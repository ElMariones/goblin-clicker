/** Deterministic reinvestment heuristic using shipped prices, production and actions. */
import { createInitialGameState } from '../state';
import { createInitialRoboState, creditRoboProduction } from './state';
import { ROBO_BLUEPRINT_TIERS, ROBO_FIRMWARE, ROBO_GLOBAL_BLUEPRINTS, ROBO_LINES, ROBO_LOCAL_BLUEPRINTS, ROBO_MASTERY_LEVELS, ROBO_PROJECTS } from './content';
import { activateRoboOverclock, buildRoboProject, performRoboRecompile, purchaseKernelPerk, purchaseRoboBlueprint, purchaseRoboFirmware, purchaseRoboLine } from './engine';
import { getRoboClickPower, getRoboLineBulkCost, getRoboRecompileGain, getRoboStableRps, isRoboLineRevealed } from './math';
import { advanceRoboBetween } from './production';
import type { GameState } from '../types';
import type { RoboLineId, RoboProjectId } from './types';

export function simulateRoboPacing(hours: number, active = false, recompile = false, projects = false) {
  let state = createInitialGameState(0, 7);
  state.unlocks.robogoblins = true;
  state.robo = createInitialRoboState();
  const firstOwned: Partial<Record<RoboLineId, number>> = {};
  const firstProject: Partial<Record<RoboProjectId, number>> = {};
  let firstEightCores: number | null = null;
  let lastReset = 0;
  const step = 30;
  for (let seconds = 0; seconds <= hours * 3600; seconds += step) {
    if (seconds > 0) {
      state.robo = advanceRoboBetween(state.robo!, (seconds - step) * 1000, seconds * 1000, 0);
      if (active) state.robo = creditRoboProduction(state.robo, getRoboClickPower(state) * 2 * step);
    }
    state.lastUpdateAt = seconds * 1000;
    if (getRoboRecompileGain(state) >= 8 && firstEightCores === null) firstEightCores = seconds;
    if (recompile && seconds - lastReset >= 900 && getRoboRecompileGain(state) >= Math.max(8, state.robo!.kernel.totalCoresEarned)) {
      state = performRoboRecompile(state).state;
      lastReset = seconds;
      for (let rank = 0; rank < 10; rank += 1) state = purchaseKernelPerk(state, 'better_bolts').state;
      for (let rank = 0; rank < 5; rank += 1) state = purchaseKernelPerk(state, 'boot_cache').state;
    }
    if (active) state = activateRoboOverclock(state).state;
    for (const group of ['control', 'cadence'] as const) {
      const def = ROBO_FIRMWARE[group];
      if (!state.robo!.firmware[group] && state.robo!.runProducedRG >= def.unlockProducedRG && state.robo!.readyRG >= def.cost) {
        state = purchaseRoboFirmware(state, group, group === 'control' ? (active ? 'spark' : 'clock') : 'heavy').state;
      }
    }
    if (projects) for (const project of ROBO_PROJECTS) {
      const result = buildRoboProject(state, project.id);
      if (result.success && firstProject[project.id] === undefined) firstProject[project.id] = seconds;
      state = result.state;
    }
    for (let buys = 0; buys < 30; buys += 1) {
      const robo = state.robo!;
      const rate = getRoboStableRps(state);
      const income = rate * (active ? 1.3 : 1) + (active ? getRoboClickPower(state) * 2 : 0);
      let best: { score: number; cost: number; buy: () => GameState } | null = null;
      const consider = (cost: number, next: GameState, buy: () => GameState) => {
        const gain = getRoboStableRps(next) - rate;
        const wait = Math.max(0, cost - robo.readyRG) / Math.max(income, 0.5);
        if (gain <= 0 || wait > Math.max(300, Math.min(21600, seconds * 0.2))) return;
        const score = wait + cost / gain;
        if (!best || score < best.score) best = { score, cost, buy };
      };
      for (const line of ROBO_LINES) {
        if (!isRoboLineRevealed(robo, line.id)) continue;
        const owned = robo.lines[line.id].owned;
        const nextMilestone = ROBO_MASTERY_LEVELS.find((tier) => tier.threshold > owned)?.threshold;
        for (const count of new Set([1, ...(nextMilestone ? [nextMilestone - owned] : [])])) {
          const cost = getRoboLineBulkCost(state, line.id, count);
          const next = { ...state, robo: { ...robo, lines: { ...robo.lines, [line.id]: { ...robo.lines[line.id], owned: owned + count } } } };
          consider(cost, next, () => purchaseRoboLine(state, line.id, count).state);
        }
        const rank = robo.lines[line.id].blueprintRank;
        if (rank < ROBO_BLUEPRINT_TIERS.length && owned >= ROBO_BLUEPRINT_TIERS[rank].threshold) {
          const blueprint = ROBO_LOCAL_BLUEPRINTS.find((item) => item.lineId === line.id && item.tierId === ROBO_BLUEPRINT_TIERS[rank].tierId)!;
          const next = { ...state, robo: { ...robo, lines: { ...robo.lines, [line.id]: { ...robo.lines[line.id], blueprintRank: rank + 1 } } } };
          consider(blueprint.cost, next, () => purchaseRoboBlueprint(state, blueprint.id).state);
        }
      }
      const global = ROBO_GLOBAL_BLUEPRINTS[robo.globalBlueprintRank];
      if (global && rate > 0) consider(global.cost, { ...state, robo: { ...robo, globalBlueprintRank: robo.globalBlueprintRank + 1 } }, () => purchaseRoboBlueprint(state, global.id).state);
      const candidate = best as { score: number; cost: number; buy: () => GameState } | null;
      if (!candidate || candidate.cost > robo.readyRG) break;
      state = candidate.buy();
      for (const line of ROBO_LINES) if (state.robo!.lines[line.id].owned && firstOwned[line.id] === undefined) firstOwned[line.id] = seconds;
    }
  }
  return { firstEightCores, firstOwned, firstProject, projects: state.robo!.kernel.projects, cores: state.robo!.kernel.totalCoresEarned, recompiles: state.robo!.kernel.recompiles, rate: getRoboStableRps(state), lifetime: state.robo!.lifetimeProducedRG };
}
