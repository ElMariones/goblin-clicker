/**
 * Controlled-random piece generation.
 *
 * Pure random draws produce runs that die for reasons the player cannot learn
 * from. The generator therefore reads the board before drawing, and rejects
 * pathological trios — but its liveness guarantee is deliberately narrow: the
 * player is guaranteed *one* legal move, never a survivable set. Deaths come
 * from the board the player built.
 *
 * Every draw goes through `randomAt(seed, counter)`, so a run replays exactly
 * from its save.
 */

import { randomAt } from '../rng';
import { BLOCK_PIECES, BLOCK_PIECE_BY_ID, type BlockPieceDefinition, type BlockPieceId } from './pieces';
import { BOARD_CELLS, canPlaceAnywhere, countOccupied, type BlocksBoard } from './rules';
import type { BlocksDifficulty } from './pieces';

const MAX_TRIO_ATTEMPTS = 12;
/** Beyond this many sets the generator leans very slightly harder, so even expert runs end. */
const RUN_PRESSURE_START_SET = 15;
const MAX_RUN_PRESSURE = 0.35;

export interface GeneratedPieces {
  ids: BlockPieceId[];
  counter: number;
}

function difficultyScale(occupancy: number, setNumber: number): Record<BlocksDifficulty, number> {
  const clamped = Math.min(1, Math.max(0, occupancy));
  let hard = Math.min(1.1, Math.max(0.2, 1.1 - clamped * 1.1));
  if (setNumber > RUN_PRESSURE_START_SET) {
    hard *= 1 + Math.min(MAX_RUN_PRESSURE, (setNumber - RUN_PRESSURE_START_SET) * 0.01);
  }
  return { easy: 1 + clamped * 0.8, medium: 1, hard };
}

interface WeightedPiece {
  piece: BlockPieceDefinition;
  weight: number;
}

function buildPool(board: BlocksBoard, setNumber: number): { pool: WeightedPiece[]; total: number } {
  const scale = difficultyScale(countOccupied(board) / BOARD_CELLS, setNumber);
  let total = 0;
  const pool = BLOCK_PIECES.map((piece) => {
    const weight = piece.weight * scale[piece.difficulty];
    total += weight;
    return { piece, weight };
  });
  return { pool, total };
}

function drawFromPool(pool: readonly WeightedPiece[], total: number, roll: number): BlockPieceId {
  let remaining = roll * total;
  for (const entry of pool) {
    remaining -= entry.weight;
    if (remaining <= 0) return entry.piece.id;
  }
  return pool[pool.length - 1].piece.id;
}

function hardCount(ids: readonly BlockPieceId[]): number {
  return ids.filter((id) => BLOCK_PIECE_BY_ID[id].difficulty === 'hard').length;
}

function isSameSet(a: readonly BlockPieceId[], b: readonly BlockPieceId[]): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((id, index) => id === sortedB[index]);
}

/**
 * Draws `count` pieces for the given board.
 *
 * Rejects a candidate set when two or more pieces are hard, when it repeats the
 * previous set exactly, or when not one of its pieces fits. After
 * `MAX_TRIO_ATTEMPTS` it falls back to seeding slot 0 with the heaviest piece
 * that does fit and drawing the rest freely — the board can never be completely
 * full (a full board always completes lines), so the fallback always succeeds.
 */
export function generatePieces(
  board: BlocksBoard,
  seed: number,
  counter: number,
  count: number,
  previousIds: readonly BlockPieceId[],
  setNumber: number,
): GeneratedPieces {
  const wanted = Math.max(1, Math.floor(count));
  const { pool, total } = buildPool(board, setNumber);
  let cursor = Math.max(0, Math.floor(counter));

  for (let attempt = 0; attempt < MAX_TRIO_ATTEMPTS; attempt += 1) {
    const ids: BlockPieceId[] = [];
    for (let slot = 0; slot < wanted; slot += 1) {
      ids.push(drawFromPool(pool, total, randomAt(seed, cursor)));
      cursor += 1;
    }
    if (hardCount(ids) >= 2) continue;
    if (isSameSet(ids, previousIds)) continue;
    if (!ids.some((id) => canPlaceAnywhere(board, id))) continue;
    return { ids, counter: cursor };
  }

  const fitting = pool
    .filter((entry) => canPlaceAnywhere(board, entry.piece.id))
    .sort((a, b) => b.weight - a.weight);
  const softPool = pool.filter((entry) => entry.piece.difficulty !== 'hard');
  const softTotal = softPool.reduce((sum, entry) => sum + entry.weight, 0);
  const ids: BlockPieceId[] = [];
  if (fitting.length > 0) ids.push(fitting[0].piece.id);
  while (ids.length < wanted) {
    // The fallback still honours the one-hard-piece rule, so a rescued set is
    // never harsher than one the main loop would have accepted.
    const capped = hardCount(ids) >= 1;
    ids.push(drawFromPool(capped ? softPool : pool, capped ? softTotal : total, randomAt(seed, cursor)));
    cursor += 1;
  }
  return { ids: ids.slice(0, wanted), counter: cursor };
}
