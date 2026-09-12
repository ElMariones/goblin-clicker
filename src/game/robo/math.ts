import type { GameState } from '../types';
import {
  FAMILY_ADAPTER_MILESTONES,
  INHERITED_BLUEPRINT_MILESTONES,
  KERNEL_PERK_BY_ID,
  ROBO_CIRCUITS,
  ROBO_CIRCUIT_THRESHOLDS,
  ROBO_COST_GROWTH,
  ROBO_GLOBAL_BLUEPRINTS,
  ROBO_LINE_BY_ID,
  ROBO_LINES,
  ROBO_MASTERY_LEVELS,
  ROBO_MAX_CORES,
  ROBO_MAX_OWNED,
  ROBO_CORE_SCALE,
} from './content';
import { getRoboProjectMultiplier, hasRoboBulkFabrication, hasRoboDeepFabrication } from './projects';
import { getRawKernelPerkRank } from './state';
import type { KernelPerkId, RoboCircuitId, RoboCircuitSummary, RoboLineId, RoboState } from './types';

const EPSILON = 1e-9;

function getRoboFromGame(state: GameState): RoboState | null {
  return state.unlocks.robogoblins ? state.robo : null;
}

export function getKernelPerkRank(state: GameState, id: KernelPerkId): number {
  const robo = getRoboFromGame(state);
  return robo ? getRawKernelPerkRank(robo, id) : 0;
}

export function getKernelPerkCost(state: GameState, id: KernelPerkId): number {
  const definition = KERNEL_PERK_BY_ID[id];
  if (!definition) return Number.POSITIVE_INFINITY;
  const rank = getKernelPerkRank(state, id);
  if (rank >= definition.maxRank) return Number.POSITIVE_INFINITY;
  const cost = definition.baseCost * 2 ** rank;
  return Number.isSafeInteger(cost) ? cost : Number.POSITIVE_INFINITY;
}

export function getInheritedBlueprintsFactor(totalShardsEarned: number): number {
  const reached = INHERITED_BLUEPRINT_MILESTONES.filter((threshold) => totalShardsEarned >= threshold).length;
  return Math.min(1.1, 1 + reached * 0.02);
}

export function getFamilyAdapterFactor(totalCoresEarned: number, adapterRank: number): number {
  const reached = FAMILY_ADAPTER_MILESTONES.filter((threshold) => totalCoresEarned >= threshold).length;
  return Math.min(1.25, 1 + reached * Math.max(0, Math.min(5, Math.floor(adapterRank))) * 0.01);
}

export function getRoboLineMasteryFromOwned(owned: number): number {
  const count = Math.max(0, Math.floor(owned));
  return ROBO_MASTERY_LEVELS.reduce(
    (multiplier, level) => multiplier * (count >= level.threshold ? level.multiplier : 1),
    1,
  );
}

export function getRoboLineMastery(state: GameState, lineId: RoboLineId): number {
  const robo = getRoboFromGame(state);
  return robo && ROBO_LINE_BY_ID[lineId] ? getRoboLineMasteryFromOwned(robo.lines[lineId].owned) : 1;
}

export function getRoboCircuitTierCount(robo: RoboState, circuitId: RoboCircuitId): number {
  const members = ROBO_CIRCUITS[circuitId];
  return ROBO_CIRCUIT_THRESHOLDS.filter((threshold) => members.every((lineId) => robo.lines[lineId].owned >= threshold)).length;
}

export function getRoboCircuitTierTotal(robo: RoboState): number {
  return (Object.keys(ROBO_CIRCUITS) as RoboCircuitId[]).reduce((sum, circuitId) => sum + getRoboCircuitTierCount(robo, circuitId), 0);
}

export function getRoboCircuitSummary(state: GameState): RoboCircuitSummary[] {
  const robo = getRoboFromGame(state);
  return (Object.keys(ROBO_CIRCUITS) as RoboCircuitId[]).map((id) => {
    const lineIds = ROBO_CIRCUITS[id];
    const tiers = robo ? getRoboCircuitTierCount(robo, id) : 0;
    const nextThreshold = ROBO_CIRCUIT_THRESHOLDS[tiers] ?? null;
    let bottleneck: RoboCircuitSummary['bottleneck'] = null;
    if (robo && nextThreshold !== null) {
      const lineId = lineIds.reduce((current, candidate) => (
        robo.lines[candidate].owned < robo.lines[current].owned ? candidate : current
      ), lineIds[0]);
      const owned = robo.lines[lineId].owned;
      bottleneck = { lineId, owned, needed: Math.max(0, nextThreshold - owned) };
    }
    return { id, lineIds, tiers, nextThreshold, bottleneck };
  });
}

export function getRoboCircuitMultiplier(robo: RoboState): number {
  const increment = 0.1 + 0.01 * getRawKernelPerkRank(robo, 'copper_memory');
  return 1 + getRoboCircuitTierTotal(robo) * increment;
}

export function getRoboGlobalBlueprintMultiplier(robo: RoboState): number {
  return ROBO_GLOBAL_BLUEPRINTS.slice(0, robo.globalBlueprintRank)
    .reduce((multiplier, blueprint) => multiplier * blueprint.multiplier, 1);
}

export function getRoboLineCycleFromState(robo: RoboState, lineId: RoboLineId): number {
  const base = ROBO_LINE_BY_ID[lineId].batchSeconds;
  if (robo.firmware.cadence === 'quick') return base * 0.5;
  if (robo.firmware.cadence === 'heavy') return base * 2;
  return base;
}

export function getRoboLineCycle(state: GameState, lineId: RoboLineId): number {
  const robo = getRoboFromGame(state);
  return robo && ROBO_LINE_BY_ID[lineId] ? getRoboLineCycleFromState(robo, lineId) : ROBO_LINE_BY_ID[lineId]?.batchSeconds ?? 0;
}

export function getRoboLineStableRateFromState(robo: RoboState, lineId: RoboLineId, totalShardsEarned: number): number {
  const definition = ROBO_LINE_BY_ID[lineId];
  const line = robo.lines[lineId];
  if (!definition || !line || line.owned <= 0) return 0;
  const mastery = getRoboLineMasteryFromOwned(line.owned);
  const localBlueprint = 2 ** line.blueprintRank;
  const circuit = getRoboCircuitMultiplier(robo);
  const core = getRoboCoreMultiplier(robo.kernel.totalCoresEarned);
  const projects = getRoboProjectMultiplier(robo, definition.circuit);
  const bolts = 1 + 0.05 * getRawKernelPerkRank(robo, 'better_bolts');
  const global = getRoboGlobalBlueprintMultiplier(robo);
  const heritage = getInheritedBlueprintsFactor(totalShardsEarned);
  const cadence = robo.firmware.cadence === 'heavy' ? 1.15 : 1;
  const control = robo.firmware.control === 'clock' ? 1.2 : 1;
  const rate = definition.baseRps * line.owned * mastery * localBlueprint * circuit * core * bolts * global * heritage * cadence * control * projects;
  return Number.isFinite(rate) ? Math.min(1e300, Math.max(0, rate)) : 1e300;
}

export function getRoboLineRate(state: GameState, lineId: RoboLineId): number {
  const robo = getRoboFromGame(state);
  return robo && ROBO_LINE_BY_ID[lineId]
    ? getRoboLineStableRateFromState(robo, lineId, state.prestige.totalShardsEarned)
    : 0;
}

export function getRoboStableRpsFromState(robo: RoboState, totalShardsEarned: number): number {
  return ROBO_LINES.reduce((sum, line) => Math.min(1e300, sum + getRoboLineStableRateFromState(robo, line.id, totalShardsEarned)), 0);
}

export function getRoboStableRps(state: GameState): number {
  const robo = getRoboFromGame(state);
  return robo ? getRoboStableRpsFromState(robo, state.prestige.totalShardsEarned) : 0;
}

export function getRoboClickPower(state: GameState): number {
  const robo = getRoboFromGame(state);
  if (!robo) return 0;
  const stable = getRoboStableRpsFromState(robo, state.prestige.totalShardsEarned);
  const preControl = robo.firmware.control === 'clock' ? stable / 1.2 : stable;
  const fraction = robo.firmware.control === 'spark' ? 0.15 : 0.03;
  const servos = 1 + 0.1 * getRawKernelPerkRank(robo, 'finger_servos');
  const power = (1 + preControl * fraction) * servos;
  return Number.isFinite(power) ? Math.min(1e300, Math.max(1, power)) : 1e300;
}

export function getRoboTotalPending(state: GameState): number {
  const robo = getRoboFromGame(state);
  if (!robo) return 0;
  return ROBO_LINES.reduce((sum, line) => Math.min(1e300, sum + robo.lines[line.id].pendingRG), 0);
}

export function getRoboTotalPendingFromState(robo: RoboState): number {
  return ROBO_LINES.reduce((sum, line) => Math.min(1e300, sum + Math.max(0, robo.lines[line.id].pendingRG)), 0);
}

export function getRoboLineBulkCostFromState(robo: RoboState, lineId: RoboLineId, count = 1): number {
  const definition = ROBO_LINE_BY_ID[lineId];
  if (!definition || !Number.isFinite(count)) return Number.POSITIVE_INFINITY;
  const quantity = Math.max(0, Math.floor(count));
  if (quantity === 0) return 0;
  const owned = Math.max(0, Math.floor(robo.lines[lineId].owned));
  if (owned + quantity > ROBO_MAX_OWNED) return Number.POSITIVE_INFINITY;
  const geometric = (first: number, growth: number, units: number) => units === 0 ? 0
    : first * Math.expm1(units * Math.log(growth)) / (growth - 1);
  let raw: number;
  if (hasRoboBulkFabrication(robo, definition.circuit)) {
    const normalUnits = Math.min(quantity, Math.max(0, 100 - owned));
    const deepFabrication = hasRoboDeepFabrication(robo, definition.circuit);
    const bulkUnits = deepFabrication ? Math.min(quantity - normalUnits, Math.max(0, 500 - Math.max(100, owned))) : quantity - normalUnits;
    const deepUnits = quantity - normalUnits - bulkUnits;
    const normal = geometric(definition.baseCost * ROBO_COST_GROWTH ** Math.min(owned, 100), ROBO_COST_GROWTH, normalUnits);
    const bulkOwned = deepFabrication ? Math.min(500, owned) : owned;
    const bulkFirst = definition.baseCost * ROBO_COST_GROWTH ** 100 * 1.035 ** Math.max(0, bulkOwned - 100);
    const deepFirst = definition.baseCost * ROBO_COST_GROWTH ** 100 * 1.035 ** 400 * 1.015 ** Math.max(0, owned - 500);
    raw = normal + geometric(bulkFirst, 1.035, bulkUnits) + geometric(deepFirst, 1.015, deepUnits);
  } else {
    raw = geometric(definition.baseCost * Math.exp(owned * Math.log(ROBO_COST_GROWTH)), ROBO_COST_GROWTH, quantity);
  }
  return Number.isFinite(raw) ? Math.max(1, Math.ceil(raw - EPSILON)) : Number.POSITIVE_INFINITY;
}

export function getRoboLineBulkCost(state: GameState, lineId: RoboLineId, count = 1): number {
  const robo = getRoboFromGame(state);
  return robo ? getRoboLineBulkCostFromState(robo, lineId, count) : Number.POSITIVE_INFINITY;
}

export function getRoboMaxAffordableLineCount(state: GameState, lineId: RoboLineId, budget = state.robo?.readyRG ?? 0): number {
  const robo = getRoboFromGame(state);
  if (!robo || !ROBO_LINE_BY_ID[lineId]) return 0;
  if (budget === Number.POSITIVE_INFINITY) return Math.max(0, ROBO_MAX_OWNED - robo.lines[lineId].owned);
  if (!(budget > 0) || !Number.isFinite(budget)) return 0;
  const remaining = ROBO_MAX_OWNED - robo.lines[lineId].owned;
  if (remaining <= 0 || getRoboLineBulkCostFromState(robo, lineId, 1) > budget + EPSILON) return 0;
  // Binary search also handles purchases crossing the fabrication threshold.
  let low = 0;
  let high = remaining;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (getRoboLineBulkCostFromState(robo, lineId, middle) <= budget + EPSILON) low = middle;
    else high = middle - 1;
  }
  return low;
}

export function getRoboCorePotential(eligibleLifetimeRG: number): number {
  const amount = Math.max(0, Number.isFinite(eligibleLifetimeRG) ? eligibleLifetimeRG : eligibleLifetimeRG > 0 ? 1e300 : 0);
  let candidate = Math.min(ROBO_MAX_CORES, Math.max(0, Math.floor(Math.cbrt(amount / ROBO_CORE_SCALE))));
  while (candidate < ROBO_MAX_CORES && ROBO_CORE_SCALE * (candidate + 1) ** 3 <= amount) candidate += 1;
  while (candidate > 0 && ROBO_CORE_SCALE * candidate ** 3 > amount) candidate -= 1;
  return candidate;
}

export function getRoboRecompileGain(state: GameState): number {
  const robo = getRoboFromGame(state);
  if (!robo) return 0;
  const eligible = Math.min(1e300, robo.lifetimeProducedRG + getRoboTotalPendingFromState(robo));
  return Math.max(0, getRoboCorePotential(eligible) - robo.kernel.totalCoresEarned);
}

export function getRoboNextMilestoneQuantity(robo: RoboState, lineId: RoboLineId): number {
  const owned = robo.lines[lineId].owned;
  const next = ROBO_MASTERY_LEVELS.find((level) => owned < level.threshold);
  return next ? next.threshold - owned : 1;
}

export function isRoboLineRevealed(robo: RoboState, lineId: RoboLineId): boolean {
  const index = ROBO_LINES.findIndex((line) => line.id === lineId);
  if (index <= 0) return index === 0;
  return robo.lines[ROBO_LINES[index - 1].id].owned > 0;
}

/** Preserve early prestige gains, then taper the compounding feedback loop. */
export function getRoboCoreMultiplier(totalCoresEarned: number): number {
  const cores = Math.max(0, Math.min(ROBO_MAX_CORES, Number.isFinite(totalCoresEarned) ? totalCoresEarned : 0));
  return cores <= 64 ? 1 + cores * 0.1 : 7.4 + 0.8 * (Math.sqrt(cores) - 8);
}
