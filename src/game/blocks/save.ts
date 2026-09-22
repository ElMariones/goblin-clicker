/**
 * Trust boundary for Goblin Blocks save data.
 *
 * Rewards flow into the Warren economy, so an edited save must not be able to
 * claim an unbounded payout. Structural damage drops the run only; lifetime
 * statistics, tokens and the unlock survive, because losing a cosmetic track to
 * one corrupt board would be a worse outcome than losing the board.
 */

import { clampResource } from '../state';
import { isBlockPieceId, type BlockPieceId } from './pieces';
import { isBlocksTileSetId } from './tilesets';
import { BOARD_CELLS, BOARD_CLEAR_DOUBLE_PLACEMENTS, BOARD_SIZE, COMBO_GRACE_PLACEMENTS } from './rules';
import {
  BLOCKS_CHARGE_CAP,
  BLOCKS_MAX_REWARD_SECONDS,
  BLOCKS_MAX_TOKENS,
  BLOCKS_TOKEN_DAILY_CAP,
  BLOCKS_TRAY_SIZE,
  createInitialBlocksState,
  localDayIndex,
} from './state';
import {
  BLOCKS_LOOT_FAMILIES,
  BLOCKS_LOOT_VARIANTS,
  type BlocksCell,
  type BlocksLoot,
  type BlocksRun,
  type BlocksState,
  type BlocksTrayPiece,
} from './types';

const LOOT_FAMILIES = new Set<BlocksLoot>(BLOCKS_LOOT_FAMILIES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function integer(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

function bounded(value: unknown, max: number, fallback = 0): number {
  return Math.min(max, integer(value, fallback));
}

function sanitizeCell(raw: unknown): BlocksCell | null | undefined {
  if (raw === null || raw === undefined) return null;
  if (!isRecord(raw)) return undefined;
  const loot = raw.loot as BlocksLoot;
  if (typeof loot !== 'string' || !LOOT_FAMILIES.has(loot)) return undefined;
  return { loot, variant: bounded(raw.variant, BLOCKS_LOOT_VARIANTS - 1) };
}

function sanitizeTrayPiece(raw: unknown): BlocksTrayPiece | null | undefined {
  if (raw === null || raw === undefined) return null;
  if (!isRecord(raw) || !isBlockPieceId(raw.pieceId)) return undefined;
  const loot = raw.loot as BlocksLoot;
  return {
    pieceId: raw.pieceId,
    loot: typeof loot === 'string' && LOOT_FAMILIES.has(loot) ? loot : 'gold',
    variant: bounded(raw.variant, BLOCKS_LOOT_VARIANTS - 1),
  };
}

function sanitizeRun(raw: unknown, lastUpdateAt: number): BlocksRun | null {
  if (!isRecord(raw)) return null;

  if (!Array.isArray(raw.board) || raw.board.length !== BOARD_CELLS) return null;
  const board: (BlocksCell | null)[] = [];
  for (const rawCell of raw.board) {
    const cell = sanitizeCell(rawCell);
    if (cell === undefined) return null;
    board.push(cell);
  }

  if (!Array.isArray(raw.tray) || raw.tray.length !== BLOCKS_TRAY_SIZE) return null;
  const tray: (BlocksTrayPiece | null)[] = [];
  for (const rawPiece of raw.tray) {
    const piece = sanitizeTrayPiece(rawPiece);
    if (piece === undefined) return null;
    tray.push(piece);
  }

  const endedAt = raw.endedAt === null || raw.endedAt === undefined ? null : integer(raw.endedAt);
  // A completed set always deals a new trio, so an empty tray on a live run is
  // incoherent and the run is discarded rather than silently repaired.
  if (endedAt === null && tray.every((piece) => piece === null)) return null;

  const rawResult = isRecord(raw.result) ? raw.result : null;
  const score = clampResource(integer(raw.score));
  const result = endedAt !== null && rawResult
    ? {
      score: clampResource(integer(rawResult.score, score)),
      rewardSeconds: bounded(rawResult.rewardSeconds, BLOCKS_MAX_REWARD_SECONDS),
      dailyFactor: Math.min(1, Math.max(0, typeof rawResult.dailyFactor === 'number' && Number.isFinite(rawResult.dailyFactor) ? rawResult.dailyFactor : 0)),
      tokens: bounded(rawResult.tokens, BLOCKS_TOKEN_DAILY_CAP),
    }
    : null;
  // A finished run without a payable result carries no information worth keeping.
  if (endedAt !== null && result === null) return null;

  const previousTrayIds = Array.isArray(raw.previousTrayIds)
    ? raw.previousTrayIds.filter((id): id is BlockPieceId => isBlockPieceId(id)).slice(0, BLOCKS_TRAY_SIZE)
    : [];

  const startedAt = Math.min(integer(raw.startedAt, lastUpdateAt), Math.max(0, lastUpdateAt));
  return {
    startedAt,
    endedAt,
    // Runs saved before tile sets existed simply wear the original costume.
    tileSet: isBlocksTileSetId(raw.tileSet) ? raw.tileSet : 'loot',
    board,
    tray,
    previousTrayIds,
    setNumber: Math.max(1, integer(raw.setNumber, 1)),
    score,
    combo: bounded(raw.combo, 10_000),
    comboMisses: bounded(raw.comboMisses, COMBO_GRACE_PLACEMENTS),
    bestCombo: bounded(raw.bestCombo, 10_000),
    largestClear: bounded(raw.largestClear, BOARD_SIZE * 2),
    clearsThisSet: bounded(raw.clearsThisSet, BLOCKS_TRAY_SIZE),
    clearingPiecesThisSet: bounded(raw.clearingPiecesThisSet, BLOCKS_TRAY_SIZE),
    doubleScorePlacements: bounded(raw.doubleScorePlacements, BOARD_CLEAR_DOUBLE_PLACEMENTS),
    linesCleared: integer(raw.linesCleared),
    blocksPlaced: integer(raw.blocksPlaced),
    boardClears: integer(raw.boardClears),
    perfectSets: integer(raw.perfectSets),
    bonusTokens: bounded(raw.bonusTokens, BLOCKS_TOKEN_DAILY_CAP),
    rngSeed: integer(raw.rngSeed, 1) || 1,
    rngCounter: integer(raw.rngCounter),
    result,
  };
}

export function sanitizeBlocksState(raw: unknown, lastUpdateAt: number, warnings: string[]): BlocksState {
  const base = createInitialBlocksState(lastUpdateAt);
  if (!isRecord(raw)) return base;

  const rawStats = isRecord(raw.stats) ? raw.stats : {};
  const rawCharges = isRecord(raw.charges) ? raw.charges : {};
  const rawDaily = isRecord(raw.daily) ? raw.daily : {};

  const run = raw.run === null || raw.run === undefined ? null : sanitizeRun(raw.run, lastUpdateAt);
  if (raw.run && run === null) {
    warnings.push('A corrupt Hoard Warehouse run was discarded; warehouse records were kept.');
  }

  const lifetimeTokens = bounded(raw.lifetimeTokens, BLOCKS_MAX_TOKENS);
  const day = integer(rawDaily.day, localDayIndex(lastUpdateAt));
  return {
    unlocked: raw.unlocked === true,
    run,
    stats: {
      runs: integer(rawStats.runs),
      bestScore: clampResource(integer(rawStats.bestScore)),
      lifetimeScore: clampResource(integer(rawStats.lifetimeScore)),
      totalLines: integer(rawStats.totalLines),
      totalBlocks: integer(rawStats.totalBlocks),
      bestCombo: bounded(rawStats.bestCombo, 10_000),
      largestClear: bounded(rawStats.largestClear, BOARD_SIZE * 2),
      boardClears: integer(rawStats.boardClears),
      perfectSets: integer(rawStats.perfectSets),
    },
    tokens: Math.min(bounded(raw.tokens, BLOCKS_MAX_TOKENS), lifetimeTokens),
    lifetimeTokens,
    charges: {
      shuffle: bounded(rawCharges.shuffle, BLOCKS_CHARGE_CAP),
      hammer: bounded(rawCharges.hammer, BLOCKS_CHARGE_CAP),
    },
    daily: {
      day,
      runsFinished: integer(rawDaily.runsFinished),
      tokensEarned: bounded(rawDaily.tokensEarned, BLOCKS_TOKEN_DAILY_CAP),
    },
    tutorialSeen: raw.tutorialSeen === true,
  };
}
