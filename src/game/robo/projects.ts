import { ROBO_CIRCUITS, ROBO_LINES, ROBO_PROJECTS } from './content';
import type { RoboCircuitId, RoboProjectId, RoboState } from './types';

type Projects = RoboState['kernel']['projects'];

export function getRoboProjectCoreSpend(projects: Projects): number {
  return ROBO_PROJECTS.reduce((sum, project) => sum + project.baseCoreCost * (10 ** (projects[project.id] ?? 0) - 1) / 9, 0);
}

/** Missing fields in existing saves start empty; impossible ranks cannot mint perks. */
export function sanitizeRoboProjects(raw: unknown, coreBudget: number): Projects {
  const source = typeof raw === 'object' && raw !== null ? raw as Record<string, unknown> : {};
  const projects: Projects = {};
  let remaining = coreBudget;
  for (const project of ROBO_PROJECTS) {
    const value = source[project.id];
    const requested = typeof value === 'number' && Number.isFinite(value) ? Math.min(project.maxRank, Math.max(0, Math.floor(value))) : 0;
    let rank = 0;
    while (rank < requested && remaining >= project.baseCoreCost * 10 ** rank) {
      remaining -= project.baseCoreCost * 10 ** rank;
      rank += 1;
    }
    if (rank > 0) projects[project.id] = rank;
  }
  return projects;
}

export function getRoboProjectProgress(robo: RoboState, id: RoboProjectId) {
  const definition = ROBO_PROJECTS.find((project) => project.id === id);
  if (!definition) return null;
  const rank = robo.kernel.projects[id] ?? 0;
  const complete = rank >= definition.maxRank;
  const cost = definition.baseCost * 10 ** rank;
  const coreCost = definition.baseCoreCost * 10 ** rank;
  const requiredOwned = definition.baseOwned + rank * 50;
  const lineIds = definition.circuit === 'all' ? ROBO_LINES.map((line) => line.id) : ROBO_CIRCUITS[definition.circuit];
  const minOwned = Math.min(...lineIds.map((lineId) => robo.lines[lineId].owned));
  const requiredBlueprintRank = Math.min(10, definition.requiredBlueprintRank + rank);
  const requirementsMet = robo.kernel.recompiles >= 1 && robo.lines.paradox_nest.owned >= 1
    && minOwned >= requiredOwned && robo.globalBlueprintRank >= requiredBlueprintRank;
  return {
    definition, rank, complete, cost, coreCost, requiredOwned, minOwned, requiredBlueprintRank, requirementsMet,
    canBuild: !complete && requirementsMet && robo.readyRG >= cost && robo.kernel.cores >= coreCost,
  };
}

export function getRoboProjectMultiplier(robo: RoboState, circuit: RoboCircuitId): number {
  const local = ROBO_PROJECTS.find((project) => project.circuit === circuit)!;
  return (1 + 0.25 * (robo.kernel.projects[local.id] ?? 0))
    * (1 + 0.1 * (robo.kernel.projects.eternity_foundry ?? 0));
}

/** The first circuit wonder makes deep ownership feasible without speeding the opening. */
export function hasRoboBulkFabrication(robo: RoboState, circuit: RoboCircuitId): boolean {
  const project = ROBO_PROJECTS.find((entry) => entry.circuit === circuit)!;
  return (robo.kernel.projects[project.id] ?? 0) > 0;
}
