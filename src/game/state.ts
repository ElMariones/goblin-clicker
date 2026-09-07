import { BUILDINGS } from './content';
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
    },
    buffs: [],
    mooncap: {
      active: false,
      spawnedAt: null,
      expiresAt: null,
      nextSpawnAt: timestamp,
      rngSeed: seed >>> 0,
      rngCounter: 0,
    },
    statistics: {
      totalClicks: 0,
      manuallyBorn: 0,
      goldenEventsClicked: 0,
      totalTimePlayedMs: 0,
      highestCps: 0,
    },
  };

  return scheduleNextMooncap(initial, timestamp);
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
