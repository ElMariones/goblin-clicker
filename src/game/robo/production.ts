import { clampResource } from '../state';
import { ROBO_CHARGE_CAP, ROBO_LINES } from './content';
import { getRoboLineCycleFromState, getRoboLineStableRateFromState, getRoboStableRpsFromState } from './math';
import type { RoboLineState, RoboState } from './types';

export interface RoboLineIntegration {
  phaseSeconds: number;
  pendingRG: number;
  paidRG: number;
}

export function integrateRoboLine(
  phaseSeconds: number,
  pendingRG: number,
  cycleSeconds: number,
  rate: number,
  seconds: number,
): RoboLineIntegration {
  if (!(seconds > 0) || !(cycleSeconds > 0) || !(rate >= 0)) {
    return { phaseSeconds, pendingRG, paidRG: 0 };
  }
  const phase = Math.min(cycleSeconds, Math.max(0, phaseSeconds));
  const pending = Math.max(0, pendingRG);
  const firstBoundary = cycleSeconds - phase;
  if (seconds < firstBoundary - 1e-9) {
    return {
      phaseSeconds: phase + seconds,
      pendingRG: clampResource(pending + rate * seconds),
      paidRG: 0,
    };
  }
  const remaining = Math.max(0, seconds - firstBoundary);
  const fullCycles = Math.floor((remaining + 1e-9) / cycleSeconds);
  const rawLeftoverSeconds = Math.max(0, remaining - fullCycles * cycleSeconds);
  // Exact cycle boundaries can leave a few floating-point femtoseconds behind
  // after subtraction. Treat that numerical dust as zero so phase/pending state
  // does not surface tiny ghost batches such as 0.00000015 RG in telemetry.
  const leftoverSeconds = rawLeftoverSeconds <= 1e-9 ? 0 : rawLeftoverSeconds;
  return {
    phaseSeconds: leftoverSeconds,
    pendingRG: clampResource(rate * leftoverSeconds),
    paidRG: clampResource(pending + rate * firstBoundary + fullCycles * cycleSeconds * rate),
  };
}

function advanceSegment(
  robo: RoboState,
  seconds: number,
  totalShardsEarned: number,
  rateMultiplier: number,
  refillCharge: boolean,
): RoboState {
  if (!(seconds > 0)) return robo;
  const lines = { ...robo.lines };
  const lifetimeProducedByLine = { ...robo.statistics.lifetimeProducedByLine };
  let paidTotal = 0;
  for (const definition of ROBO_LINES) {
    const current = robo.lines[definition.id];
    if (current.owned <= 0) continue;
    const cycle = getRoboLineCycleFromState(robo, definition.id);
    const stableRate = getRoboLineStableRateFromState(robo, definition.id, totalShardsEarned);
    const integrated = integrateRoboLine(current.phaseSeconds, current.pendingRG, cycle, stableRate * rateMultiplier, seconds);
    const nextLine: RoboLineState = {
      ...current,
      phaseSeconds: integrated.phaseSeconds,
      pendingRG: integrated.pendingRG,
    };
    lines[definition.id] = nextLine;
    if (integrated.paidRG > 0) {
      paidTotal = clampResource(paidTotal + integrated.paidRG);
      lifetimeProducedByLine[definition.id] = clampResource(lifetimeProducedByLine[definition.id] + integrated.paidRG);
    }
  }
  const hasLine = ROBO_LINES.some((line) => robo.lines[line.id].owned > 0);
  const charge = refillCharge && hasLine
    ? Math.min(ROBO_CHARGE_CAP, robo.capacitor.charge + seconds)
    : robo.capacitor.charge;
  return {
    ...robo,
    readyRG: clampResource(robo.readyRG + paidTotal),
    runProducedRG: clampResource(robo.runProducedRG + paidTotal),
    lifetimeProducedRG: clampResource(robo.lifetimeProducedRG + paidTotal),
    lines,
    capacitor: { ...robo.capacitor, charge },
    statistics: {
      ...robo.statistics,
      highestStableRps: Math.max(robo.statistics.highestStableRps, getRoboStableRpsFromState(robo, totalShardsEarned)),
      lifetimeProducedByLine,
    },
  };
}

export function advanceRoboBetween(robo: RoboState, startMs: number, endMs: number, totalShardsEarned: number): RoboState {
  if (endMs <= startMs) return robo;
  let next = robo;
  let cursor = startMs;
  const overclockEndsAt = robo.capacitor.overclockEndsAt;
  if (overclockEndsAt !== null && overclockEndsAt <= cursor) {
    next = { ...next, capacitor: { ...next.capacitor, overclockEndsAt: null } };
  } else if (overclockEndsAt !== null && overclockEndsAt > cursor) {
    const activeEnd = Math.min(endMs, overclockEndsAt);
    next = advanceSegment(next, (activeEnd - cursor) / 1_000, totalShardsEarned, 2, false);
    cursor = activeEnd;
    if (cursor >= overclockEndsAt) {
      next = { ...next, capacitor: { ...next.capacitor, overclockEndsAt: null } };
    }
  }
  if (cursor < endMs) {
    next = advanceSegment(next, (endMs - cursor) / 1_000, totalShardsEarned, 1, true);
  }
  return next;
}

export function advanceRoboOfflineSeconds(
  robo: RoboState,
  creditedSeconds: number,
  efficiency: number,
  totalShardsEarned: number,
): RoboState {
  const cleared = robo.capacitor.overclockEndsAt === null
    ? robo
    : { ...robo, capacitor: { ...robo.capacitor, overclockEndsAt: null } };
  return advanceSegment(cleared, Math.max(0, creditedSeconds), totalShardsEarned, Math.min(1, Math.max(0, efficiency)), true);
}

export function drainRoboPending(robo: RoboState, resetPhases = true): RoboState {
  const lines = { ...robo.lines };
  const lifetimeProducedByLine = { ...robo.statistics.lifetimeProducedByLine };
  let total = 0;
  for (const definition of ROBO_LINES) {
    const current = robo.lines[definition.id];
    const pending = Math.max(0, current.pendingRG);
    total = clampResource(total + pending);
    if (pending > 0) lifetimeProducedByLine[definition.id] = clampResource(lifetimeProducedByLine[definition.id] + pending);
    lines[definition.id] = {
      ...current,
      phaseSeconds: resetPhases ? 0 : current.phaseSeconds,
      pendingRG: 0,
    };
  }
  if (total <= 0 && !resetPhases) return robo;
  return {
    ...robo,
    readyRG: clampResource(robo.readyRG + total),
    runProducedRG: clampResource(robo.runProducedRG + total),
    lifetimeProducedRG: clampResource(robo.lifetimeProducedRG + total),
    lines,
    statistics: { ...robo.statistics, lifetimeProducedByLine },
  };
}
