import { describe, expect, it } from 'vitest';
import { getBuildingBulkCost, getBuildingCps, getBuildingSellRefund, getBuildingUnitCps, getClickPower, getCps, getMaxAffordableBuildingCount, getPermanentUpgradeCost, getPrestigeShardGain } from './math';
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
    expect(getCps(state, 1_000)).toBeCloseTo(2.42, 8);

    state.buffs.push({ id: 'moon_frenzy', multiplier: 7, startedAt: 1_000, expiresAt: 5_000, target: 'cps' });
    expect(getCps(state, 2_000)).toBeCloseTo(16.94, 8);
    expect(getBuildingUnitCps(state, 'brood_matron', 2_000)).toBeCloseTo(1.694, 8);
    expect(getBuildingCps(state, 'brood_matron', 2_000)).toBeCloseTo(16.94, 8);
    expect(getCps(state, 5_000)).toBeCloseTo(2.42, 8);
  });

  it('starts clicking at one goblin and applies click upgrades deterministically', () => {
    const state = createInitialGameState(1_000, 123);
    expect(getClickPower(state)).toBe(1);
    state.purchasedUpgrades.sharpened_nails = true;
    state.prestige.permanentUpgrades.stronger_spawn = 2;
    expect(getClickPower(state)).toBeCloseTo(2.4);
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
