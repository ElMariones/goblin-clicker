import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../state';
import { deserializeGame, serializeGame } from '../save';
import { applyOfflineProgress } from '../offline';
import { ROBO_LINES, ROBO_PROJECTS } from './content';
import { buildRoboProject, performRoboRecompile, purchaseRoboBlueprint, purchaseRoboLine } from './engine';
import { getRoboCoreMultiplier, getRoboLineBulkCost, getRoboMaxAffordableLineCount, getRoboStableRps } from './math';
import { getRoboProjectCoreSpend, getRoboProjectProgress } from './projects';
import { createInitialRoboState } from './state';

function foundry() {
  const state = createInitialGameState(1_000, 7);
  state.unlocks.robogoblins = true;
  state.robo = createInitialRoboState();
  state.robo.readyRG = 1e22;
  state.robo.lifetimeProducedRG = 1e24;
  state.robo.kernel.cores = 100_000;
  state.robo.kernel.totalCoresEarned = 100_000;
  state.robo.kernel.recompiles = 1;
  state.robo.globalBlueprintRank = 6;
  for (const line of ROBO_LINES) state.robo.lines[line.id].owned = line.circuit === 'scrap' ? 150 : 1;
  return state;
}

describe('RoboGoblins endgame', () => {
  it('preserves early core rewards while tapering later compounding', () => {
    expect(getRoboCoreMultiplier(8)).toBe(1.8);
    expect(getRoboCoreMultiplier(64)).toBe(7.4);
    expect(getRoboCoreMultiplier(65)).toBeGreaterThan(7.4);
    expect(getRoboCoreMultiplier(65) - getRoboCoreMultiplier(64)).toBeLessThan(0.1);
    expect(getRoboCoreMultiplier(1_000)).toBeCloseTo(26.29822128);
    expect(getRoboCoreMultiplier(1e9)).toBeLessThan(26_000);
  });

  it('requires the current factory, research, prestige and both currencies', () => {
    for (const missing of ['lines', 'research', 'prestige', 'paradox', 'rg', 'cores'] as const) {
      const state = foundry();
      if (missing === 'lines') state.robo!.lines.cutlery_press.owned = 149;
      if (missing === 'research') state.robo!.globalBlueprintRank = 5;
      if (missing === 'prestige') state.robo!.kernel.recompiles = 0;
      if (missing === 'paradox') state.robo!.lines.paradox_nest.owned = 0;
      if (missing === 'rg') state.robo!.readyRG = 1e20 - 1e10;
      if (missing === 'cores') state.robo!.kernel.cores = 255;
      expect(buildRoboProject(state, 'scrap_archive').success, missing).toBe(false);
      expect(state.robo!.kernel.projects).toEqual({});
    }
    expect(buildRoboProject(foundry(), 'forged' as never).reason).toBe('invalidInput');
    const locked = foundry();
    locked.unlocks.robogoblins = false;
    expect(buildRoboProject(locked, 'scrap_archive').reason).toBe('locked');
  });

  it('spends once, preserves lines and pending work, and makes the next stage harder', () => {
    const state = foundry();
    state.robo!.lines.tin_cradle.pendingRG = 12;
    const before = getRoboStableRps(state);
    const built = buildRoboProject(state, 'scrap_archive');
    expect(built.success).toBe(true);
    expect(built.state.robo!.readyRG).toBe(state.robo!.readyRG - 1e20);
    expect(built.state.robo!.kernel.cores).toBe(100_000 - 256);
    expect(built.state.robo!.kernel.totalCoresEarned).toBe(100_000);
    expect(built.state.robo!.lines).toEqual(state.robo!.lines);
    expect(getRoboStableRps(built.state)).toBeGreaterThan(before);
    expect(built.state.robo!.achievements.rg_megaproject).toBe(1_000);
    const next = getRoboProjectProgress(built.state.robo!, 'scrap_archive')!;
    expect(next.requiredOwned).toBe(200);
    expect(next.requiredBlueprintRank).toBe(7);
    expect(next.cost).toBe(1e21);
    expect(next.coreCost).toBe(2560);
    expect(buildRoboProject(built.state, 'scrap_archive').reason).toBe('requirementNotMet');
  });

  it('round-trips permanent stages and keeps them through Recompile and offline progress', () => {
    const built = buildRoboProject(foundry(), 'scrap_archive').state;
    const loaded = deserializeGame(serializeGame(built), 1_000).state;
    expect(loaded.robo!.kernel).toEqual(built.robo!.kernel);
    expect(loaded.robo!.readyRG).toBe(built.robo!.readyRG);
    const reset = performRoboRecompile(loaded);
    expect(reset.success).toBe(true);
    expect(reset.state.robo!.kernel.projects).toEqual({ scrap_archive: 1 });
    expect(reset.state.robo!.lines.tin_cradle.owned).toBe(0);
    const restarted = purchaseRoboLine(reset.state, 'tin_cradle', 1).state;
    const offline = applyOfflineProgress(restarted, 601_000);
    expect(offline.roboProgress!.producedRG).toBeCloseTo(getRoboStableRps(restarted) * 600 * 0.8);
  });

  it('loads old saves without changing their stock, earned cores, perks or owned lines', () => {
    const state = foundry();
    state.robo!.kernel.perks.better_bolts = 10;
    state.robo!.kernel.cores -= 1023;
    state.robo!.lines.paradox_nest.blueprintRank = 3;
    const data = JSON.parse(serializeGame(state));
    delete data.state.robo.kernel.projects;
    const loaded = deserializeGame(JSON.stringify(data), 1_000).state;
    expect(loaded.robo!.kernel).toEqual(state.robo!.kernel);
    expect(loaded.robo!.lines).toEqual(state.robo!.lines);
    expect(loaded.robo!.readyRG).toBe(state.robo!.readyRG);
    expect(loaded.robo!.lifetimeProducedRG).toBe(state.robo!.lifetimeProducedRG);
  });

  it('sanitizes invalid project ranks within the earned core budget', () => {
    const data = JSON.parse(serializeGame(foundry()));
    data.state.robo.kernel.projects = { scrap_archive: 999, stellar_engine: -2, causality_anchor: '5', eternity_foundry: 5, forged: 100 };
    const loaded = deserializeGame(JSON.stringify(data), 1_000).state.robo!;
    expect(loaded.kernel.projects).toEqual({ scrap_archive: 3, eternity_foundry: 1 });
    expect(getRoboProjectCoreSpend(loaded.kernel.projects) + loaded.kernel.cores).toBeLessThanOrEqual(loaded.kernel.totalCoresEarned);
  });

  it('supports every stage, awards completion, and rejects purchases beyond the cap', () => {
    let state = foundry();
    state.robo!.readyRG = 1e40;
    state.robo!.kernel.cores = 1e9;
    state.robo!.kernel.totalCoresEarned = 1e9;
    state.robo!.globalBlueprintRank = 10;
    for (const line of ROBO_LINES) state.robo!.lines[line.id].owned = 500;
    for (const project of ROBO_PROJECTS) {
      for (let rank = 0; rank < project.maxRank; rank += 1) {
        const built = buildRoboProject(state, project.id);
        expect(built.success, `${project.id}:${rank}`).toBe(true);
        state = built.state;
      }
      expect(buildRoboProject(state, project.id).reason).toBe('maxRank');
    }
    expect(state.robo!.achievements.rg_eternal_foundry).toBe(1_000);
    expect(state.robo!.achievements.rg_four_wonders).toBe(1_000);
    expect(state.robo!.achievements.rg_deep_mastery).toBe(1_000);
    expect(deserializeGame(serializeGame(state), 1_000).state.robo!.kernel).toEqual(state.robo!.kernel);
  });

  it('unlocks deep fabrication only for the corresponding circuit and prices mixed bulk purchases correctly', () => {
    const state = foundry();
    state.robo!.lines.tin_cradle.owned = 95;
    const oldPrice = getRoboLineBulkCost(state, 'tin_cradle', 50);
    const steamPrice = getRoboLineBulkCost(state, 'boiler_brood', 150);
    state.robo!.kernel.projects.scrap_archive = 1;
    const expected = Array.from({ length: 50 }, (_, i) => {
      const owned = 95 + i;
      return 20 * 1.14 ** Math.min(owned, 100) * 1.035 ** Math.max(0, owned - 100);
    }).reduce((sum, price) => sum + price, 0);
    const price = getRoboLineBulkCost(state, 'tin_cradle', 50);
    expect(price).toBe(Math.ceil(expected - 1e-9));
    expect(price).toBeLessThan(oldPrice);
    expect(getRoboLineBulkCost(state, 'boiler_brood', 150)).toBe(steamPrice);
    expect(getRoboMaxAffordableLineCount(state, 'tin_cradle', price)).toBe(50);
    expect(getRoboMaxAffordableLineCount(state, 'tin_cradle', price - 1)).toBe(49);
    state.robo!.lines.tin_cradle.owned = 1_000_000;
    expect(getRoboMaxAffordableLineCount(state, 'tin_cradle', 1e300)).toBe(0);
  });

  it('keeps extended blueprints sequential and persists new ranks', () => {
    let state = foundry();
    state.robo!.lines.tin_cradle.owned = 200;
    state.robo!.lines.tin_cradle.blueprintRank = 3;
    expect(purchaseRoboBlueprint(state, 'tin_cradle_ancestral_forge').success).toBe(false);
    const installed = purchaseRoboBlueprint(state, 'tin_cradle_quantum_tools');
    expect(installed.success).toBe(true);
    state = installed.state;
    expect(deserializeGame(serializeGame(state), 1_000).state.robo!.lines.tin_cradle.blueprintRank).toBe(4);
    state.robo!.lines.tin_cradle.owned = 300;
    expect(purchaseRoboBlueprint(state, 'tin_cradle_ancestral_forge').success).toBe(true);
  });
});
