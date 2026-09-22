import blockCrystal from '../images/blocks/block-crystal.webp';
import blockFungus from '../images/blocks/block-fungus.webp';
import blockGold from '../images/blocks/block-gold.webp';
import blockRelic from '../images/blocks/block-relic.webp';
import blockTool from '../images/blocks/block-tool.webp';
import blockWeapon from '../images/blocks/block-weapon.webp';
import blocksGiver from '../images/blocks/blocks-giver.webp';
import vaultFloor from '../images/blocks/vault-floor.webp';
import brews0 from '../images/blocks/brews-0.webp';
import brews1 from '../images/blocks/brews-1.webp';
import brews2 from '../images/blocks/brews-2.webp';
import brews3 from '../images/blocks/brews-3.webp';
import brews4 from '../images/blocks/brews-4.webp';
import brews5 from '../images/blocks/brews-5.webp';
import cogs0 from '../images/blocks/cogs-0.webp';
import cogs1 from '../images/blocks/cogs-1.webp';
import cogs2 from '../images/blocks/cogs-2.webp';
import cogs3 from '../images/blocks/cogs-3.webp';
import cogs4 from '../images/blocks/cogs-4.webp';
import cogs5 from '../images/blocks/cogs-5.webp';
import gems0 from '../images/blocks/gems-0.webp';
import gems1 from '../images/blocks/gems-1.webp';
import gems2 from '../images/blocks/gems-2.webp';
import gems3 from '../images/blocks/gems-3.webp';
import gems4 from '../images/blocks/gems-4.webp';
import gems5 from '../images/blocks/gems-5.webp';
import heads0 from '../images/blocks/heads-0.webp';
import heads1 from '../images/blocks/heads-1.webp';
import heads2 from '../images/blocks/heads-2.webp';
import heads3 from '../images/blocks/heads-3.webp';
import heads4 from '../images/blocks/heads-4.webp';
import heads5 from '../images/blocks/heads-5.webp';
import type { BlocksLoot } from '../game/blocks/types';
import type { BlocksTileSetId } from '../game/blocks/tilesets';

/**
 * Single indirection point for Hoard Warehouse art. Every set fills the same six
 * slots, so swapping a set — or adding a sixth — touches only this file.
 */
const SLOT_ORDER: readonly BlocksLoot[] = ['gold', 'weapon', 'fungus', 'crystal', 'relic', 'tool'];

const TILE_SETS: Readonly<Record<BlocksTileSetId, readonly string[]>> = {
  loot: [blockGold, blockWeapon, blockFungus, blockCrystal, blockRelic, blockTool],
  heads: [heads0, heads1, heads2, heads3, heads4, heads5],
  gems: [gems0, gems1, gems2, gems3, gems4, gems5],
  brews: [brews0, brews1, brews2, brews3, brews4, brews5],
  cogs: [cogs0, cogs1, cogs2, cogs3, cogs4, cogs5],
};

export const blocksArt = {
  giver: blocksGiver,
  floor: vaultFloor,
} as const;

export function blocksTileArt(set: BlocksTileSetId, slot: BlocksLoot): string {
  const tiles = TILE_SETS[set] ?? TILE_SETS.loot;
  const index = SLOT_ORDER.indexOf(slot);
  return tiles[index < 0 ? 0 : index] ?? tiles[0];
}

/**
 * Each slot ships one painted tile, so the saved `variant` drives a mirror and
 * quarter-turn instead of a separate image. That is enough to stop a large
 * single-slot region reading as one flat repeated texture, at no asset cost.
 */
export function blocksTileTransform(variant: number): string | undefined {
  switch (((Math.floor(variant) % 4) + 4) % 4) {
    case 1: return 'scaleX(-1)';
    case 2: return 'rotate(180deg)';
    case 3: return 'scaleY(-1)';
    default: return undefined;
  }
}
