import { describe, expect, it } from 'vitest';
import { serializeGame } from '../game/save';
import { createInitialRoboState } from '../game/robo/state';
import { createInitialGameState } from '../game/state';
import { loadStoredGame } from './saveLifecycle';
import type { StorageLike } from './saveOwnership';

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

describe('browser save lifecycle', () => {
  it('secondary load is read-only, while takeover reloads the newest persisted timestamp and settles once', () => {
    const storage = new MemoryStorage();
    const saveKey = 'goblin-clicker.save';
    const stale = createInitialGameState(0, 7);
    stale.buildings.mushroom_nursery = 1;
    storage.setItem(saveKey, serializeGame(stale, 0));

    const secondary = loadStoredGame(storage, saveKey, [], 10_000, false);
    expect(secondary.state.lastUpdateAt).toBe(0);
    expect(secondary.state.goblins).toBe(0);

    // The owner advances and persists after this secondary document was opened.
    const newest = createInitialGameState(5_000, 7);
    newest.buildings.mushroom_nursery = 1;
    newest.goblins = 123;
    newest.runGoblins = 123;
    newest.lifetimeGoblins = 123;
    newest.unlocks.robogoblins = true;
    newest.robo = createInitialRoboState();
    newest.robo.lines.tin_cradle.owned = 1;
    storage.setItem(saveKey, serializeGame(newest, 5_000));

    const takeover = loadStoredGame(storage, saveKey, [], 10_000, true);
    expect(takeover.state.lastUpdateAt).toBe(10_000);
    expect(takeover.state.goblins).toBeCloseTo(123 + 5 * 0.75, 8);
    expect(takeover.offline).toBeCloseTo(5 * 0.75, 8);
    expect(takeover.roboOffline).toBeCloseTo(0.5 * 5 * 0.8, 8);

    // Re-reading the state that takeover would persist at the same timestamp
    // cannot claim the interval again.
    storage.setItem(saveKey, serializeGame(takeover.state, 10_000));
    const repeated = loadStoredGame(storage, saveKey, [], 10_000, true);
    expect(repeated.offline).toBe(0);
    expect(repeated.roboOffline).toBe(0);
    expect(repeated.state.goblins).toBeCloseTo(takeover.state.goblins, 8);
  });
});
