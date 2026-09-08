import { applyOfflineProgress } from '../game/offline';
import { deserializeGame } from '../game/save';
import { createInitialGameState } from '../game/state';
import type { GameState } from '../game/types';
import type { StorageLike } from './saveOwnership';

export type SaveLoadWarning = 'storageUnavailable' | 'unreadable' | null;

export interface StoredGameLoadResult {
  state: GameState;
  offline: number;
  roboOffline: number;
  warning: SaveLoadWarning;
}

/** Read the newest persisted save. Offline settlement is opt-in for the owner only. */
export function loadStoredGame(
  storage: Pick<StorageLike, 'getItem'> | null,
  saveKey: string,
  legacyKeys: readonly string[],
  now: number,
  settleOffline: boolean,
): StoredGameLoadResult {
  if (!storage) return { state: createInitialGameState(now), offline: 0, roboOffline: 0, warning: 'storageUnavailable' };
  let raw: string | null;
  try {
    raw = storage.getItem(saveKey);
    if (!raw) {
      for (const legacyKey of legacyKeys) {
        raw = storage.getItem(legacyKey);
        if (raw) break;
      }
    }
  } catch {
    return { state: createInitialGameState(now), offline: 0, roboOffline: 0, warning: 'storageUnavailable' };
  }
  if (!raw) return { state: createInitialGameState(now), offline: 0, roboOffline: 0, warning: null };
  try {
    const loaded = deserializeGame(raw, now);
    if (!settleOffline) return { state: loaded.state, offline: 0, roboOffline: 0, warning: null };
    const offline = applyOfflineProgress(loaded.state, now);
    return {
      state: offline.state,
      offline: offline.progress.goblinsProduced,
      roboOffline: offline.roboProgress?.producedRG ?? 0,
      warning: null,
    };
  } catch (error) {
    console.error('Unable to load save:', error);
    return { state: createInitialGameState(now), offline: 0, roboOffline: 0, warning: 'unreadable' };
  }
}
