export type RoboLineId =
  | 'tin_cradle'
  | 'windup_workbench'
  | 'cutlery_press'
  | 'magnet_nursery'
  | 'boiler_brood'
  | 'punchcard_den'
  | 'servo_scriptorium'
  | 'walking_foundry'
  | 'thunderhead_coil'
  | 'moonwire_loom'
  | 'clockwyrm_assembly'
  | 'paradox_nest';

export type RoboCircuitId = 'scrap' | 'steam' | 'impossible';
export type RoboBlueprintTierId = 'stolen_plans' | 'self_inspection' | 'recursive_tooling';
export type RoboLocalBlueprintId = `${RoboLineId}_${RoboBlueprintTierId}`;
export type RoboGlobalBlueprintId =
  | 'common_thread'
  | 'standard_sockets'
  | 'distributed_mischief'
  | 'factory_remembers'
  | 'illegal_recursion'
  | 'birth_without_permission';
export type RoboBlueprintId = RoboLocalBlueprintId | RoboGlobalBlueprintId;

export type ControlFirmware = 'clock' | 'spark';
export type CadenceFirmware = 'quick' | 'heavy';
export type RoboFirmwareGroup = 'control' | 'cadence';

export type KernelPerkId =
  | 'better_bolts'
  | 'boot_cache'
  | 'night_shift'
  | 'deep_battery'
  | 'copper_memory'
  | 'warm_start'
  | 'finger_servos'
  | 'family_adapter';

export type RoboAchievementId =
  | 'rg_first_spark'
  | 'rg_unattended'
  | 'rg_bolted'
  | 'rg_scrap_circuit'
  | 'rg_first_million'
  | 'rg_overclock'
  | 'rg_firmware'
  | 'rg_recompile'
  | 'rg_steam_circuit'
  | 'rg_three_circuits'
  | 'rg_paradox'
  | 'rg_kernel_complete';

export type RoboAppearanceId = 'goblin_cap' | 'goblin_dark' | 'goblin_glass' | 'goblin_gold' | 'goblin_suit';

export interface RoboLineDefinition {
  id: RoboLineId;
  name: string;
  circuit: RoboCircuitId;
  baseCost: number;
  baseRps: number;
  batchSeconds: number;
  description: string;
}

export interface RoboLineState {
  owned: number;
  blueprintRank: number;
  phaseSeconds: number;
  pendingRG: number;
}

export interface RoboLocalBlueprintDefinition {
  id: RoboLocalBlueprintId;
  lineId: RoboLineId;
  tierId: RoboBlueprintTierId;
  name: string;
  threshold: number;
  cost: number;
  multiplier: number;
}

export interface RoboGlobalBlueprintDefinition {
  id: RoboGlobalBlueprintId;
  name: string;
  cost: number;
  multiplier: number;
}

export interface KernelPerkDefinition {
  id: KernelPerkId;
  name: string;
  baseCost: number;
  maxRank: number;
}

export interface RoboAchievementDefinition {
  id: RoboAchievementId;
  name: string;
  description: string;
}

export interface RoboStatistics {
  manualActions: number;
  manuallyAssembledRG: number;
  highestStableRps: number;
  lifetimeProducedByLine: Record<RoboLineId, number>;
  overclocksActivated: number;
}

export interface RoboState {
  readyRG: number;
  runProducedRG: number;
  lifetimeProducedRG: number;
  lines: Record<RoboLineId, RoboLineState>;
  globalBlueprintRank: number;
  firmware: {
    control: ControlFirmware | null;
    cadence: CadenceFirmware | null;
  };
  capacitor: {
    charge: number;
    overclockEndsAt: number | null;
  };
  kernel: {
    cores: number;
    totalCoresEarned: number;
    recompiles: number;
    perks: Partial<Record<KernelPerkId, number>>;
  };
  statistics: RoboStatistics;
  achievements: Partial<Record<RoboAchievementId, number>>;
  appearance: RoboAppearanceId;
}

export type RoboActionFailureReason =
  | 'locked'
  | 'insufficientFunds'
  | 'alreadyOwned'
  | 'maxRank'
  | 'firmwareCommitted'
  | 'requirementNotMet'
  | 'noNewCores'
  | 'invalidInput';

export interface RoboActionResult<TState> {
  state: TState;
  success: boolean;
  amount: number;
  reason?: RoboActionFailureReason;
}

export interface RoboCircuitSummary {
  id: RoboCircuitId;
  lineIds: readonly RoboLineId[];
  tiers: number;
  nextThreshold: number | null;
  bottleneck: { lineId: RoboLineId; owned: number; needed: number } | null;
}

export interface RoboOfflineProgress {
  elapsedMs: number;
  creditedMs: number;
  efficiency: number;
  producedRG: number;
  deliveredRG: number;
  pendingRG: number;
  capMs: number;
}
