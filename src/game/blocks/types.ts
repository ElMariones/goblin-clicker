import type { BlockPieceId } from './pieces';

/**
 * Loot families are decoration. Geometry is the entire game, so no rule ever
 * reads `loot` — layering colour matching onto the core mechanic would obscure
 * the one thing the player has to read quickly.
 */
export type BlocksLoot = 'gold' | 'weapon' | 'fungus' | 'crystal' | 'relic' | 'tool';

export const BLOCKS_LOOT_FAMILIES: readonly BlocksLoot[] = ['gold', 'weapon', 'fungus', 'crystal', 'relic', 'tool'];

/**
 * Variants per family. Each family ships one painted crate and the variant picks
 * a mirror or quarter-turn of it, which is enough to stop a large single-family
 * region reading as one flat repeated texture.
 */
export const BLOCKS_LOOT_VARIANTS = 4;

export type BlocksChargeId = 'shuffle' | 'hammer';

export interface BlocksCell {
  loot: BlocksLoot;
  variant: number;
}

export interface BlocksTrayPiece {
  pieceId: BlockPieceId;
  loot: BlocksLoot;
  variant: number;
}

/**
 * Computed once when the run ends and held until the player collects, so closing
 * the warehouse never loses a payout. `dailyFactor` is snapshotted at that moment
 * to stop finished runs being stockpiled and collected all at full rate; the
 * production term is evaluated at collection, matching contract behaviour.
 */
export interface BlocksRunResult {
  score: number;
  rewardSeconds: number;
  dailyFactor: number;
  tokens: number;
}

export interface BlocksRun {
  startedAt: number;
  endedAt: number | null;
  /** 64 entries, row-major, index = y * 8 + x. */
  board: (BlocksCell | null)[];
  /** Exactly three slots. `null` means that piece has already been placed this set. */
  tray: (BlocksTrayPiece | null)[];
  /** Guards against the generator handing out the same trio twice in a row. */
  previousTrayIds: BlockPieceId[];
  setNumber: number;
  score: number;
  combo: number;
  bestCombo: number;
  largestClear: number;
  clearsThisSet: number;
  /** Pieces in the current set that each cleared at least one line, for Perfect Set. */
  clearingPiecesThisSet: number;
  /** Remaining placements that score double, granted by a board clear. */
  doubleScorePlacements: number;
  linesCleared: number;
  blocksPlaced: number;
  boardClears: number;
  perfectSets: number;
  /** Tokens earned from Perfect Sets and board clears, on top of the score conversion. */
  bonusTokens: number;
  rngSeed: number;
  rngCounter: number;
  result: BlocksRunResult | null;
}

export interface BlocksStats {
  runs: number;
  bestScore: number;
  lifetimeScore: number;
  totalLines: number;
  totalBlocks: number;
  bestCombo: number;
  largestClear: number;
  boardClears: number;
  perfectSets: number;
}

export interface BlocksDailyState {
  /** Local calendar day index; a change resets the counters below. */
  day: number;
  runsFinished: number;
  tokensEarned: number;
}

export interface BlocksState {
  /** Latched the first time a Warren Den is owned; a Great Migration never re-locks it. */
  unlocked: boolean;
  run: BlocksRun | null;
  stats: BlocksStats;
  tokens: number;
  lifetimeTokens: number;
  charges: Record<BlocksChargeId, number>;
  daily: BlocksDailyState;
  tutorialSeen: boolean;
}
