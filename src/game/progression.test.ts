import { describe, expect, it } from 'vitest';
import { BUILDINGS, EXPANSION_MASTERY_LEVELS, PERMANENT_UPGRADES, WARREN_INNOVATIONS } from './content';
import { buildWarrenProject, performPrestigeReset, purchaseBuildingMilestone, purchasePermanentUpgrade, purchaseUpgrade, sellBuilding, tickGame } from './engine';
import { getBaseCps, getBuildingBulkCost, getBuildingBaseCps, getClickPower, getNextExpansionMilestoneQuantity } from './math';
import { applyOfflineProgress, getOfflineEfficiency } from './offline';
import { getWarrenProjectProgress, getWarrenProjectSpend, WARREN_PROJECTS } from './projects';
import { deserializeGame, serializeGame } from './save';
import { createInitialGameState } from './state';
import { createInitialRoboState } from './robo/state';

function warren() {
  const state = createInitialGameState(1000, 7);
  state.goblins = 1e30;
  state.lifetimeGoblins = 1e32;
  state.prestige.resets = 1;
  state.prestige.shards = 1e9;
  state.prestige.totalShardsEarned = 1e9;
  for (const building of BUILDINGS) state.buildings[building.id] = 300;
  for (const upgrade of WARREN_INNOVATIONS) state.purchasedUpgrades[upgrade.id] = true;
  state.unlocks.robogoblins = true;
  state.robo = createInitialRoboState();
  return state;
}

describe('Warren megaprojects', () => {
  it.each(['goblins', 'cunning', 'migration', 'reality', 'ownership', 'research'] as const)('requires %s before spending', (missing) => {
    const state = warren();
    if (missing === 'goblins') state.goblins = 1e14 - 1;
    if (missing === 'cunning') state.prestige.shards = 99;
    if (missing === 'migration') state.prestige.resets = 0;
    if (missing === 'reality') state.buildings.reality_burrow = 0;
    if (missing === 'ownership') state.buildings.bog_hatchery = 99;
    if (missing === 'research') state.purchasedUpgrades = {};
    const before = structuredClone(state);
    const result = buildWarrenProject(state, 'worldroot');
    expect(result.success).toBe(false);
    expect(result.state.prestige.projects).toEqual({});
    expect(result.state.goblins).toBe(before.goblins);
    expect(result.state.prestige.shards).toBe(before.prestige.shards);
    expect(state).toEqual(before);
  });

  it('spends both currencies once, preserves workers and research, and only boosts its district', () => {
    const state = warren();
    state.goblins = 1e15;
    const before = getBuildingBaseCps(state, 'brood_matron');
    const industry = getBuildingBaseCps(state, 'scrap_incubator');
    const result = buildWarrenProject(state, 'worldroot');
    expect(result.success).toBe(true);
    expect(result.state.goblins).toBe(9e14);
    expect(result.state.prestige.shards).toBe(state.prestige.shards - 100);
    expect(result.state.prestige.totalShardsEarned).toBe(state.prestige.totalShardsEarned);
    expect(result.state.buildings).toEqual(state.buildings);
    expect(result.state.purchasedUpgrades).toEqual(state.purchasedUpgrades);
    expect(result.state.robo).toEqual(state.robo);
    expect(getBuildingBaseCps(result.state, 'brood_matron') / before).toBeCloseTo(1.25);
    expect(getBuildingBaseCps(result.state, 'scrap_incubator')).toBe(industry);
    expect(getWarrenProjectProgress(result.state, 'worldroot')).toMatchObject({ rank: 1, requiredOwned: 150, requiredInnovations: 4, cost: 1e15, cunningCost: 500 });
  });

  it('completes all 20 stages, keeps bounded bonuses and rejects unknown or maxed projects', () => {
    let state = warren();
    const before = getBaseCps(state);
    for (const project of WARREN_PROJECTS) {
      for (let rank = 0; rank < project.maxRank; rank++) {
        const result = buildWarrenProject(state, project.id);
        expect(result.success, `${project.id}:${rank}`).toBe(true);
        state = result.state;
      }
      expect(buildWarrenProject(state, project.id).success).toBe(false);
    }
    expect(getBaseCps(state) / before).toBeCloseTo(2.25 * 1.5);
    expect(getWarrenProjectSpend(state.prestige.projects)).toBe(86_769_100);
    expect(buildWarrenProject(state, 'forged' as never).success).toBe(false);
    expect(deserializeGame(serializeGame(state), 1000).state.prestige).toEqual(state.prestige);
  });

  it('preserves projects after reload, offline progress, selling and migration while clearing innovations', () => {
    const state = buildWarrenProject(warren(), 'worldroot').state;
    const loaded = deserializeGame(serializeGame(state), 1000).state;
    expect(loaded.prestige).toEqual(state.prestige);
    expect(loaded.purchasedUpgrades).toEqual(state.purchasedUpgrades);
    const offline = applyOfflineProgress(loaded, 61_000);
    expect(offline.progress.goblinsProduced).toBeCloseTo(getBaseCps(loaded) * 60 * getOfflineEfficiency(loaded));
    expect(offline.state.prestige.projects).toEqual({ worldroot: 1 });
    const sold = sellBuilding(loaded, 'brood_matron', 300).state;
    expect(sold.prestige.projects).toEqual({ worldroot: 1 });
    const reset = performPrestigeReset(loaded);
    expect(reset.success).toBe(true);
    expect(reset.state.prestige.projects).toEqual({ worldroot: 1 });
    expect(reset.state.purchasedUpgrades).toEqual({});
    expect(reset.state.buildings.reality_burrow).toBe(0);
    expect(reset.state.robo).toEqual(loaded.robo);
  });

  it('settles elapsed production using the old bonus before building', () => {
    const state = warren();
    const ticked = tickGame(state, 6000);
    const result = buildWarrenProject(state, 'worldroot', 6000);
    expect(result.state.goblins).toBe(ticked.goblins - 1e14);
    expect(result.state.lifetimeGoblins).toBe(ticked.lifetimeGoblins);
  });

  it('keeps legitimately earned Cunning on reload after buying every perk and a project', () => {
    let state = warren();
    for (const perk of PERMANENT_UPGRADES) {
      for (let rank = 0; rank < perk.maxRank; rank++) state = purchasePermanentUpgrade(state, perk.id).state;
      expect(state.prestige.permanentUpgrades[perk.id]).toBe(perk.maxRank);
    }
    state = buildWarrenProject(state, 'worldroot').state;
    const loaded = deserializeGame(serializeGame(state), 1000).state;
    expect(loaded.prestige.projects).toEqual({ worldroot: 1 });
    expect(loaded.prestige.shards).toBe(state.prestige.shards);
  });

  it('migrates missing project fields and sanitizes forged ranks against the Cunning budget', () => {
    const state = warren();
    const data = JSON.parse(serializeGame(state));
    delete data.state.prestige.projects;
    expect(deserializeGame(JSON.stringify(data), 1000).state.prestige).toEqual(state.prestige);
    data.state.prestige.shards = 100;
    data.state.prestige.totalShardsEarned = 100;
    data.state.prestige.projects = { worldroot: 999, moonforge: '5', worldgate: -1, everlasting_warren: 5, forged: 100 };
    const loaded = deserializeGame(JSON.stringify(data), 1000).state;
    expect(loaded.prestige.projects).toEqual({ worldroot: 1 });
    expect(loaded.prestige.shards).toBe(0);
    data.state.prestige.projects = { worldroot: null, worldgate: [] };
    expect(deserializeGame(JSON.stringify(data), 1000).state.prestige.projects).toEqual({});
  });
});

describe('Warren milestone buying and innovations', () => {
  it.each(BUILDINGS)('buys every exact mastery threshold for $id without overshooting', (building) => {
    for (const tier of EXPANSION_MASTERY_LEVELS) {
      const state = createInitialGameState(1000, 7);
      state.buildings[building.id] = tier.threshold - 1;
      state.goblins = getBuildingBulkCost(state, building.id, 1);
      expect(getNextExpansionMilestoneQuantity(state, building.id)).toBe(1);
      const result = purchaseBuildingMilestone(state, building.id);
      expect(result.success).toBe(true);
      expect(result.state.buildings[building.id]).toBe(tier.threshold);
      expect(result.state.goblins).toBe(0);
      expect(state.buildings[building.id]).toBe(tier.threshold - 1);
    }
  });

  it('buys a whole gap, rejects insufficient funds, and does nothing after final mastery', () => {
    const state = createInitialGameState(1000, 7);
    state.buildings.brood_matron = 11;
    const price = getBuildingBulkCost(state, 'brood_matron', 14);
    state.goblins = price - 1;
    expect(purchaseBuildingMilestone(state, 'brood_matron').success).toBe(false);
    state.goblins = price;
    expect(purchaseBuildingMilestone(state, 'brood_matron').state.buildings.brood_matron).toBe(25);
    state.buildings.brood_matron = 300;
    state.goblins = 1e30;
    expect(purchaseBuildingMilestone(state, 'brood_matron').success).toBe(false);
  });

  it('gates and applies all 18 innovations, persists them, and keeps doctrines available', () => {
    expect(WARREN_INNOVATIONS).toHaveLength(18);
    for (const definition of WARREN_INNOVATIONS) {
      expect(purchaseUpgrade(createInitialGameState(1000, 7), definition.id).success).toBe(false);
      const state = warren();
      state.purchasedUpgrades = {};
      const result = purchaseUpgrade(state, definition.id);
      expect(result.success, definition.id).toBe(true);
      expect(result.state.goblins).toBe(state.goblins - definition.cost);
      expect(purchaseUpgrade(result.state, definition.id).success).toBe(false);
      expect(deserializeGame(serializeGame(result.state), 1000).state.purchasedUpgrades[definition.id]).toBe(true);
      expect(result.state.robo).toEqual(state.robo);
    }
    const state = warren(); state.purchasedUpgrades = {};
    expect(getClickPower(purchaseUpgrade(state, 'innovation_collective_instinct').state)).toBe(getClickPower(state) * 2);
    expect(getBaseCps(purchaseUpgrade(state, 'innovation_boundless_warren').state)).toBe(getBaseCps(state) * 2);
    expect(getOfflineEfficiency(purchaseUpgrade(state, 'innovation_sleeping_shifts').state)).toBeCloseTo(0.85);
  });
});
