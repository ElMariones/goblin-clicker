import type {
  AchievementDefinition,
  BuildingDefinition,
  PermanentUpgradeDefinition,
  UpgradeDefinition,
} from './types';

export const BUILDINGS = [
  {
    id: 'brood_matron',
    name: 'Brood Matron',
    description: 'A tireless matron who keeps the first clutch coming.',
    baseCost: 15,
    baseCps: 0.1,
    costGrowth: 1.15,
  },
  {
    id: 'mushroom_nursery',
    name: 'Mushroom Nursery',
    description: 'Warm fungus beds where goblinlings sprout beneath damp moss.',
    baseCost: 100,
    baseCps: 1,
    costGrowth: 1.15,
  },
  {
    id: 'warren_den',
    name: 'Warren Den',
    description: 'A cramped burrow packed with hammocks, cradles, and bad ideas.',
    baseCost: 1_100,
    baseCps: 8,
    costGrowth: 1.15,
  },
  {
    id: 'bog_hatchery',
    name: 'Bog Hatchery',
    description: 'Mud, steam, and suspiciously fertile swamp water.',
    baseCost: 12_000,
    baseCps: 47,
    costGrowth: 1.15,
  },
  {
    id: 'scrap_incubator',
    name: 'Scrap Incubator',
    description: 'Stolen pipes and boilers turned into a mostly safe incubator.',
    baseCost: 130_000,
    baseCps: 260,
    costGrowth: 1.15,
  },
  {
    id: 'shaman_circle',
    name: 'Shaman Circle',
    description: 'Moon chants and bone rattles persuade nature to hurry up.',
    baseCost: 1_400_000,
    baseCps: 1_400,
    costGrowth: 1.15,
  },
  {
    id: 'war_camp',
    name: 'War Camp',
    description: 'A disciplined camp where every new recruit raises the next.',
    baseCost: 20_000_000,
    baseCps: 7_800,
    costGrowth: 1.15,
  },
  {
    id: 'moonspore_cavern',
    name: 'Moonspore Cavern',
    description: 'Bioluminescent spores make whole generations bloom overnight.',
    baseCost: 330_000_000,
    baseCps: 44_000,
    costGrowth: 1.15,
  },
  {
    id: 'deepforge_vat',
    name: 'Deepforge Vat',
    description: 'Runic vats beneath the mountain brew goblins by the batch.',
    baseCost: 5_100_000_000,
    baseCps: 260_000,
    costGrowth: 1.15,
  },
  {
    id: 'goblin_gate',
    name: 'Goblin Gate',
    description: 'A crooked portal connected to warrens that should not exist.',
    baseCost: 75_000_000_000,
    baseCps: 1_600_000,
    costGrowth: 1.15,
  },
  {
    id: 'wyrm_hoard',
    name: 'Wyrm Hoard',
    description: 'A dragon-sized nest repurposed for a far more numerous species.',
    baseCost: 1_000_000_000_000,
    baseCps: 10_000_000,
    costGrowth: 1.15,
  },
  {
    id: 'reality_burrow',
    name: 'Reality Burrow',
    description: 'A tunnel bored sideways through possibility itself.',
    baseCost: 14_000_000_000_000,
    baseCps: 65_000_000,
    costGrowth: 1.15,
  },
] as const satisfies readonly BuildingDefinition[];

export const UPGRADES = [
  {
    id: 'sharpened_nails', name: 'Sharpened Nails', description: 'Clicks hatch twice as many goblins.', cost: 100,
    requirements: [{ type: 'totalClicks', amount: 25 }], effects: [{ type: 'clickMultiplier', multiplier: 2 }],
  },
  {
    id: 'midwife_whistles', name: 'Midwife Whistles', description: 'Clicks hatch twice as many goblins again.', cost: 5_000,
    requirements: [{ type: 'totalClicks', amount: 250 }], effects: [{ type: 'clickMultiplier', multiplier: 2 }],
  },
  {
    id: 'riotous_birthing', name: 'Riotous Birthing', description: 'Manual hatching gains 1% of current production.', cost: 500_000,
    requirements: [{ type: 'lifetimeGoblins', amount: 100_000 }], effects: [{ type: 'clickCpsFraction', fraction: 0.01 }],
  },
  {
    id: 'green_thumb', name: 'Green Thumb', description: 'All warrens produce 10% more goblins.', cost: 10_000,
    requirements: [{ type: 'lifetimeGoblins', amount: 1_000 }], effects: [{ type: 'globalCpsMultiplier', multiplier: 1.1 }],
  },
  {
    id: 'warren_accounting', name: 'Warren Accounting', description: 'All warrens produce 20% more goblins.', cost: 25_000_000,
    requirements: [{ type: 'lifetimeGoblins', amount: 5_000_000 }], effects: [{ type: 'globalCpsMultiplier', multiplier: 1.2 }],
  },
  {
    id: 'grand_clutch_plan', name: 'Grand Clutch Plan', description: 'All warrens produce 25% more goblins.', cost: 25_000_000_000,
    requirements: [{ type: 'lifetimeGoblins', amount: 2_000_000_000 }], effects: [{ type: 'globalCpsMultiplier', multiplier: 1.25 }],
  },
  {
    id: 'matron_stew', name: 'Matron Stew', description: 'Brood Matrons are twice as productive.', cost: 500,
    requirements: [{ type: 'buildingOwned', buildingId: 'brood_matron', amount: 10 }], effects: [{ type: 'buildingMultiplier', buildingId: 'brood_matron', multiplier: 2 }],
  },
  {
    id: 'matron_union', name: 'Matron Union', description: 'Brood Matrons are twice as productive again.', cost: 50_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'brood_matron', amount: 50 }], effects: [{ type: 'buildingMultiplier', buildingId: 'brood_matron', multiplier: 2 }],
  },
  {
    id: 'richer_compost', name: 'Richer Compost', description: 'Mushroom Nurseries are twice as productive.', cost: 2_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'mushroom_nursery', amount: 10 }], effects: [{ type: 'buildingMultiplier', buildingId: 'mushroom_nursery', multiplier: 2 }],
  },
  {
    id: 'singing_fungus', name: 'Singing Fungus', description: 'Mushroom Nurseries are twice as productive again.', cost: 200_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'mushroom_nursery', amount: 50 }], effects: [{ type: 'buildingMultiplier', buildingId: 'mushroom_nursery', multiplier: 2 }],
  },
  {
    id: 'double_bunks', name: 'Double Bunks', description: 'Warren Dens are twice as productive.', cost: 20_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'warren_den', amount: 10 }], effects: [{ type: 'buildingMultiplier', buildingId: 'warren_den', multiplier: 2 }],
  },
  {
    id: 'triple_bunks', name: 'Triple Bunks', description: 'Warren Dens are twice as productive again.', cost: 2_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'warren_den', amount: 50 }], effects: [{ type: 'buildingMultiplier', buildingId: 'warren_den', multiplier: 2 }],
  },
  {
    id: 'warmer_mud', name: 'Warmer Mud', description: 'Bog Hatcheries are twice as productive.', cost: 150_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'bog_hatchery', amount: 10 }], effects: [{ type: 'buildingMultiplier', buildingId: 'bog_hatchery', multiplier: 2 }],
  },
  {
    id: 'royal_sludge', name: 'Royal Sludge', description: 'Bog Hatcheries are twice as productive again.', cost: 15_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'bog_hatchery', amount: 50 }], effects: [{ type: 'buildingMultiplier', buildingId: 'bog_hatchery', multiplier: 2 }],
  },
  {
    id: 'borrowed_bellows', name: 'Borrowed Bellows', description: 'Scrap Incubators are twice as productive.', cost: 1_500_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'scrap_incubator', amount: 10 }], effects: [{ type: 'buildingMultiplier', buildingId: 'scrap_incubator', multiplier: 2 }],
  },
  {
    id: 'unsafe_pressure', name: 'Unsafe Pressure', description: 'Scrap Incubators are twice as productive again.', cost: 150_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'scrap_incubator', amount: 50 }], effects: [{ type: 'buildingMultiplier', buildingId: 'scrap_incubator', multiplier: 2 }],
  },
  {
    id: 'louder_rattles', name: 'Louder Rattles', description: 'Shaman Circles are twice as productive.', cost: 15_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'shaman_circle', amount: 10 }], effects: [{ type: 'buildingMultiplier', buildingId: 'shaman_circle', multiplier: 2 }],
  },
  {
    id: 'forbidden_chorus', name: 'Forbidden Chorus', description: 'Shaman Circles are twice as productive again.', cost: 1_500_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'shaman_circle', amount: 50 }], effects: [{ type: 'buildingMultiplier', buildingId: 'shaman_circle', multiplier: 2 }],
  },
  {
    id: 'mandatory_cuddles', name: 'Mandatory Cuddles', description: 'War Camps are twice as productive.', cost: 200_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'war_camp', amount: 10 }], effects: [{ type: 'buildingMultiplier', buildingId: 'war_camp', multiplier: 2 }],
  },
  {
    id: 'drill_sergeant_midwives', name: 'Drill-Sergeant Midwives', description: 'War Camps are twice as productive again.', cost: 20_000_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'war_camp', amount: 50 }], effects: [{ type: 'buildingMultiplier', buildingId: 'war_camp', multiplier: 2 }],
  },
  {
    id: 'silver_spores', name: 'Silver Spores', description: 'Moonspore Caverns are twice as productive.', cost: 3_300_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'moonspore_cavern', amount: 10 }], effects: [{ type: 'buildingMultiplier', buildingId: 'moonspore_cavern', multiplier: 2 }],
  },
  {
    id: 'full_moon_farming', name: 'Full-Moon Farming', description: 'Moonspore Caverns are twice as productive again.', cost: 330_000_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'moonspore_cavern', amount: 50 }], effects: [{ type: 'buildingMultiplier', buildingId: 'moonspore_cavern', multiplier: 2 }],
  },
  {
    id: 'forge_runes', name: 'Forge Runes', description: 'Deepforge Vats are twice as productive.', cost: 51_000_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'deepforge_vat', amount: 10 }], effects: [{ type: 'buildingMultiplier', buildingId: 'deepforge_vat', multiplier: 2 }],
  },
  {
    id: 'molten_cradles', name: 'Molten Cradles', description: 'Deepforge Vats are twice as productive again.', cost: 5_100_000_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'deepforge_vat', amount: 50 }], effects: [{ type: 'buildingMultiplier', buildingId: 'deepforge_vat', multiplier: 2 }],
  },
  {
    id: 'hinge_grease', name: 'Hinge Grease', description: 'Goblin Gates are twice as productive.', cost: 750_000_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'goblin_gate', amount: 10 }], effects: [{ type: 'buildingMultiplier', buildingId: 'goblin_gate', multiplier: 2 }],
  },
  {
    id: 'many_doors', name: 'Many Doors', description: 'Goblin Gates are twice as productive again.', cost: 75_000_000_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'goblin_gate', amount: 50 }], effects: [{ type: 'buildingMultiplier', buildingId: 'goblin_gate', multiplier: 2 }],
  },
  {
    id: 'warm_scale_blankets', name: 'Warm Scale Blankets', description: 'Wyrm Hoards are twice as productive.', cost: 10_000_000_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'wyrm_hoard', amount: 10 }], effects: [{ type: 'buildingMultiplier', buildingId: 'wyrm_hoard', multiplier: 2 }],
  },
  {
    id: 'borrowed_dragonfire', name: 'Borrowed Dragonfire', description: 'Wyrm Hoards are twice as productive again.', cost: 1_000_000_000_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'wyrm_hoard', amount: 50 }], effects: [{ type: 'buildingMultiplier', buildingId: 'wyrm_hoard', multiplier: 2 }],
  },
  {
    id: 'wider_impossibility', name: 'Wider Impossibility', description: 'Reality Burrows are twice as productive.', cost: 140_000_000_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'reality_burrow', amount: 10 }], effects: [{ type: 'buildingMultiplier', buildingId: 'reality_burrow', multiplier: 2 }],
  },
  {
    id: 'burrow_beyond', name: 'Burrow Beyond', description: 'Reality Burrows are twice as productive again.', cost: 14_000_000_000_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'reality_burrow', amount: 50 }], effects: [{ type: 'buildingMultiplier', buildingId: 'reality_burrow', multiplier: 2 }],
  },
] as const satisfies readonly UpgradeDefinition[];

export const ACHIEVEMENTS = [
  { id: 'first_clutch', name: 'First Clutch', description: 'Bring 100 goblins into the world.', condition: { type: 'lifetimeGoblins', amount: 100 } },
  { id: 'crowded_cave', name: 'Crowded Cave', description: 'Reach 10,000 lifetime goblins.', condition: { type: 'lifetimeGoblins', amount: 10_000 } },
  { id: 'green_tide', name: 'Green Tide', description: 'Reach 1 million lifetime goblins.', condition: { type: 'lifetimeGoblins', amount: 1_000_000 } },
  { id: 'uncountable_horde', name: 'Uncountable Horde', description: 'Reach 1 billion lifetime goblins.', condition: { type: 'lifetimeGoblins', amount: 1_000_000_000 } },
  { id: 'finger_exercise', name: 'Finger Exercise', description: 'Click 100 times.', condition: { type: 'totalClicks', amount: 100 } },
  { id: 'calloused_chief', name: 'Calloused Chief', description: 'Click 5,000 times.', condition: { type: 'totalClicks', amount: 5_000 } },
  { id: 'matron_house', name: 'Matron House', description: 'Own 25 Brood Matrons.', condition: { type: 'buildingOwned', buildingId: 'brood_matron', amount: 25 } },
  { id: 'fungus_farmer', name: 'Fungus Farmer', description: 'Own 25 Mushroom Nurseries.', condition: { type: 'buildingOwned', buildingId: 'mushroom_nursery', amount: 25 } },
  { id: 'landlord', name: 'Warren Landlord', description: 'Own 25 Warren Dens.', condition: { type: 'buildingOwned', buildingId: 'warren_den', amount: 25 } },
  { id: 'bog_baron', name: 'Bog Baron', description: 'Own 25 Bog Hatcheries.', condition: { type: 'buildingOwned', buildingId: 'bog_hatchery', amount: 25 } },
  { id: 'scrap_tycoon', name: 'Scrap Tycoon', description: 'Own 25 Scrap Incubators.', condition: { type: 'buildingOwned', buildingId: 'scrap_incubator', amount: 25 } },
  { id: 'moon_speaker', name: 'Moon Speaker', description: 'Own 25 Shaman Circles.', condition: { type: 'buildingOwned', buildingId: 'shaman_circle', amount: 25 } },
  { id: 'camp_commander', name: 'Camp Commander', description: 'Own 25 War Camps.', condition: { type: 'buildingOwned', buildingId: 'war_camp', amount: 25 } },
  { id: 'spore_lord', name: 'Spore Lord', description: 'Own 25 Moonspore Caverns.', condition: { type: 'buildingOwned', buildingId: 'moonspore_cavern', amount: 25 } },
  { id: 'deep_smith', name: 'Deep Smith', description: 'Own 25 Deepforge Vats.', condition: { type: 'buildingOwned', buildingId: 'deepforge_vat', amount: 25 } },
  { id: 'gatekeeper', name: 'Gatekeeper', description: 'Own 25 Goblin Gates.', condition: { type: 'buildingOwned', buildingId: 'goblin_gate', amount: 25 } },
  { id: 'wyrm_squatter', name: 'Wyrm Squatter', description: 'Own 25 Wyrm Hoards.', condition: { type: 'buildingOwned', buildingId: 'wyrm_hoard', amount: 25 } },
  { id: 'reality_problem', name: 'Reality Problem', description: 'Own 25 Reality Burrows.', condition: { type: 'buildingOwned', buildingId: 'reality_burrow', amount: 25 } },
  { id: 'full_toolbox', name: 'Full Toolbox', description: 'Own at least one of every building.', condition: { type: 'allBuildingsOwned', amount: 1 } },
  { id: 'industrial_horde', name: 'Industrial Horde', description: 'Own at least 50 of every building.', condition: { type: 'allBuildingsOwned', amount: 50 } },
  { id: 'steady_trickle', name: 'Steady Trickle', description: 'Reach 100 goblins per second.', condition: { type: 'cps', amount: 100 } },
  { id: 'breeding_machine', name: 'Breeding Machine', description: 'Reach 1 million goblins per second.', condition: { type: 'cps', amount: 1_000_000 } },
  { id: 'mooncap_nibbler', name: 'Mooncap Nibbler', description: 'Catch a Mooncap event.', condition: { type: 'goldenEventsClicked', amount: 1 } },
  { id: 'mooncap_hunter', name: 'Mooncap Hunter', description: 'Catch 25 Mooncap events.', condition: { type: 'goldenEventsClicked', amount: 25 } },
  { id: 'old_blood', name: 'Old Blood', description: 'Perform your first Great Migration.', condition: { type: 'prestigeResets', amount: 1 } },
  { id: 'ancestral_loop', name: 'Ancestral Loop', description: 'Perform 10 Great Migrations.', condition: { type: 'prestigeResets', amount: 10 } },
] as const satisfies readonly AchievementDefinition[];

export const PERMANENT_UPGRADES = [
  { id: 'ancestral_fertility', name: 'Ancestral Fertility', description: '+5% global CPS per rank.', baseCost: 1, costGrowth: 1.8, maxRank: 20 },
  { id: 'stronger_spawn', name: 'Stronger Spawn', description: '+10% click power per rank.', baseCost: 1, costGrowth: 2, maxRank: 20 },
  { id: 'scavenger_memory', name: 'Scavenger Memory', description: '-1% building costs per rank.', baseCost: 2, costGrowth: 2, maxRank: 10 },
  { id: 'lucky_totem', name: 'Lucky Totem', description: 'Mooncaps appear roughly 10% sooner per rank.', baseCost: 3, costGrowth: 2.2, maxRank: 5 },
  { id: 'deep_warrens', name: 'Deep Warrens', description: '+2 hours offline-production cap per rank.', baseCost: 2, costGrowth: 2, maxRank: 8 },
  { id: 'starter_clutch', name: 'Starter Clutch', description: 'Begin each migration with 50 goblins per rank.', baseCost: 1, costGrowth: 2.5, maxRank: 5 },
] as const satisfies readonly PermanentUpgradeDefinition[];

export type UpgradeId = (typeof UPGRADES)[number]['id'];
export type AchievementId = (typeof ACHIEVEMENTS)[number]['id'];

export const BUILDING_BY_ID = Object.fromEntries(BUILDINGS.map((item) => [item.id, item])) as {
  [K in (typeof BUILDINGS)[number]['id']]: Extract<(typeof BUILDINGS)[number], { id: K }>;
};

export const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((item) => [item.id, item])) as Record<UpgradeId, (typeof UPGRADES)[number]>;
export const PERMANENT_UPGRADE_BY_ID = Object.fromEntries(PERMANENT_UPGRADES.map((item) => [item.id, item])) as Record<(typeof PERMANENT_UPGRADES)[number]['id'], (typeof PERMANENT_UPGRADES)[number]>;
