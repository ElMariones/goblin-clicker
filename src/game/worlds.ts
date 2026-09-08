import { tickGame } from './engine';
import { createInitialRoboState } from './robo/state';
import type { GameState } from './types';

export const MECHANICAL_CHARTER_COST = 100;
export const MECHANICAL_CHARTER_REQUIRED_MIGRATIONS = 3;
export const MECHANICAL_CHARTER_REQUIRED_TOTAL_CUNNING = 2_500;

export interface MechanicalCharterProgress {
  owned: boolean;
  migrations: { current: number; required: number; met: boolean };
  totalCunning: { current: number; required: number; met: boolean };
  availableCunning: { current: number; required: number; met: boolean };
}

export function getMechanicalCharterProgress(state: GameState): MechanicalCharterProgress {
  const migrations = Math.max(0, Math.floor(state.prestige.resets));
  const totalCunning = Math.max(0, Math.floor(state.prestige.totalShardsEarned));
  const availableCunning = Math.max(0, Math.floor(state.prestige.shards));
  return {
    owned: state.unlocks.robogoblins,
    migrations: { current: migrations, required: MECHANICAL_CHARTER_REQUIRED_MIGRATIONS, met: migrations >= MECHANICAL_CHARTER_REQUIRED_MIGRATIONS },
    totalCunning: { current: totalCunning, required: MECHANICAL_CHARTER_REQUIRED_TOTAL_CUNNING, met: totalCunning >= MECHANICAL_CHARTER_REQUIRED_TOTAL_CUNNING },
    availableCunning: { current: availableCunning, required: MECHANICAL_CHARTER_COST, met: availableCunning >= MECHANICAL_CHARTER_COST },
  };
}

export function canPurchaseMechanicalCharter(state: GameState): boolean {
  const progress = getMechanicalCharterProgress(state);
  return !progress.owned && progress.migrations.met && progress.totalCunning.met && progress.availableCunning.met;
}

export function purchaseMechanicalCharter(
  state: GameState,
  now = state.lastUpdateAt,
): { state: GameState; success: boolean; amount: number; reason?: 'alreadyOwned' | 'requirementNotMet' | 'insufficientFunds' } {
  const ticked = tickGame(state, now);
  if (ticked.unlocks.robogoblins) return { state: ticked, success: false, amount: 0, reason: 'alreadyOwned' };
  const progress = getMechanicalCharterProgress(ticked);
  if (!progress.migrations.met || !progress.totalCunning.met) {
    return { state: ticked, success: false, amount: MECHANICAL_CHARTER_COST, reason: 'requirementNotMet' };
  }
  if (!progress.availableCunning.met) {
    return { state: ticked, success: false, amount: MECHANICAL_CHARTER_COST, reason: 'insufficientFunds' };
  }
  return {
    state: {
      ...ticked,
      unlocks: { ...ticked.unlocks, robogoblins: true },
      robo: createInitialRoboState(),
      prestige: { ...ticked.prestige, shards: ticked.prestige.shards - MECHANICAL_CHARTER_COST },
    },
    success: true,
    amount: MECHANICAL_CHARTER_COST,
  };
}
