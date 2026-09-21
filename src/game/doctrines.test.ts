import { describe, expect, it } from 'vitest';
import { UPGRADES } from './content';
import { clickMooncap } from './events';
import { performPrestigeReset, purchaseUpgrade } from './engine';
import {
  canPurchaseUpgrade,
  getBuildingBulkCost,
  getBuildingCps,
  getClickPower,
  getCps,
  getExpansionMasteryProductionMultiplier,
  getUpgradeChoiceBlocker,
  isUpgradeBlockedByChoice,
} from './math';
import { calculateOfflineProgress } from './offline';
import { createInitialGameState } from './state';
import type { GameState, UpgradeExclusiveGroup } from './types';

const DOCTRINE_IDS = [
  'doctrine_matron_dynasty',
  'doctrine_fungal_symbiosis',
  'doctrine_scrap_standardization',
  'doctrine_redline_industry',
  'doctrine_moon_cult',
  'doctrine_ancestor_choir',
  'doctrine_gate_network',
  'doctrine_impossible_brood',
] as const;

function withDoctrine(state: GameState, id: (typeof DOCTRINE_IDS)[number]): GameState {
  return { ...state, purchasedUpgrades: { ...state.purchasedUpgrades, [id]: true } };
}

function doctrineReward(id: (typeof DOCTRINE_IDS)[number], family: 'clutch' | 'frenzy') {
  let state = createInitialGameState(1_000, 123);
  state = withDoctrine(state, id);
  state.mooncap = { ...state.mooncap, active: true, family, spawnedAt: 1_000, expiresAt: 20_000 };
  return clickMooncap(state, 1_001).reward;
}

describe('migration doctrines', () => {
  it('keeps the original 48 foundation nodes non-exclusive and adds four doctrine pairs', () => {
    const doctrines = UPGRADES.filter((upgrade) => 'exclusiveGroup' in upgrade && upgrade.exclusiveGroup);
    const foundation = UPGRADES.filter((upgrade) => !('exclusiveGroup' in upgrade) && !upgrade.id.startsWith('innovation_'));
    expect(foundation).toHaveLength(48);
    expect(doctrines).toHaveLength(8);
    expect(doctrines.map(({ id }) => id)).toEqual([...DOCTRINE_IDS]);

    const groupCounts = new Map<UpgradeExclusiveGroup, number>();
    for (const doctrine of doctrines) {
      if (!('exclusiveGroup' in doctrine)) continue;
      const group = doctrine.exclusiveGroup as UpgradeExclusiveGroup;
      groupCounts.set(group, (groupCounts.get(group) ?? 0) + 1);
    }
    expect(Object.fromEntries(groupCounts)).toEqual({ broodcraft: 2, industry: 2, occult: 2, dimensional: 2 });
  });

  it('enforces sibling exclusivity in the engine rather than only in the UI', () => {
    const state = createInitialGameState(1_000, 7);
    state.prestige.resets = 1;
    state.buildings.mushroom_nursery = 100;
    state.goblins = 2_000_000_000;

    const chosen = purchaseUpgrade(state, 'doctrine_matron_dynasty', 1_000);
    expect(chosen.success).toBe(true);
    expect(getUpgradeChoiceBlocker(chosen.state, 'doctrine_fungal_symbiosis')).toBe('doctrine_matron_dynasty');
    expect(isUpgradeBlockedByChoice(chosen.state, 'doctrine_fungal_symbiosis')).toBe(true);
    expect(canPurchaseUpgrade(chosen.state, 'doctrine_fungal_symbiosis')).toBe(false);

    const rejected = purchaseUpgrade(chosen.state, 'doctrine_fungal_symbiosis', 1_000);
    expect(rejected.success).toBe(false);
    expect(rejected.state.purchasedUpgrades.doctrine_fungal_symbiosis).toBeUndefined();
  });

  it('allows independent doctrine groups to coexist in one migration', () => {
    const state = createInitialGameState(1_000, 7);
    state.prestige.resets = 1;
    state.buildings.mushroom_nursery = 100;
    state.buildings.scrap_incubator = 100;
    state.goblins = 2_000_000_000_000;

    const broodcraft = purchaseUpgrade(state, 'doctrine_fungal_symbiosis', 1_000);
    const industry = purchaseUpgrade(broodcraft.state, 'doctrine_scrap_standardization', 1_000);
    expect(broodcraft.success).toBe(true);
    expect(industry.success).toBe(true);
    expect(industry.state.purchasedUpgrades.doctrine_fungal_symbiosis).toBe(true);
    expect(industry.state.purchasedUpgrades.doctrine_scrap_standardization).toBe(true);
  });

  it('clears doctrine commitments naturally on Great Migration', () => {
    let state = createInitialGameState(1_000, 7);
    state = withDoctrine(state, 'doctrine_matron_dynasty');
    state.runGoblins = 5_000_000;
    state.lifetimeGoblins = 5_000_000;

    const reset = performPrestigeReset(state, 1_000);
    expect(reset.success).toBe(true);
    expect(reset.state.purchasedUpgrades).toEqual({});
    expect(isUpgradeBlockedByChoice(reset.state, 'doctrine_fungal_symbiosis')).toBe(false);
  });

  it('makes Matron Dynasty reward deep early-expansion mastery without runaway scaling', () => {
    const state = createInitialGameState(1_000, 11);
    state.buildings.brood_matron = 300;
    const baseline = getExpansionMasteryProductionMultiplier(state, 'brood_matron');
    const dynasty = getExpansionMasteryProductionMultiplier(withDoctrine(state, 'doctrine_matron_dynasty'), 'brood_matron');
    const doctrineFactor = dynasty / baseline;

    expect(doctrineFactor).toBeCloseTo(1.12 ** 8, 10);
    expect(doctrineFactor).toBeGreaterThan(2);
    expect(doctrineFactor).toBeLessThan(2.6);
  });

  it('makes Fungal Symbiosis the active Broodcraft choice', () => {
    const state = createInitialGameState(1_000, 11);
    state.buildings.mushroom_nursery = 100;
    const baselineClick = getClickPower(state);
    const fungal = withDoctrine(state, 'doctrine_fungal_symbiosis');
    const fungalClick = getClickPower(fungal);

    expect(getBuildingCps(fungal, 'mushroom_nursery')).toBeGreaterThan(getBuildingCps(state, 'mushroom_nursery') * 1.79);
    expect(fungalClick).toBeGreaterThan(baselineClick * 10);

    const plain = createInitialGameState(1_000, 123);
    plain.mooncap = { ...plain.mooncap, active: true, family: 'clutch', spawnedAt: 1_000, expiresAt: 20_000 };
    const plainReward = clickMooncap(plain, 1_001).reward;
    const fungalReward = doctrineReward('doctrine_fungal_symbiosis', 'clutch');
    expect(plainReward?.type).toBe('goblins');
    expect(fungalReward?.type).toBe('goblins');
    if (plainReward?.type === 'goblins' && fungalReward?.type === 'goblins') expect(fungalReward.amount).toBeGreaterThan(plainReward.amount);
  });

  it('gives Industry a real efficiency-versus-throughput tradeoff', () => {
    const state = createInitialGameState(1_000, 19);
    state.buildings.scrap_incubator = 100;
    state.buildings.deepforge_vat = 100;
    const standard = withDoctrine(state, 'doctrine_scrap_standardization');
    const redline = withDoctrine(state, 'doctrine_redline_industry');

    const baseFutureCost = getBuildingBulkCost(state, 'scrap_incubator', 10);
    expect(getBuildingBulkCost(standard, 'scrap_incubator', 10)).toBeLessThan(baseFutureCost * 0.83);
    expect(getBuildingBulkCost(redline, 'scrap_incubator', 10)).toBeGreaterThan(baseFutureCost * 1.07);

    const standardCps = getBuildingCps(standard, 'scrap_incubator') + getBuildingCps(standard, 'deepforge_vat');
    const redlineCps = getBuildingCps(redline, 'scrap_incubator') + getBuildingCps(redline, 'deepforge_vat');
    expect(redlineCps).toBeGreaterThan(standardCps * 1.5);
    expect(redlineCps).toBeLessThan(standardCps * 1.6);
  });

  it('makes Moon Cult spike harder while Ancestor Choir wins unattended reliability', () => {
    const cultFrenzy = doctrineReward('doctrine_moon_cult', 'frenzy');
    const choirFrenzy = doctrineReward('doctrine_ancestor_choir', 'frenzy');
    expect(cultFrenzy?.type).toBe('buff');
    expect(choirFrenzy?.type).toBe('buff');
    if (cultFrenzy?.type === 'buff' && choirFrenzy?.type === 'buff') {
      expect(cultFrenzy.buff.expiresAt - cultFrenzy.buff.startedAt).toBe(92_400);
      expect(choirFrenzy.buff.expiresAt - choirFrenzy.buff.startedAt).toBe(65_450);
    }

    const state = createInitialGameState(0, 29);
    state.buildings.mushroom_nursery = 10;
    const cult = withDoctrine(state, 'doctrine_moon_cult');
    const choir = withDoctrine(state, 'doctrine_ancestor_choir');
    const horizon = 60 * 60 * 1_000;
    const cultOffline = calculateOfflineProgress(cult, horizon);
    const choirOffline = calculateOfflineProgress(choir, horizon);
    expect(cultOffline.efficiency).toBe(0.75);
    expect(choirOffline.efficiency).toBeCloseTo(0.95, 10);
    expect(choirOffline.goblinsProduced).toBeGreaterThan(cultOffline.goblinsProduced * 1.45);
    expect(choirOffline.goblinsProduced).toBeLessThan(cultOffline.goblinsProduced * 1.55);
  });

  it('makes Gate Network strongest for broad mature warrens and Impossible Brood strongest at the reality-heavy endpoint', () => {
    const broad = createInitialGameState(1_000, 31);
    for (const id of ['brood_matron', 'mushroom_nursery', 'warren_den', 'bog_hatchery', 'scrap_incubator', 'shaman_circle', 'war_camp', 'moonspore_cavern', 'deepforge_vat', 'goblin_gate'] as const) broad.buildings[id] = 100;
    const gateBroad = getCps(withDoctrine(broad, 'doctrine_gate_network'));
    const impossibleBroad = getCps(withDoctrine(broad, 'doctrine_impossible_brood'));
    expect(gateBroad).toBeGreaterThan(impossibleBroad * 1.05);

    const endpoint = createInitialGameState(1_000, 31);
    endpoint.buildings.goblin_gate = 100;
    endpoint.buildings.wyrm_hoard = 100;
    endpoint.buildings.reality_burrow = 100;
    const gateEndpoint = getCps(withDoctrine(endpoint, 'doctrine_gate_network'));
    const impossibleEndpoint = getCps(withDoctrine(endpoint, 'doctrine_impossible_brood'));
    expect(impossibleEndpoint).toBeGreaterThan(gateEndpoint * 1.5);
    expect(impossibleEndpoint).toBeLessThan(gateEndpoint * 2.6);
  });
});
