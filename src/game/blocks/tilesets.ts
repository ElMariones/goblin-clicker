/**
 * Tile sets.
 *
 * Every set has the same six slots, so a set is purely a change of costume: the
 * geometry the player reads is untouched. Emptying the vault rotates the
 * warehouse onto a different set, which is the reward for a board clear that
 * keeps showing up for the rest of the run.
 */

import { randomAt } from '../rng';

export type BlocksTileSetId = 'loot' | 'heads' | 'gems' | 'brews' | 'cogs';

export const BLOCKS_TILE_SETS: readonly BlocksTileSetId[] = ['loot', 'heads', 'gems', 'brews', 'cogs'];

const TILE_SET_IDS = new Set<BlocksTileSetId>(BLOCKS_TILE_SETS);

export function isBlocksTileSetId(value: unknown): value is BlocksTileSetId {
  return typeof value === 'string' && TILE_SET_IDS.has(value as BlocksTileSetId);
}

/** Always a different set, so a board clear visibly changes the vault. */
export function nextTileSet(current: BlocksTileSetId, seed: number, counter: number): BlocksTileSetId {
  const others = BLOCKS_TILE_SETS.filter((id) => id !== current);
  if (others.length === 0) return current;
  const index = Math.floor(randomAt(seed, counter) * others.length) % others.length;
  return others[index];
}
