import { describe, expect, it } from 'vitest';
import { BUILDINGS } from './content';
import { CONTRACT_KINDS, generateContract, getContractProgress, getContractRewardAmount, isContractComplete } from './contracts';
import { claimContract } from './engine';
import { getBaseCps, getClickPower } from './math';
import { createInitialGameState } from './state';

describe('warren contracts', () => {
  it('starts with exactly one contract at each horizon', () => {
    const state = createInitialGameState(1_000, 12);
    expect(Object.keys(state.contracts.active).sort()).toEqual([...CONTRACT_KINDS].sort());
    expect(new Set(Object.values(state.contracts.active).map(({ id }) => id)).size).toBe(3);
  });

  it('generates objectives against reachable current-run systems', () => {
    const state = createInitialGameState(1_000, 12);
    state.lifetimeGoblins = 100_000;
    state.runGoblins = 25_000;
    state.goblins = 20_000;
    state.buildings.brood_matron = 12;
    state.buildings.mushroom_nursery = 6;
    state.buildings.warren_den = 1;

    for (let sequence = 0; sequence < 40; sequence += 1) {
      for (const kind of CONTRACT_KINDS) {
        const contract = generateContract(state, kind, sequence, 1_000);
        const objective = contract.objective;
        if (objective.type === 'buildingOwned') {
          expect(BUILDINGS.some(({ id }) => id === objective.buildingId)).toBe(true);
          expect(objective.target).toBeGreaterThan(state.buildings[objective.buildingId]);
        } else if (objective.type === 'runGoblins') {
          expect(objective.target).toBeGreaterThan(state.runGoblins);
        } else if (objective.type === 'manualBorn' || objective.type === 'mooncapCatches') {
          expect(objective.amount).toBeGreaterThan(0);
        } else {
          expect(objective.target).toBeGreaterThan(0);
          expect(objective.target).toBeLessThanOrEqual(BUILDINGS.length);
        }
      }
    }
  });

  it('claims a completed contract, pays immediately, and replaces only that horizon', () => {
    const state = createInitialGameState(1_000, 12);
    const quick = state.contracts.active.quick!;
    expect(quick.objective.type).toBe('manualBorn');
    if (quick.objective.type !== 'manualBorn') throw new Error('Expected deterministic opening manual contract');
    state.statistics.manuallyBorn = quick.objective.start + quick.objective.amount;
    state.contracts.oracleBoost = 1;
    const expectedReward = getContractRewardAmount(state, quick);
    const previousQuartermaster = state.contracts.active.quartermaster?.id;
    const previousDirective = state.contracts.active.directive?.id;
    const beforeGoblins = state.goblins;

    expect(isContractComplete(state, quick)).toBe(true);
    expect(getContractProgress(state, quick).ratio).toBe(1);
    const claimed = claimContract(state, 'quick', 1_000);
    expect(claimed.success).toBe(true);
    expect(claimed.reward).toBe(expectedReward);
    expect(claimed.state.goblins).toBe(beforeGoblins + expectedReward);
    expect(claimed.state.contracts.completed).toBe(1);
    expect(claimed.state.contracts.oracleBoost).toBe(0);
    expect(claimed.state.contracts.active.quick?.id).not.toBe(quick.id);
    expect(claimed.state.contracts.active.quartermaster?.id).toBe(previousQuartermaster);
    expect(claimed.state.contracts.active.directive?.id).toBe(previousDirective);
  });

  it('cannot claim an unfinished contract', () => {
    const state = createInitialGameState(1_000, 12);
    const quickId = state.contracts.active.quick?.id;
    const claimed = claimContract(state, 'quick', 1_000);
    expect(claimed.success).toBe(false);
    expect(claimed.reward).toBe(0);
    expect(claimed.state.contracts.active.quick?.id).toBe(quickId);
  });

  it('keeps click-focused quick contracts meaningful instead of becoming one-tap farms', () => {
    const state = createInitialGameState(1_000, 12);
    state.lifetimeGoblins = 10_000_000_000;
    state.runGoblins = 2_000_000_000;
    state.buildings.brood_matron = 100;
    state.buildings.mushroom_nursery = 75;
    state.prestige.permanentUpgrades.stronger_spawn = 5;
    state.purchasedUpgrades.sharpened_nails = true;
    state.purchasedUpgrades.riotous_birthing = true;

    const stableClickPower = getClickPower({ ...state, buffs: [] });
    const contract = generateContract(state, 'quick', 3, 1_000);
    expect(contract.objective.type).toBe('manualBorn');
    if (contract.objective.type !== 'manualBorn') throw new Error('Expected manual contract');
    const clicksRequired = contract.objective.amount / stableClickPower;
    expect(clicksRequired).toBeGreaterThanOrEqual(24);
    expect(clicksRequired).toBeLessThanOrEqual(91);

    const reward = getContractRewardAmount(state, contract);
    expect(reward).toBeLessThanOrEqual(Math.max(12, Math.floor(getBaseCps(state) * 10)));
  });

  it('keeps idle-production Grand Directives net-positive but subordinate to normal progression', () => {
    const state = createInitialGameState(1_000, 12);
    state.lifetimeGoblins = 100_000_000;
    state.runGoblins = 5_000_000;
    state.goblins = 1_000_000;
    state.buildings.brood_matron = 80;
    state.buildings.mushroom_nursery = 60;
    state.buildings.warren_den = 40;
    state.buildings.bog_hatchery = 20;

    const contract = generateContract(state, 'directive', 1, 1_000);
    expect(contract.objective.type).toBe('runGoblins');
    if (contract.objective.type !== 'runGoblins') throw new Error('Expected production directive');
    const cps = getBaseCps(state);
    const requiredProduction = contract.objective.target - state.runGoblins;
    expect(requiredProduction).toBeGreaterThanOrEqual(cps * 900);
    const normalReward = getContractRewardAmount(state, contract);
    expect(normalReward).toBeLessThanOrEqual(Math.floor(requiredProduction * 0.27) + 1);

    state.contracts.oracleBoost = 2;
    const oracleReward = getContractRewardAmount(state, contract);
    expect(oracleReward).toBeLessThanOrEqual(Math.floor(requiredProduction * 0.54) + 1);
  });

  it('keeps quartermaster objectives as bounded breadth investments across progression', () => {
    for (const owned of [0, 9, 24, 49, 99, 199]) {
      const state = createInitialGameState(1_000, 12);
      state.lifetimeGoblins = 1_000_000_000_000;
      for (const building of BUILDINGS) state.buildings[building.id] = owned;
      const contract = generateContract(state, 'quartermaster', 2, 1_000);
      expect(contract.objective.type).toBe('buildingOwned');
      if (contract.objective.type !== 'buildingOwned') throw new Error('Expected building contract');
      const step = contract.objective.target - state.buildings[contract.objective.buildingId];
      expect(step).toBeGreaterThan(0);
      expect(step).toBeLessThanOrEqual(24);
    }
  });

  it('does not inflate rewards from temporary frenzy strategies', () => {
    const state = createInitialGameState(1_000, 12);
    state.buildings.brood_matron = 100;
    state.buildings.mushroom_nursery = 60;
    const contract = generateContract(state, 'quick', 3, 1_000);
    const baseReward = getContractRewardAmount(state, contract);
    state.buffs.push({ id: 'moon_frenzy', multiplier: 7, startedAt: 500, expiresAt: 5_000, target: 'cps' });
    expect(getContractRewardAmount(state, contract)).toBe(baseReward);
  });
});
