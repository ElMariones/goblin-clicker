export const CURRENT_SAVE_VERSION = 4 as const;

export type BuildingId =
  | 'brood_matron'
  | 'mushroom_nursery'
  | 'warren_den'
  | 'bog_hatchery'
  | 'scrap_incubator'
  | 'shaman_circle'
  | 'war_camp'
  | 'moonspore_cavern'
  | 'deepforge_vat'
  | 'goblin_gate'
  | 'wyrm_hoard'
  | 'reality_burrow';

export type UpgradeEffect =
  | { type: 'clickMultiplier'; multiplier: number }
  | { type: 'globalCpsMultiplier'; multiplier: number }
  | { type: 'buildingMultiplier'; buildingId: BuildingId; multiplier: number }
  | { type: 'clickCpsFraction'; fraction: number }
  | { type: 'buildingCostMultiplier'; buildingId: BuildingId; multiplier: number }
  | { type: 'globalBuildingCostMultiplier'; multiplier: number }
  | { type: 'masteryLevelMultiplier'; buildingId: BuildingId; multiplier: number }
  | { type: 'masteryNetworkMultiplier'; multiplier: number }
  | { type: 'offlineEfficiencyBonus'; bonus: number }
  | { type: 'mooncapRewardMultiplier'; multiplier: number }
  | { type: 'mooncapDurationMultiplier'; multiplier: number };

export type UpgradeExclusiveGroup = 'broodcraft' | 'industry' | 'occult' | 'dimensional';

export type UnlockRequirement =
  | { type: 'buildingOwned'; buildingId: BuildingId; amount: number }
  | { type: 'lifetimeGoblins'; amount: number }
  | { type: 'totalClicks'; amount: number }
  | { type: 'prestigeResets'; amount: number }
  | { type: 'prestigeShardsEarned'; amount: number };

export interface BuildingDefinition {
  id: BuildingId;
  name: string;
  description: string;
  baseCost: number;
  baseCps: number;
  costGrowth: number;
}

export type ExpansionMasteryLevelId =
  | 'established'
  | 'thriving'
  | 'veteran'
  | 'renowned'
  | 'elite'
  | 'legendary'
  | 'ancestral'
  | 'mythic';

/**
 * Expansion mastery is derived from current owned building counts rather than
 * stored separately. Reaching a level grants both a local multiplicative bonus
 * and a small additive contribution to the all-warren mastery network bonus.
 */
export interface ExpansionMasteryLevelDefinition {
  id: ExpansionMasteryLevelId;
  name: string;
  description: string;
  threshold: number;
  productionMultiplier: number;
  networkCpsBonus: number;
}

export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
  requirements: UnlockRequirement[];
  effects: UpgradeEffect[];
  /** New doctrine research only. Foundation upgrades intentionally omit this. */
  exclusiveGroup?: UpgradeExclusiveGroup;
  /** Short, explicit cost of committing to this doctrine for the current migration. */
  tradeoff?: string;
}

export type AchievementCondition =
  | { type: 'buildingOwned'; buildingId: BuildingId; amount: number }
  | { type: 'lifetimeGoblins'; amount: number }
  | { type: 'totalClicks'; amount: number }
  | { type: 'cps'; amount: number }
  | { type: 'goldenEventsClicked'; amount: number }
  | { type: 'prestigeResets'; amount: number }
  | { type: 'allBuildingsOwned'; amount: number };

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  condition: AchievementCondition;
}

export type PermanentUpgradeId =
  | 'ancestral_fertility'
  | 'stronger_spawn'
  | 'scavenger_memory'
  | 'lucky_totem'
  | 'deep_warrens'
  | 'starter_clutch'
  | 'founders_legacy'
  | 'ancestral_momentum'
  | 'tireless_lineage'
  | 'moonlit_blood'
  | 'heirloom_matrons';

export interface PermanentUpgradeDefinition {
  id: PermanentUpgradeId;
  name: string;
  description: string;
  baseCost: number;
  costGrowth: number;
  maxRank: number;
}

export interface BuffInstance {
  id: 'moon_frenzy' | 'hatching_fever' | 'eclipse';
  multiplier: number;
  startedAt: number;
  expiresAt: number;
  target: 'cps' | 'click';
}

export type MooncapFamily = 'clutch' | 'frenzy' | 'blood' | 'oracle';

export interface MooncapEventState {
  active: boolean;
  family: MooncapFamily | null;
  spawnedAt: number | null;
  expiresAt: number | null;
  nextSpawnAt: number;
  lunarCharge: number;
  nextFamilyBias: MooncapFamily | null;
  rngSeed: number;
  rngCounter: number;
}

export type ContractKind = 'quick' | 'quartermaster' | 'directive';

export type ContractObjective =
  | { type: 'manualBorn'; start: number; amount: number }
  | { type: 'buildingOwned'; buildingId: BuildingId; target: number }
  | { type: 'runGoblins'; target: number }
  | { type: 'mooncapCatches'; start: number; amount: number }
  | { type: 'masteryCount'; tier: ExpansionMasteryLevelId; target: number };

export interface ContractInstance {
  id: string;
  kind: ContractKind;
  sequence: number;
  assignedAt: number;
  rewardSeconds: number;
  objective: ContractObjective;
}

export interface ContractBoardState {
  active: Partial<Record<ContractKind, ContractInstance>>;
  completed: number;
  nextSequence: number;
  /** Oraclecaps empower the next claimed contract by +50% per stack, capped at two. */
  oracleBoost: number;
}

export interface GameStatistics {
  totalClicks: number;
  manuallyBorn: number;
  goldenEventsClicked: number;
  totalTimePlayedMs: number;
  highestCps: number;
  /** All-time passive production credited to each building type, across prestige resets. */
  lifetimeProducedByBuilding: Record<BuildingId, number>;
}

export interface PrestigeState {
  shards: number;
  totalShardsEarned: number;
  resets: number;
  permanentUpgrades: Partial<Record<PermanentUpgradeId, number>>;
}

export interface GameState {
  version: typeof CURRENT_SAVE_VERSION;
  createdAt: number;
  lastUpdateAt: number;
  goblins: number;
  runGoblins: number;
  lifetimeGoblins: number;
  buildings: Record<BuildingId, number>;
  purchasedUpgrades: Record<string, true>;
  unlockedAchievements: Record<string, number>;
  prestige: PrestigeState;
  buffs: BuffInstance[];
  mooncap: MooncapEventState;
  contracts: ContractBoardState;
  expeditions: ExpeditionState;
  statistics: GameStatistics;
}

export type ExpeditionDestination = 'mine' | 'ruins' | 'cellar';
export type ExpeditionCrew = 'scouts' | 'haulers' | 'keepers';
export type ExpeditionBand = 'short' | 'medium' | 'long';
export interface ExpeditionPlan {
  destination: ExpeditionDestination;
  crew: ExpeditionCrew;
  band: ExpeditionBand;
  complication: boolean;
}
export interface ExpeditionMission extends ExpeditionPlan {
  startedAt: number;
  endsAt: number;
  reservation: number;
  rewardMultiplier: number;
  reserved: number;
}
export interface ExpeditionState {
  active: ExpeditionMission | null;
  completed: number;
  artifacts: Partial<Record<ExpeditionDestination, true>>;
}

export interface OfflineProgress {
  elapsedMs: number;
  creditedMs: number;
  efficiency: number;
  goblinsProduced: number;
  capMs: number;
}

export type MooncapReward =
  | { type: 'goblins'; family: 'clutch'; amount: number; label: string }
  | { type: 'buff'; family: 'frenzy' | 'blood'; buff: BuffInstance; label: string }
  | { type: 'oracle'; family: 'oracle'; contractMultiplier: number; label: string };

export interface SaveEnvelope {
  schema: 'goblin-clicker-save';
  version: typeof CURRENT_SAVE_VERSION;
  savedAt: number;
  state: GameState;
}

export interface DeserializeResult {
  state: GameState;
  migratedFrom: number | null;
  warnings: string[];
}
