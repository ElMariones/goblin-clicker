import { describe, expect, it } from 'vitest';
import { BUILDINGS, UPGRADES } from './content';
import {
  getAncestralMomentumMultiplier,
  getBuildingBulkCost,
  getBuildingCps,
  getBuildingSellRefund,
  getBuildingUnitCps,
  getClickPower,
  getCps,
  getExpansionMasteryLevel,
  getExpansionMasteryNetworkBonus,
  getExpansionMasteryProductionMultiplier,
  getMaxAffordableBuildingCount,
  getNextExpansionMasteryLevel,
  getPermanentUpgradeCost,
  getPrestigeShardGain,
  isUpgradeUnlocked,
} from './math';
import { createInitialGameState } from './state';

describe('economy math', () => {
  it('uses deterministic geometric building pricing', () => {
    const state = createInitialGameState(1_000, 123);
    expect(getBuildingBulkCost(state, 'brood_matron', 1)).toBe(15);
    expect(getBuildingBulkCost(state, 'brood_matron', 10)).toBe(305);

    const rich = { ...state, goblins: 304 };
    expect(getMaxAffordableBuildingCount(rich, 'brood_matron')).toBe(9);
    expect(getMaxAffordableBuildingCount({ ...rich, goblins: 305 }, 'brood_matron')).toBe(10);
  });

  it('refunds only a fraction of the equivalent purchase price', () => {
    const state = createInitialGameState(1_000, 123);
    state.buildings.brood_matron = 10;
    const refund = getBuildingSellRefund(state, 'brood_matron', 10);
    expect(refund).toBe(Math.floor(getBuildingBulkCost(createInitialGameState(1_000, 123), 'brood_matron', 10) * 0.25));
  });

  it('combines building, global, permanent and temporary production multipliers', () => {
    const state = createInitialGameState(1_000, 123);
    state.buildings.brood_matron = 10;
    state.purchasedUpgrades.matron_stew = true;
    state.purchasedUpgrades.green_thumb = true;
    state.prestige.permanentUpgrades.ancestral_fertility = 2;
    // 10 Matrons: base 1/s × research 2 × Established 1.2 ×
    // (Ancestral Fertility 1.1 × Green Thumb 1.1 × mastery network 1.005).
    expect(getCps(state, 1_000)).toBeCloseTo(2.91852, 8);

    state.buffs.push({ id: 'moon_frenzy', multiplier: 7, startedAt: 1_000, expiresAt: 5_000, target: 'cps' });
    expect(getCps(state, 2_000)).toBeCloseTo(20.42964, 8);
    expect(getBuildingUnitCps(state, 'brood_matron', 2_000)).toBeCloseTo(2.042964, 8);
    expect(getBuildingCps(state, 'brood_matron', 2_000)).toBeCloseTo(20.42964, 8);
    expect(getCps(state, 5_000)).toBeCloseTo(2.91852, 8);
  });

  it('starts clicking at one goblin and applies click upgrades deterministically', () => {
    const state = createInitialGameState(1_000, 123);
    expect(getClickPower(state)).toBe(1);
    state.purchasedUpgrades.sharpened_nails = true;
    state.prestige.permanentUpgrades.stronger_spawn = 2;
    expect(getClickPower(state)).toBeCloseTo(2.4);
  });

  it('stacks late manual upgrades using the existing click effect model', () => {
    const state = createInitialGameState(1_000, 123);
    state.buildings.mushroom_nursery = 100;
    state.purchasedUpgrades.iron_fingertips = true;
    state.purchasedUpgrades.hatchery_command = true;
    state.purchasedUpgrades.twitch_of_creation = true;
    // 100 Nurseries reach Renowned: 4.5× local mastery and +3.75% network CPS.
    expect(getClickPower(state)).toBeCloseTo((1 + (100 * 4.5 * 1.0375) * 0.15) * 6, 8);
  });

  it('derives eight expansion mastery levels from owned counts with cumulative local multipliers', () => {
    const state = createInitialGameState(1_000, 123);
    state.buildings.brood_matron = 9;
    expect(getExpansionMasteryLevel(state, 'brood_matron')).toBeNull();
    expect(getNextExpansionMasteryLevel(state, 'brood_matron')?.id).toBe('established');
    expect(getExpansionMasteryProductionMultiplier(state, 'brood_matron')).toBe(1);

    state.buildings.brood_matron = 10;
    expect(getExpansionMasteryLevel(state, 'brood_matron')?.id).toBe('established');
    expect(getExpansionMasteryProductionMultiplier(state, 'brood_matron')).toBeCloseTo(1.2, 10);

    state.buildings.brood_matron = 100;
    expect(getExpansionMasteryLevel(state, 'brood_matron')?.id).toBe('renowned');
    expect(getExpansionMasteryProductionMultiplier(state, 'brood_matron')).toBeCloseTo(4.5, 10);

    state.buildings.brood_matron = 300;
    expect(getExpansionMasteryLevel(state, 'brood_matron')?.id).toBe('mythic');
    expect(getNextExpansionMasteryLevel(state, 'brood_matron')).toBeNull();
    expect(getExpansionMasteryProductionMultiplier(state, 'brood_matron')).toBeCloseTo(270, 10);
  });

  it('turns early expansion mastery into a global network bonus and amplifies it with Founders Legacy', () => {
    const state = createInitialGameState(1_000, 123);
    state.buildings.brood_matron = 25; // Established + Thriving = 1.25%.
    state.buildings.mushroom_nursery = 10; // Established = 0.5%.
    expect(getExpansionMasteryNetworkBonus(state)).toBeCloseTo(0.0175, 10);

    state.prestige.permanentUpgrades.founders_legacy = 2; // +40% network strength.
    expect(getExpansionMasteryNetworkBonus(state)).toBeCloseTo(0.0245, 10);
  });

  it('caps migration-based Ancestral Momentum at 25 completed migrations', () => {
    const state = createInitialGameState(1_000, 123);
    state.prestige.permanentUpgrades.ancestral_momentum = 3;
    state.prestige.resets = 10;
    expect(getAncestralMomentumMultiplier(state)).toBeCloseTo(1.3, 10);
    state.prestige.resets = 100;
    expect(getAncestralMomentumMultiplier(state)).toBeCloseTo(1.75, 10);
  });

  it('provides a third building-specific production tier for every structure', () => {
    for (const building of BUILDINGS) {
      const tiers = UPGRADES.filter((upgrade) => !('exclusiveGroup' in upgrade) && upgrade.effects.some((effect) => effect.type === 'buildingMultiplier' && effect.buildingId === building.id));
      expect(tiers).toHaveLength(3);
      expect(tiers.some((upgrade) => upgrade.requirements.some((requirement) => requirement.type === 'buildingOwned' && requirement.buildingId === building.id && requirement.amount === 100))).toBe(true);
    }
  });

  it('gates advanced global research behind late-game milestones', () => {
    const state = createInitialGameState(1_000, 123);
    state.lifetimeGoblins = 1_000_000_000_000_000;
    expect(isUpgradeUnlocked(state, 'horde_standardization')).toBe(false);
    state.prestige.resets = 1;
    expect(isUpgradeUnlocked(state, 'horde_standardization')).toBe(true);

    state.lifetimeGoblins = 1_000_000_000_000_000_000;
    state.prestige.totalShardsEarned = 9;
    expect(isUpgradeUnlocked(state, 'empire_beneath_everything')).toBe(false);
    state.prestige.totalShardsEarned = 10;
    expect(isUpgradeUnlocked(state, 'empire_beneath_everything')).toBe(true);
  });

  it('makes first prestige reachable at five million lifetime goblins', () => {
    const state = createInitialGameState(1_000, 123);
    state.lifetimeGoblins = 4_999_999;
    expect(getPrestigeShardGain(state)).toBe(0);
    state.lifetimeGoblins = 5_000_000;
    expect(getPrestigeShardGain(state)).toBe(1);
    state.lifetimeGoblins = 20_000_000;
    expect(getPrestigeShardGain(state)).toBe(2);
    state.prestige.totalShardsEarned = 1;
    expect(getPrestigeShardGain(state)).toBe(1);
  });

  it('scales permanent upgrade costs by current rank', () => {
    const state = createInitialGameState(1_000, 123);
    expect(getPermanentUpgradeCost(state, 'ancestral_fertility')).toBe(1);
    state.prestige.permanentUpgrades.ancestral_fertility = 1;
    expect(getPermanentUpgradeCost(state, 'ancestral_fertility')).toBe(2);
  });
});
