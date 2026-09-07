import { ACHIEVEMENTS, BUILDINGS, PERMANENT_UPGRADES, UPGRADES } from './content';
import { normalizeSeed, seedFromTimestamp } from './rng';
import { clampResource, createEmptyBuildingProduction, createInitialGameState } from './state';
import { CURRENT_SAVE_VERSION, type BuffInstance, type BuildingId, type DeserializeResult, type GameState, type PermanentUpgradeId, type SaveEnvelope } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const LEGACY_SAVE_KEYS = [
  'goblins', 'totalGoblins', 'runGoblins', 'lifetimeGoblins', 'buildings',
  'upgrades', 'purchasedUpgrades', 'prestige', 'prestigePoints', 'statistics',
  'mooncap', 'totalClicks', 'lastSave', 'lastUpdateAt',
] as const;

function looksLikeLegacySave(value: Record<string, unknown>): boolean {
  return LEGACY_SAVE_KEYS.some((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function finiteNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function nonNegativeNumber(value: unknown, fallback = 0): number {
  return Math.max(0, finiteNumber(value, fallback));
}

function integer(value: unknown, fallback = 0): number {
  return Math.max(0, Math.floor(finiteNumber(value, fallback)));
}

function sanitizeState(raw: Record<string, unknown>, now: number, warnings: string[]): GameState {
  const createdAt = integer(raw.createdAt, now);
  const base = createInitialGameState(createdAt, seedFromTimestamp(createdAt));
  const rawBuildings = isRecord(raw.buildings) ? raw.buildings : {};
  const buildings = { ...base.buildings };
  for (const { id } of BUILDINGS) buildings[id as BuildingId] = integer(rawBuildings[id]);

  const rawUpgrades = isRecord(raw.purchasedUpgrades)
    ? raw.purchasedUpgrades
    : Array.isArray(raw.upgrades)
      ? Object.fromEntries(raw.upgrades.filter((value): value is string => typeof value === 'string').map((id) => [id, true]))
      : {};
  const purchasedUpgrades: Record<string, true> = {};
  for (const { id } of UPGRADES) if (rawUpgrades[id] === true) purchasedUpgrades[id] = true;

  const rawAchievements = isRecord(raw.unlockedAchievements) ? raw.unlockedAchievements : {};
  const unlockedAchievements: Record<string, number> = {};
  for (const { id } of ACHIEVEMENTS) {
    const unlockedAt = rawAchievements[id];
    if (typeof unlockedAt === 'number' && Number.isFinite(unlockedAt)) unlockedAchievements[id] = Math.max(0, unlockedAt);
    else if (unlockedAt === true) unlockedAchievements[id] = createdAt;
  }

  const rawPrestige = isRecord(raw.prestige) ? raw.prestige : {};
  const rawPermanent = isRecord(rawPrestige.permanentUpgrades) ? rawPrestige.permanentUpgrades : {};
  const permanentUpgrades: Partial<Record<PermanentUpgradeId, number>> = {};
  for (const definition of PERMANENT_UPGRADES) {
    const rank = Math.min(definition.maxRank, integer(rawPermanent[definition.id]));
    if (rank > 0) permanentUpgrades[definition.id] = rank;
  }

  const rawStats = isRecord(raw.statistics) ? raw.statistics : {};
  const rawBuildingProduction = isRecord(rawStats.lifetimeProducedByBuilding) ? rawStats.lifetimeProducedByBuilding : {};
  const lifetimeProducedByBuilding = createEmptyBuildingProduction();
  for (const { id } of BUILDINGS) lifetimeProducedByBuilding[id] = clampResource(nonNegativeNumber(rawBuildingProduction[id]));
  const rawMooncap = isRecord(raw.mooncap) ? raw.mooncap : {};
  const rawBuffs = Array.isArray(raw.buffs) ? raw.buffs : [];
  const buffs: BuffInstance[] = rawBuffs.flatMap((item): BuffInstance[] => {
    if (!isRecord(item)) return [];
    const id = item.id;
    const target = item.target;
    if ((id !== 'moon_frenzy' && id !== 'hatching_fever') || (target !== 'cps' && target !== 'click')) return [];
    const startedAt = integer(item.startedAt);
    const expiresAt = integer(item.expiresAt);
    const multiplier = nonNegativeNumber(item.multiplier, 1);
    if (expiresAt <= startedAt || multiplier <= 0) return [];
    return [{ id, target, startedAt, expiresAt, multiplier } as BuffInstance];
  });

  const fallbackLifetime = nonNegativeNumber(raw.totalGoblins, nonNegativeNumber(raw.goblins));
  const legacyOrCurrentShards = integer(rawPrestige.shards, integer(raw.prestigePoints));
  const totalShardsEarned = Math.max(
    legacyOrCurrentShards,
    integer(rawPrestige.totalShardsEarned, integer(raw.totalPrestigePoints)),
  );
  const state: GameState = {
    ...base,
    version: CURRENT_SAVE_VERSION,
    createdAt,
    lastUpdateAt: integer(raw.lastUpdateAt, integer(raw.lastSave, createdAt)),
    goblins: clampResource(nonNegativeNumber(raw.goblins)),
    runGoblins: clampResource(nonNegativeNumber(raw.runGoblins, fallbackLifetime)),
    lifetimeGoblins: clampResource(nonNegativeNumber(raw.lifetimeGoblins, fallbackLifetime)),
    buildings,
    purchasedUpgrades,
    unlockedAchievements,
    prestige: {
      shards: legacyOrCurrentShards,
      totalShardsEarned,
      resets: integer(rawPrestige.resets),
      permanentUpgrades,
    },
    buffs,
    mooncap: {
      active: rawMooncap.active === true,
      spawnedAt: rawMooncap.spawnedAt === null ? null : integer(rawMooncap.spawnedAt, 0) || null,
      expiresAt: rawMooncap.expiresAt === null ? null : integer(rawMooncap.expiresAt, 0) || null,
      nextSpawnAt: integer(rawMooncap.nextSpawnAt, base.mooncap.nextSpawnAt),
      rngSeed: normalizeSeed(finiteNumber(rawMooncap.rngSeed, base.mooncap.rngSeed)),
      rngCounter: integer(rawMooncap.rngCounter),
    },
    statistics: {
      totalClicks: integer(rawStats.totalClicks, integer(raw.totalClicks)),
      manuallyBorn: clampResource(nonNegativeNumber(rawStats.manuallyBorn)),
      goldenEventsClicked: integer(rawStats.goldenEventsClicked),
      totalTimePlayedMs: integer(rawStats.totalTimePlayedMs),
      highestCps: nonNegativeNumber(rawStats.highestCps),
      lifetimeProducedByBuilding,
    },
  };

  if (state.lastUpdateAt > now + 5 * 60_000) {
    warnings.push('Save timestamp was in the future and has been clamped to the current time.');
    state.lastUpdateAt = now;
  }
  if (state.lifetimeGoblins < state.runGoblins) state.lifetimeGoblins = state.runGoblins;
  return state;
}

export function serializeGame(state: GameState, savedAt = state.lastUpdateAt): string {
  const envelope: SaveEnvelope = {
    schema: 'goblin-clicker-save',
    version: CURRENT_SAVE_VERSION,
    savedAt: Math.max(0, Math.floor(savedAt)),
    state: { ...state, version: CURRENT_SAVE_VERSION },
  };
  return JSON.stringify(envelope);
}

export function deserializeGame(serialized: string, now = Date.now()): DeserializeResult {
  const warnings: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error('Save data is not valid JSON.');
  }
  if (!isRecord(parsed)) throw new Error('Save data must be a JSON object.');

  const declaresCurrentSchema = parsed.schema === 'goblin-clicker-save';
  if (declaresCurrentSchema && !isRecord(parsed.state)) {
    throw new Error('Save file is missing a valid game state.');
  }
  if (!declaresCurrentSchema && Object.prototype.hasOwnProperty.call(parsed, 'schema')) {
    throw new Error('Save file schema is not supported.');
  }
  if (!declaresCurrentSchema && !looksLikeLegacySave(parsed)) {
    throw new Error('JSON file does not contain a recognized Goblin Clicker save.');
  }

  const isEnvelope = declaresCurrentSchema;
  const rawState = (isEnvelope ? parsed.state : parsed) as Record<string, unknown>;
  const declaredVersion = integer(isEnvelope ? parsed.version : rawState.version, 1);
  if (declaredVersion > CURRENT_SAVE_VERSION) {
    throw new Error(`Save version ${declaredVersion} is newer than supported version ${CURRENT_SAVE_VERSION}.`);
  }
  if (declaredVersion < CURRENT_SAVE_VERSION) {
    warnings.push(`Save migrated from version ${declaredVersion} to ${CURRENT_SAVE_VERSION}.`);
  }
  const state = sanitizeState(rawState, Math.max(0, Math.floor(now)), warnings);
  return { state, migratedFrom: declaredVersion < CURRENT_SAVE_VERSION ? declaredVersion : null, warnings };
}

export function migrateSave(serialized: string, now = Date.now()): string {
  const { state } = deserializeGame(serialized, now);
  return serializeGame(state, now);
}

/** Human-readable portable export suitable for clipboard or file download. */
export function exportGameSave(state: GameState, savedAt = state.lastUpdateAt): string {
  const envelope = JSON.parse(serializeGame(state, savedAt)) as SaveEnvelope;
  return JSON.stringify(envelope, null, 2);
}

/** Imports either compact autosave JSON, pretty exported JSON, or supported legacy JSON. */
export function importGameSave(serialized: string, now = Date.now()): DeserializeResult {
  return deserializeGame(serialized, now);
}
