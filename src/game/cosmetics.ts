import type { CosmeticId } from './types';

export interface CosmeticDefinition {
  id: CosmeticId;
  name: string;
  description: string;
  cost: number;
}

export const COSMETICS: readonly CosmeticDefinition[] = [
  { id: 'red_cap', name: 'Scrappy Red Cap', description: 'A worn red cap patched for a goblin who refuses to retire it.', cost: 1 },
  { id: 'round_glasses', name: 'Golden Round Glasses', description: 'Big round spectacles for looking considerably cleverer than the plan deserves.', cost: 1 },
  { id: 'steampunk_goggles', name: 'Tinker Goggles', description: 'Brass workshop goggles built for smoke, sparks, and questionable machinery.', cost: 2 },
  { id: 'miner_helmet', name: 'Deep-Mine Helmet', description: 'A battered mining helmet with a lamp bright enough for the oldest tunnels.', cost: 2 },
  { id: 'pirate_monocle', name: 'Tunnel Corsair', description: 'Bandana and monocle for a goblin who considers every hoard legitimate salvage.', cost: 3 },
  { id: 'chef', name: 'Warren Chef', description: 'A towering chef hat for the brood cook nobody is brave enough to critique.', cost: 3 },
  { id: 'wizard', name: 'Mushroom Magus', description: 'Purple arcane finery for a goblin whose spellbook is mostly stains and ambition.', cost: 4 },
  { id: 'druid', name: 'Moss Druid', description: 'Leaves, flowers, and mushrooms gathered into a living little warren shrine.', cost: 4 },
  { id: 'punk', name: 'Scrap Punk', description: 'Spikes, straps, and enough attitude to make the Directorate nervous.', cost: 5 },
  { id: 'king', name: 'Goblin King', description: 'A crown and royal cloak for the brood ruler who finally made the title official.', cost: 6 },
] as const;

export const COSMETIC_BY_ID = Object.fromEntries(COSMETICS.map((cosmetic) => [cosmetic.id, cosmetic])) as Readonly<Record<CosmeticId, CosmeticDefinition>>;
