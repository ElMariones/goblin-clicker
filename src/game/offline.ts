import { BUILDINGS } from './content';
import { scheduleNextMooncap } from './events';
import { getBaseCps, getBuildingBaseCps, getPermanentRank } from './math';
import { clampResource } from './state';
import type { GameState, OfflineProgress } from './types';

export const BASE_OFFLINE_CAP_MS = 8 * 60 * 60 * 1_000;
export const OFFLINE_CAP_PER_RANK_MS = 2 * 60 * 60 * 1_000;
export const OFFLINE_EFFICIENCY = 0.75;

export function getOfflineEfficiency(state: GameState): number {
  return Math.min(1, OFFLINE_EFFICIENCY + getPermanentRank(state, 'tireless_lineage') * 0.05);
}

export function getOfflineCapMs(state: GameState): number {
  return BASE_OFFLINE_CAP_MS + getPermanentRank(state, 'deep_warrens') * OFFLINE_CAP_PER_RANK_MS;
}

export function calculateOfflineProgress(state: GameState, now: number): OfflineProgress {
  const timestamp = Math.max(state.lastUpdateAt, Math.floor(now));
  const elapsedMs = timestamp - state.lastUpdateAt;
  const capMs = getOfflineCapMs(state);
  const creditedMs = Math.min(elapsedMs, capMs);
  const efficiency = getOfflineEfficiency(state);
  const goblinsProduced = getBaseCps(state) * (creditedMs / 1_000) * efficiency;
  return { elapsedMs, creditedMs, efficiency, goblinsProduced, capMs };
}

/**
 * Applies capped offline production without temporary buffs or Mooncap spawns.
 * Call once after deserializing a save before entering the foreground tick loop.
 */
export function applyOfflineProgress(state: GameState, now: number): { state: GameState; progress: OfflineProgress } {
  const progress = calculateOfflineProgress(state, now);
  const timestamp = Math.max(state.lastUpdateAt, Math.floor(now));
  const lifetimeProducedByBuilding = { ...state.statistics.lifetimeProducedByBuilding };
  for (const building of BUILDINGS) {
    const produced = getBuildingBaseCps(state, building.id) * (progress.creditedMs / 1_000) * progress.efficiency;
    if (produced <= 0) continue;
    lifetimeProducedByBuilding[building.id] = clampResource(lifetimeProducedByBuilding[building.id] + produced);
  }
  let next: GameState = {
    ...state,
    lastUpdateAt: timestamp,
    goblins: clampResource(state.goblins + progress.goblinsProduced),
    runGoblins: clampResource(state.runGoblins + progress.goblinsProduced),
    lifetimeGoblins: clampResource(state.lifetimeGoblins + progress.goblinsProduced),
    buffs: [],
    mooncap: { ...state.mooncap, active: false, family: null, spawnedAt: null, expiresAt: null },
    statistics: { ...state.statistics, lifetimeProducedByBuilding },
  };
  next = scheduleNextMooncap(next, timestamp);
  return { state: next, progress };
}
