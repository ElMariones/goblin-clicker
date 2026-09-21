/**
 * Fresh Goblin Blocks state and the calendar helper it needs.
 *
 * Deliberately kept free of any `../state` import: `createInitialGameState`
 * calls into this module, so anything here that reached back into the core
 * state module would close an import cycle.
 */

import type { BlocksState } from './types';

/** Local calendar day, so "first run today" follows the player's clock, not UTC. */
export function localDayIndex(now: number): number {
  const timestamp = Number.isFinite(now) ? now : 0;
  const offsetMs = new Date(timestamp).getTimezoneOffset() * 60_000;
  return Math.floor((timestamp - offsetMs) / 86_400_000);
}

export function createInitialBlocksState(now = 0): BlocksState {
  return {
    unlocked: false,
    run: null,
    stats: {
      runs: 0,
      bestScore: 0,
      lifetimeScore: 0,
      totalLines: 0,
      totalBlocks: 0,
      bestCombo: 0,
      largestClear: 0,
      boardClears: 0,
      perfectSets: 0,
    },
    tokens: 0,
    lifetimeTokens: 0,
    charges: { shuffle: 0, hammer: 0 },
    daily: { day: localDayIndex(now), runsFinished: 0, tokensEarned: 0 },
    tutorialSeen: false,
  };
}
