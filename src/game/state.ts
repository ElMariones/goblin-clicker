import { BUILDINGS } from './content';
import { ensureContracts } from './contracts';
import { scheduleNextMooncap } from './events';
import { seedFromTimestamp } from './rng';
import { CURRENT_SAVE_VERSION, type BuildingId, type GameState } from './types';

export const MAX_RESOURCE = 1e300;

export function clampResource(value: number): number {
  if (!Number.isFinite(value)) return value > 0 ? MAX_RESOURCE : 0;
  return Math.min(MAX_RESOURCE, Math.max(0, value));
}

export function createEmptyBuildings(): Record<BuildingId, number> {
  return Object.fromEntries(BUILDINGS.map(({ id }) => [id, 0])) as Record<BuildingId, number>;
}

export function createEmptyBuildingProduction(): Record<BuildingId, number> {
  return Object.fromEntries(BUILDINGS.map(({ id }) => [id, 0])) as Record<BuildingId, number>;
}

export function isWarrenBuildingRevealed(state: GameState, index: number): boolean {
  const building = BUILDINGS[index];
  if (!building) return false;
  if (index < 2) return true;
  const previous = BUILDINGS[index - 1];
  return state.buildings[previous.id] > 0 || state.lifetimeGoblins >= building.baseCost * 0.25;
}

export function hasRevealedAllWarrenBuildings(state: GameState): boolean {
  return BUILDINGS.every((_, index) => isWarrenBuildingRevealed(state, index));
}

export function ensureRobogoblinsEligibility(state: GameState): GameState {
  if (state.unlocks.robogoblinsEligible) return state;
  if (!state.unlocks.robogoblins && !hasRevealedAllWarrenBuildings(state)) return state;
  return {
    ...state,
    unlocks: { ...state.unlocks, robogoblinsEligible: true },
  };
}

export function createInitialGameState(now = Date.now(), seed = seedFromTimestamp(now)): GameState {
  const timestamp = Math.max(0, Math.floor(now));
  const initial: GameState = {
    version: CURRENT_SAVE_VERSION,
    createdAt: timestamp,
    lastUpdateAt: timestamp,
    goblins: 0,
    runGoblins: 0,
    lifetimeGoblins: 0,
    buildings: createEmptyBuildings(),
    purchasedUpgrades: {},
    unlockedAchievements: {},
    prestige: {
      shards: 0,
      totalShardsEarned: 0,
      resets: 0,
      permanentUpgrades: {},
      cosmetics: { owned: {}, equipped: null },
    },
    buffs: [],
    mooncap: {
      active: false,
      family: null,
      spawnedAt: null,
      expiresAt: null,
      nextSpawnAt: timestamp,
      lunarCharge: 0,
      nextFamilyBias: null,
      rngSeed: seed >>> 0,
      rngCounter: 0,
    },
    expeditions: { active: null, completed: 0, artifacts: {} },
    contracts: {
      active: {},
      completed: 0,
      nextSequence: 0,
      oracleBoost: 0,
    },
    statistics: {
      totalClicks: 0,
      manuallyBorn: 0,
      goldenEventsClicked: 0,
      totalTimePlayedMs: 0,
      highestCps: 0,
      lifetimeProducedByBuilding: createEmptyBuildingProduction(),
    },
    unlocks: { robogoblins: false, robogoblinsEligible: false },
    robo: null,
  };

  return ensureContracts(scheduleNextMooncap(initial, timestamp), timestamp);
}

export function creditGoblins(state: GameState, amount: number): GameState {
  if (!(amount > 0)) return state;
  const credited = Math.min(MAX_RESOURCE, amount);
  return {
    ...state,
    goblins: clampResource(state.goblins + credited),
    runGoblins: clampResource(state.runGoblins + credited),
    lifetimeGoblins: clampResource(state.lifetimeGoblins + credited),
  };
}
