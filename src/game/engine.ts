import { collectExpedition, launchExpedition } from './expeditions';
import { COSMETIC_BY_ID } from './cosmetics';
import type { CosmeticId, ExpeditionPlan } from './types';
import { BUILDINGS, UPGRADE_BY_ID, type UpgradeId } from './content';
import { ensureContracts, getContractRewardAmount, isContractComplete, resetContractsForMigration } from './contracts';
import { advanceMooncap, applyMoonDialAction, clickMooncap, scheduleNextMooncap, type MooncapClickResult, type MoonDialAction, type MoonDialResult } from './events';
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
import { clampResource, createEmptyBuildings, creditGoblins } from './state';
import type { BuildingId, ContractInstance, ContractKind, GameState, PermanentUpgradeId } from './types';

export interface EconomyActionResult {
  state: GameState;
  success: boolean;
  amount: number;
}

export interface ContractClaimResult {
  state: GameState;
  success: boolean;
  reward: number;
  contract: ContractInstance | null;
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
  const mission = state.expeditions.active;
  if (mission) {
    if (mission.startedAt > startTime && mission.startedAt < endTime) boundaries.add(mission.startedAt);
    if (mission.endsAt > startTime && mission.endsAt < endTime) boundaries.add(mission.endsAt);
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
  const mission = state.expeditions.active;
  if (mission && state.lastUpdateAt < mission.endsAt) {
    const end = Math.min(timestamp, mission.endsAt);
    const net = calculateProductionBetween(state, Math.max(state.lastUpdateAt, mission.startedAt), end);
    next.expeditions = { ...state.expeditions, active: { ...mission,
      reserved: clampResource(mission.reserved + net * mission.reservation / (1 - mission.reservation)) } };
  }
  next = advanceMooncap(next, timestamp);
  return awardAchievements(ensureContracts(next, timestamp), timestamp);
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

export function purchaseCosmetic(
  state: GameState,
  id: CosmeticId,
  now = state.lastUpdateAt,
): EconomyActionResult {
  const ticked = tickGame(state, now);
  const definition = COSMETIC_BY_ID[id];
  if (!definition || ticked.prestige.cosmetics.owned[id] || ticked.prestige.shards < definition.cost) {
    return { state: ticked, success: false, amount: definition?.cost ?? 0 };
  }
  return {
    state: {
      ...ticked,
      prestige: {
        ...ticked.prestige,
        shards: ticked.prestige.shards - definition.cost,
        cosmetics: {
          ...ticked.prestige.cosmetics,
          owned: { ...ticked.prestige.cosmetics.owned, [id]: true },
        },
      },
    },
    success: true,
    amount: definition.cost,
  };
}

export function equipCosmetic(
  state: GameState,
  id: CosmeticId | null,
  now = state.lastUpdateAt,
): EconomyActionResult {
  const ticked = tickGame(state, now);
  if (id !== null && !ticked.prestige.cosmetics.owned[id]) return { state: ticked, success: false, amount: 0 };
  return {
    state: {
      ...ticked,
      prestige: {
        ...ticked.prestige,
        cosmetics: { ...ticked.prestige.cosmetics, equipped: id },
      },
    },
    success: true,
    amount: 0,
  };
}

export function performPrestigeReset(state: GameState, now = state.lastUpdateAt): EconomyActionResult {
  const ticked = tickGame(state, now);
  const expeditionReady = !!ticked.expeditions.active && ticked.lastUpdateAt >= ticked.expeditions.active.endsAt;
  const settled = expeditionReady ? collectExpedition(ticked).state : ticked;
  const gained = getPrestigeShardGain(settled);
  if (gained <= 0) return { state: ticked, success: false, amount: 0 };
  const startingGoblins = getPermanentRank(settled, 'starter_clutch') * 50;
  const startingBuildings = createEmptyBuildings();
  startingBuildings.brood_matron = getPermanentRank(settled, 'heirloom_matrons');
  let next: GameState = {
    ...settled,
    goblins: startingGoblins,
    runGoblins: startingGoblins,
    buildings: startingBuildings,
    purchasedUpgrades: {},
    expeditions: { ...settled.expeditions, active: null },
    buffs: [],
    prestige: {
      ...settled.prestige,
      shards: settled.prestige.shards + gained,
      totalShardsEarned: settled.prestige.totalShardsEarned + gained,
      resets: settled.prestige.resets + 1,
    },
    mooncap: {
      ...settled.mooncap,
      active: false,
      family: null,
      spawnedAt: null,
      expiresAt: null,
    },
  };
  next = resetContractsForMigration(next, now);
  next = scheduleNextMooncap(next, now);
  return { state: awardAchievements(next, now), success: true, amount: gained };
}

export function claimMooncap(state: GameState, now = state.lastUpdateAt): MooncapClickResult {
  const ticked = tickGame(state, now);
  const result = clickMooncap(ticked, now);
  return { ...result, state: awardAchievements(result.state, now) };
}

export function claimContract(state: GameState, kind: ContractKind, now = state.lastUpdateAt): ContractClaimResult {
  const ticked = ensureContracts(tickGame(state, now), now);
  const contract = ticked.contracts.active[kind] ?? null;
  if (!contract || !isContractComplete(ticked, contract)) return { state: ticked, success: false, reward: 0, contract };
  const reward = getContractRewardAmount(ticked, contract);
  const active = { ...ticked.contracts.active };
  delete active[kind];
  let next = creditGoblins(ticked, reward);
  next = {
    ...next,
    contracts: {
      ...next.contracts,
      active,
      completed: next.contracts.completed + 1,
      oracleBoost: 0,
    },
  };
  next = ensureContracts(next, now);
  return { state: awardAchievements(next, now), success: true, reward, contract };
}

export function spendLunarCharge(state: GameState, action: MoonDialAction, now = state.lastUpdateAt): MoonDialResult {
  const ticked = tickGame(state, now);
  return applyMoonDialAction(ticked, action, now);
}

export function startExpedition(state: GameState, plan: ExpeditionPlan, now = state.lastUpdateAt): GameState {
  return launchExpedition(tickGame(state, now), plan);
}

export function cancelExpedition(state: GameState, now = state.lastUpdateAt): GameState {
  const next = tickGame(state, now);
  if (!next.expeditions.active || next.lastUpdateAt >= next.expeditions.active.endsAt) return next;
  return { ...next, expeditions: { ...next.expeditions, active: null } };
}

export function claimExpedition(state: GameState, now = state.lastUpdateAt) {
  const result = collectExpedition(tickGame(state, now));
  return { ...result, state: awardAchievements(ensureContracts(result.state, now), now) };
}
