import type { GameState } from '../types';
import { ROBO_LINES } from './content';
import { getRawKernelPerkRank } from './state';
import { advanceRoboOfflineSeconds, integrateRoboLine } from './production';
import { getRoboLineCycleFromState, getRoboLineStableRateFromState } from './math';
import type { RoboOfflineProgress, RoboState } from './types';

export const ROBO_BASE_OFFLINE_CAP_MS = 8 * 60 * 60 * 1_000;
export const ROBO_OFFLINE_CAP_PER_RANK_MS = 2 * 60 * 60 * 1_000;
export const ROBO_BASE_OFFLINE_EFFICIENCY = 0.8;

export function getRoboOfflineEfficiency(robo: RoboState): number {
  return Math.min(1, ROBO_BASE_OFFLINE_EFFICIENCY + getRawKernelPerkRank(robo, 'night_shift') * 0.05);
}

export function getRoboOfflineCapMs(robo: RoboState): number {
  return ROBO_BASE_OFFLINE_CAP_MS + getRawKernelPerkRank(robo, 'deep_battery') * ROBO_OFFLINE_CAP_PER_RANK_MS;
}

export function calculateRoboOfflineProgress(state: GameState, now: number): RoboOfflineProgress | null {
  if (!state.unlocks.robogoblins || !state.robo) return null;
  const timestamp = Math.max(state.lastUpdateAt, Math.floor(now));
  const elapsedMs = timestamp - state.lastUpdateAt;
  const capMs = getRoboOfflineCapMs(state.robo);
  const creditedMs = Math.min(elapsedMs, capMs);
  const efficiency = getRoboOfflineEfficiency(state.robo);
  // Do not subtract lifetime totals: late-game totals can swallow an early
  // post-Recompile batch through floating-point cancellation.
  let producedRG = 0;
  let deliveredRG = 0;
  let afterPending = 0;
  for (const definition of ROBO_LINES) {
    const line = state.robo.lines[definition.id];
    if (line.owned <= 0) continue;
    const rate = getRoboLineStableRateFromState(state.robo, definition.id, state.prestige.totalShardsEarned) * efficiency;
    const integrated = integrateRoboLine(line.phaseSeconds, line.pendingRG, getRoboLineCycleFromState(state.robo, definition.id), rate, creditedMs / 1_000);
    producedRG = Math.min(1e300, producedRG + rate * creditedMs / 1_000);
    deliveredRG = Math.min(1e300, deliveredRG + integrated.paidRG);
    afterPending = Math.min(1e300, afterPending + integrated.pendingRG);
  }
  return { elapsedMs, creditedMs, efficiency, producedRG, deliveredRG, pendingRG: afterPending, capMs };
}

export function applyRoboOfflineProgress(state: GameState, now: number): { robo: RoboState | null; progress: RoboOfflineProgress | null } {
  const progress = calculateRoboOfflineProgress(state, now);
  if (!progress || !state.robo) return { robo: state.robo, progress };
  return {
    robo: advanceRoboOfflineSeconds(state.robo, progress.creditedMs / 1_000, progress.efficiency, state.prestige.totalShardsEarned),
    progress,
  };
}
