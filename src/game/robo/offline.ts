import type { GameState } from '../types';
import { ROBO_LINES } from './content';
import { getRawKernelPerkRank } from './state';
import { advanceRoboOfflineSeconds } from './production';
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
  const beforePending = ROBO_LINES.reduce((sum, line) => sum + state.robo!.lines[line.id].pendingRG, 0);
  const advanced = advanceRoboOfflineSeconds(state.robo, creditedMs / 1_000, efficiency, state.prestige.totalShardsEarned);
  const deliveredRG = Math.max(0, advanced.lifetimeProducedRG - state.robo.lifetimeProducedRG);
  const afterPending = ROBO_LINES.reduce((sum, line) => sum + advanced.lines[line.id].pendingRG, 0);
  const producedRG = Math.max(0, deliveredRG + afterPending - beforePending);
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
