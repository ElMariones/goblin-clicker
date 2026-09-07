import { describe, expect, it } from 'vitest';
import { claimMooncap, equipCosmetic, hatchGoblin, performPrestigeReset, purchaseBuilding, purchaseCosmetic, spendLunarCharge, tickGame } from './engine';
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
    // Established Matrons gain ×1.475 locally (base mastery + veterancy) and
    // +0.6% to the global mastery network.
    expect(next.goblins).toBeCloseTo(3.49585, 8);
    expect(next.statistics.lifetimeProducedByBuilding.brood_matron).toBeCloseTo(1.48385, 8);
    expect(next.statistics.lifetimeProducedByBuilding.mushroom_nursery).toBeCloseTo(2.012, 8);
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

  it('buys and equips cosmetics with permanent Ancestral Cunning', () => {
    const state = createInitialGameState(1_000, 7);
    state.prestige.shards = 3;
    state.prestige.totalShardsEarned = 3;

    const blockedEquip = equipCosmetic(state, 'wizard', 1_000);
    expect(blockedEquip.success).toBe(false);
    expect(blockedEquip.state.prestige.cosmetics.equipped).toBeNull();

    const bought = purchaseCosmetic(state, 'red_cap', 1_000);
    expect(bought.success).toBe(true);
    expect(bought.amount).toBe(1);
    expect(bought.state.prestige.shards).toBe(2);
    expect(bought.state.prestige.totalShardsEarned).toBe(3);
    expect(bought.state.prestige.cosmetics.owned.red_cap).toBe(true);

    const duplicate = purchaseCosmetic(bought.state, 'red_cap', 1_000);
    expect(duplicate.success).toBe(false);
    expect(duplicate.state.prestige.shards).toBe(2);

    const equipped = equipCosmetic(bought.state, 'red_cap', 1_000);
    expect(equipped.success).toBe(true);
    expect(equipped.state.prestige.cosmetics.equipped).toBe('red_cap');

    const unequipped = equipCosmetic(equipped.state, null, 1_000);
    expect(unequipped.success).toBe(true);
    expect(unequipped.state.prestige.cosmetics.equipped).toBeNull();
  });

  it('carries owned and equipped cosmetics through a New Warren reset', () => {
    const state = createInitialGameState(1_000, 7);
    state.lifetimeGoblins = 5_000_000;
    state.runGoblins = 5_000_000;
    state.prestige.cosmetics.owned.druid = true;
    state.prestige.cosmetics.equipped = 'druid';

    const result = performPrestigeReset(state, 1_000);
    expect(result.success).toBe(true);
    expect(result.state.prestige.cosmetics.owned.druid).toBe(true);
    expect(result.state.prestige.cosmetics.equipped).toBe('druid');
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

  it('carries heirloom matrons into a new migration without carrying ordinary buildings', () => {
    const state = createInitialGameState(1_000, 7);
    state.lifetimeGoblins = 5_000_000;
    state.runGoblins = 5_000_000;
    state.buildings.brood_matron = 42;
    state.buildings.mushroom_nursery = 11;
    state.prestige.permanentUpgrades.heirloom_matrons = 3;
    const result = performPrestigeReset(state, 1_000);
    expect(result.success).toBe(true);
    expect(result.state.buildings.brood_matron).toBe(3);
    expect(result.state.buildings.mushroom_nursery).toBe(0);
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

  it('raises offline efficiency to 100% with a maxed Tireless Lineage', () => {
    const state = createInitialGameState(0, 7);
    state.buildings.mushroom_nursery = 1;
    state.prestige.permanentUpgrades.tireless_lineage = 5;
    const progress = calculateOfflineProgress(state, 60 * 60 * 1_000);
    expect(progress.efficiency).toBe(1);
    expect(progress.goblinsProduced).toBeCloseTo(3_600, 8);
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

  it('extends Mooncap clutch rewards and buff durations with Moonlit Blood', () => {
    const clutchState = createInitialGameState(1_000, 1);
    clutchState.prestige.permanentUpgrades.moonlit_blood = 2;
    clutchState.mooncap = { ...clutchState.mooncap, active: true, family: 'clutch', spawnedAt: 1_000, expiresAt: 20_000 };
    const clutch = claimMooncap(clutchState, 1_001);
    expect(clutch.reward?.type).toBe('goblins');
    if (clutch.reward?.type === 'goblins') expect(clutch.reward.amount).toBe(15); // floor(13 × 1.2)

    const frenzyState = createInitialGameState(1_000, 2);
    frenzyState.prestige.permanentUpgrades.moonlit_blood = 2;
    frenzyState.mooncap = { ...frenzyState.mooncap, active: true, family: 'frenzy', spawnedAt: 1_000, expiresAt: 20_000 };
    const frenzy = claimMooncap(frenzyState, 1_001);
    expect(frenzy.reward?.type).toBe('buff');
    if (frenzy.reward?.type === 'buff') {
      expect(frenzy.reward.buff.id).toBe('moon_frenzy');
      expect(frenzy.reward.buff.expiresAt - frenzy.reward.buff.startedAt).toBe(92_400);
    }

    const feverState = createInitialGameState(1_000, 3);
    feverState.prestige.permanentUpgrades.moonlit_blood = 2;
    feverState.mooncap = { ...feverState.mooncap, active: true, family: 'blood', spawnedAt: 1_000, expiresAt: 20_000 };
    const fever = claimMooncap(feverState, 1_001);
    expect(fever.reward?.type).toBe('buff');
    if (fever.reward?.type === 'buff') {
      expect(fever.reward.buff.id).toBe('hatching_fever');
      expect(fever.reward.buff.expiresAt - fever.reward.buff.startedAt).toBe(15_600);
    }
  });

  it('builds lunar charge, spends it deterministically, and can bias the next Mooncap family', () => {
    const state = createInitialGameState(1_000, 91);
    state.mooncap = { ...state.mooncap, active: true, family: 'clutch', spawnedAt: 1_000, expiresAt: 20_000, lunarCharge: 5 };
    const claimed = claimMooncap(state, 1_001);
    expect(claimed.state.mooncap.lunarCharge).toBe(6);

    const biased = spendLunarCharge(claimed.state, { type: 'bias', family: 'oracle' }, 1_001);
    expect(biased.success).toBe(true);
    expect(biased.state.mooncap.lunarCharge).toBe(4);
    expect(biased.state.mooncap.nextFamilyBias).toBe('oracle');

    const hastened = spendLunarCharge(biased.state, { type: 'hasten' }, 1_001);
    expect(hastened.success).toBe(true);
    expect(hastened.state.mooncap.lunarCharge).toBe(1);
    expect(hastened.state.mooncap.nextSpawnAt).toBeLessThanOrEqual(9_001);
    const spawned = tickGame(hastened.state, hastened.state.mooncap.nextSpawnAt);
    expect(spawned.mooncap.family).toBe('oracle');
    expect(spawned.mooncap.nextFamilyBias).toBeNull();
  });

  it('triggers Eclipse when Frenzycap and Bloodcap overlap', () => {
    const state = createInitialGameState(1_000, 17);
    state.buffs = [{ id: 'moon_frenzy', multiplier: 7, startedAt: 1_000, expiresAt: 60_000, target: 'cps' }];
    state.mooncap = { ...state.mooncap, active: true, family: 'blood', spawnedAt: 1_000, expiresAt: 20_000 };
    const result = claimMooncap(state, 1_001);
    expect(result.eclipseTriggered).toBe(true);
    expect(result.state.buffs.some(({ id }) => id === 'hatching_fever')).toBe(true);
    expect(result.state.buffs.some(({ id }) => id === 'eclipse')).toBe(true);
  });

  it('Oraclecap strengthens the next contract payout without adding a new currency', () => {
    const state = createInitialGameState(1_000, 29);
    state.mooncap = { ...state.mooncap, active: true, family: 'oracle', spawnedAt: 1_000, expiresAt: 20_000 };
    const result = claimMooncap(state, 1_001);
    expect(result.reward?.type).toBe('oracle');
    expect(result.state.contracts.oracleBoost).toBe(1);
    expect(result.state.mooncap.lunarCharge).toBe(1);
  });
});
