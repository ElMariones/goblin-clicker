import { describe, expect, it } from 'vitest';
import { BUILDINGS } from './content';
import { CONTRACT_KINDS, generateContract, getContractProgress, getContractRewardAmount, isContractComplete } from './contracts';
import { claimContract } from './engine';
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
});
