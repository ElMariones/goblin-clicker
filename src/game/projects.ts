import { WARREN_INNOVATIONS } from './content';
import type { BuildingId, GameState, WarrenDistrict, WarrenProjectId } from './types';

export const WARREN_DISTRICTS: Record<WarrenDistrict, readonly BuildingId[]> = {
  roots: ['brood_matron', 'mushroom_nursery', 'warren_den', 'bog_hatchery'],
  industry: ['scrap_incubator', 'shaman_circle', 'war_camp', 'moonspore_cavern'],
  beyond: ['deepforge_vat', 'goblin_gate', 'wyrm_hoard', 'reality_burrow'],
};

export const WARREN_PROJECTS = [
  { id: 'worldroot', district: 'roots', art: 'mushroom_nursery', baseCost: 1e14, baseCunning: 100, baseOwned: 100, innovations: 3, maxRank: 5 },
  { id: 'moonforge', district: 'industry', art: 'scrap_incubator', baseCost: 1e17, baseCunning: 1_000, baseOwned: 75, innovations: 6, maxRank: 5 },
  { id: 'worldgate', district: 'beyond', art: 'goblin_gate', baseCost: 1e20, baseCunning: 10_000, baseOwned: 25, innovations: 9, maxRank: 5 },
  { id: 'everlasting_warren', district: 'all', art: 'reality_burrow', baseCost: 1e23, baseCunning: 100_000, baseOwned: 50, innovations: 12, maxRank: 5 },
] as const satisfies readonly { id: WarrenProjectId; district: WarrenDistrict | 'all'; art: BuildingId; baseCost: number; baseCunning: number; baseOwned: number; innovations: number; maxRank: number }[];

export function getWarrenProjectSpend(projects: GameState['prestige']['projects']): number {
  return WARREN_PROJECTS.reduce((sum, project) => sum + project.baseCunning * (5 ** (projects[project.id] ?? 0) - 1) / 4, 0);
}

/** Only known, finite ranks backed by earned Cunning can grant permanent bonuses. */
export function sanitizeWarrenProjects(raw: unknown, budget: number): GameState['prestige']['projects'] {
  const source = typeof raw === 'object' && raw !== null ? raw as Record<string, unknown> : {};
  const projects: GameState['prestige']['projects'] = {};
  let remaining = Math.max(0, budget);
  for (const project of WARREN_PROJECTS) {
    const value = source[project.id];
    const requested = typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(project.maxRank, Math.floor(value))) : 0;
    let rank = 0;
    while (rank < requested && remaining >= project.baseCunning * 5 ** rank) {
      remaining -= project.baseCunning * 5 ** rank;
      rank += 1;
    }
    if (rank) projects[project.id] = rank;
  }
  return projects;
}

export function getWarrenProjectProgress(state: GameState, id: WarrenProjectId) {
  const definition = WARREN_PROJECTS.find((project) => project.id === id);
  if (!definition) return null;
  const rank = state.prestige.projects[id] ?? 0;
  const complete = rank >= definition.maxRank;
  const cost = definition.baseCost * 10 ** rank;
  const cunningCost = definition.baseCunning * 5 ** rank;
  const requiredOwned = definition.baseOwned + rank * 50;
  const buildingIds = definition.district === 'all' ? Object.values(WARREN_DISTRICTS).flat() : WARREN_DISTRICTS[definition.district];
  const minOwned = Math.min(...buildingIds.map((id) => state.buildings[id]));
  const innovations = WARREN_INNOVATIONS.filter((upgrade) => state.purchasedUpgrades[upgrade.id]).length;
  const requiredInnovations = Math.min(WARREN_INNOVATIONS.length, definition.innovations + rank);
  const entryMet = state.prestige.resets >= 1 && state.buildings.reality_burrow >= 1;
  const requirementsMet = entryMet && minOwned >= requiredOwned && innovations >= requiredInnovations;
  return { definition, rank, complete, cost, cunningCost, requiredOwned, buildingIds, minOwned, innovations, requiredInnovations, entryMet, requirementsMet,
    canBuild: !complete && requirementsMet && state.goblins >= cost && state.prestige.shards >= cunningCost };
}

export function getWarrenProjectMultiplier(state: GameState, buildingId: BuildingId): number {
  const project = WARREN_PROJECTS.find((project) => project.district !== 'all' && WARREN_DISTRICTS[project.district].includes(buildingId))!;
  return (1 + 0.25 * (state.prestige.projects[project.id] ?? 0)) * (1 + 0.1 * (state.prestige.projects.everlasting_warren ?? 0));
}
