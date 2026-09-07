import type {
  AchievementDefinition,
  BuildingDefinition,
  ExpansionMasteryLevelDefinition,
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

/**
 * Mastery rewards breadth and continued investment in older expansions.
 * productionMultiplier is applied multiplicatively for every reached level;
 * networkCpsBonus is added to the all-warren mastery network bonus.
 */
export const EXPANSION_MASTERY_LEVELS = [
  {
    id: 'established', name: 'Established', threshold: 10, productionMultiplier: 1.2, networkCpsBonus: 0.005,
    description: 'A permanent crew and stable routines take hold. ×1.20 expansion output and +0.5% all-warren production while this level is maintained.',
  },
  {
    id: 'thriving', name: 'Thriving', threshold: 25, productionMultiplier: 1.25, networkCpsBonus: 0.0075,
    description: 'The expansion becomes a dependable district. ×1.25 expansion output and another +0.75% all-warren production.',
  },
  {
    id: 'veteran', name: 'Veteran', threshold: 50, productionMultiplier: 1.5, networkCpsBonus: 0.01,
    description: 'Experienced crews teach every new clutch the shortcuts. ×1.50 expansion output and another +1% all-warren production.',
  },
  {
    id: 'renowned', name: 'Renowned', threshold: 100, productionMultiplier: 2, networkCpsBonus: 0.015,
    description: 'The expansion becomes a model copied throughout the warrens. ×2 expansion output and another +1.5% all-warren production.',
  },
  {
    id: 'elite', name: 'Elite', threshold: 150, productionMultiplier: 2, networkCpsBonus: 0.02,
    description: 'Specialist crews turn repetition into doctrine. ×2 expansion output and another +2% all-warren production.',
  },
  {
    id: 'legendary', name: 'Legendary', threshold: 200, productionMultiplier: 2.5, networkCpsBonus: 0.025,
    description: 'Its methods become campfire legend and practical instruction. ×2.50 expansion output and another +2.5% all-warren production.',
  },
  {
    id: 'ancestral', name: 'Ancestral', threshold: 250, productionMultiplier: 3, networkCpsBonus: 0.035,
    description: 'Generations of accumulated craft turn the expansion into a bloodline institution. ×3 expansion output and another +3.5% all-warren production.',
  },
  {
    id: 'mythic', name: 'Mythic', threshold: 300, productionMultiplier: 4, networkCpsBonus: 0.05,
    description: 'The expansion is no longer merely productive; it defines how the entire horde works. ×4 expansion output and another +5% all-warren production.',
  },
] as const satisfies readonly ExpansionMasteryLevelDefinition[];

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
    id: 'iron_fingertips', name: 'Iron Fingertips', description: 'Years of frantic hatching turn every click into a three-goblin command.', cost: 100_000_000,
    requirements: [{ type: 'totalClicks', amount: 2_500 }], effects: [{ type: 'clickMultiplier', multiplier: 3 }],
  },
  {
    id: 'hatchery_command', name: 'Hatchery Command', description: 'Manual hatching commandeers 5% of the warrens’ current base production.', cost: 50_000_000_000,
    requirements: [{ type: 'totalClicks', amount: 10_000 }, { type: 'lifetimeGoblins', amount: 1_000_000_000 }], effects: [{ type: 'clickCpsFraction', fraction: 0.05 }],
  },
  {
    id: 'twitch_of_creation', name: 'Twitch of Creation', description: 'A single twitch echoes through the broodways, doubling manual force and adding 10% of base production.', cost: 5_000_000_000_000_000,
    requirements: [{ type: 'totalClicks', amount: 25_000 }, { type: 'lifetimeGoblins', amount: 100_000_000_000_000 }], effects: [{ type: 'clickMultiplier', multiplier: 2 }, { type: 'clickCpsFraction', fraction: 0.1 }],
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
    id: 'subterranean_logistics', name: 'Subterranean Logistics', description: 'Burrow schedules, fungus ledgers, and tunnel priority lanes raise all production by 30%.', cost: 2_500_000_000_000,
    requirements: [{ type: 'lifetimeGoblins', amount: 1_000_000_000_000 }], effects: [{ type: 'globalCpsMultiplier', multiplier: 1.3 }],
  },
  {
    id: 'horde_standardization', name: 'Horde Standardization', description: 'Every warren follows the same ruthlessly efficient breeding doctrine, raising all production by 40%.', cost: 5_000_000_000_000_000,
    requirements: [{ type: 'lifetimeGoblins', amount: 1_000_000_000_000_000 }, { type: 'prestigeResets', amount: 1 }], effects: [{ type: 'globalCpsMultiplier', multiplier: 1.4 }],
  },
  {
    id: 'empire_beneath_everything', name: 'Empire Beneath Everything', description: 'The warrens become a single civilization-sized machine, increasing all production by 50%.', cost: 10_000_000_000_000_000_000,
    requirements: [{ type: 'lifetimeGoblins', amount: 1_000_000_000_000_000_000 }, { type: 'prestigeShardsEarned', amount: 10 }], effects: [{ type: 'globalCpsMultiplier', multiplier: 1.5 }],
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
    id: 'matron_dynasties', name: 'Matron Dynasties', description: 'Brood Matrons are twice as productive yet again.', cost: 50_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'brood_matron', amount: 100 }], effects: [{ type: 'buildingMultiplier', buildingId: 'brood_matron', multiplier: 2 }],
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
    id: 'mycelial_cradles', name: 'Mycelial Cradles', description: 'Mushroom Nurseries are twice as productive yet again.', cost: 300_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'mushroom_nursery', amount: 100 }], effects: [{ type: 'buildingMultiplier', buildingId: 'mushroom_nursery', multiplier: 2 }],
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
    id: 'honeycomb_warrens', name: 'Honeycomb Warrens', description: 'Warren Dens are twice as productive yet again.', cost: 3_000_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'warren_den', amount: 100 }], effects: [{ type: 'buildingMultiplier', buildingId: 'warren_den', multiplier: 2 }],
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
    id: 'primordial_mire', name: 'Primordial Mire', description: 'Bog Hatcheries are twice as productive yet again.', cost: 30_000_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'bog_hatchery', amount: 100 }], effects: [{ type: 'buildingMultiplier', buildingId: 'bog_hatchery', multiplier: 2 }],
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
    id: 'redline_boilers', name: 'Redline Boilers', description: 'Scrap Incubators are twice as productive yet again.', cost: 300_000_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'scrap_incubator', amount: 100 }], effects: [{ type: 'buildingMultiplier', buildingId: 'scrap_incubator', multiplier: 2 }],
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
    id: 'ancestor_thunder', name: 'Ancestor Thunder', description: 'Shaman Circles are twice as productive yet again.', cost: 3_000_000_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'shaman_circle', amount: 100 }], effects: [{ type: 'buildingMultiplier', buildingId: 'shaman_circle', multiplier: 2 }],
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
    id: 'mobilized_generation', name: 'Mobilized Generation', description: 'War Camps are twice as productive yet again.', cost: 40_000_000_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'war_camp', amount: 100 }], effects: [{ type: 'buildingMultiplier', buildingId: 'war_camp', multiplier: 2 }],
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
    id: 'perpetual_eclipse', name: 'Perpetual Eclipse', description: 'Moonspore Caverns are twice as productive yet again.', cost: 660_000_000_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'moonspore_cavern', amount: 100 }], effects: [{ type: 'buildingMultiplier', buildingId: 'moonspore_cavern', multiplier: 2 }],
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
    id: 'heart_of_the_forge', name: 'Heart of the Forge', description: 'Deepforge Vats are twice as productive yet again.', cost: 10_200_000_000_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'deepforge_vat', amount: 100 }], effects: [{ type: 'buildingMultiplier', buildingId: 'deepforge_vat', multiplier: 2 }],
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
    id: 'gate_without_walls', name: 'Gate Without Walls', description: 'Goblin Gates are twice as productive yet again.', cost: 150_000_000_000_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'goblin_gate', amount: 100 }], effects: [{ type: 'buildingMultiplier', buildingId: 'goblin_gate', multiplier: 2 }],
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
    id: 'dragonless_hoard', name: 'Dragonless Hoard', description: 'Wyrm Hoards are twice as productive yet again.', cost: 2_000_000_000_000_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'wyrm_hoard', amount: 100 }], effects: [{ type: 'buildingMultiplier', buildingId: 'wyrm_hoard', multiplier: 2 }],
  },
  {
    id: 'wider_impossibility', name: 'Wider Impossibility', description: 'Reality Burrows are twice as productive.', cost: 140_000_000_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'reality_burrow', amount: 10 }], effects: [{ type: 'buildingMultiplier', buildingId: 'reality_burrow', multiplier: 2 }],
  },
  {
    id: 'burrow_beyond', name: 'Burrow Beyond', description: 'Reality Burrows are twice as productive again.', cost: 14_000_000_000_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'reality_burrow', amount: 50 }], effects: [{ type: 'buildingMultiplier', buildingId: 'reality_burrow', multiplier: 2 }],
  },
  {
    id: 'impossible_population', name: 'Impossible Population', description: 'Reality Burrows are twice as productive yet again.', cost: 28_000_000_000_000_000_000,
    requirements: [{ type: 'buildingOwned', buildingId: 'reality_burrow', amount: 100 }], effects: [{ type: 'buildingMultiplier', buildingId: 'reality_burrow', multiplier: 2 }],
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
  { id: 'ancestral_fertility', name: 'Ancestral Fertility', description: 'The old blood remembers how to multiply. Each rank adds +5% to the base global production multiplier, before research and temporary buffs.', baseCost: 1, costGrowth: 1.8, maxRank: 20 },
  { id: 'stronger_spawn', name: 'Stronger Spawn', description: 'Every generation is born ready to work. Each rank adds +10% to manual spawn power before ordinary click multipliers.', baseCost: 1, costGrowth: 2, maxRank: 20 },
  { id: 'scavenger_memory', name: 'Scavenger Memory', description: 'The clan remembers where every useful plank and stolen hinge came from. Each rank reduces all expansion purchase prices by 1%, down to the shared 50% cost floor.', baseCost: 2, costGrowth: 2, maxRank: 10 },
  { id: 'lucky_totem', name: 'Lucky Totem', description: 'An old moon-carved idol calls strange fungus to the surface. Each rank shortens Mooncap spawn delays by the equivalent of roughly 10%, subject to the 30-second minimum.', baseCost: 3, costGrowth: 2.2, maxRank: 5 },
  { id: 'deep_warrens', name: 'Deep Warrens', description: 'Hidden nurseries keep working while the chief is away. Each rank adds 2 hours to the offline-production cap beyond the base 8 hours.', baseCost: 2, costGrowth: 2, maxRank: 8 },
  { id: 'starter_clutch', name: 'Starter Clutch', description: 'Every new warren begins with descendants already waiting in the tunnels. Start each migration with 50 goblins per rank.', baseCost: 1, costGrowth: 2.5, maxRank: 5 },
  { id: 'founders_legacy', name: "Founders' Legacy", description: 'Older expansions teach the whole horde. Each rank makes expansion-mastery network bonuses 20% stronger, doubling their global contribution at rank 5.', baseCost: 4, costGrowth: 2.15, maxRank: 5 },
  { id: 'ancestral_momentum', name: 'Ancestral Momentum', description: 'Each successful migration makes the next empire quicker to organize. Gain +1% global production per completed migration per rank, counting up to 25 migrations.', baseCost: 5, costGrowth: 2.3, maxRank: 5 },
  { id: 'tireless_lineage', name: 'Tireless Lineage', description: 'The warrens waste less time while unattended. Each rank raises offline efficiency by 5 percentage points, from 75% up to 100% at rank 5.', baseCost: 4, costGrowth: 2.25, maxRank: 5 },
  { id: 'moonlit_blood', name: 'Moonlit Blood', description: 'Mooncaps recognize an old bargain in the bloodline. Each rank adds 10% to Mooncap clutch rewards and to the duration of Moon Frenzy and Hatching Fever.', baseCost: 6, costGrowth: 2.35, maxRank: 5 },
  { id: 'heirloom_matrons', name: 'Heirloom Matrons', description: 'Trusted matrons travel with the clan instead of being left behind. Begin each migration with 1 Brood Matron per rank, immediately restoring a trickle of passive production.', baseCost: 3, costGrowth: 2.4, maxRank: 8 },
] as const satisfies readonly PermanentUpgradeDefinition[];

export type UpgradeId = (typeof UPGRADES)[number]['id'];
export type AchievementId = (typeof ACHIEVEMENTS)[number]['id'];

export const BUILDING_BY_ID = Object.fromEntries(BUILDINGS.map((item) => [item.id, item])) as {
  [K in (typeof BUILDINGS)[number]['id']]: Extract<(typeof BUILDINGS)[number], { id: K }>;
};

export const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((item) => [item.id, item])) as Record<UpgradeId, (typeof UPGRADES)[number]>;
export const PERMANENT_UPGRADE_BY_ID = Object.fromEntries(PERMANENT_UPGRADES.map((item) => [item.id, item])) as Record<(typeof PERMANENT_UPGRADES)[number]['id'], (typeof PERMANENT_UPGRADES)[number]>;
