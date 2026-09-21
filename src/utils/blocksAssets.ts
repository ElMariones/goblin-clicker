import blockCrystal from '../images/blocks/block-crystal.webp';
import blockFungus from '../images/blocks/block-fungus.webp';
import blockGold from '../images/blocks/block-gold.webp';
import blockRelic from '../images/blocks/block-relic.webp';
import blockTool from '../images/blocks/block-tool.webp';
import blockWeapon from '../images/blocks/block-weapon.webp';
import blocksGiver from '../images/blocks/blocks-giver.webp';
import vaultFloor from '../images/blocks/vault-floor.webp';
import type { BlocksLoot } from '../game/blocks/types';

/**
 * Single indirection point for Hoard Warehouse art. Swapping in a new painted
 * set — or adding a second board skin — touches only this file.
 */
const LOOT_TILE_ART: Readonly<Record<BlocksLoot, string>> = {
  gold: blockGold,
  weapon: blockWeapon,
  fungus: blockFungus,
  crystal: blockCrystal,
  relic: blockRelic,
  tool: blockTool,
};

export const blocksArt = {
  giver: blocksGiver,
  floor: vaultFloor,
} as const;

export function blocksTileArt(loot: BlocksLoot): string {
  return LOOT_TILE_ART[loot] ?? blockGold;
}

/**
 * Each family ships one painted crate, so the saved `variant` drives a mirror
 * and quarter-turn instead of a separate image. That is enough to stop a large
 * single-family region reading as one flat repeated texture, at no asset cost.
 */
export function blocksTileTransform(variant: number): string | undefined {
  switch (((Math.floor(variant) % 4) + 4) % 4) {
    case 1: return 'scaleX(-1)';
    case 2: return 'rotate(180deg)';
    case 3: return 'scaleY(-1)';
    default: return undefined;
  }
}
