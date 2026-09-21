import { describe, expect, it } from 'vitest';
// Read through Vite's `?raw` loader rather than node:fs, so the suite needs no
// Node type surface and runs the same way the app bundles these modules.
import generatorSource from './generator.ts?raw';
import piecesSource from './pieces.ts?raw';
import rulesSource from './rules.ts?raw';
import { performPrestigeReset } from '../engine';
import { getBaseCps } from '../math';
import { randomAt } from '../rng';
import { deserializeGame, serializeGame } from '../save';
import { createInitialGameState } from '../state';
import type { GameState } from '../types';
import {
  BLOCKS_CHARGE_COSTS,
  BLOCKS_DAILY_FACTORS,
  BLOCKS_MAX_REWARD_SECONDS,
  BLOCKS_TOKEN_DAILY_CAP,
  applyChargePurchase,
  applyHammer,
  applyPlacement,
  applyShuffle,
  beginRun,
  collectFinishedRun,
  dailyFactorFor,
  getBlocksRewardGoblins,
  rewardSecondsForScore,
} from './state';
import { generatePieces } from './generator';
import { BLOCK_PIECES, BLOCK_PIECE_BY_ID, type BlockPieceId } from './pieces';
import {
  BOARD_CELLS,
  BOARD_SIZE,
  canPlace,
  cellIndex,
  comboMultiplier,
  createEmptyBoard,
  hasAnyLegalPlacement,
  scoreForLines,
} from './rules';
import type { BlocksCell, BlocksRun } from './types';

const START = 1_700_000_000_000;

function boardFrom(rows: readonly string[]): (BlocksCell | null)[] {
  const board = createEmptyBoard();
  rows.forEach((row, y) => {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      if (row[x] === 'X') board[cellIndex(x, y)] = { loot: 'gold', variant: 0 };
    }
  });
  return board;
}

function checkerboard(): (BlocksCell | null)[] {
  const board = createEmptyBoard();
  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      if ((x + y) % 2 === 1) board[cellIndex(x, y)] = { loot: 'gold', variant: 0 };
    }
  }
  return board;
}

function makeRun(board: (BlocksCell | null)[], tray: readonly (BlockPieceId | null)[], overrides: Partial<BlocksRun> = {}): BlocksRun {
  return {
    startedAt: START,
    endedAt: null,
    board,
    tray: tray.map((pieceId) => (pieceId === null ? null : { pieceId, loot: 'gold' as const, variant: 0 })),
    previousTrayIds: [],
    setNumber: 1,
    score: 0,
    combo: 0,
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
    rngSeed: 12_345,
    rngCounter: 0,
    result: null,
    ...overrides,
  };
}

function warehouse(run: BlocksRun | null, patch: Partial<GameState['blocks']> = {}): GameState {
  const state = createInitialGameState(START, 7);
  state.buildings.warren_den = 4;
  state.blocks = { ...state.blocks, unlocked: true, run, ...patch };
  return state;
}

describe('gate 1 — placement legality', () => {
  it('refuses overlaps and leaves the board byte-identical', () => {
    const board = boardFrom(['XX......']);
    const state = warehouse(makeRun(board, ['square2', 'dot', 'dot']));
    const result = applyPlacement(state, 0, cellIndex(0, 0), START);
    expect(result.success).toBe(false);
    expect(result.state).toBe(state);
    expect(result.state.blocks.run?.board).toEqual(board);
  });

  it('refuses a piece that would leave the board', () => {
    const empty = createEmptyBoard();
    expect(canPlace(empty, 'h5', cellIndex(4, 0))).toBe(false);
    expect(canPlace(empty, 'h5', cellIndex(3, 0))).toBe(true);
    expect(canPlace(empty, 'v5', cellIndex(0, 4))).toBe(false);
    expect(canPlace(empty, 'square3', cellIndex(6, 6))).toBe(false);
  });

  it('rejects a slot that has already been placed this set', () => {
    const state = warehouse(makeRun(createEmptyBoard(), [null, 'dot', 'dot']));
    expect(applyPlacement(state, 0, 0, START).success).toBe(false);
  });
});

describe('gate 2 — simultaneous clears', () => {
  it('clears two rows and a column at once and pays the triple band', () => {
    const board = boardFrom([
      'XXXXXXX.',
      'XXXXXXX.',
      '.......X',
      '.......X',
      'X......X',
      '.......X',
      '.......X',
      '.......X',
    ]);
    const state = warehouse(makeRun(board, ['v2', 'dot', 'dot']));
    const result = applyPlacement(state, 0, cellIndex(7, 0), START);

    expect(result.success).toBe(true);
    expect(result.clearedLines).toBe(3);
    // 2 cells placed (20) + the triple band at combo x1 (450).
    expect(result.scoreGained).toBe(20 + scoreForLines(3));
    expect(result.scoreGained).toBeGreaterThan(20 + 4 * scoreForLines(1));
    const next = result.state.blocks.run!;
    expect(next.board[cellIndex(0, 4)]).not.toBeNull();
    expect(next.board.filter((cell) => cell !== null)).toHaveLength(1);
  });
});

describe('gate 3 — combo arithmetic', () => {
  it('steps by 0.15 per consecutive clear and caps at 5', () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(1)).toBe(1);
    expect(comboMultiplier(2)).toBeCloseTo(1.15, 10);
    expect(comboMultiplier(3)).toBeCloseTo(1.3, 10);
    expect(comboMultiplier(10)).toBeCloseTo(2.35, 10);
    expect(comboMultiplier(28)).toBe(5);
    expect(comboMultiplier(1_000)).toBe(5);
  });

  it('builds across consecutive clearing placements and resets on a dry one', () => {
    // Rows 0 and 1 each need their last cell. The stray cell on row 5 keeps the
    // board from emptying, which would otherwise fire a board clear instead.
    let state = warehouse(makeRun(
      boardFrom(['XXXXXXX.', 'XXXXXXX.', '', '', '', 'X.......']),
      ['dot', 'dot', 'dot'],
    ));

    const first = applyPlacement(state, 0, cellIndex(7, 0), START);
    expect(first.combo).toBe(1);
    expect(first.scoreGained).toBe(10 + scoreForLines(1));

    state = first.state;
    const second = applyPlacement(state, 1, cellIndex(7, 1), START);
    expect(second.combo).toBe(2);
    expect(second.scoreGained).toBe(10 + Math.round(scoreForLines(1) * 1.15));

    state = second.state;
    const third = applyPlacement(state, 2, cellIndex(0, 3), START);
    expect(third.clearedLines).toBe(0);
    expect(third.combo).toBe(0);
    expect(third.state.blocks.run?.bestCombo).toBe(2);
  });
});

describe('gate 4 — perfect set', () => {
  it('pays the perfect-set bonus and a token only when all three pieces clear', () => {
    const board = boardFrom(['XXXXXXX.', 'XXXXXXX.', 'XXXXXXX.', '', '', 'X.......']);
    const state = warehouse(makeRun(board, ['dot', 'dot', 'dot']));
    const first = applyPlacement(state, 0, cellIndex(7, 0), START);
    const second = applyPlacement(first.state, 1, cellIndex(7, 1), START);
    const third = applyPlacement(second.state, 2, cellIndex(7, 2), START);

    expect(third.perfectSet).toBe(true);
    expect(third.setCompleted).toBe(true);
    const run = third.state.blocks.run!;
    expect(run.perfectSets).toBe(1);
    expect(run.bonusTokens).toBe(1);
    // Placement 10 + clear at x1.30 + set 50 + set-with-clear 100 + perfect 500.
    expect(third.scoreGained).toBe(10 + Math.round(scoreForLines(1) * 1.3) + 50 + 100 + 500);
  });

  it('pays neither when only two of the three pieces clear', () => {
    const board = boardFrom(['XXXXXXX.', 'XXXXXXX.', '', '', '', 'X.......']);
    const state = warehouse(makeRun(board, ['dot', 'dot', 'dot']));
    const first = applyPlacement(state, 0, cellIndex(7, 0), START);
    const second = applyPlacement(first.state, 1, cellIndex(7, 1), START);
    const third = applyPlacement(second.state, 2, cellIndex(2, 5), START);

    expect(third.perfectSet).toBe(false);
    expect(third.state.blocks.run?.bonusTokens).toBe(0);
    // Set complete (50) plus at-least-one-clear (100), but no perfect bonus.
    expect(third.scoreGained).toBe(10 + 50 + 100);
  });
});

describe('gate 5 — board clear', () => {
  it('pays 2,500 with three tokens and doubles exactly the next three placements', () => {
    const state = warehouse(makeRun(boardFrom(['XXXXXXX.']), ['dot', 'h2', 'h3']));
    const cleared = applyPlacement(state, 0, cellIndex(7, 0), START);

    expect(cleared.boardCleared).toBe(true);
    expect(cleared.scoreGained).toBe(10 + scoreForLines(1) + 2_500);
    expect(cleared.state.blocks.run?.bonusTokens).toBe(3);
    expect(cleared.state.blocks.run?.doubleScorePlacements).toBe(3);

    const second = applyPlacement(cleared.state, 1, cellIndex(0, 4), START);
    expect(second.scoreGained).toBe(2 * 10 * 2);
    const third = applyPlacement(second.state, 2, cellIndex(0, 6), START);
    // Still doubled, plus the set bonus (50) and the at-least-one-clear bonus
    // (100), which the board-clearing first placement earned for this set.
    expect(third.scoreGained).toBe(3 * 10 * 2 + 50 + 100);

    const run = third.state.blocks.run!;
    expect(run.doubleScorePlacements).toBe(1);
    const fourth = applyPlacement({ ...third.state }, 0, findFreeAnchor(run, 0), START);
    expect(fourth.success).toBe(true);
    expect(fourth.state.blocks.run?.doubleScorePlacements).toBe(0);
  });
});

function findFreeAnchor(run: BlocksRun, slot: number): number {
  const pieceId = run.tray[slot]!.pieceId;
  for (let index = 0; index < BOARD_CELLS; index += 1) {
    if (canPlace(run.board, pieceId, index)) return index;
  }
  throw new Error('no legal anchor for the test fixture');
}

describe('gate 6 — game over is exact', () => {
  it('continues while any single piece still fits', () => {
    const board = checkerboard();
    expect(hasAnyLegalPlacement(board, ['square3', 'h2', 'dot'])).toBe(true);
    expect(hasAnyLegalPlacement(board, ['square3', 'h2', 'v2'])).toBe(false);
    expect(hasAnyLegalPlacement(board, [null, null, null])).toBe(false);
  });

  it('ends the run the moment the remaining pieces have nowhere to go', () => {
    const state = warehouse(makeRun(checkerboard(), ['dot', 'h2', 'v2']));
    const result = applyPlacement(state, 0, cellIndex(0, 0), START);

    expect(result.success).toBe(true);
    expect(result.clearedLines).toBe(0);
    expect(result.runEnded).toBe(true);
    expect(result.state.blocks.run?.result).not.toBeNull();
    expect(result.state.blocks.stats.runs).toBe(1);
  });

  it('does not end the run while an unplaceable piece sits beside a placeable one', () => {
    const state = warehouse(makeRun(checkerboard(), ['square3', 'dot', 'dot']));
    const result = applyPlacement(state, 1, cellIndex(0, 0), START);
    expect(result.runEnded).toBe(false);
  });
});

describe('gate 7 — generator liveness', () => {
  it('always offers a legal move and never two hard pieces, across 2,000 seeded boards', () => {
    for (let trial = 0; trial < 2_000; trial += 1) {
      const seed = 1_000 + trial * 7;
      const board = createEmptyBoard();
      // Fill a pseudo-random subset, biased towards crowded boards where the
      // generator has to work hardest.
      const density = 0.25 + (trial % 60) / 100;
      for (let index = 0; index < BOARD_CELLS; index += 1) {
        if (randomAt(seed, index) < density) board[index] = { loot: 'gold', variant: 0 };
      }
      // Real play can never fill the board — a full board always completes
      // lines — so give the synthetic fixture the same guarantee.
      if (!board.includes(null)) board[trial % BOARD_CELLS] = null;
      const setNumber = 1 + (trial % 40);
      const { ids } = generatePieces(board, seed, trial, 3, [], setNumber);

      expect(ids).toHaveLength(3);
      expect(ids.some((id) => BLOCK_PIECES.some((piece) => piece.id === id))).toBe(true);
      expect(hasAnyLegalPlacement(board, ids)).toBe(true);
      expect(ids.filter((id) => BLOCK_PIECE_BY_ID[id].difficulty === 'hard').length).toBeLessThan(2);
    }
  });

  it('does not repeat the previous trio', () => {
    const board = createEmptyBoard();
    const first = generatePieces(board, 99, 0, 3, [], 1);
    const second = generatePieces(board, 99, first.counter, 3, first.ids, 1);
    expect([...second.ids].sort().join()).not.toBe([...first.ids].sort().join());
  });
});

describe('gate 8 — determinism', () => {
  const script: [number, number][] = [[0, 0], [1, 24], [2, 40]];

  function replay(): GameState {
    let state = beginRun(warehouse(null), START).state;
    for (const [slot, anchor] of script) {
      const run = state.blocks.run;
      if (!run || run.endedAt !== null) break;
      const piece = run.tray[slot];
      if (!piece || !canPlace(run.board, piece.pieceId, anchor)) continue;
      state = applyPlacement(state, slot, anchor, START).state;
    }
    return state;
  }

  it('produces an identical board, score and tray from the same seed and inputs', () => {
    const a = replay();
    const b = replay();
    expect(a.blocks.run?.board).toEqual(b.blocks.run?.board);
    expect(a.blocks.run?.score).toBe(b.blocks.run?.score);
    expect(a.blocks.run?.tray).toEqual(b.blocks.run?.tray);
    expect(a.blocks.run?.rngCounter).toBe(b.blocks.run?.rngCounter);
  });
});

describe('gate 9 — reward bounds', () => {
  it('maps score brackets to seconds and never exceeds the ceiling', () => {
    expect(rewardSecondsForScore(0)).toBe(20);
    expect(rewardSecondsForScore(1_999)).toBe(20);
    expect(rewardSecondsForScore(2_000)).toBe(45);
    expect(rewardSecondsForScore(5_000)).toBe(90);
    expect(rewardSecondsForScore(10_000)).toBe(180);
    expect(rewardSecondsForScore(20_000)).toBe(300);
    expect(rewardSecondsForScore(40_000)).toBe(360);
    expect(rewardSecondsForScore(Number.MAX_VALUE)).toBe(BLOCKS_MAX_REWARD_SECONDS);
    expect(rewardSecondsForScore(Number.POSITIVE_INFINITY)).toBeLessThanOrEqual(BLOCKS_MAX_REWARD_SECONDS);
  });

  it('tapers the production payout across four runs in one day', () => {
    expect([0, 1, 2, 3, 9].map(dailyFactorFor)).toEqual([1, 0.5, 0.25, 0.1, 0.1]);
    expect(BLOCKS_DAILY_FACTORS[0]).toBe(1);
  });

  it('pays base production seconds, ignoring temporary buffs', () => {
    const state = warehouse(null);
    const baseCps = getBaseCps(state);
    expect(baseCps).toBeGreaterThan(0);
    expect(getBlocksRewardGoblins(state, 90, 0.5)).toBe(Math.floor(baseCps * 90 * 0.5));
    // A tiny warren still gets a floor equal to the seconds awarded.
    const tiny = createInitialGameState(START, 7);
    expect(getBlocksRewardGoblins(tiny, 90, 1)).toBe(90);
  });

  it('stops awarding tokens once the daily cap is reached', () => {
    const state = warehouse(
      makeRun(checkerboard(), ['dot', 'h2', 'v2'], { score: 400_000 }),
      { daily: { day: 0, runsFinished: 0, tokensEarned: 0 } },
    );
    const ended = applyPlacement(state, 0, cellIndex(0, 0), START);
    expect(ended.runEnded).toBe(true);
    expect(ended.state.blocks.run?.result?.tokens).toBe(BLOCKS_TOKEN_DAILY_CAP);
    expect(ended.state.blocks.daily.tokensEarned).toBe(BLOCKS_TOKEN_DAILY_CAP);

    const collected = collectFinishedRun(ended.state, START);
    expect(collected.tokens).toBe(BLOCKS_TOKEN_DAILY_CAP);
    expect(collected.state.blocks.tokens).toBe(BLOCKS_TOKEN_DAILY_CAP);
    expect(collected.state.blocks.run).toBeNull();
    expect(collected.state.goblins).toBeGreaterThan(0);
  });
});

describe('gate 10 — save round trip', () => {
  it('restores a mid-run board, tray and counters exactly', () => {
    const state = applyPlacement(beginRun(warehouse(null), START).state, 0, 0, START).state;
    expect(state.blocks.run).not.toBeNull();
    const restored = deserializeGame(serializeGame(state, START), START).state;
    expect(restored.blocks.run).toEqual(state.blocks.run);
    expect(restored.blocks.stats).toEqual(state.blocks.stats);
  });

  it('gives a schema 6 save a fresh warehouse without warning', () => {
    const legacy = JSON.parse(serializeGame(warehouse(null), START)) as Record<string, unknown>;
    legacy.version = 6;
    (legacy.state as Record<string, unknown>).version = 6;
    delete (legacy.state as Record<string, unknown>).blocks;

    const result = deserializeGame(JSON.stringify(legacy), START);
    expect(result.state.blocks.run).toBeNull();
    expect(result.state.blocks.tokens).toBe(0);
    expect(result.warnings.some((warning) => warning.includes('Warehouse'))).toBe(false);
  });

  it('drops a corrupt run but keeps lifetime records and tokens', () => {
    const state = warehouse(makeRun(createEmptyBoard(), ['dot', 'h2', 'v2']), { tokens: 12, lifetimeTokens: 30 });
    state.blocks.stats = { ...state.blocks.stats, runs: 5, bestScore: 9_000 };
    const raw = JSON.parse(serializeGame(state, START)) as { state: { blocks: { run: { board: unknown[] } } } };
    raw.state.blocks.run.board = raw.state.blocks.run.board.slice(0, 63);

    const result = deserializeGame(JSON.stringify(raw), START);
    expect(result.state.blocks.run).toBeNull();
    expect(result.state.blocks.stats.runs).toBe(5);
    expect(result.state.blocks.stats.bestScore).toBe(9_000);
    expect(result.state.blocks.tokens).toBe(12);
    expect(result.warnings.some((warning) => warning.includes('Hoard Warehouse'))).toBe(true);
  });

  it('bounds a hand-edited payout to the design ceiling', () => {
    const ended = applyPlacement(
      warehouse(makeRun(checkerboard(), ['dot', 'h2', 'v2'], { score: 5_000 })),
      0,
      cellIndex(0, 0),
      START,
    ).state;
    const raw = JSON.parse(serializeGame(ended, START)) as {
      state: { blocks: { run: { result: { rewardSeconds: number; dailyFactor: number; tokens: number } } } };
    };
    raw.state.blocks.run.result = { rewardSeconds: 99_999, dailyFactor: 50, tokens: 99_999 };

    const restored = deserializeGame(JSON.stringify(raw), START).state;
    expect(restored.blocks.run?.result?.rewardSeconds).toBe(BLOCKS_MAX_REWARD_SECONDS);
    expect(restored.blocks.run?.result?.dailyFactor).toBe(1);
    expect(restored.blocks.run?.result?.tokens).toBe(BLOCKS_TOKEN_DAILY_CAP);
  });
});

describe('gate 11 — prestige', () => {
  it('leaves the warehouse, its records and an in-progress run untouched', () => {
    const state = warehouse(makeRun(boardFrom(['XX......']), ['dot', 'h2', 'v2']), { tokens: 40, lifetimeTokens: 40 });
    state.buildings.brood_matron = 500;
    state.lifetimeGoblins = 1e14;
    state.runGoblins = 1e14;
    state.goblins = 1e14;

    const result = performPrestigeReset(state, START + 1_000);
    expect(result.success).toBe(true);
    expect(result.state.buildings.warren_den).toBe(0);
    expect(result.state.blocks.unlocked).toBe(true);
    expect(result.state.blocks.tokens).toBe(40);
    expect(result.state.blocks.run).toEqual(state.blocks.run);
  });
});

describe('charges', () => {
  it('buys within the cap and spends tokens', () => {
    const state = warehouse(null, { tokens: 100 });
    const bought = applyChargePurchase(state, 'shuffle');
    expect(bought.success).toBe(true);
    expect(bought.state.blocks.tokens).toBe(100 - BLOCKS_CHARGE_COSTS.shuffle);
    expect(bought.state.blocks.charges.shuffle).toBe(1);

    let capped = bought.state;
    capped = applyChargePurchase(capped, 'shuffle').state;
    capped = applyChargePurchase(capped, 'shuffle').state;
    expect(capped.blocks.charges.shuffle).toBe(3);
    expect(applyChargePurchase(capped, 'shuffle').success).toBe(false);
  });

  it('refuses a charge the player cannot afford', () => {
    expect(applyChargePurchase(warehouse(null, { tokens: 1 }), 'hammer').success).toBe(false);
  });

  it('shuffle redeals only the unplaced slots and spends one charge', () => {
    const state = warehouse(
      makeRun(createEmptyBoard(), [null, 'square3', 'h5']),
      { charges: { shuffle: 1, hammer: 0 } },
    );
    const result = applyShuffle(state, START);
    expect(result.success).toBe(true);
    const tray = result.state.blocks.run!.tray;
    expect(tray[0]).toBeNull();
    expect(tray[1]).not.toBeNull();
    expect(tray[2]).not.toBeNull();
    expect(result.state.blocks.charges.shuffle).toBe(0);
  });

  it('hammer frees a cell without ever awarding a board clear', () => {
    const state = warehouse(
      makeRun(boardFrom(['X.......']), ['dot', 'h2', 'v2']),
      { charges: { shuffle: 0, hammer: 1 } },
    );
    const result = applyHammer(state, cellIndex(0, 0), START);
    expect(result.success).toBe(true);
    const run = result.state.blocks.run!;
    expect(run.board[cellIndex(0, 0)]).toBeNull();
    expect(run.boardClears).toBe(0);
    expect(run.bonusTokens).toBe(0);
    expect(run.score).toBe(0);
  });

  it('refuses both charges once the run has ended', () => {
    const ended = applyPlacement(warehouse(makeRun(checkerboard(), ['dot', 'h2', 'v2'])), 0, cellIndex(0, 0), START).state;
    const withCharges: GameState = { ...ended, blocks: { ...ended.blocks, charges: { shuffle: 3, hammer: 3 } } };
    expect(applyShuffle(withCharges, START).success).toBe(false);
    expect(applyHammer(withCharges, cellIndex(1, 0), START).success).toBe(false);
  });
});

describe('run lifecycle', () => {
  it('refuses to start while the warehouse is locked', () => {
    const locked = createInitialGameState(START, 7);
    expect(beginRun(locked, START).success).toBe(false);
  });

  it('collects a finished run before starting the next one', () => {
    const ended = applyPlacement(
      warehouse(makeRun(checkerboard(), ['dot', 'h2', 'v2'], { score: 6_000 })),
      0,
      cellIndex(0, 0),
      START,
    ).state;
    const restarted = beginRun(ended, START);

    expect(restarted.success).toBe(true);
    expect(restarted.state.blocks.tokens).toBe(6);
    expect(restarted.state.goblins).toBeGreaterThan(0);
    expect(restarted.state.blocks.run?.endedAt).toBeNull();
    expect(restarted.state.blocks.run?.score).toBe(0);
  });

  it('deals a fresh trio once all three pieces are placed', () => {
    let state = beginRun(warehouse(null), START).state;
    for (let slot = 0; slot < 3; slot += 1) {
      const run = state.blocks.run!;
      state = applyPlacement(state, slot, findFreeAnchor(run, slot), START).state;
    }
    const run = state.blocks.run!;
    expect(run.setNumber).toBe(2);
    expect(run.tray.every((piece) => piece !== null)).toBe(true);
    expect(run.clearsThisSet).toBe(0);
  });
});

describe('gate 12 — no wall-clock leakage in the rules', () => {
  const modules: [string, string][] = [
    ['rules.ts', rulesSource],
    ['generator.ts', generatorSource],
    ['pieces.ts', piecesSource],
  ];
  it.each(modules)('%s is pure', (_file, source) => {
    // Comments legitimately name both APIs, so scan the code only.
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(code).not.toMatch(/Math\.random/);
    expect(code).not.toMatch(/Date\.now/);
  });
});
