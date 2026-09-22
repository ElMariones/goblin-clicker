/**
 * Goblin Blocks run lifecycle and reward contract.
 *
 * Every function here takes a `GameState` whose elapsed production has already
 * been settled — the public actions in `./engine.ts` call `tickGame` first, the
 * same way `purchaseBuilding` does. Keeping `tickGame` out of this module is
 * what lets `engine.ts` latch the unlock without an import cycle.
 */

import { getBaseCps } from '../math';
import { randomAt, seedFromTimestamp } from '../rng';
import { clampResource, creditGoblins } from '../state';
import type { GameState } from '../types';
import { localDayIndex } from './factory';
import { generatePieces } from './generator';
import { BLOCK_PIECE_BY_ID, type BlockPieceId } from './pieces';
import { BLOCKS_TILE_SETS, nextTileSet, type BlocksTileSetId } from './tilesets';
import {
  BOARD_CELLS,
  BOARD_CLEAR_DOUBLE_PLACEMENTS,
  COMBO_GRACE_PLACEMENTS,
  BOARD_CLEAR_SCORE,
  BOARD_CLEAR_TOKENS,
  PERFECT_SET_SCORE,
  PERFECT_SET_TOKENS,
  PLACEMENT_SCORE_PER_CELL,
  SET_COMPLETE_SCORE,
  SET_WITH_CLEAR_SCORE,
  clearLines,
  comboMultiplier,
  createEmptyBoard,
  findFullLines,
  hasAnyLegalPlacement,
  isBoardEmpty,
  isValidCellIndex,
  placementIndices,
  scoreForLines,
  type BlocksBoard,
} from './rules';
import {
  BLOCKS_LOOT_FAMILIES,
  BLOCKS_LOOT_VARIANTS,
  type BlocksChargeId,
  type BlocksRun,
  type BlocksState,
  type BlocksTrayPiece,
} from './types';

export const BLOCKS_TRAY_SIZE = 3;
export const BLOCKS_SCORE_PER_TOKEN = 10_000;
export const BLOCKS_TOKEN_DAILY_CAP = 50;
export const BLOCKS_MAX_REWARD_SECONDS = 600;
export const BLOCKS_CHARGE_CAP = 3;
export const BLOCKS_MAX_TOKENS = 1e9;
export const BLOCKS_CHARGE_COSTS: Record<BlocksChargeId, number> = { shuffle: 6, hammer: 10 };

/** Daily payout taper. Index is how many runs were already finished today. */
export const BLOCKS_DAILY_FACTORS = [1, 0.5, 0.25, 0.1] as const;

export { createInitialBlocksState, localDayIndex } from './factory';

export interface BlocksActionResult {
  state: GameState;
  success: boolean;
}

export interface BlocksPlacementResult extends BlocksActionResult {
  clearedLines: number;
  /** Which lines went, so the interface can animate exactly those. */
  clearedRows: number[];
  clearedColumns: number[];
  /** Board indices the piece just filled, for the placement pop. */
  placedCells: number[];
  combo: number;
  comboBroken: boolean;
  scoreGained: number;
  boardCleared: boolean;
  /** Set after the placement; differs from the previous one on a board clear. */
  tileSet: BlocksTileSetId;
  perfectSet: boolean;
  setCompleted: boolean;
  runEnded: boolean;
}

export interface BlocksCollectResult extends BlocksActionResult {
  goblins: number;
  tokens: number;
}

function withDailyReset(blocks: BlocksState, now: number): BlocksState {
  const day = localDayIndex(now);
  if (blocks.daily.day === day) return blocks;
  return { ...blocks, daily: { day, runsFinished: 0, tokensEarned: 0 } };
}

function withBlocks(state: GameState, blocks: BlocksState): GameState {
  return blocks === state.blocks ? state : { ...state, blocks };
}

/**
 * Latched the first time a Warren Den is owned. Latching matters: a Great
 * Migration zeroes every building, and the warehouse must never re-lock.
 */
export function latchBlocksUnlock(state: GameState): GameState {
  if (state.blocks.unlocked || state.buildings.warren_den <= 0) return state;
  return withBlocks(state, { ...state.blocks, unlocked: true });
}

export function isBlocksUnlocked(state: GameState): boolean {
  return state.blocks.unlocked;
}

export function isBlocksRunActive(state: GameState): boolean {
  return state.blocks.run !== null && state.blocks.run.endedAt === null;
}

export function isBlocksRunFinished(state: GameState): boolean {
  const run = state.blocks.run;
  return run !== null && run.endedAt !== null && run.result !== null;
}

/**
 * Brackets moved by the same factor as the score table, so the payout for a
 * given quality of run is exactly what it was before scores were enlarged.
 */
export function rewardSecondsForScore(score: number): number {
  if (!Number.isFinite(score) || score < 20_000) return 20;
  if (score < 50_000) return 45;
  if (score < 100_000) return 90;
  if (score < 200_000) return 180;
  if (score < 400_000) return 300;
  const extraBands = Math.floor((score - 400_000) / 200_000) + 1;
  return Math.min(BLOCKS_MAX_REWARD_SECONDS, 300 + extraBands * 60);
}

export function dailyFactorFor(runsFinishedToday: number): number {
  const index = Math.max(0, Math.floor(runsFinishedToday));
  return BLOCKS_DAILY_FACTORS[Math.min(index, BLOCKS_DAILY_FACTORS.length - 1)];
}

/**
 * Uses `getBaseCps` — production *before* temporary buffs — so a Mooncap frenzy
 * cannot be banked into an inflated puzzle payout.
 */
export function getBlocksRewardGoblins(state: GameState, seconds: number, factor: number): number {
  const safeSeconds = Math.max(0, Math.min(BLOCKS_MAX_REWARD_SECONDS, seconds));
  const safeFactor = Math.max(0, Math.min(1, factor));
  return clampResource(Math.max(safeSeconds, Math.floor(getBaseCps(state) * safeSeconds * safeFactor)));
}

function buildTrayPieces(ids: readonly BlockPieceId[], seed: number, counter: number): { pieces: BlocksTrayPiece[]; counter: number } {
  let cursor = counter;
  const pieces = ids.map((pieceId) => {
    const loot = BLOCKS_LOOT_FAMILIES[Math.floor(randomAt(seed, cursor) * BLOCKS_LOOT_FAMILIES.length) % BLOCKS_LOOT_FAMILIES.length];
    cursor += 1;
    const variant = Math.floor(randomAt(seed, cursor) * BLOCKS_LOOT_VARIANTS) % BLOCKS_LOOT_VARIANTS;
    cursor += 1;
    return { pieceId, loot, variant };
  });
  return { pieces, counter: cursor };
}

function dealTray(
  board: BlocksBoard,
  seed: number,
  counter: number,
  previousIds: readonly BlockPieceId[],
  setNumber: number,
  count = BLOCKS_TRAY_SIZE,
): { tray: BlocksTrayPiece[]; counter: number } {
  const drawn = generatePieces(board, seed, counter, count, previousIds, setNumber);
  const built = buildTrayPieces(drawn.ids, seed, drawn.counter);
  return { tray: built.pieces, counter: built.counter };
}

function trayIds(tray: readonly (BlocksTrayPiece | null)[]): (BlockPieceId | null)[] {
  return tray.map((piece) => piece?.pieceId ?? null);
}

function createRun(now: number): BlocksRun {
  const board = createEmptyBoard();
  const seed = seedFromTimestamp(now);
  const dealt = dealTray(board, seed, 0, [], 1);
  return {
    startedAt: Math.max(0, Math.floor(now)),
    endedAt: null,
    tileSet: BLOCKS_TILE_SETS[Math.floor(randomAt(seed, 9_999) * BLOCKS_TILE_SETS.length) % BLOCKS_TILE_SETS.length],
    board,
    tray: dealt.tray,
    previousTrayIds: dealt.tray.map((piece) => piece.pieceId),
    setNumber: 1,
    score: 0,
    combo: 0,
    comboMisses: 0,
    bestCombo: 0,
    largestClear: 0,
    clearsThisSet: 0,
    clearingPiecesThisSet: 0,
    doubleScorePlacements: 0,
    linesCleared: 0,
    blocksPlaced: 0,
    boardClears: 0,
    perfectSets: 0,
    bonusTokens: 0,
    rngSeed: seed,
    rngCounter: dealt.counter,
    result: null,
  };
}

/**
 * Settles a finished run: snapshots the daily factor and token award now, so a
 * player cannot stockpile finished runs and collect them all at full rate, then
 * folds the run into lifetime statistics.
 */
function endRun(blocks: BlocksState, run: BlocksRun, now: number): BlocksState {
  const current = withDailyReset(blocks, now);
  const factor = dailyFactorFor(current.daily.runsFinished);
  const rewardSeconds = rewardSecondsForScore(run.score);
  const earnable = Math.max(0, BLOCKS_TOKEN_DAILY_CAP - current.daily.tokensEarned);
  const tokens = Math.min(earnable, Math.floor(run.score / BLOCKS_SCORE_PER_TOKEN) + run.bonusTokens);
  return {
    ...current,
    run: {
      ...run,
      endedAt: Math.max(0, Math.floor(now)),
      result: { score: run.score, rewardSeconds, dailyFactor: factor, tokens },
    },
    daily: {
      ...current.daily,
      runsFinished: current.daily.runsFinished + 1,
      tokensEarned: current.daily.tokensEarned + tokens,
    },
    stats: {
      runs: current.stats.runs + 1,
      bestScore: Math.max(current.stats.bestScore, run.score),
      lifetimeScore: clampResource(current.stats.lifetimeScore + run.score),
      totalLines: current.stats.totalLines + run.linesCleared,
      totalBlocks: current.stats.totalBlocks + run.blocksPlaced,
      bestCombo: Math.max(current.stats.bestCombo, run.bestCombo),
      largestClear: Math.max(current.stats.largestClear, run.largestClear),
      boardClears: current.stats.boardClears + run.boardClears,
      perfectSets: current.stats.perfectSets + run.perfectSets,
    },
  };
}

function endRunIfStuck(blocks: BlocksState, run: BlocksRun, now: number): BlocksState {
  if (hasAnyLegalPlacement(run.board, trayIds(run.tray))) return { ...blocks, run };
  return endRun(blocks, run, now);
}

export function collectFinishedRun(state: GameState, now: number): BlocksCollectResult {
  const run = state.blocks.run;
  if (!run || run.endedAt === null || !run.result) return { state, success: false, goblins: 0, tokens: 0 };
  const goblins = getBlocksRewardGoblins(state, run.result.rewardSeconds, run.result.dailyFactor);
  const tokens = Math.max(0, Math.floor(run.result.tokens));
  const credited = creditGoblins(state, goblins);
  return {
    state: withBlocks(credited, {
      ...withDailyReset(credited.blocks, now),
      run: null,
      tokens: Math.min(BLOCKS_MAX_TOKENS, credited.blocks.tokens + tokens),
      lifetimeTokens: Math.min(BLOCKS_MAX_TOKENS, credited.blocks.lifetimeTokens + tokens),
    }),
    success: true,
    goblins,
    tokens,
  };
}

/** Starting a new run first collects any finished one, so "Play again" never drops a payout. */
export function beginRun(state: GameState, now: number): BlocksActionResult {
  if (!state.blocks.unlocked) return { state, success: false };
  const collected = isBlocksRunFinished(state) ? collectFinishedRun(state, now).state : state;
  if (collected.blocks.run !== null) return { state: collected, success: false };
  return {
    state: withBlocks(collected, { ...withDailyReset(collected.blocks, now), run: createRun(now) }),
    success: true,
  };
}

const failedPlacement = (state: GameState): BlocksPlacementResult => ({
  state,
  success: false,
  clearedLines: 0,
  clearedRows: [],
  clearedColumns: [],
  placedCells: [],
  combo: 0,
  comboBroken: false,
  scoreGained: 0,
  boardCleared: false,
  tileSet: state.blocks.run?.tileSet ?? 'loot',
  perfectSet: false,
  setCompleted: false,
  runEnded: false,
});

/**
 * The main verb. Resolves placement score, clears, combo, set bonuses, board
 * clears and the game-over check in that order, then deals a new trio when the
 * set is complete.
 */
export function applyPlacement(state: GameState, slot: number, anchorIndex: number, now: number): BlocksPlacementResult {
  const run = state.blocks.run;
  if (!run || run.endedAt !== null) return failedPlacement(state);
  if (!Number.isInteger(slot) || slot < 0 || slot >= run.tray.length) return failedPlacement(state);
  const trayPiece = run.tray[slot];
  if (!trayPiece || !isValidCellIndex(anchorIndex)) return failedPlacement(state);
  const indices = placementIndices(run.board, trayPiece.pieceId, anchorIndex);
  if (!indices) return failedPlacement(state);

  const doubleFactor = run.doubleScorePlacements > 0 ? 2 : 1;
  let board = [...run.board];
  for (const index of indices) board[index] = { loot: trayPiece.loot, variant: trayPiece.variant };

  let scoreGained = indices.length * PLACEMENT_SCORE_PER_CELL * doubleFactor;

  const lines = findFullLines(board);
  const clearedLines = lines.rows.length + lines.columns.length;
  // A chain survives a couple of dry placements. Losing six moves of combo to
  // one awkward piece punished the wrong thing.
  const comboMisses = clearedLines > 0 ? 0 : run.comboMisses + 1;
  const comboBroken = clearedLines === 0 && comboMisses >= COMBO_GRACE_PLACEMENTS;
  const combo = clearedLines > 0 ? run.combo + 1 : comboBroken ? 0 : run.combo;
  if (clearedLines > 0) {
    board = clearLines(board, lines);
    scoreGained += Math.round(scoreForLines(clearedLines) * comboMultiplier(combo)) * doubleFactor;
  }

  const boardCleared = clearedLines > 0 && isBoardEmpty(board);
  if (boardCleared) scoreGained += BOARD_CLEAR_SCORE;
  // Emptying the vault re-dresses it, so the rest of the run looks different.
  const tileSet = boardCleared ? nextTileSet(run.tileSet, run.rngSeed, run.rngCounter + 7) : run.tileSet;

  const tray = [...run.tray];
  tray[slot] = null;
  const clearsThisSet = run.clearsThisSet + (clearedLines > 0 ? 1 : 0);
  const clearingPiecesThisSet = run.clearingPiecesThisSet + (clearedLines > 0 ? 1 : 0);

  let next: BlocksRun = {
    ...run,
    board,
    tray,
    tileSet,
    combo,
    comboMisses: comboBroken ? 0 : comboMisses,
    bestCombo: Math.max(run.bestCombo, combo),
    largestClear: Math.max(run.largestClear, clearedLines),
    clearsThisSet,
    clearingPiecesThisSet,
    // The board-clear window covers the *next* three placements, so the counter
    // is spent for this one before a fresh window can be granted.
    doubleScorePlacements: boardCleared
      ? BOARD_CLEAR_DOUBLE_PLACEMENTS
      : Math.max(0, run.doubleScorePlacements - 1),
    linesCleared: run.linesCleared + clearedLines,
    blocksPlaced: run.blocksPlaced + indices.length,
    boardClears: run.boardClears + (boardCleared ? 1 : 0),
    bonusTokens: run.bonusTokens + (boardCleared ? BOARD_CLEAR_TOKENS : 0),
  };

  const setCompleted = tray.every((piece) => piece === null);
  const perfectSet = setCompleted && clearingPiecesThisSet === BLOCKS_TRAY_SIZE;
  if (setCompleted) {
    scoreGained += SET_COMPLETE_SCORE;
    if (clearsThisSet > 0) scoreGained += SET_WITH_CLEAR_SCORE;
    if (perfectSet) scoreGained += PERFECT_SET_SCORE;
    const dealt = dealTray(board, run.rngSeed, run.rngCounter, run.previousTrayIds, run.setNumber + 1);
    next = {
      ...next,
      tray: dealt.tray,
      previousTrayIds: dealt.tray.map((piece) => piece.pieceId),
      setNumber: run.setNumber + 1,
      clearsThisSet: 0,
      clearingPiecesThisSet: 0,
      perfectSets: run.perfectSets + (perfectSet ? 1 : 0),
      bonusTokens: next.bonusTokens + (perfectSet ? PERFECT_SET_TOKENS : 0),
      rngCounter: dealt.counter,
    };
  }

  next = { ...next, score: clampResource(run.score + scoreGained) };
  const blocks = endRunIfStuck(state.blocks, next, now);
  return {
    state: withBlocks(state, blocks),
    success: true,
    clearedLines,
    clearedRows: lines.rows,
    clearedColumns: lines.columns,
    placedCells: indices,
    combo,
    comboBroken,
    scoreGained,
    boardCleared,
    tileSet,
    perfectSet,
    setCompleted,
    runEnded: blocks.run !== null && blocks.run.endedAt !== null,
  };
}

/**
 * Redeals every piece the player has not yet placed this set. It draws from the
 * same generator against the same board, so it can rescue a trio but is not a
 * guaranteed survival button.
 */
export function applyShuffle(state: GameState, now: number): BlocksActionResult {
  const run = state.blocks.run;
  if (!run || run.endedAt !== null || state.blocks.charges.shuffle <= 0) return { state, success: false };
  const remaining = run.tray.reduce((count, piece) => count + (piece === null ? 0 : 1), 0);
  if (remaining === 0) return { state, success: false };

  const dealt = dealTray(run.board, run.rngSeed, run.rngCounter, run.previousTrayIds, run.setNumber, remaining);
  let cursor = 0;
  const tray = run.tray.map((piece) => (piece === null ? null : dealt.tray[cursor++] ?? piece));
  const next: BlocksRun = {
    ...run,
    tray,
    previousTrayIds: dealt.tray.map((piece) => piece.pieceId),
    rngCounter: dealt.counter,
  };
  return {
    state: withBlocks(state, endRunIfStuck({
      ...state.blocks,
      charges: { ...state.blocks.charges, shuffle: state.blocks.charges.shuffle - 1 },
    }, next, now)),
    success: true,
  };
}

/**
 * Frees one occupied cell. Removing a cell can never complete a line, so there
 * is no clear check — and a hammer that happens to empty the last cell does
 * **not** award a board clear, which would otherwise be buyable with tokens.
 */
export function applyHammer(state: GameState, cellIndex: number, now: number): BlocksActionResult {
  const run = state.blocks.run;
  if (!run || run.endedAt !== null || state.blocks.charges.hammer <= 0) return { state, success: false };
  if (!isValidCellIndex(cellIndex) || run.board[cellIndex] === null) return { state, success: false };
  const board = [...run.board];
  board[cellIndex] = null;
  return {
    state: withBlocks(state, endRunIfStuck({
      ...state.blocks,
      charges: { ...state.blocks.charges, hammer: state.blocks.charges.hammer - 1 },
    }, { ...run, board }, now)),
    success: true,
  };
}

export function applyChargePurchase(state: GameState, charge: BlocksChargeId): BlocksActionResult {
  const cost = BLOCKS_CHARGE_COSTS[charge];
  const blocks = state.blocks;
  if (cost === undefined || blocks.tokens < cost || blocks.charges[charge] >= BLOCKS_CHARGE_CAP) {
    return { state, success: false };
  }
  return {
    state: withBlocks(state, {
      ...blocks,
      tokens: blocks.tokens - cost,
      charges: { ...blocks.charges, [charge]: blocks.charges[charge] + 1 },
    }),
    success: true,
  };
}

export function markTutorialSeen(state: GameState): GameState {
  if (state.blocks.tutorialSeen) return state;
  return withBlocks(state, { ...state.blocks, tutorialSeen: true });
}

/** Cells the player could still fill, used by the interface to explain a game over. */
export function getBlocksOccupancy(board: BlocksBoard): number {
  let filled = 0;
  for (const cell of board) if (cell !== null) filled += 1;
  return filled / BOARD_CELLS;
}

export function getBlocksPieceCellCount(pieceId: BlockPieceId): number {
  return BLOCK_PIECE_BY_ID[pieceId]?.cells.length ?? 0;
}
