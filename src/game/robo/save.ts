import { clampResource } from '../state';
import { awardRoboAchievements, isRoboAppearanceUnlocked } from './achievements';
import {
  KERNEL_PERKS,
  ROBO_ACHIEVEMENTS,
  ROBO_CHARGE_CAP,
  ROBO_GLOBAL_BLUEPRINTS,
  ROBO_LINE_BY_ID,
  ROBO_LINES,
  ROBO_MAX_CORES,
  ROBO_MAX_OWNED,
} from './content';
import { createInitialRoboState } from './state';
import type {
  CadenceFirmware,
  ControlFirmware,
  KernelPerkId,
  RoboAchievementId,
  RoboAppearanceId,
  RoboLineId,
  RoboState,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finite(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function nonNegative(value: unknown, fallback = 0): number {
  return Math.max(0, finite(value, fallback));
}

function integer(value: unknown, fallback = 0): number {
  return Math.max(0, Math.floor(finite(value, fallback)));
}

function rankSpend(id: KernelPerkId, rank: number): number {
  const definition = KERNEL_PERKS.find((perk) => perk.id === id);
  if (!definition || rank <= 0) return 0;
  return definition.baseCost * (2 ** rank - 1);
}

function totalPerkSpend(perks: Partial<Record<KernelPerkId, number>>): number {
  return KERNEL_PERKS.reduce((sum, perk) => sum + rankSpend(perk.id, perks[perk.id] ?? 0), 0);
}

export function sanitizeRoboState(raw: Record<string, unknown>, lastUpdateAt: number, warnings: string[]): RoboState {
  const base = createInitialRoboState();
  const rawKernel = isRecord(raw.kernel) ? raw.kernel : {};
  const totalCoresEarned = Math.min(ROBO_MAX_CORES, integer(rawKernel.totalCoresEarned));
  const rawPerks = isRecord(rawKernel.perks) ? rawKernel.perks : {};
  const perks: Partial<Record<KernelPerkId, number>> = {};
  for (const definition of KERNEL_PERKS) {
    const rank = Math.min(definition.maxRank, integer(rawPerks[definition.id]));
    if (rank > 0) perks[definition.id] = rank;
  }
  if (totalPerkSpend(perks) > totalCoresEarned) {
    warnings.push('RoboGoblins Kernel ranks exceeded earned cores and were conservatively reduced.');
    for (const definition of [...KERNEL_PERKS].reverse()) {
      while ((perks[definition.id] ?? 0) > 0 && totalPerkSpend(perks) > totalCoresEarned) {
        const nextRank = (perks[definition.id] ?? 0) - 1;
        if (nextRank <= 0) delete perks[definition.id];
        else perks[definition.id] = nextRank;
      }
    }
  }
  const minimumSpent = totalPerkSpend(perks);
  const cores = Math.min(integer(rawKernel.cores), Math.max(0, totalCoresEarned - minimumSpent));

  const rawFirmware = isRecord(raw.firmware) ? raw.firmware : {};
  const control: ControlFirmware | null = rawFirmware.control === 'clock' || rawFirmware.control === 'spark'
    ? rawFirmware.control
    : null;
  const cadence: CadenceFirmware | null = rawFirmware.cadence === 'quick' || rawFirmware.cadence === 'heavy'
    ? rawFirmware.cadence
    : null;
  const rawLines = isRecord(raw.lines) ? raw.lines : {};
  const lines = { ...base.lines };
  for (const definition of ROBO_LINES) {
    const rawLine = rawLines[definition.id];
    const item: Record<string, unknown> = isRecord(rawLine) ? rawLine : {};
    const owned = Math.min(ROBO_MAX_OWNED, integer(item.owned));
    const blueprintRank = Math.min(3, integer(item.blueprintRank));
    const cycle = definition.batchSeconds * (cadence === 'quick' ? 0.5 : cadence === 'heavy' ? 2 : 1);
    const phaseRaw = nonNegative(item.phaseSeconds);
    const phaseSeconds = owned > 0 && cycle > 0 ? phaseRaw % cycle : 0;
    const pendingRG = owned > 0 ? clampResource(nonNegative(item.pendingRG)) : 0;
    lines[definition.id] = { owned, blueprintRank, phaseSeconds, pendingRG };
  }

  const rawStats = isRecord(raw.statistics) ? raw.statistics : {};
  const rawByLine = isRecord(rawStats.lifetimeProducedByLine) ? rawStats.lifetimeProducedByLine : {};
  const lifetimeProducedByLine = { ...base.statistics.lifetimeProducedByLine };
  for (const definition of ROBO_LINES) lifetimeProducedByLine[definition.id] = clampResource(nonNegative(rawByLine[definition.id]));

  const rawAchievements = isRecord(raw.achievements) ? raw.achievements : {};
  const achievements: Partial<Record<RoboAchievementId, number>> = {};
  for (const definition of ROBO_ACHIEVEMENTS) {
    const value = rawAchievements[definition.id];
    if (typeof value === 'number' && Number.isFinite(value)) achievements[definition.id] = Math.max(0, value);
    else if (value === true) achievements[definition.id] = lastUpdateAt;
  }

  const runProducedRG = clampResource(nonNegative(raw.runProducedRG));
  const lifetimeProducedRG = Math.max(runProducedRG, clampResource(nonNegative(raw.lifetimeProducedRG)));
  const rawCapacitor = isRecord(raw.capacitor) ? raw.capacitor : {};
  const candidateEndsAt = integer(rawCapacitor.overclockEndsAt);
  const overclockEndsAt = candidateEndsAt > lastUpdateAt && candidateEndsAt <= lastUpdateAt + 30_000
    ? candidateEndsAt
    : null;

  const recoveredStartingStock = base.readyRG + 100 * (perks.boot_cache ?? 0);
  const recoveredStartingCharge = Math.min(ROBO_CHARGE_CAP, 30 * (perks.warm_start ?? 0));
  let state: RoboState = {
    readyRG: clampResource(nonNegative(raw.readyRG, recoveredStartingStock)),
    runProducedRG,
    lifetimeProducedRG,
    lines,
    globalBlueprintRank: Math.min(ROBO_GLOBAL_BLUEPRINTS.length, integer(raw.globalBlueprintRank)),
    firmware: { control, cadence },
    capacitor: {
      charge: Math.min(ROBO_CHARGE_CAP, nonNegative(rawCapacitor.charge, recoveredStartingCharge)),
      overclockEndsAt,
    },
    kernel: {
      cores,
      totalCoresEarned,
      recompiles: integer(rawKernel.recompiles),
      perks,
    },
    statistics: {
      manualActions: integer(rawStats.manualActions),
      manuallyAssembledRG: clampResource(nonNegative(rawStats.manuallyAssembledRG)),
      highestStableRps: clampResource(nonNegative(rawStats.highestStableRps)),
      lifetimeProducedByLine,
      overclocksActivated: integer(rawStats.overclocksActivated),
    },
    achievements,
    appearance: 'tin_rascal',
  };
  state = awardRoboAchievements(state, lastUpdateAt);
  const appearance = raw.appearance as RoboAppearanceId;
  if ((appearance === 'tin_rascal' || appearance === 'boiler_baron' || appearance === 'clockwork_ancestor')
    && isRoboAppearanceUnlocked(state, appearance)) {
    state.appearance = appearance;
  }
  return state;
}

export function isKnownRoboLineId(value: unknown): value is RoboLineId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(ROBO_LINE_BY_ID, value);
}
