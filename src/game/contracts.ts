import { BUILDINGS, EXPANSION_MASTERY_LEVELS } from './content';
import { getBaseCps, getReachedExpansionMasteryLevels } from './math';
import type { BuildingId, ContractInstance, ContractKind, ContractObjective, GameState } from './types';

export const CONTRACT_KINDS: readonly ContractKind[] = ['quick', 'quartermaster', 'directive'] as const;

const REWARD_SECONDS: Record<ContractKind, number> = {
  quick: 35,
  quartermaster: 150,
  directive: 600,
};

const REWARD_FLOORS: Record<ContractKind, number> = {
  quick: 25,
  quartermaster: 125,
  directive: 500,
};

function availableBuildingIds(state: GameState): BuildingId[] {
  return BUILDINGS.filter((building, index) => {
    if (index < 2) return true;
    const previous = BUILDINGS[index - 1];
    return state.buildings[previous.id] > 0 || state.lifetimeGoblins >= building.baseCost * 0.25;
  }).map(({ id }) => id);
}

function countAtMastery(state: GameState, tier: 'established'): number {
  const threshold = EXPANSION_MASTERY_LEVELS.find((level) => level.id === tier)?.threshold ?? 10;
  return BUILDINGS.filter(({ id }) => state.buildings[id] >= threshold).length;
}

function generateObjective(state: GameState, kind: ContractKind, sequence: number): ContractObjective {
  const available = availableBuildingIds(state);
  const totalBuildings = BUILDINGS.reduce((sum, building) => sum + state.buildings[building.id], 0);

  if (kind === 'quick') {
    if (sequence % 3 === 1 && totalBuildings >= 5) {
      return { type: 'mooncapCatches', start: state.statistics.goldenEventsClicked, amount: 1 };
    }
    const scale = Math.max(18, Math.min(240, Math.ceil(Math.log10(state.lifetimeGoblins + 10) * 14)));
    return { type: 'manualBorn', start: state.statistics.manuallyBorn, amount: scale };
  }

  if (kind === 'quartermaster') {
    const buildingId = available[(sequence * 5 + state.prestige.resets) % available.length] ?? 'brood_matron';
    const owned = state.buildings[buildingId];
    const nextMastery = EXPANSION_MASTERY_LEVELS.find((level) => level.threshold > owned);
    const modestStep = Math.max(3, Math.min(12, Math.ceil((owned + 1) * 0.18)));
    const target = nextMastery && nextMastery.threshold - owned <= modestStep * 2
      ? nextMastery.threshold
      : owned + modestStep;
    return { type: 'buildingOwned', buildingId, target };
  }

  const mastered = countAtMastery(state, 'established');
  if (sequence % 2 === 0 && available.length >= 3 && mastered < available.length) {
    return { type: 'masteryCount', tier: 'established', target: Math.min(available.length, Math.max(2, mastered + 1)) };
  }
  const baseCps = getBaseCps(state);
  const target = Math.ceil(Math.max(state.runGoblins * 1.5, state.runGoblins + Math.max(500, baseCps * 600)));
  return { type: 'runGoblins', target };
}

export function generateContract(state: GameState, kind: ContractKind, sequence: number, now = state.lastUpdateAt): ContractInstance {
  return {
    id: `${kind}-${sequence}`,
    kind,
    sequence,
    assignedAt: Math.max(0, Math.floor(now)),
    rewardSeconds: REWARD_SECONDS[kind],
    objective: generateObjective(state, kind, sequence),
  };
}

export function ensureContracts(state: GameState, now = state.lastUpdateAt): GameState {
  let nextSequence = Math.max(0, Math.floor(state.contracts.nextSequence));
  const active = { ...state.contracts.active };
  let changed = false;
  for (const kind of CONTRACT_KINDS) {
    if (active[kind]) continue;
    active[kind] = generateContract(state, kind, nextSequence, now);
    nextSequence += 1;
    changed = true;
  }
  if (!changed && nextSequence === state.contracts.nextSequence) return state;
  return { ...state, contracts: { ...state.contracts, active, nextSequence } };
}

export function getContractProgress(state: GameState, contract: ContractInstance): { current: number; target: number; ratio: number } {
  const objective = contract.objective;
  let current = 0;
  let target = 1;
  switch (objective.type) {
    case 'manualBorn':
      current = Math.max(0, state.statistics.manuallyBorn - objective.start);
      target = objective.amount;
      break;
    case 'buildingOwned':
      current = state.buildings[objective.buildingId];
      target = objective.target;
      break;
    case 'runGoblins':
      current = state.runGoblins;
      target = objective.target;
      break;
    case 'mooncapCatches':
      current = Math.max(0, state.statistics.goldenEventsClicked - objective.start);
      target = objective.amount;
      break;
    case 'masteryCount':
      current = BUILDINGS.filter(({ id }) => getReachedExpansionMasteryLevels(state, id).some(({ id: tierId }) => tierId === objective.tier)).length;
      target = objective.target;
      break;
  }
  return { current, target, ratio: Math.max(0, Math.min(1, target > 0 ? current / target : 1)) };
}

export function isContractComplete(state: GameState, contract: ContractInstance): boolean {
  const { current, target } = getContractProgress(state, contract);
  return current >= target;
}

export function getContractRewardAmount(state: GameState, contract: ContractInstance): number {
  const oracleMultiplier = 1 + Math.min(2, Math.max(0, Math.floor(state.contracts.oracleBoost))) * 0.5;
  const productionReward = Math.max(1, getBaseCps(state)) * contract.rewardSeconds;
  return Math.max(REWARD_FLOORS[contract.kind], Math.floor(productionReward * oracleMultiplier));
}

export function resetContractsForMigration(state: GameState, now: number): GameState {
  const cleared: GameState = {
    ...state,
    contracts: {
      ...state.contracts,
      active: {},
      oracleBoost: 0,
    },
  };
  return ensureContracts(cleared, now);
}
