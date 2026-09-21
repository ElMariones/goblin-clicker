/**
 * Public Goblin Blocks actions.
 *
 * Each one settles elapsed production with `tickGame` before touching the run,
 * matching `purchaseBuilding` and every other economy action, so opening the
 * warehouse never costs the player idle output.
 */

import { tickGame } from '../engine';
import type { GameState } from '../types';
import {
  applyChargePurchase,
  applyHammer,
  applyPlacement,
  applyShuffle,
  beginRun,
  collectFinishedRun,
  markTutorialSeen,
  type BlocksActionResult,
  type BlocksCollectResult,
  type BlocksPlacementResult,
} from './state';
import type { BlocksChargeId } from './types';

export function startBlocksRun(state: GameState, now = state.lastUpdateAt): BlocksActionResult {
  return beginRun(tickGame(state, now), now);
}

export function placeBlocksPiece(
  state: GameState,
  slot: number,
  anchorIndex: number,
  now = state.lastUpdateAt,
): BlocksPlacementResult {
  return applyPlacement(tickGame(state, now), slot, anchorIndex, now);
}

export function spendBlocksShuffle(state: GameState, now = state.lastUpdateAt): BlocksActionResult {
  return applyShuffle(tickGame(state, now), now);
}

export function spendBlocksHammer(state: GameState, cellIndex: number, now = state.lastUpdateAt): BlocksActionResult {
  return applyHammer(tickGame(state, now), cellIndex, now);
}

/** The only place a puzzle run credits goblins. */
export function collectBlocksRun(state: GameState, now = state.lastUpdateAt): BlocksCollectResult {
  return collectFinishedRun(tickGame(state, now), now);
}

export function buyBlocksCharge(state: GameState, charge: BlocksChargeId, now = state.lastUpdateAt): BlocksActionResult {
  return applyChargePurchase(tickGame(state, now), charge);
}

export function markBlocksTutorialSeen(state: GameState, now = state.lastUpdateAt): GameState {
  return markTutorialSeen(tickGame(state, now));
}
