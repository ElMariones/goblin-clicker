/**
 * Pure board rules for Goblin Blocks.
 *
 * Nothing here reads the clock, calls `Math.random`, or touches `GameState`.
 * That separation is what makes the whole ruleset exhaustively testable, and it
 * keeps the puzzle reproducible from a save's stored seed.
 */

import { BLOCK_PIECE_BY_ID, type BlockPieceDefinition, type BlockPieceId } from './pieces';
import type { BlocksCell } from './types';

export const BOARD_SIZE = 8;
export const BOARD_CELLS = BOARD_SIZE * BOARD_SIZE;

export type BlocksBoard = readonly (BlocksCell | null)[];

/** Score per occupied cell placed, before any board-clear doubling. */
export const PLACEMENT_SCORE_PER_CELL = 10;
export const BOARD_CLEAR_SCORE = 2_500;
export const BOARD_CLEAR_DOUBLE_PLACEMENTS = 3;
export const BOARD_CLEAR_TOKENS = 3;
export const SET_COMPLETE_SCORE = 50;
export const SET_WITH_CLEAR_SCORE = 100;
export const PERFECT_SET_SCORE = 500;
export const PERFECT_SET_TOKENS = 1;
export const MAX_COMBO_MULTIPLIER = 5;

/** Index 0 is unused; six is the most lines a single placement can complete. */
const LINE_CLEAR_BASE = [0, 100, 250, 450, 700, 1_000] as const;

export function createEmptyBoard(): (BlocksCell | null)[] {
  return Array.from({ length: BOARD_CELLS }, () => null);
}

export function cellIndex(x: number, y: number): number {
  return y * BOARD_SIZE + x;
}

export function cellColumn(index: number): number {
  return index % BOARD_SIZE;
}

export function cellRow(index: number): number {
  return Math.floor(index / BOARD_SIZE);
}

export function isValidCellIndex(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value < BOARD_CELLS;
}

/**
 * Board indices a piece would occupy anchored at `anchorIndex`, or `null` when
 * the placement is illegal. Returning the indices rather than a boolean lets the
 * caller place without recomputing the geometry.
 */
export function placementIndices(board: BlocksBoard, pieceId: BlockPieceId, anchorIndex: number): number[] | null {
  const piece: BlockPieceDefinition | undefined = BLOCK_PIECE_BY_ID[pieceId];
  if (!piece || !isValidCellIndex(anchorIndex)) return null;
  const anchorX = cellColumn(anchorIndex);
  const anchorY = cellRow(anchorIndex);
  if (anchorX + piece.width > BOARD_SIZE || anchorY + piece.height > BOARD_SIZE) return null;
  const indices: number[] = [];
  for (const [dx, dy] of piece.cells) {
    const index = cellIndex(anchorX + dx, anchorY + dy);
    if (board[index] !== null) return null;
    indices.push(index);
  }
  return indices;
}

export function canPlace(board: BlocksBoard, pieceId: BlockPieceId, anchorIndex: number): boolean {
  return placementIndices(board, pieceId, anchorIndex) !== null;
}

export function canPlaceAnywhere(board: BlocksBoard, pieceId: BlockPieceId): boolean {
  for (let index = 0; index < BOARD_CELLS; index += 1) {
    if (placementIndices(board, pieceId, index) !== null) return true;
  }
  return false;
}

/**
 * The run continues while *any* remaining piece fits. One unplaceable piece is
 * never fatal: if the 3x3 has nowhere to go but the 1x1 does, play goes on.
 */
export function hasAnyLegalPlacement(board: BlocksBoard, pieceIds: readonly (BlockPieceId | null)[]): boolean {
  return pieceIds.some((pieceId) => pieceId !== null && canPlaceAnywhere(board, pieceId));
}

export interface FullLines {
  rows: number[];
  columns: number[];
}

/**
 * Scans the whole board rather than only the lines the piece touched. At 64
 * cells the difference is unmeasurable, and a full scan cannot drift out of
 * sync with a future rule that fills cells some other way (the hammer, say).
 */
export function findFullLines(board: BlocksBoard): FullLines {
  const rows: number[] = [];
  const columns: number[] = [];
  for (let y = 0; y < BOARD_SIZE; y += 1) {
    let full = true;
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      if (board[cellIndex(x, y)] === null) { full = false; break; }
    }
    if (full) rows.push(y);
  }
  for (let x = 0; x < BOARD_SIZE; x += 1) {
    let full = true;
    for (let y = 0; y < BOARD_SIZE; y += 1) {
      if (board[cellIndex(x, y)] === null) { full = false; break; }
    }
    if (full) columns.push(x);
  }
  return { rows, columns };
}

/** Clears every listed row and column at once; an intersection clears once. */
export function clearLines(board: BlocksBoard, lines: FullLines): (BlocksCell | null)[] {
  const next = [...board];
  for (const y of lines.rows) {
    for (let x = 0; x < BOARD_SIZE; x += 1) next[cellIndex(x, y)] = null;
  }
  for (const x of lines.columns) {
    for (let y = 0; y < BOARD_SIZE; y += 1) next[cellIndex(x, y)] = null;
  }
  return next;
}

export function countOccupied(board: BlocksBoard): number {
  let total = 0;
  for (const cell of board) if (cell !== null) total += 1;
  return total;
}

export function isBoardEmpty(board: BlocksBoard): boolean {
  return countOccupied(board) === 0;
}

/**
 * The gap between four separate single clears (400) and a genuine quad (700) is
 * the whole reason to engineer multi-line placements instead of clearing greedily.
 */
export function scoreForLines(lines: number): number {
  if (!Number.isFinite(lines) || lines <= 0) return 0;
  const count = Math.floor(lines);
  if (count < LINE_CLEAR_BASE.length) return LINE_CLEAR_BASE[count];
  return LINE_CLEAR_BASE[LINE_CLEAR_BASE.length - 1] + (count - (LINE_CLEAR_BASE.length - 1)) * 350;
}

/**
 * `combo` is the number of consecutive clearing placements including this one,
 * so the first clear of a chain is x1.00 and the second x1.15. Capped so a single
 * extraordinary run cannot run away with the reward brackets.
 */
export function comboMultiplier(combo: number): number {
  if (!Number.isFinite(combo) || combo <= 1) return 1;
  return Math.min(MAX_COMBO_MULTIPLIER, 1 + (Math.floor(combo) - 1) * 0.15);
}
