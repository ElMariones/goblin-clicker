import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../state';
import { deserializeGame, serializeGame } from '../save';
import { applyOfflineProgress } from '../offline';
import { ROBO_CIRCUITS, ROBO_LINES, ROBO_MASTERY_LEVELS, ROBO_PROJECTS } from './content';
import { performRoboRecompile, purchaseRoboLine } from './engine';
import { getRoboCircuitMultiplier, getRoboCircuitSummary, getRoboLineBulkCost, getRoboLineMasteryFromOwned, getRoboMaxAffordableLineCount, getRoboNextMilestoneQuantity, getRoboStableRps } from './math';
import { createInitialRoboState } from './state';

function factory(owned = 500) {
  const state = createInitialGameState(1000, 7);
  state.unlocks.robogoblins = true;
  state.robo = createInitialRoboState();
  state.robo.readyRG = 1e45;
  state.robo.lifetimeProducedRG = 1e40;
  state.robo.kernel.totalCoresEarned = 1e9;
  state.robo.kernel.cores = 1e9;
  state.robo.globalBlueprintRank = 10;
  for (const line of ROBO_LINES) Object.assign(state.robo.lines[line.id], { owned, blueprintRank: 5 });
  return state;
}

describe('RoboGoblins thousand-robot progression', () => {
  it.each([600, 700, 800, 900, 1000])('awards mastery and each circuit tier exactly at %s robots', (threshold) => {
    const state = factory(threshold - 1);
    const tier = ROBO_MASTERY_LEVELS.find((tier) => tier.threshold === threshold)!;
    expect(getRoboLineMasteryFromOwned(threshold) / getRoboLineMasteryFromOwned(threshold - 1)).toBeCloseTo(tier.multiplier);
    for (const [circuit, ids] of Object.entries(ROBO_CIRCUITS)) {
      const before = getRoboCircuitMultiplier(state.robo!);
      for (const id of ids.slice(0, 3)) state.robo!.lines[id].owned = threshold;
      expect(getRoboCircuitMultiplier(state.robo!)).toBe(before);
      const bottleneck = getRoboCircuitSummary(state).find((summary) => summary.id === circuit)!;
      expect(bottleneck.nextThreshold).toBe(threshold);
      expect(bottleneck.bottleneck).toMatchObject({ lineId: ids[3], needed: 1 });
      state.robo!.lines[ids[3]].owned = threshold;
      expect(getRoboCircuitMultiplier(state.robo!) - before).toBeCloseTo(0.1);
    }
    expect(getRoboCircuitSummary(state).every((summary) => summary.nextThreshold === (threshold === 1000 ? null : threshold + 100))).toBe(true);
    expect(getRoboCircuitSummary(state).every((summary) => summary.tiers === 8 + (threshold - 500) / 100)).toBe(true);
  });

  it('buys exact milestones through 1000 on every line and persists their bonuses', () => {
    let state = factory();
    for (const project of ROBO_PROJECTS) state.robo!.kernel.projects[project.id] = 5;
    for (const threshold of [600, 700, 800, 900, 1000]) {
      for (const line of ROBO_LINES) {
        expect(getRoboNextMilestoneQuantity(state.robo!, line.id)).toBe(100);
        const result = purchaseRoboLine(state, line.id, 'nextMilestone');
        expect(result.success).toBe(true);
        state = result.state;
        expect(state.robo!.lines[line.id].owned).toBe(threshold);
      }
    }
    expect(getRoboCircuitMultiplier(state.robo!)).toBeCloseTo(4.9);
    state.robo!.kernel.perks.copper_memory = 5;
    expect(getRoboCircuitMultiplier(state.robo!)).toBeCloseTo(6.85);
    const loaded = deserializeGame(serializeGame(state), 1000).state;
    expect(loaded.robo!.lines).toEqual(state.robo!.lines);
    expect(getRoboStableRps(loaded)).toBe(getRoboStableRps(state));
    const offline = applyOfflineProgress(loaded, 61_000);
    expect(offline.roboProgress!.producedRG).toBeCloseTo(getRoboStableRps(loaded) * 60 * 0.8);
    state.robo!.kernel.totalCoresEarned = 1;
    const reset = performRoboRecompile(state);
    expect(reset.success).toBe(true);
    expect(getRoboCircuitMultiplier(reset.state.robo!)).toBe(1);
  });

  it.each([[95, 510], [490, 30], [500, 100], [999, 1]])('prices mixed fabrication from %s for %s units and max-buy agrees', (owned, count) => {
    const state = factory(owned);
    const oldPrice = getRoboLineBulkCost(state, 'tin_cradle', count);
    state.robo!.kernel.projects.scrap_archive = 4;
    const stageFourPrice = getRoboLineBulkCost(state, 'tin_cradle', count);
    state.robo!.kernel.projects.scrap_archive = 5;
    const expected = Array.from({ length: count }, (_, i) => {
      const n = owned + i;
      return 20 * 1.14 ** Math.min(n, 100) * 1.035 ** Math.max(0, Math.min(n, 500) - 100) * 1.015 ** Math.max(0, n - 500);
    }).reduce((a, b) => a + b, 0);
    const actual = getRoboLineBulkCost(state, 'tin_cradle', count);
    expect(actual / expected).toBeCloseTo(1, 12);
    expect(actual).toBeLessThan(stageFourPrice);
    expect(stageFourPrice).toBeLessThan(oldPrice);
    expect(getRoboMaxAffordableLineCount(state, 'tin_cradle', actual)).toBe(count);
    expect(getRoboMaxAffordableLineCount(state, 'tin_cradle', actual * (1 - 1e-10))).toBe(count - 1);
    expect(getRoboLineBulkCost(state, 'boiler_brood', 10)).toBe(getRoboLineBulkCost(factory(owned), 'boiler_brood', 10));
  });

  it('preserves all prices below 500 and keeps late passive payback within days at maximum permanent progression', () => {
    const state = factory(100);
    state.robo!.kernel.projects.scrap_archive = 1;
    const oldPrice = getRoboLineBulkCost(state, 'tin_cradle', 400);
    state.robo!.kernel.projects.scrap_archive = 5;
    expect(getRoboLineBulkCost(state, 'tin_cradle', 400)).toBe(oldPrice);
    for (const project of ROBO_PROJECTS) state.robo!.kernel.projects[project.id] = 5;
    state.robo!.kernel.perks.better_bolts = 10;
    state.robo!.kernel.perks.copper_memory = 5;
    state.robo!.firmware = { control: 'clock', cadence: 'heavy' };
    for (const owned of [500, 600, 700, 800, 900]) {
      for (const line of ROBO_LINES) state.robo!.lines[line.id].owned = owned;
      const cost = ROBO_LINES.reduce((sum, line) => sum + getRoboLineBulkCost(state, line.id, 100), 0);
      const days = cost / getRoboStableRps(state) / 86400;
      expect(days).toBeGreaterThan(1);
      expect(days).toBeLessThan(4);
    }
  });
});
