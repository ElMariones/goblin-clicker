import { BUILDINGS } from './content';
import { scheduleNextMooncap } from './events';
import { getBaseCps, getBuildingBaseCps, getOfflineEfficiencyResearchBonus, getPermanentRank } from './math';
import { clampResource } from './state';
import type { GameState, OfflineProgress } from './types';

export const BASE_OFFLINE_CAP_MS = 8 * 60 * 60 * 1_000;
export const OFFLINE_CAP_PER_RANK_MS = 2 * 60 * 60 * 1_000;
export const OFFLINE_EFFICIENCY = 0.75;

export function getOfflineEfficiency(state: GameState): number {
  return Math.min(1, OFFLINE_EFFICIENCY + getPermanentRank(state, 'tireless_lineage') * 0.05 + getOfflineEfficiencyResearchBonus(state));
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
  const mission = state.expeditions.active;
  const reservedMs = mission ? Math.max(0, Math.min(state.lastUpdateAt + creditedMs, mission.endsAt) - Math.max(state.lastUpdateAt, mission.startedAt)) : 0;
  const goblinsProduced = getBaseCps(state) * ((creditedMs - reservedMs * (mission?.reservation ?? 0)) / 1_000) * efficiency;
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
  const baseCps = getBaseCps(state);
  for (const building of BUILDINGS) {
    const produced = baseCps > 0 ? progress.goblinsProduced * getBuildingBaseCps(state, building.id) / baseCps : 0;
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
  const mission = state.expeditions.active;
  if (mission) {
    const reservedMs = Math.max(0, Math.min(state.lastUpdateAt + progress.creditedMs, mission.endsAt) - Math.max(state.lastUpdateAt, mission.startedAt));
    next.expeditions = { ...state.expeditions, active: { ...mission,
      reserved: clampResource(mission.reserved + baseCps * reservedMs / 1000 * progress.efficiency * mission.reservation) } };
  }
  next = scheduleNextMooncap(next, timestamp);
  return { state: next, progress };
}
