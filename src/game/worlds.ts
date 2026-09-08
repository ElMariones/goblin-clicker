import { tickGame } from './engine';
import { createInitialRoboState } from './robo/state';
import { ensureRobogoblinsEligibility } from './state';
import type { GameState } from './types';

export const MECHANICAL_CHARTER_COST = 100;

export interface MechanicalCharterProgress {
  owned: boolean;
  eligible: boolean;
  availableCunning: { current: number; required: number; met: boolean };
}

export function getMechanicalCharterProgress(state: GameState): MechanicalCharterProgress {
  const eligibleState = ensureRobogoblinsEligibility(state);
  const availableCunning = Math.max(0, Math.floor(state.prestige.shards));
  return {
    owned: eligibleState.unlocks.robogoblins,
    eligible: eligibleState.unlocks.robogoblinsEligible,
    availableCunning: { current: availableCunning, required: MECHANICAL_CHARTER_COST, met: availableCunning >= MECHANICAL_CHARTER_COST },
  };
}

export function canPurchaseMechanicalCharter(state: GameState): boolean {
  const progress = getMechanicalCharterProgress(state);
  return !progress.owned && progress.eligible && progress.availableCunning.met;
}

export function purchaseMechanicalCharter(
  state: GameState,
  now = state.lastUpdateAt,
): { state: GameState; success: boolean; amount: number; reason?: 'alreadyOwned' | 'requirementNotMet' | 'insufficientFunds' } {
  const ticked = tickGame(state, now);
  if (ticked.unlocks.robogoblins) return { state: ticked, success: false, amount: 0, reason: 'alreadyOwned' };
  const progress = getMechanicalCharterProgress(ticked);
  if (!progress.eligible) {
    return { state: ticked, success: false, amount: MECHANICAL_CHARTER_COST, reason: 'requirementNotMet' };
  }
  if (!progress.availableCunning.met) {
    return { state: ticked, success: false, amount: MECHANICAL_CHARTER_COST, reason: 'insufficientFunds' };
  }
  return {
    state: {
      ...ticked,
      unlocks: { ...ticked.unlocks, robogoblins: true, robogoblinsEligible: true },
      robo: createInitialRoboState(),
      prestige: { ...ticked.prestige, shards: ticked.prestige.shards - MECHANICAL_CHARTER_COST },
    },
    success: true,
    amount: MECHANICAL_CHARTER_COST,
  };
}
