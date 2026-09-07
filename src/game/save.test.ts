import { describe, expect, it } from 'vitest';
import { createInitialGameState } from './state';
import { deserializeGame, exportGameSave, importGameSave, serializeGame } from './save';
import { CURRENT_SAVE_VERSION } from './types';

describe('save system', () => {
  it('round-trips current game state', () => {
    const state = createInitialGameState(10_000, 42);
    state.goblins = 1234.5;
    state.runGoblins = 2_000;
    state.lifetimeGoblins = 9_000;
    state.buildings.warren_den = 3;
    state.purchasedUpgrades.sharpened_nails = true;
    const loaded = deserializeGame(serializeGame(state, 10_000), 10_000);
    expect(loaded.migratedFrom).toBeNull();
    expect(loaded.state.goblins).toBe(1234.5);
    expect(loaded.state.buildings.warren_den).toBe(3);
    expect(loaded.state.purchasedUpgrades.sharpened_nails).toBe(true);
    expect(loaded.state.version).toBe(CURRENT_SAVE_VERSION);
  });

  it('migrates legacy bare v1 saves and ignores unknown content', () => {
    const legacy = JSON.stringify({
      version: 1,
      goblins: 500,
      totalGoblins: 2_500,
      totalClicks: 12,
      lastSave: 5_000,
      buildings: { brood_matron: 4, hacked_building: 999 },
      upgrades: ['sharpened_nails', 'hacked_upgrade'],
      prestigePoints: 3,
    });
    const loaded = deserializeGame(legacy, 6_000);
    expect(loaded.migratedFrom).toBe(1);
    expect(loaded.state.lifetimeGoblins).toBe(2_500);
    expect(loaded.state.buildings.brood_matron).toBe(4);
    expect(loaded.state.purchasedUpgrades).toEqual({ sharpened_nails: true });
    expect(loaded.state.prestige.shards).toBe(3);
    expect(loaded.state.prestige.totalShardsEarned).toBe(3);
    expect(loaded.warnings[0]).toContain('migrated');
  });

  it('does not count prestige starter currency as newly produced goblins on load', () => {
    const state = createInitialGameState(10_000, 42);
    state.goblins = 250;
    state.runGoblins = 0;
    state.lifetimeGoblins = 5_000_000;
    state.prestige.resets = 1;
    state.prestige.permanentUpgrades.starter_clutch = 5;
    const loaded = deserializeGame(serializeGame(state), 10_000).state;
    expect(loaded.goblins).toBe(250);
    expect(loaded.runGoblins).toBe(0);
    expect(loaded.lifetimeGoblins).toBe(5_000_000);
  });

  it('supports pretty portable export/import without changing state', () => {
    const state = createInitialGameState(10_000, 42);
    state.goblins = 77;
    const exported = exportGameSave(state, 10_000);
    expect(exported).toContain('\n  "schema"');
    expect(importGameSave(exported, 10_000).state.goblins).toBe(77);
  });

  it('rejects saves from unsupported future versions', () => {
    expect(() => deserializeGame(JSON.stringify({ schema: 'goblin-clicker-save', version: 999, state: {} }), 10_000))
      .toThrow(/newer than supported/);
  });
});
