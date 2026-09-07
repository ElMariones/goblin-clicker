export const CURRENT_SAVE_VERSION = 3 as const;

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
  | { type: 'clickCpsFraction'; fraction: number };

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
  id: 'moon_frenzy' | 'hatching_fever';
  multiplier: number;
  startedAt: number;
  expiresAt: number;
  target: 'cps' | 'click';
}

export interface MooncapEventState {
  active: boolean;
  spawnedAt: number | null;
  expiresAt: number | null;
  nextSpawnAt: number;
  rngSeed: number;
  rngCounter: number;
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
  statistics: GameStatistics;
}

export interface OfflineProgress {
  elapsedMs: number;
  creditedMs: number;
  efficiency: number;
  goblinsProduced: number;
  capMs: number;
}

export type MooncapReward =
  | { type: 'goblins'; amount: number; label: string }
  | { type: 'buff'; buff: BuffInstance; label: string };

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
