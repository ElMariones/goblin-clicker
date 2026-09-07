import { BUILDINGS, UPGRADE_BY_ID, type UpgradeId } from './content';
import { advanceMooncap, clickMooncap, scheduleNextMooncap, type MooncapClickResult } from './events';
import {
  canPurchasePermanentUpgrade,
  canPurchaseUpgrade,
  getBaseCps,
  getBuildingBaseCps,
  getBuildingBulkCost,
  getBuildingSellRefund,
  getClickPower,
  getCps,
  getNewlyUnlockedAchievements,
  getPermanentRank,
  getPermanentUpgradeCost,
  getPrestigeShardGain,
} from './math';
import { clampResource, createEmptyBuildings } from './state';
import type { BuildingId, GameState, PermanentUpgradeId } from './types';

export interface EconomyActionResult {
  state: GameState;
  success: boolean;
  amount: number;
}

function awardAchievements(state: GameState, now: number): GameState {
  const unlocked = getNewlyUnlockedAchievements(state, now);
  if (unlocked.length === 0) return state;
  const additions = Object.fromEntries(unlocked.map((id) => [id, now]));
  return { ...state, unlockedAchievements: { ...state.unlockedAchievements, ...additions } };
}

/** Integrates temporary CPS buffs exactly across their start/end boundaries. */
export function calculateProductionBetween(state: GameState, startTime: number, endTime: number): number {
  if (endTime <= startTime) return 0;
  const boundaries = new Set<number>([startTime, endTime]);
  for (const buff of state.buffs) {
    if (buff.target !== 'cps') continue;
    if (buff.startedAt > startTime && buff.startedAt < endTime) boundaries.add(buff.startedAt);
    if (buff.expiresAt > startTime && buff.expiresAt < endTime) boundaries.add(buff.expiresAt);
  }
  const sorted = [...boundaries].sort((a, b) => a - b);
  let produced = 0;
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const segmentStart = sorted[i];
    const segmentEnd = sorted[i + 1];
    const sampleTime = segmentStart + Math.min(1, (segmentEnd - segmentStart) / 2);
    produced += getCps(state, sampleTime) * ((segmentEnd - segmentStart) / 1_000);
  }
  return produced;
}

export function tickGame(state: GameState, now: number): GameState {
  const timestamp = Math.max(state.lastUpdateAt, Math.floor(now));
  if (timestamp === state.lastUpdateAt) {
    return awardAchievements(advanceMooncap(state, timestamp), timestamp);
  }

  const produced = calculateProductionBetween(state, state.lastUpdateAt, timestamp);
  const baseCps = getBaseCps(state);
  const lifetimeProducedByBuilding = { ...state.statistics.lifetimeProducedByBuilding };
  if (produced > 0 && baseCps > 0) {
    for (const building of BUILDINGS) {
      const share = getBuildingBaseCps(state, building.id) / baseCps;
      if (share <= 0) continue;
      lifetimeProducedByBuilding[building.id] = clampResource(
        lifetimeProducedByBuilding[building.id] + produced * share,
      );
    }
  }
  let next: GameState = {
    ...state,
    lastUpdateAt: timestamp,
    goblins: clampResource(state.goblins + produced),
    runGoblins: clampResource(state.runGoblins + produced),
    lifetimeGoblins: clampResource(state.lifetimeGoblins + produced),
    buffs: state.buffs.filter((buff) => buff.expiresAt > timestamp),
    statistics: {
      ...state.statistics,
      totalTimePlayedMs: state.statistics.totalTimePlayedMs + (timestamp - state.lastUpdateAt),
      highestCps: Math.max(state.statistics.highestCps, getCps(state, timestamp)),
      lifetimeProducedByBuilding,
    },
  };
  next = advanceMooncap(next, timestamp);
  return awardAchievements(next, timestamp);
}

export function hatchGoblin(state: GameState, now = state.lastUpdateAt): EconomyActionResult {
  let next = tickGame(state, now);
  const power = getClickPower(next, now);
  next = {
    ...next,
    goblins: clampResource(next.goblins + power),
    runGoblins: clampResource(next.runGoblins + power),
    lifetimeGoblins: clampResource(next.lifetimeGoblins + power),
    statistics: {
      ...next.statistics,
      totalClicks: next.statistics.totalClicks + 1,
      manuallyBorn: clampResource(next.statistics.manuallyBorn + power),
    },
  };
  return { state: awardAchievements(next, now), success: true, amount: power };
}

export function purchaseBuilding(
  state: GameState,
  buildingId: BuildingId,
  count = 1,
  now = state.lastUpdateAt,
): EconomyActionResult {
  const quantity = Math.max(0, Math.floor(count));
  if (quantity === 0) return { state, success: false, amount: 0 };
  const ticked = tickGame(state, now);
  const cost = getBuildingBulkCost(ticked, buildingId, quantity);
  if (!Number.isFinite(cost) || ticked.goblins < cost) return { state: ticked, success: false, amount: cost };
  const next = {
    ...ticked,
    goblins: clampResource(ticked.goblins - cost),
    buildings: { ...ticked.buildings, [buildingId]: ticked.buildings[buildingId] + quantity },
  };
  return { state: awardAchievements(next, now), success: true, amount: cost };
}

export function sellBuilding(
  state: GameState,
  buildingId: BuildingId,
  count = 1,
  now = state.lastUpdateAt,
): EconomyActionResult {
  const ticked = tickGame(state, now);
  const quantity = Math.min(Math.max(0, Math.floor(count)), ticked.buildings[buildingId]);
  if (quantity === 0) return { state: ticked, success: false, amount: 0 };
  const refund = getBuildingSellRefund(ticked, buildingId, quantity);
  return {
    state: {
      ...ticked,
      goblins: clampResource(ticked.goblins + refund),
      buildings: { ...ticked.buildings, [buildingId]: ticked.buildings[buildingId] - quantity },
    },
    success: true,
    amount: refund,
  };
}

export function purchaseUpgrade(state: GameState, upgradeId: UpgradeId, now = state.lastUpdateAt): EconomyActionResult {
  const ticked = tickGame(state, now);
  if (!canPurchaseUpgrade(ticked, upgradeId)) return { state: ticked, success: false, amount: 0 };
  const definition = UPGRADE_BY_ID[upgradeId];
  const next: GameState = {
    ...ticked,
    goblins: clampResource(ticked.goblins - definition.cost),
    purchasedUpgrades: { ...ticked.purchasedUpgrades, [upgradeId]: true },
  };
  return { state: awardAchievements(next, now), success: true, amount: definition.cost };
}

export function purchasePermanentUpgrade(
  state: GameState,
  id: PermanentUpgradeId,
  now = state.lastUpdateAt,
): EconomyActionResult {
  const ticked = tickGame(state, now);
  if (!canPurchasePermanentUpgrade(ticked, id)) return { state: ticked, success: false, amount: getPermanentUpgradeCost(ticked, id) };
  const cost = getPermanentUpgradeCost(ticked, id);
  const rank = getPermanentRank(ticked, id);
  return {
    state: {
      ...ticked,
      prestige: {
        ...ticked.prestige,
        shards: ticked.prestige.shards - cost,
        permanentUpgrades: { ...ticked.prestige.permanentUpgrades, [id]: rank + 1 },
      },
    },
    success: true,
    amount: cost,
  };
}

export function performPrestigeReset(state: GameState, now = state.lastUpdateAt): EconomyActionResult {
  const ticked = tickGame(state, now);
  const gained = getPrestigeShardGain(ticked);
  if (gained <= 0) return { state: ticked, success: false, amount: 0 };
  const startingGoblins = getPermanentRank(ticked, 'starter_clutch') * 50;
  let next: GameState = {
    ...ticked,
    goblins: startingGoblins,
    runGoblins: startingGoblins,
    buildings: createEmptyBuildings(),
    purchasedUpgrades: {},
    buffs: [],
    prestige: {
      ...ticked.prestige,
      shards: ticked.prestige.shards + gained,
      totalShardsEarned: ticked.prestige.totalShardsEarned + gained,
      resets: ticked.prestige.resets + 1,
    },
    mooncap: {
      ...ticked.mooncap,
      active: false,
      spawnedAt: null,
      expiresAt: null,
    },
  };
  next = scheduleNextMooncap(next, now);
  return { state: awardAchievements(next, now), success: true, amount: gained };
}

export function claimMooncap(state: GameState, now = state.lastUpdateAt): MooncapClickResult {
  const ticked = tickGame(state, now);
  const result = clickMooncap(ticked, now);
  return { ...result, state: awardAchievements(result.state, now) };
}
