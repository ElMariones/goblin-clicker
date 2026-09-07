import { describe, expect, it } from 'vitest';
import { claimMooncap, hatchGoblin, performPrestigeReset, purchaseBuilding, tickGame } from './engine';
import { applyOfflineProgress, calculateOfflineProgress } from './offline';
import { createInitialGameState } from './state';

describe('game simulation', () => {
  it('hatches exactly one goblin on a fresh manual click', () => {
    const state = createInitialGameState(1_000, 7);
    const result = hatchGoblin(state, 1_000);
    expect(result.amount).toBe(1);
    expect(result.state.goblins).toBe(1);
    expect(result.state.statistics.totalClicks).toBe(1);
    expect(result.state.statistics.manuallyBorn).toBe(1);
  });

  it('counts actual goblins spawned manually rather than click events', () => {
    const state = createInitialGameState(1_000, 7);
    state.purchasedUpgrades.sharpened_nails = true;

    const result = hatchGoblin(state, 1_000);

    expect(result.amount).toBe(2);
    expect(result.state.statistics.totalClicks).toBe(1);
    expect(result.state.statistics.manuallyBorn).toBe(2);
  });

  it('ticks passive production and handles a buff ending mid-tick', () => {
    const state = createInitialGameState(1_000, 7);
    state.buildings.mushroom_nursery = 1;
    state.buffs = [{ id: 'moon_frenzy', multiplier: 7, startedAt: 1_000, expiresAt: 2_000, target: 'cps' }];
    const next = tickGame(state, 3_000);
    expect(next.goblins).toBeCloseTo(8, 8); // 7 for first second + 1 for second.
    expect(next.statistics.lifetimeProducedByBuilding.mushroom_nursery).toBeCloseTo(8, 8);
    expect(next.buffs).toHaveLength(0);
  });

  it('attributes mixed passive production to each building without changing aggregate output', () => {
    const state = createInitialGameState(1_000, 7);
    state.buildings.brood_matron = 10; // 1/s total
    state.buildings.mushroom_nursery = 2; // 2/s total
    const next = tickGame(state, 2_000);
    expect(next.goblins).toBeCloseTo(3, 8);
    expect(next.statistics.lifetimeProducedByBuilding.brood_matron).toBeCloseTo(1, 8);
    expect(next.statistics.lifetimeProducedByBuilding.mushroom_nursery).toBeCloseTo(2, 8);
  });

  it('purchases buildings atomically', () => {
    const state = createInitialGameState(1_000, 7);
    state.goblins = 15;
    const result = purchaseBuilding(state, 'brood_matron', 1, 1_000);
    expect(result.success).toBe(true);
    expect(result.amount).toBe(15);
    expect(result.state.goblins).toBe(0);
    expect(result.state.buildings.brood_matron).toBe(1);
  });

  it('preserves legacy progress while resetting the current run on prestige', () => {
    const state = createInitialGameState(1_000, 7);
    state.goblins = 1_000_000;
    state.runGoblins = 5_000_000;
    state.lifetimeGoblins = 5_000_000;
    state.buildings.brood_matron = 42;
    state.purchasedUpgrades.sharpened_nails = true;
    const result = performPrestigeReset(state, 1_000);
    expect(result.success).toBe(true);
    expect(result.amount).toBe(1);
    expect(result.state.prestige.shards).toBe(1);
    expect(result.state.prestige.resets).toBe(1);
    expect(result.state.buildings.brood_matron).toBe(0);
    expect(result.state.purchasedUpgrades).toEqual({});
    expect(result.state.lifetimeGoblins).toBe(5_000_000);
  });

  it('counts a permanent starter clutch consistently in the new run', () => {
    const state = createInitialGameState(1_000, 7);
    state.lifetimeGoblins = 5_000_000;
    state.runGoblins = 5_000_000;
    state.prestige.permanentUpgrades.starter_clutch = 2;
    const result = performPrestigeReset(state, 1_000);
    expect(result.success).toBe(true);
    expect(result.state.goblins).toBe(100);
    expect(result.state.runGoblins).toBe(100);
    expect(result.state.lifetimeGoblins).toBe(5_000_000);
  });

  it('caps offline progress and excludes temporary buffs', () => {
    const state = createInitialGameState(0, 7);
    state.buildings.mushroom_nursery = 1;
    state.buffs = [{ id: 'moon_frenzy', multiplier: 7, startedAt: 0, expiresAt: 100_000_000, target: 'cps' }];
    const twelveHours = 12 * 60 * 60 * 1_000;
    const progress = calculateOfflineProgress(state, twelveHours);
    expect(progress.creditedMs).toBe(8 * 60 * 60 * 1_000);
    expect(progress.goblinsProduced).toBe(8 * 60 * 60 * 0.75);
    const applied = applyOfflineProgress(state, twelveHours);
    expect(applied.state.buffs).toHaveLength(0);
    expect(applied.state.lastUpdateAt).toBe(twelveHours);
    expect(applied.state.statistics.lifetimeProducedByBuilding.mushroom_nursery)
      .toBeCloseTo(progress.goblinsProduced, 8);
  });

  it('produces reproducible Mooncap reward sequences from identical seeds', () => {
    const a = createInitialGameState(1_000, 12345);
    const b = createInitialGameState(1_000, 12345);
    const spawnAt = a.mooncap.nextSpawnAt;
    const aSpawned = tickGame(a, spawnAt);
    const bSpawned = tickGame(b, spawnAt);
    expect(aSpawned.mooncap.active).toBe(true);
    const rewardA = claimMooncap(aSpawned, spawnAt + 1);
    const rewardB = claimMooncap(bSpawned, spawnAt + 1);
    expect(rewardA.reward).toEqual(rewardB.reward);
    expect(rewardA.state.mooncap.nextSpawnAt).toBe(rewardB.state.mooncap.nextSpawnAt);
  });
});
