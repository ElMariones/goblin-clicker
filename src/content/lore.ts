/**
 * Original presentation copy for Brood & Burrow.
 *
 * This file intentionally contains no game math. The simulation in src/game
 * owns costs, CPS, requirements, reset rules, and save identifiers; these
 * records mirror its stable IDs so UI code may optionally enrich the engine
 * definitions with flavor without making save compatibility depend on prose.
 */

export type BuildingFlavor = {
  id: string;
  name: string;
  description: string;
  quote: string;
};

export type UpgradeFlavor = {
  id: string;
  name: string;
  description: string;
  quote: string;
};

export type AchievementFlavor = {
  id: string;
  name: string;
  description: string;
};

export type PrestigeFlavor = {
  id: string;
  name: string;
  description: string;
  quote: string;
};

export const GAME_FLAVOR = {
  title: 'Brood & Burrow',
  subtitle: 'Goblin Reproduction Directorate',
  resourceSingular: 'goblin',
  resourcePlural: 'goblins',
  prestigeResourceSingular: 'Ancestral Cunning',
  prestigeResourcePlural: 'Ancestral Cunning',
  clickAction: 'Spawn a Goblin',
  resetAction: 'Found a New Warren',
} as const;

/** Twelve production tiers matching src/game/content.ts by id. */
export const BUILDING_FLAVOR: readonly BuildingFlavor[] = [
  {
    id: 'brood_matron',
    name: 'Brood Matron',
    description:
      'A veteran broodkeeper with a soup ladle, a terrifying singing voice, and the calm authority required to keep the first clutch coming.',
    quote: 'Nobody outranks the matron during nap time.',
  },
  {
    id: 'mushroom_nursery',
    name: 'Mushroom Nursery',
    description:
      'Warm fungus beds, damp moss, and mooncaps turn a forgotten cave into a nursery where goblinlings seem to appear between blinks.',
    quote: 'The mushrooms are completely safe, says the mushroom.',
  },
  {
    id: 'warren_den',
    name: 'Warren Den',
    description:
      'A disciplined maze of hammocks, cradles, kitchens, tunnels, and emergency snack caches. Population has become architecture.',
    quote: 'Every tunnel needs a goblin. Every goblin wants another tunnel.',
  },
  {
    id: 'bog_hatchery',
    name: 'Bog Hatchery',
    description:
      'Steaming mud pools and suspiciously fertile swamp water produce a thriving clutch no surface physician would ever agree to inspect.',
    quote: 'If it bubbles, it is working. If it talks, fetch the shaman.',
  },
  {
    id: 'scrap_incubator',
    name: 'Scrap Incubator',
    description:
      'Stolen pipes, dented boilers, mine-cart wheels, and three valves nobody understands combine into a mostly safe mechanical nursery.',
    quote: 'If it rattles, tighten it. If it stops rattling, run.',
  },
  {
    id: 'shaman_circle',
    name: 'Shaman Circle',
    description:
      'Bone rattles and moon chants persuade nature to hurry. The shamans insist this is ancient wisdom, not yelling at biology.',
    quote: 'The moon listens better when everyone shouts together.',
  },
  {
    id: 'war_camp',
    name: 'War Camp',
    description:
      'A regimented settlement where veterans raise recruits, recruits raise tents, and the tents somehow contain even more recruits.',
    quote: 'Reveille at dawn. Bedtime whenever the horn breaks.',
  },
  {
    id: 'moonspore_cavern',
    name: 'Moonspore Cavern',
    description:
      'Bioluminescent spores turn the ceiling into a false night sky and whole generations bloom beneath its silver-green light.',
    quote: 'The stars are fungus. Try not to ruin it for the children.',
  },
  {
    id: 'deepforge_vat',
    name: 'Deepforge Vat',
    description:
      'Runic iron vats beneath the mountain thrum with ancestral heat, brewing clutches by the batch to the rhythm of enormous bellows.',
    quote: 'Traditional craftsmanship, now with pressure gauges.',
  },
  {
    id: 'goblin_gate',
    name: 'Goblin Gate',
    description:
      'A crooked portal connects the burrow to warrens that maps deny exist. Open the door and distant cousins arrive already asking for dinner.',
    quote: 'The shortest distance between two goblins is negotiable.',
  },
  {
    id: 'wyrm_hoard',
    name: 'Wyrm Hoard',
    description:
      'A dragon-sized nest is repurposed as a volcanic nursery. The resident wyrm provides heat in exchange for tribute and uninterrupted naps.',
    quote: 'Never wake the furnace. The furnace has teeth.',
  },
  {
    id: 'reality_burrow',
    name: 'Reality Burrow',
    description:
      'A tunnel bored sideways through possibility itself, opening into every warren the brood might have built in every history where it survived.',
    quote: 'A kingdom is just a burrow that learned to exist more than once.',
  },
] as const;

/** Flavor for every cycle upgrade currently defined by the deterministic engine. */
export const UPGRADE_FLAVOR: readonly UpgradeFlavor[] = [
  {
    id: 'sharpened_nails',
    name: 'Sharpened Nails',
    description: 'A proper manicure for a hands-on overseer. Manual spawning becomes dramatically more efficient.',
    quote: 'Productivity begins at the fingertips.',
  },
  {
    id: 'midwife_whistles',
    name: 'Midwife Whistles',
    description: 'Color-coded whistles coordinate the brood chamber with a sophisticated language consisting entirely of shrill blasts.',
    quote: 'Three blasts means hurry. Four means hurry louder.',
  },
  {
    id: 'riotous_birthing',
    name: 'Riotous Birthing',
    description: 'The entire warren joins the commotion; every manual spawn now borrows a little strength from industrial production.',
    quote: 'When the whole cave is cheering, nobody can hear the safety officer.',
  },
  {
    id: 'green_thumb',
    name: 'Green Thumb',
    description: 'A burrow-wide program of better moss, better mushrooms, and better yelling improves every producer at once.',
    quote: 'Agriculture, but applied to everything.',
  },
  {
    id: 'warren_accounting',
    name: 'Warren Accounting',
    description: 'The discovery of ledgers reveals several thousand goblins who were apparently working off the books.',
    quote: 'Final total: more than yesterday.',
  },
  {
    id: 'grand_clutch_plan',
    name: 'Grand Clutch Plan',
    description: 'A master plan coordinates every chamber, shift, ration cart, and broodkeeper into one enormous demographic machine.',
    quote: 'Five-year plan. Five-minute attention span.',
  },
  {
    id: 'matron_stew',
    name: 'Matron Stew',
    description: 'A thick mushroom stew keeps Brood Matrons on their feet through shifts that lesser creatures would call several days.',
    quote: 'The secret ingredient is not asking.',
  },
  {
    id: 'matron_union',
    name: 'Matron Union',
    description: 'The matrons organize, standardize shift handovers, and immediately become frighteningly efficient negotiators.',
    quote: 'The warren belongs to everyone. The ladle belongs to us.',
  },
  {
    id: 'richer_compost',
    name: 'Richer Compost',
    description: 'Premium compost turns Mushroom Nurseries into lush, steaming greenhouses with suspiciously energetic cradles.',
    quote: 'Yesterday’s leftovers. Tomorrow’s population boom.',
  },
  {
    id: 'singing_fungus',
    name: 'Singing Fungus',
    description: 'A resonant mooncap strain hums lullabies on its own, freeing nursery workers for more important forms of chaos.',
    quote: 'It only knows one song. It is a very long song.',
  },
  {
    id: 'double_bunks',
    name: 'Double Bunks',
    description: 'Warren Dens discover vertical space. The civil engineer responsible is immediately promoted beyond competence.',
    quote: 'Floor space is a state of mind.',
  },
  {
    id: 'triple_bunks',
    name: 'Triple Bunks',
    description: 'The obvious next step. Ceiling clearance, dignity, and common sense are treated as optional constraints.',
    quote: 'The top bunk has weather now.',
  },
  {
    id: 'warmer_mud',
    name: 'Warmer Mud',
    description: 'Heated stones beneath the bog keep every clutch comfortable and make the hatchery smell only slightly more alive.',
    quote: 'Luxury is mud at the correct temperature.',
  },
  {
    id: 'royal_sludge',
    name: 'Royal Sludge',
    description: 'Ceremonial swamp muck from the deepest pool turns Bog Hatcheries into aristocratic engines of abundance.',
    quote: 'Same mud. Tiny crown.',
  },
  {
    id: 'borrowed_bellows',
    name: 'Borrowed Bellows',
    description: 'A forge reports several missing bellows at roughly the same moment Scrap Incubators become much more productive.',
    quote: 'Borrowed means we remember where it came from.',
  },
  {
    id: 'unsafe_pressure',
    name: 'Unsafe Pressure',
    description: 'The red zone on a boiler gauge is reinterpreted as an aspirational target rather than a warning.',
    quote: 'Efficiency has a whistle now.',
  },
  {
    id: 'louder_rattles',
    name: 'Louder Rattles',
    description: 'Shamans replace delicate ritual instruments with objects audible from neighboring geological formations.',
    quote: 'If the ancestors cannot hear us, the ancestors are not trying.',
  },
  {
    id: 'forbidden_chorus',
    name: 'Forbidden Chorus',
    description: 'A sealed verse from an old cave wall makes every Shaman Circle work twice as hard and the stalactites visibly nervous.',
    quote: 'Forbidden mostly means nobody printed enough copies.',
  },
  {
    id: 'mandatory_cuddles',
    name: 'Mandatory Cuddles',
    description: 'War Camps introduce a morale doctrine so effective nobody dares admit they enjoy it.',
    quote: 'Form ranks. Present arms. Hug left.',
  },
  {
    id: 'drill_sergeant_midwives',
    name: 'Drill-Sergeant Midwives',
    description: 'The brood chamber adopts parade-ground discipline. Blankets are folded square enough to frighten recruits.',
    quote: 'WELCOME TO THE WORLD, WHELP. SOUND OFF.',
  },
  {
    id: 'silver_spores',
    name: 'Silver Spores',
    description: 'Moonspore Caverns cultivate a luminous strain that doubles output and makes everyone’s sneezes briefly magnificent.',
    quote: 'Do not inhale the profit margin.',
  },
  {
    id: 'full_moon_farming',
    name: 'Full-Moon Farming',
    description: 'Mirrors and polished shields convince the cavern crop that every night is the perfect night to bloom.',
    quote: 'The moon has been outsourced.',
  },
  {
    id: 'forge_runes',
    name: 'Forge Runes',
    description: 'Fresh sigils cut into every Deepforge Vat teach iron itself to remember the preferred rhythm of production.',
    quote: 'Measure twice. Enchant once. Run anyway.',
  },
  {
    id: 'molten_cradles',
    name: 'Molten Cradles',
    description: 'Heat-proof cradle frames allow the Deepforge to operate at temperatures previously reserved for poor decisions.',
    quote: 'Warm is relative.',
  },
  {
    id: 'hinge_grease',
    name: 'Hinge Grease',
    description: 'The Goblin Gate finally stops screaming every time it opens. Distant warrens interpret this as an invitation.',
    quote: 'Less prophecy. More lubrication.',
  },
  {
    id: 'many_doors',
    name: 'Many Doors',
    description: 'Why connect to one impossible warren when the frame can hold several portals at mildly incompatible angles?',
    quote: 'Please label your dimension before entering.',
  },
  {
    id: 'warm_scale_blankets',
    name: 'Warm Scale Blankets',
    description: 'Shed wyrm scales make nearly indestructible blankets and turn a terrifying hoard into a surprisingly cozy nursery.',
    quote: 'Fireproof on one side.',
  },
  {
    id: 'borrowed_dragonfire',
    name: 'Borrowed Dragonfire',
    description: 'A carefully routed breath of dragonfire keeps the entire Wyrm Hoard warm. “Carefully” is doing heroic work here.',
    quote: 'The furnace would like its treasure back.',
  },
  {
    id: 'wider_impossibility',
    name: 'Wider Impossibility',
    description: 'Reality Burrows are widened beyond the limits of geometry, improving throughput and upsetting several mathematicians.',
    quote: 'Two meters wide on the outside. Ask no further questions.',
  },
  {
    id: 'burrow_beyond',
    name: 'Burrow Beyond',
    description: 'The tunnel reaches into histories where the brood already perfected the tunnel, creating an extremely productive argument with causality.',
    quote: 'We learned it from ourselves tomorrow.',
  },
] as const;

/** Flavor keyed to the engine achievement IDs. Conditions remain engine-owned. */
export const ACHIEVEMENT_FLAVOR: readonly AchievementFlavor[] = [
  { id: 'first_clutch', name: 'First Clutch', description: 'One hundred goblins. Enough for a crowd, a committee, and several rival committees.' },
  { id: 'crowded_cave', name: 'Crowded Cave', description: 'Ten thousand lifetime goblins have made personal space a historical curiosity.' },
  { id: 'green_tide', name: 'Green Tide', description: 'One million lifetime goblins. The cave is no longer the important part.' },
  { id: 'uncountable_horde', name: 'Uncountable Horde', description: 'One billion lifetime goblins. The census office resigns collectively.' },
  { id: 'finger_exercise', name: 'Finger Exercise', description: 'One hundred manual spawns. The brood bell knows your touch.' },
  { id: 'calloused_chief', name: 'Calloused Chief', description: 'Five thousand manual spawns. Delegation remains a theoretical concept.' },
  { id: 'matron_house', name: 'Matron House', description: 'Twenty-five Brood Matrons now run the warren more effectively than you do.' },
  { id: 'fungus_farmer', name: 'Fungus Farmer', description: 'Twenty-five Mushroom Nurseries prove agriculture can be extremely loud.' },
  { id: 'landlord', name: 'Warren Landlord', description: 'Twenty-five Warren Dens and not one reliably straight hallway.' },
  { id: 'bog_baron', name: 'Bog Baron', description: 'Twenty-five Bog Hatcheries. Your boots have accepted their fate.' },
  { id: 'scrap_tycoon', name: 'Scrap Tycoon', description: 'Twenty-five Scrap Incubators turn stolen engineering into an industry.' },
  { id: 'moon_speaker', name: 'Moon Speaker', description: 'Twenty-five Shaman Circles chant in enough harmony to alarm the moon.' },
  { id: 'camp_commander', name: 'Camp Commander', description: 'Twenty-five War Camps answer the morning horn, eventually.' },
  { id: 'spore_lord', name: 'Spore Lord', description: 'Twenty-five Moonspore Caverns glow beneath your expanding domain.' },
  { id: 'deep_smith', name: 'Deep Smith', description: 'Twenty-five Deepforge Vats make the mountain sound like a heartbeat.' },
  { id: 'gatekeeper', name: 'Gatekeeper', description: 'Twenty-five Goblin Gates make “local population” a meaningless phrase.' },
  { id: 'wyrm_squatter', name: 'Wyrm Squatter', description: 'Twenty-five Wyrm Hoards. The dragons are drafting a strongly worded notice.' },
  { id: 'reality_problem', name: 'Reality Problem', description: 'Twenty-five Reality Burrows have made causality a zoning issue.' },
  { id: 'full_toolbox', name: 'Full Toolbox', description: 'Own at least one of every producer, from matron to impossible tunnel.' },
  { id: 'industrial_horde', name: 'Industrial Horde', description: 'Own fifty of every producer. The brood has become its own ecosystem.' },
  { id: 'steady_trickle', name: 'Steady Trickle', description: 'Reach one hundred goblins per second and discover that “trickle” is relative.' },
  { id: 'breeding_machine', name: 'Breeding Machine', description: 'Reach one million goblins per second. Biology has filed a complaint.' },
  { id: 'mooncap_nibbler', name: 'Mooncap Nibbler', description: 'Catch a Mooncap before it vanishes back into the dark.' },
  { id: 'mooncap_hunter', name: 'Mooncap Hunter', description: 'Catch twenty-five Mooncaps. You now react to glowing fungus professionally.' },
  { id: 'old_blood', name: 'Old Blood', description: 'Complete your first Great Migration and carry ancestral cunning into a new warren.' },
  { id: 'ancestral_loop', name: 'Ancestral Loop', description: 'Complete ten Great Migrations. History has started taking notes from you.' },
] as const;

/** Flavor keyed to src/game PermanentUpgradeId. */
export const PRESTIGE_FLAVOR: readonly PrestigeFlavor[] = [
  {
    id: 'ancestral_fertility',
    name: 'Ancestral Fertility',
    description: 'Every new warren inherits a little of the old bloodline’s impossible productivity.',
    quote: 'Nothing ends. It becomes an ancestor.',
  },
  {
    id: 'stronger_spawn',
    name: 'Stronger Spawn',
    description: 'Generations of practiced hands make every manual spawn more potent in every future warren.',
    quote: 'Technique survives the migration.',
  },
  {
    id: 'scavenger_memory',
    name: 'Scavenger Memory',
    description: 'Descendants remember exactly where the cheap timber, loose gears, and unattended carts were found last time.',
    quote: 'Not stolen. Historically reassigned.',
  },
  {
    id: 'lucky_totem',
    name: 'Lucky Totem',
    description: 'A crooked heirloom makes wandering Mooncaps seem just a little more eager to find the brood.',
    quote: 'Luck improves when you carve teeth into it.',
  },
  {
    id: 'deep_warrens',
    name: 'Deep Warrens',
    description: 'Old tunnel wisdom lets the brood keep working longer while its chief is away.',
    quote: 'The deeper chambers never learned what closing time means.',
  },
  {
    id: 'starter_clutch',
    name: 'Starter Clutch',
    description: 'Every Great Migration begins with a few descendants already waiting at the new warren.',
    quote: 'The family moved ahead. They brought snacks.',
  },
] as const;

export const EVENT_FLAVOR = {
  name: 'Mooncap',
  description: 'A luminous Mooncap has pushed through the stone. Catch it before the glow fades.',
  success: 'Caught it! The warren erupts in profitable cheering.',
  missed: 'The Mooncap folds back into the dark, leaving only spores and regret.',
} as const;

export const OFFLINE_FLAVOR = {
  title: 'The Warren Kept Busy',
  body: 'While you were away, the brood carried on without supervision. Against all expectations, this improved efficiency.',
} as const;

export function findBuildingFlavor(id: string): BuildingFlavor | undefined {
  return BUILDING_FLAVOR.find((building) => building.id === id);
}

export function findUpgradeFlavor(id: string): UpgradeFlavor | undefined {
  return UPGRADE_FLAVOR.find((upgrade) => upgrade.id === id);
}

export function findAchievementFlavor(id: string): AchievementFlavor | undefined {
  return ACHIEVEMENT_FLAVOR.find((achievement) => achievement.id === id);
}

export function findPrestigeFlavor(id: string): PrestigeFlavor | undefined {
  return PRESTIGE_FLAVOR.find((upgrade) => upgrade.id === id);
}
