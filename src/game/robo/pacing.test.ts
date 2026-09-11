import { describe, expect, it } from 'vitest';
import { simulateRoboPacing } from './pacing';

describe('shipped RoboGoblins pacing', () => {
  it('opens a reachable endgame after Paradox Nest without exhausting it in three days', () => {
    const result = simulateRoboPacing(72, true, true, true);
    expect(result.firstProject.scrap_archive).toBeGreaterThan(result.firstOwned.paradox_nest!);
    expect(result.firstProject.scrap_archive).toBeGreaterThan(24 * 3600);
    expect(result.firstProject.scrap_archive).toBeLessThan(72 * 3600);
    expect(result.projects.scrap_archive).toBeGreaterThanOrEqual(1);
    expect(result.projects.eternity_foundry ?? 0).toBe(0);
  }, 120_000);
  it.each([[false, false], [true, true]])('paces 72 hours with active=%s, recompiles=%s', (active, recompile) => {
    const result = simulateRoboPacing(72, active, recompile);
    expect(result.firstEightCores).toBeGreaterThan(30 * 60);
    expect(result.firstEightCores).toBeLessThan(90 * 60);
    expect(result.firstOwned.tin_cradle).toBe(0);
    expect(result.firstOwned.windup_workbench).toBeLessThan(6 * 60);
    if (active) {
      expect(result.firstOwned.paradox_nest).toBeGreaterThan(12 * 3600);
      expect(result.firstOwned.paradox_nest).toBeLessThan(48 * 3600);
      expect(result.recompiles).toBeGreaterThan(1);
      expect(result.firstOwned.moonwire_loom! - result.firstOwned.thunderhead_coil!).toBeGreaterThan(3600);
      expect(result.firstOwned.paradox_nest! - result.firstOwned.clockwyrm_assembly!).toBeGreaterThan(3 * 3600);
    } else {
      expect(result.firstOwned.paradox_nest).toBeUndefined();
      expect(result.firstOwned.moonwire_loom).toBeDefined();
    }
  }, 120_000);
});
