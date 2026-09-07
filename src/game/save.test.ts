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
    state.statistics.lifetimeProducedByBuilding.warren_den = 678.5;
    state.purchasedUpgrades.sharpened_nails = true;
    state.prestige.permanentUpgrades.founders_legacy = 2;
    state.mooncap.lunarCharge = 4;
    state.mooncap.nextFamilyBias = 'oracle';
    state.contracts.completed = 9;
    state.buffs = [{ id: 'eclipse', multiplier: 2, startedAt: 9_000, expiresAt: 20_000, target: 'cps' }];
    const loaded = deserializeGame(serializeGame(state, 10_000), 10_000);
    expect(loaded.migratedFrom).toBeNull();
    expect(loaded.state.goblins).toBe(1234.5);
    expect(loaded.state.buildings.warren_den).toBe(3);
    expect(loaded.state.statistics.lifetimeProducedByBuilding.warren_den).toBe(678.5);
    expect(loaded.state.purchasedUpgrades.sharpened_nails).toBe(true);
    expect(loaded.state.prestige.permanentUpgrades.founders_legacy).toBe(2);
    expect(loaded.state.mooncap.lunarCharge).toBe(4);
    expect(loaded.state.mooncap.nextFamilyBias).toBe('oracle');
    expect(loaded.state.contracts.completed).toBe(9);
    expect(loaded.state.buffs[0]?.id).toBe('eclipse');
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
    expect(loaded.state.statistics.lifetimeProducedByBuilding.brood_matron).toBe(0);
    expect(loaded.state.prestige.permanentUpgrades.founders_legacy).toBeUndefined();
    expect(loaded.warnings[0]).toContain('migrated');
  });

  it('migrates v3 envelopes to the stable v4 contract and Observatory state', () => {
    const state = createInitialGameState(10_000, 42);
    state.goblins = 321;
    const parsed = JSON.parse(serializeGame(state, 10_000)) as { version: number; state: Record<string, unknown> };
    parsed.version = 3;
    parsed.state.version = 3;
    delete parsed.state.contracts;
    const mooncap = parsed.state.mooncap as Record<string, unknown>;
    delete mooncap.family;
    delete mooncap.lunarCharge;
    delete mooncap.nextFamilyBias;

    const loaded = deserializeGame(JSON.stringify(parsed), 10_000);
    expect(loaded.migratedFrom).toBe(3);
    expect(loaded.state.goblins).toBe(321);
    expect(Object.keys(loaded.state.contracts.active)).toHaveLength(3);
    expect(loaded.state.mooncap.lunarCharge).toBe(0);
    expect(loaded.state.version).toBe(CURRENT_SAVE_VERSION);
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
    state.runGoblins = 123;
    state.statistics.manuallyBorn = 17;
    state.buildings.brood_matron = 4;
    const exported = exportGameSave(state, 10_000);
    expect(exported).toContain('\n  "schema"');
    const imported = importGameSave(exported, 10_000).state;
    expect(imported.goblins).toBe(77);
    expect(imported.runGoblins).toBe(123);
    expect(imported.statistics.manuallyBorn).toBe(17);
    expect(imported.buildings.brood_matron).toBe(4);
  });

  it('rejects malformed save envelopes instead of silently resetting progress', () => {
    expect(() => importGameSave(JSON.stringify({ schema: 'goblin-clicker-save', version: CURRENT_SAVE_VERSION }), 10_000))
      .toThrow(/valid game state/);
    expect(() => importGameSave(JSON.stringify({ schema: 'some-other-game', state: {} }), 10_000))
      .toThrow(/schema is not supported/);
  });

  it('rejects unrelated JSON but still accepts recognizable legacy saves', () => {
    expect(() => importGameSave(JSON.stringify({ hello: 'world', version: 1 }), 10_000))
      .toThrow(/recognized Goblin Clicker save/);
    expect(importGameSave(JSON.stringify({ version: 1, goblins: 12, totalGoblins: 30 }), 10_000).state.goblins).toBe(12);
  });

  it('rejects saves from unsupported future versions', () => {
    expect(() => deserializeGame(JSON.stringify({ schema: 'goblin-clicker-save', version: 999, state: {} }), 10_000))
      .toThrow(/newer than supported/);
  });
});
