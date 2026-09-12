import type {
  CadenceFirmware,
  ControlFirmware,
  KernelPerkDefinition,
  RoboAchievementDefinition,
  RoboBlueprintTierId,
  RoboCircuitId,
  RoboGlobalBlueprintDefinition,
  RoboLineDefinition,
  RoboLineId,
  RoboLocalBlueprintDefinition,
  RoboAppearanceId,
  RoboProjectDefinition,
} from './types';

export const ROBO_STARTING_STOCK = 20;
export const ROBO_COST_GROWTH = 1.14;
export const ROBO_MAX_OWNED = 1_000_000;
export const ROBO_CORE_SCALE = 10_000_000;
export const ROBO_MAX_CORES = 1_000_000_000;
export const ROBO_CHARGE_CAP = 120;
export const ROBO_OVERCLOCK_DURATION_MS = 30_000;

export const ROBO_LINES = [
  { id: 'tin_cradle', name: 'Tin Cradle', circuit: 'scrap', baseCost: 20, baseRps: 0.5, batchSeconds: 2, description: 'A soup tin with rocking feet and one proud parent.' },
  { id: 'windup_workbench', name: 'Wind-up Workbench', circuit: 'scrap', baseCost: 240, baseRps: 4, batchSeconds: 4, description: 'Tiny robots winding each other with stolen keys.' },
  { id: 'cutlery_press', name: 'Cutlery Press', circuit: 'scrap', baseCost: 4_000, baseRps: 32, batchSeconds: 8, description: 'Household silverware stamped into sharp little bodies.' },
  { id: 'magnet_nursery', name: 'Magnet Nursery', circuit: 'scrap', baseCost: 78_000, baseRps: 240, batchSeconds: 16, description: 'Magnets fishing newborns out of a scrap pond.' },
  { id: 'boiler_brood', name: 'Boiler Brood', circuit: 'steam', baseCost: 1_750_000, baseRps: 1_800, batchSeconds: 8, description: 'A furnace mother with a clutch of pressure vessels.' },
  { id: 'punchcard_den', name: 'Punchcard Den', circuit: 'steam', baseCost: 50_000_000, baseRps: 13_000, batchSeconds: 16, description: 'Machines taught mischief by chewed punchcards.' },
  { id: 'servo_scriptorium', name: 'Servo Scriptorium', circuit: 'steam', baseCost: 1_600_000_000, baseRps: 95_000, batchSeconds: 32, description: 'Robot scribes copying plans faster than they can read.' },
  { id: 'walking_foundry', name: 'Walking Foundry', circuit: 'steam', baseCost: 56_000_000_000, baseRps: 700_000, batchSeconds: 64, description: 'An entire factory on bent chicken legs.' },
  { id: 'thunderhead_coil', name: 'Thunderhead Coil', circuit: 'impossible', baseCost: 2_240_000_000_000, baseRps: 5_200_000, batchSeconds: 16, description: 'A bottled storm issuing birth certificates.' },
  { id: 'moonwire_loom', name: 'Moonwire Loom', circuit: 'impossible', baseCost: 96_000_000_000_000, baseRps: 40_000_000, batchSeconds: 32, description: 'Moonlight woven into metal skeletons.' },
  { id: 'clockwyrm_assembly', name: 'Clockwyrm Assembly', circuit: 'impossible', baseCost: 4_480_000_000_000_000, baseRps: 320_000_000, batchSeconds: 64, description: 'A dragon made of gears, coughing up assembly lines.' },
  { id: 'paradox_nest', name: 'Paradox Nest', circuit: 'impossible', baseCost: 224_000_000_000_000_000, baseRps: 2_600_000_000, batchSeconds: 64, description: 'Future robots assembling their own ancestors.' },
] as const satisfies readonly RoboLineDefinition[];

export const ROBO_LINE_BY_ID = Object.fromEntries(ROBO_LINES.map((line) => [line.id, line])) as Record<RoboLineId, RoboLineDefinition>;

export const ROBO_APPEARANCES = [
  { id: 'goblin' as RoboAppearanceId, cost: 0 },
  { id: 'goblin_cap' as RoboAppearanceId, cost: 1 },
  { id: 'goblin_dark' as RoboAppearanceId, cost: 2 },
  { id: 'goblin_glass' as RoboAppearanceId, cost: 3 },
  { id: 'goblin_gold' as RoboAppearanceId, cost: 5 },
  { id: 'goblin_suit' as RoboAppearanceId, cost: 6 },
] as const satisfies readonly { id: RoboAppearanceId; cost: number }[];

export const ROBO_APPEARANCE_BY_ID = Object.fromEntries(ROBO_APPEARANCES.map((appearance) => [appearance.id, appearance])) as Record<RoboAppearanceId, (typeof ROBO_APPEARANCES)[number]>;

export const ROBO_MASTERY_LEVELS = [
  { threshold: 10, multiplier: 2, name: 'Bolted' },
  { threshold: 25, multiplier: 2, name: 'Calibrated' },
  { threshold: 50, multiplier: 3, name: 'Synchronized' },
  { threshold: 100, multiplier: 4, name: 'Self-tooling' },
  { threshold: 150, multiplier: 2, name: 'Replicating' },
  { threshold: 200, multiplier: 3, name: 'Distributed' },
  { threshold: 250, multiplier: 3, name: 'Recursive' },
  { threshold: 300, multiplier: 4, name: 'Unreasonably Alive' },
  { threshold: 400, multiplier: 3, name: 'Timeless' },
  { threshold: 500, multiplier: 4, name: 'Infinite' },
  { threshold: 600, multiplier: 3, name: 'Transcendent' },
  { threshold: 700, multiplier: 3, name: 'Omnipresent' },
  { threshold: 800, multiplier: 4, name: 'Starforged' },
  { threshold: 900, multiplier: 4, name: 'Reality Engine' },
  { threshold: 1000, multiplier: 5, name: 'Thousandfold' },
] as const;

export const ROBO_CIRCUITS: Readonly<Record<RoboCircuitId, readonly RoboLineId[]>> = {
  scrap: ['tin_cradle', 'windup_workbench', 'cutlery_press', 'magnet_nursery'],
  steam: ['boiler_brood', 'punchcard_den', 'servo_scriptorium', 'walking_foundry'],
  impossible: ['thunderhead_coil', 'moonwire_loom', 'clockwyrm_assembly', 'paradox_nest'],
};

export const ROBO_CIRCUIT_THRESHOLDS = [10, 25, 50, 100, 150, 200, 300, 500, 600, 700, 800, 900, 1000] as const;

export const ROBO_BLUEPRINT_TIERS = [
  { tierId: 'stolen_plans', suffix: 'Stolen Plans', threshold: 10, costFactor: 25, multiplier: 2 },
  { tierId: 'self_inspection', suffix: 'Self-inspection', threshold: 50, costFactor: 500, multiplier: 2 },
  { tierId: 'recursive_tooling', suffix: 'Recursive Tooling', threshold: 100, costFactor: 20_000, multiplier: 2 },
  { tierId: 'quantum_tools', suffix: 'Quantum Tools', threshold: 200, costFactor: 1e9, multiplier: 2 },
  { tierId: 'ancestral_forge', suffix: 'Ancestral Forge', threshold: 300, costFactor: 1e11, multiplier: 2 },
] as const satisfies readonly { tierId: RoboBlueprintTierId; suffix: string; threshold: number; costFactor: number; multiplier: number }[];

export const ROBO_LOCAL_BLUEPRINTS = ROBO_LINES.flatMap((line) => ROBO_BLUEPRINT_TIERS.map((tier) => ({
  id: `${line.id}_${tier.tierId}` as const,
  lineId: line.id,
  tierId: tier.tierId,
  name: `${line.name}: ${tier.suffix}`,
  threshold: tier.threshold,
  cost: line.baseCost * tier.costFactor,
  multiplier: tier.multiplier,
}))) satisfies readonly RoboLocalBlueprintDefinition[];

export const ROBO_LOCAL_BLUEPRINT_BY_ID = Object.fromEntries(ROBO_LOCAL_BLUEPRINTS.map((blueprint) => [blueprint.id, blueprint])) as Record<string, RoboLocalBlueprintDefinition>;

export const ROBO_GLOBAL_BLUEPRINTS = [
  { id: 'common_thread', name: 'Common Thread', cost: 2_000, multiplier: 1.25 },
  { id: 'standard_sockets', name: 'Standard Sockets', cost: 500_000, multiplier: 1.25 },
  { id: 'distributed_mischief', name: 'Distributed Mischief', cost: 100_000_000, multiplier: 1.5 },
  { id: 'factory_remembers', name: 'The Factory Remembers', cost: 20_000_000_000, multiplier: 1.5 },
  { id: 'illegal_recursion', name: 'Illegal Recursion', cost: 4_000_000_000_000, multiplier: 1.75 },
  { id: 'birth_without_permission', name: 'Birth Without Permission', cost: 800_000_000_000_000, multiplier: 2 },
  { id: 'stellar_protocol', name: 'Stellar Protocol', cost: 1e20, multiplier: 1.5 },
  { id: 'causal_network', name: 'Causal Network', cost: 1e22, multiplier: 1.5 },
  { id: 'eternal_factory', name: 'Eternal Factory', cost: 1e24, multiplier: 1.5 },
  { id: 'beyond_the_clock', name: 'Beyond the Clock', cost: 1e26, multiplier: 2 },
] as const satisfies readonly RoboGlobalBlueprintDefinition[];

export const ROBO_GLOBAL_BLUEPRINT_BY_ID = Object.fromEntries(ROBO_GLOBAL_BLUEPRINTS.map((blueprint) => [blueprint.id, blueprint])) as Record<string, RoboGlobalBlueprintDefinition>;

export const ROBO_FIRMWARE = {
  control: {
    unlockProducedRG: 1_000_000,
    cost: 500_000,
    choices: {
      clock: { id: 'clock' as ControlFirmware, name: 'Clockwork Consensus', passiveMultiplier: 1.2 },
      spark: { id: 'spark' as ControlFirmware, name: 'Spark Personality', passiveMultiplier: 1 },
    },
  },
  cadence: {
    unlockProducedRG: 1_000_000_000,
    cost: 500_000_000,
    choices: {
      quick: { id: 'quick' as CadenceFirmware, name: 'Quick-release Latches', cycleMultiplier: 0.5, passiveMultiplier: 1 },
      heavy: { id: 'heavy' as CadenceFirmware, name: 'Heavy Batch Protocol', cycleMultiplier: 2, passiveMultiplier: 1.15 },
    },
  },
} as const;

export const KERNEL_PERKS = [
  { id: 'better_bolts', name: 'Better Bolts', baseCost: 1, maxRank: 10 },
  { id: 'boot_cache', name: 'Boot Cache', baseCost: 2, maxRank: 5 },
  { id: 'night_shift', name: 'Night Shift', baseCost: 2, maxRank: 4 },
  { id: 'deep_battery', name: 'Deep Battery', baseCost: 3, maxRank: 8 },
  { id: 'copper_memory', name: 'Copper Memory', baseCost: 3, maxRank: 5 },
  { id: 'warm_start', name: 'Warm Start', baseCost: 4, maxRank: 4 },
  { id: 'finger_servos', name: 'Finger Servos', baseCost: 2, maxRank: 5 },
  { id: 'family_adapter', name: 'Family Adapter', baseCost: 5, maxRank: 5 },
] as const satisfies readonly KernelPerkDefinition[];

export const KERNEL_PERK_BY_ID = Object.fromEntries(KERNEL_PERKS.map((perk) => [perk.id, perk])) as Record<string, KernelPerkDefinition>;

export const ROBO_ACHIEVEMENTS = [
  { id: 'rg_first_spark', name: 'It Has Opinions', description: 'Manually assemble a RoboGoblin.' },
  { id: 'rg_unattended', name: "Somebody Else's Problem", description: 'Own one Tin Cradle.' },
  { id: 'rg_bolted', name: 'Tighten Until It Complains', description: 'Reach 10 owned on any line.' },
  { id: 'rg_scrap_circuit', name: 'A Complete Bad Idea', description: 'Close the first Scrap circuit tier.' },
  { id: 'rg_first_million', name: 'A Million Loose Screws', description: 'Deliver one million lifetime RoboGoblins.' },
  { id: 'rg_overclock', name: 'Smoke Is a Feature', description: 'Activate Overclock.' },
  { id: 'rg_firmware', name: 'The Machine Disagrees', description: 'Choose control-logic firmware.' },
  { id: 'rg_recompile', name: 'Remember the Important Bits', description: 'Complete one Recompile.' },
  { id: 'rg_steam_circuit', name: 'Union of Boilers', description: 'Close the first Steam circuit tier.' },
  { id: 'rg_three_circuits', name: 'Everything Is Connected', description: 'Close the first tier of all three circuits in one compile.' },
  { id: 'rg_paradox', name: 'Your Grandchild Built You', description: 'Own one Paradox Nest.' },
  { id: 'rg_megaproject', name: 'Beyond the Nest', description: 'Build the first stage of a megaproject.' },
  { id: 'rg_four_wonders', name: 'Four Impossible Wonders', description: 'Build at least one stage of all four megaprojects.' },
  { id: 'rg_deep_mastery', name: 'No Small Parts', description: 'Own 500 robots on every assembly line in one compile.' },
  { id: 'rg_eternal_foundry', name: 'The Clock Can Retire', description: 'Complete all 20 megaproject stages.' },
  { id: 'rg_kernel_complete', name: 'A Very Small God', description: 'Max all eight Kernel tracks.' },
] as const satisfies readonly RoboAchievementDefinition[];

export const ROBO_PROJECTS = [
  { id: 'scrap_archive', circuit: 'scrap', baseCost: 1e20, baseCoreCost: 256, baseOwned: 150, requiredBlueprintRank: 6, maxRank: 5 },
  { id: 'stellar_engine', circuit: 'steam', baseCost: 1e22, baseCoreCost: 1_024, baseOwned: 100, requiredBlueprintRank: 7, maxRank: 5 },
  { id: 'causality_anchor', circuit: 'impossible', baseCost: 1e24, baseCoreCost: 4_096, baseOwned: 50, requiredBlueprintRank: 8, maxRank: 5 },
  { id: 'eternity_foundry', circuit: 'all', baseCost: 1e26, baseCoreCost: 16_384, baseOwned: 150, requiredBlueprintRank: 9, maxRank: 5 },
] as const satisfies readonly RoboProjectDefinition[];

export const INHERITED_BLUEPRINT_MILESTONES = [2_500, 10_000, 100_000, 1_000_000, 10_000_000] as const;
export const FAMILY_ADAPTER_MILESTONES = [8, 32, 128, 512, 2_048] as const;
