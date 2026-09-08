import { tickGame } from '../engine';
import { clampResource } from '../state';
import type { GameState } from '../types';
import { awardRoboAchievements, isRoboAppearanceUnlocked } from './achievements';
import {
  KERNEL_PERK_BY_ID,
  ROBO_CHARGE_CAP,
  ROBO_FIRMWARE,
  ROBO_GLOBAL_BLUEPRINTS,
  ROBO_GLOBAL_BLUEPRINT_BY_ID,
  ROBO_LINE_BY_ID,
  ROBO_LINES,
  ROBO_LOCAL_BLUEPRINTS,
  ROBO_LOCAL_BLUEPRINT_BY_ID,
  ROBO_MAX_CORES,
  ROBO_MAX_OWNED,
  ROBO_OVERCLOCK_DURATION_MS,
} from './content';
import {
  getKernelPerkCost,
  getKernelPerkRank,
  getRoboClickPower,
  getRoboLineBulkCostFromState,
  getRoboMaxAffordableLineCount,
  getRoboNextMilestoneQuantity,
  getRoboRecompileGain,
  isRoboLineRevealed,
} from './math';
import { drainRoboPending } from './production';
import { createRecompiledRoboState } from './state';
import type {
  CadenceFirmware,
  ControlFirmware,
  KernelPerkId,
  RoboActionFailureReason,
  RoboActionResult,
  RoboAppearanceId,
  RoboBlueprintId,
  RoboFirmwareGroup,
  RoboLineId,
  RoboState,
} from './types';

export type RoboGameActionResult = RoboActionResult<GameState>;
export type RoboPurchaseAmount = number | 'max' | 'nextMilestone';

function failure(state: GameState, reason: RoboActionFailureReason, amount = 0): RoboGameActionResult {
  return { state, success: false, amount, reason };
}

function withRobo(state: GameState, robo: RoboState, now: number): GameState {
  return { ...state, robo: awardRoboAchievements(robo, now) };
}

function requireRobo(state: GameState): RoboState | null {
  return state.unlocks.robogoblins ? state.robo : null;
}

export function assembleRoboGoblin(state: GameState, now = state.lastUpdateAt): RoboGameActionResult {
  const ticked = tickGame(state, now);
  const robo = requireRobo(ticked);
  if (!robo) return failure(ticked, 'locked');
  const power = getRoboClickPower(ticked);
  const nextRobo: RoboState = {
    ...robo,
    readyRG: clampResource(robo.readyRG + power),
    runProducedRG: clampResource(robo.runProducedRG + power),
    lifetimeProducedRG: clampResource(robo.lifetimeProducedRG + power),
    statistics: {
      ...robo.statistics,
      manualActions: robo.statistics.manualActions + 1,
      manuallyAssembledRG: clampResource(robo.statistics.manuallyAssembledRG + power),
    },
  };
  return { state: withRobo(ticked, nextRobo, now), success: true, amount: power };
}

function resolveLinePurchaseQuantity(state: GameState, lineId: RoboLineId, amount: RoboPurchaseAmount): number {
  const robo = state.robo;
  if (!robo) return 0;
  if (amount === 'max') return getRoboMaxAffordableLineCount(state, lineId);
  if (amount === 'nextMilestone') return getRoboNextMilestoneQuantity(robo, lineId);
  return Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
}

export function purchaseRoboLine(
  state: GameState,
  lineId: RoboLineId,
  amount: RoboPurchaseAmount = 1,
  now = state.lastUpdateAt,
): RoboGameActionResult {
  if (!ROBO_LINE_BY_ID[lineId]) return failure(state, 'invalidInput');
  const ticked = tickGame(state, now);
  const robo = requireRobo(ticked);
  if (!robo) return failure(ticked, 'locked');
  if (!isRoboLineRevealed(robo, lineId)) return failure(ticked, 'requirementNotMet');
  const quantity = resolveLinePurchaseQuantity(ticked, lineId, amount);
  if (quantity <= 0 || robo.lines[lineId].owned + quantity > ROBO_MAX_OWNED) return failure(ticked, 'invalidInput');
  const cost = getRoboLineBulkCostFromState(robo, lineId, quantity);
  if (!Number.isFinite(cost)) return failure(ticked, 'maxRank', cost);
  if (robo.readyRG + 1e-9 < cost) return failure(ticked, 'insufficientFunds', cost);
  const firstPurchase = robo.lines[lineId].owned === 0;
  const nextRobo: RoboState = {
    ...robo,
    readyRG: clampResource(robo.readyRG - cost),
    lines: {
      ...robo.lines,
      [lineId]: {
        ...robo.lines[lineId],
        owned: robo.lines[lineId].owned + quantity,
        phaseSeconds: firstPurchase ? 0 : robo.lines[lineId].phaseSeconds,
      },
    },
  };
  return { state: withRobo(ticked, nextRobo, now), success: true, amount: cost };
}

export function purchaseRoboBlueprint(
  state: GameState,
  blueprintId: RoboBlueprintId,
  now = state.lastUpdateAt,
): RoboGameActionResult {
  const local = ROBO_LOCAL_BLUEPRINT_BY_ID[blueprintId];
  const global = ROBO_GLOBAL_BLUEPRINT_BY_ID[blueprintId];
  if (!local && !global) return failure(state, 'invalidInput');
  const ticked = tickGame(state, now);
  const robo = requireRobo(ticked);
  if (!robo) return failure(ticked, 'locked');

  if (local) {
    const line = robo.lines[local.lineId];
    const tierIndex = ROBO_LOCAL_BLUEPRINTS.filter((entry) => entry.lineId === local.lineId).findIndex((entry) => entry.id === local.id);
    if (line.blueprintRank > tierIndex) return failure(ticked, 'alreadyOwned', local.cost);
    if (line.blueprintRank !== tierIndex || line.owned < local.threshold) return failure(ticked, 'requirementNotMet', local.cost);
    if (robo.readyRG + 1e-9 < local.cost) return failure(ticked, 'insufficientFunds', local.cost);
    const nextRobo: RoboState = {
      ...robo,
      readyRG: clampResource(robo.readyRG - local.cost),
      lines: { ...robo.lines, [local.lineId]: { ...line, blueprintRank: line.blueprintRank + 1 } },
    };
    return { state: withRobo(ticked, nextRobo, now), success: true, amount: local.cost };
  }

  const globalDefinition = global!;
  const index = ROBO_GLOBAL_BLUEPRINTS.findIndex((entry) => entry.id === globalDefinition.id);
  if (robo.globalBlueprintRank > index) return failure(ticked, 'alreadyOwned', globalDefinition.cost);
  if (robo.globalBlueprintRank !== index || !ROBO_LINES.some((line) => robo.lines[line.id].owned > 0)) {
    return failure(ticked, 'requirementNotMet', globalDefinition.cost);
  }
  if (robo.readyRG + 1e-9 < globalDefinition.cost) return failure(ticked, 'insufficientFunds', globalDefinition.cost);
  const nextRobo: RoboState = {
    ...robo,
    readyRG: clampResource(robo.readyRG - globalDefinition.cost),
    globalBlueprintRank: robo.globalBlueprintRank + 1,
  };
  return { state: withRobo(ticked, nextRobo, now), success: true, amount: globalDefinition.cost };
}

export function purchaseRoboFirmware(
  state: GameState,
  group: RoboFirmwareGroup,
  choice: ControlFirmware | CadenceFirmware,
  now = state.lastUpdateAt,
): RoboGameActionResult {
  const valid = group === 'control'
    ? choice === 'clock' || choice === 'spark'
    : group === 'cadence' && (choice === 'quick' || choice === 'heavy');
  if (!valid) return failure(state, 'invalidInput');
  const ticked = tickGame(state, now);
  const robo = requireRobo(ticked);
  if (!robo) return failure(ticked, 'locked');
  if (robo.firmware[group] !== null) return failure(ticked, 'firmwareCommitted');
  const definition = ROBO_FIRMWARE[group];
  if (robo.runProducedRG < definition.unlockProducedRG) return failure(ticked, 'requirementNotMet', definition.cost);
  if (robo.readyRG + 1e-9 < definition.cost) return failure(ticked, 'insufficientFunds', definition.cost);

  let nextRobo = group === 'cadence' ? drainRoboPending(robo, true) : robo;
  nextRobo = {
    ...nextRobo,
    readyRG: clampResource(nextRobo.readyRG - definition.cost),
    firmware: group === 'control'
      ? { ...nextRobo.firmware, control: choice as ControlFirmware }
      : { ...nextRobo.firmware, cadence: choice as CadenceFirmware },
  };
  return { state: withRobo(ticked, nextRobo, now), success: true, amount: definition.cost };
}

export function activateRoboOverclock(state: GameState, now = state.lastUpdateAt): RoboGameActionResult {
  const ticked = tickGame(state, now);
  const robo = requireRobo(ticked);
  if (!robo) return failure(ticked, 'locked');
  if (!ROBO_LINES.some((line) => robo.lines[line.id].owned > 0)) return failure(ticked, 'requirementNotMet');
  if (robo.capacitor.overclockEndsAt !== null) return failure(ticked, 'requirementNotMet');
  if (robo.capacitor.charge + 1e-9 < ROBO_CHARGE_CAP) return failure(ticked, 'insufficientFunds', ROBO_CHARGE_CAP);
  const nextRobo: RoboState = {
    ...robo,
    capacitor: { charge: 0, overclockEndsAt: Math.max(ticked.lastUpdateAt, Math.floor(now)) + ROBO_OVERCLOCK_DURATION_MS },
    statistics: { ...robo.statistics, overclocksActivated: robo.statistics.overclocksActivated + 1 },
  };
  return { state: withRobo(ticked, nextRobo, now), success: true, amount: ROBO_CHARGE_CAP };
}

export function purchaseKernelPerk(
  state: GameState,
  perkId: KernelPerkId,
  now = state.lastUpdateAt,
): RoboGameActionResult {
  if (!KERNEL_PERK_BY_ID[perkId]) return failure(state, 'invalidInput');
  const ticked = tickGame(state, now);
  const robo = requireRobo(ticked);
  if (!robo) return failure(ticked, 'locked');
  const definition = KERNEL_PERK_BY_ID[perkId];
  const rank = getKernelPerkRank(ticked, perkId);
  if (rank >= definition.maxRank) return failure(ticked, 'maxRank');
  const cost = getKernelPerkCost(ticked, perkId);
  if (robo.kernel.cores < cost) return failure(ticked, 'insufficientFunds', cost);
  let nextRobo: RoboState = {
    ...robo,
    kernel: {
      ...robo.kernel,
      cores: robo.kernel.cores - cost,
      perks: { ...robo.kernel.perks, [perkId]: rank + 1 },
    },
  };
  if (perkId === 'boot_cache') nextRobo = { ...nextRobo, readyRG: clampResource(nextRobo.readyRG + 100) };
  if (perkId === 'warm_start') {
    nextRobo = {
      ...nextRobo,
      capacitor: { ...nextRobo.capacitor, charge: Math.min(ROBO_CHARGE_CAP, nextRobo.capacitor.charge + 30) },
    };
  }
  return { state: withRobo(ticked, nextRobo, now), success: true, amount: cost };
}

export function performRoboRecompile(state: GameState, now = state.lastUpdateAt): RoboGameActionResult {
  const ticked = tickGame(state, now);
  const robo = requireRobo(ticked);
  if (!robo) return failure(ticked, 'locked');
  const gain = getRoboRecompileGain(ticked);
  if (gain <= 0) return failure(ticked, 'noNewCores');
  const settled = drainRoboPending(robo, true);
  const earned = Math.min(ROBO_MAX_CORES, settled.kernel.totalCoresEarned + gain);
  const wallet = Math.min(ROBO_MAX_CORES, settled.kernel.cores + gain);
  const permanentRobo: RoboState = {
    ...settled,
    kernel: {
      ...settled.kernel,
      cores: wallet,
      totalCoresEarned: earned,
      recompiles: settled.kernel.recompiles + 1,
    },
  };
  const reset = createRecompiledRoboState(permanentRobo);
  return { state: withRobo(ticked, reset, now), success: true, amount: gain };
}

export function equipRoboAppearance(
  state: GameState,
  appearance: RoboAppearanceId,
  now = state.lastUpdateAt,
): RoboGameActionResult {
  if (appearance !== 'tin_rascal' && appearance !== 'boiler_baron' && appearance !== 'clockwork_ancestor') {
    return failure(state, 'invalidInput');
  }
  const ticked = tickGame(state, now);
  const robo = requireRobo(ticked);
  if (!robo) return failure(ticked, 'locked');
  const awarded = awardRoboAchievements(robo, now);
  if (!isRoboAppearanceUnlocked(awarded, appearance)) return failure({ ...ticked, robo: awarded }, 'requirementNotMet');
  return {
    state: { ...ticked, robo: { ...awarded, appearance } },
    success: true,
    amount: 0,
  };
}
