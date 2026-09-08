import { describe, expect, it } from 'vitest';
import { performPrestigeReset, tickGame } from '../engine';
import { getBaseCps } from '../math';
import { applyOfflineProgress } from '../offline';
import { deserializeGame, serializeGame } from '../save';
import { createInitialGameState } from '../state';
import {
  canPurchaseMechanicalCharter,
  getMechanicalCharterProgress,
  purchaseMechanicalCharter,
} from '../worlds';
import { ROBO_ACHIEVEMENTS, ROBO_GLOBAL_BLUEPRINTS, ROBO_LINES, ROBO_LOCAL_BLUEPRINTS } from './content';
import {
  activateRoboOverclock,
  assembleRoboGoblin,
  performRoboRecompile,
  purchaseKernelPerk,
  purchaseRoboBlueprint,
  purchaseRoboFirmware,
  purchaseRoboLine,
} from './engine';
import {
  getFamilyAdapterFactor,
  getInheritedBlueprintsFactor,
  getKernelPerkCost,
  getRoboCircuitSummary,
  getRoboClickPower,
  getRoboCorePotential,
  getRoboLineBulkCost,
  getRoboLineMastery,
  getRoboMaxAffordableLineCount,
  getRoboRecompileGain,
  getRoboStableRps,
} from './math';
import { integrateRoboLine } from './production';
import { createInitialRoboState } from './state';

function unlockedState(now = 1_000) {
  const state = createInitialGameState(now, 7);
  state.unlocks.robogoblins = true;
  state.robo = createInitialRoboState();
  return state;
}

describe('RoboGoblins content and entitlement', () => {
  it('defines the complete launch content tables', () => {
    expect(ROBO_LINES).toHaveLength(12);
    expect(ROBO_LOCAL_BLUEPRINTS).toHaveLength(36);
    expect(ROBO_GLOBAL_BLUEPRINTS).toHaveLength(6);
    expect(ROBO_ACHIEVEMENTS).toHaveLength(12);
    for (let index = 1; index < ROBO_LINES.length; index += 1) {
      expect(ROBO_LINES[index].baseCost).toBeGreaterThan(ROBO_LINES[index - 1].baseCost);
      expect(ROBO_LINES[index].baseRps).toBeGreaterThan(ROBO_LINES[index - 1].baseRps);
    }
  });

  it('requires all three Mechanical Charter gates independently', () => {
    const state = createInitialGameState(1_000, 7);
    state.prestige.resets = 3;
    state.prestige.totalShardsEarned = 2_500;
    state.prestige.shards = 99;
    expect(canPurchaseMechanicalCharter(state)).toBe(false);
    expect(getMechanicalCharterProgress(state).availableCunning.met).toBe(false);
    state.prestige.shards = 100;
    expect(canPurchaseMechanicalCharter(state)).toBe(true);
    state.prestige.resets = 2;
    expect(canPurchaseMechanicalCharter(state)).toBe(false);
    state.prestige.resets = 3;
    state.prestige.totalShardsEarned = 2_499;
    expect(canPurchaseMechanicalCharter(state)).toBe(false);
  });

  it('buys the Charter exactly once without reducing total earned Cunning', () => {
    const state = createInitialGameState(1_000, 7);
    state.prestige.resets = 3;
    state.prestige.totalShardsEarned = 2_500;
    state.prestige.shards = 150;
    const bought = purchaseMechanicalCharter(state, 1_000);
    expect(bought.success).toBe(true);
    expect(bought.state.prestige.shards).toBe(50);
    expect(bought.state.prestige.totalShardsEarned).toBe(2_500);
    expect(bought.state.robo?.readyRG).toBe(20);
    const duplicate = purchaseMechanicalCharter(bought.state, 1_000);
    expect(duplicate.success).toBe(false);
    expect(duplicate.state.prestige.shards).toBe(50);
  });
});

describe('RoboGoblins economy math', () => {
  it('uses 1.14 geometric pricing with one final rounding', () => {
    const state = unlockedState();
    expect(getRoboLineBulkCost(state, 'tin_cradle', 1)).toBe(20);
    for (const count of [1, 10, 25, 100]) {
      for (const owned of [0, 9, 49, 100]) {
        state.robo!.lines.tin_cradle.owned = owned;
        const raw = Array.from({ length: count }, (_, offset) => 20 * 1.14 ** (owned + offset)).reduce((sum, value) => sum + value, 0);
        expect(getRoboLineBulkCost(state, 'tin_cradle', count)).toBe(Math.ceil(raw - 1e-9));
      }
    }
  });

  it('fails closed for forged line IDs even with an unbounded budget', () => {
    const state = unlockedState();
    expect(getRoboMaxAffordableLineCount(state, 'hacked_line' as never, Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('multiplies mastery cumulatively at exact thresholds', () => {
    const state = unlockedState();
    const cases = [[9, 1], [10, 2], [25, 4], [50, 12], [100, 48], [300, 3_456]] as const;
    for (const [owned, multiplier] of cases) {
      state.robo!.lines.tin_cradle.owned = owned;
      expect(getRoboLineMastery(state, 'tin_cradle')).toBe(multiplier);
    }
  });

  it('requires all four members for each circuit tier', () => {
    const state = unlockedState();
    state.robo!.lines.tin_cradle.owned = 100;
    expect(getRoboCircuitSummary(state)[0].tiers).toBe(0);
    for (const id of ['tin_cradle', 'windup_workbench', 'cutlery_press', 'magnet_nursery'] as const) {
      state.robo!.lines[id].owned = 10;
    }
    expect(getRoboCircuitSummary(state)[0].tiers).toBe(1);
    expect(getRoboCircuitSummary(state)[0].nextThreshold).toBe(25);
  });

  it('uses threshold-corrected cumulative core potential', () => {
    for (const cores of [1, 4, 8, 16, 100, 1_000]) {
      const threshold = 10_000_000 * cores ** 3;
      expect(getRoboCorePotential(threshold * (1 - 1e-12))).toBe(cores - 1);
      expect(getRoboCorePotential(threshold)).toBe(cores);
      expect(getRoboCorePotential(threshold * (1 + 1e-12))).toBe(cores);
    }
    expect(getRoboCorePotential(1e300)).toBe(1_000_000_000);
  });

  it('caps both heritage bridges and keys them to earned totals', () => {
    expect(getInheritedBlueprintsFactor(0)).toBe(1);
    expect(getInheritedBlueprintsFactor(2_500)).toBe(1.02);
    expect(getInheritedBlueprintsFactor(1e12)).toBe(1.1);
    expect(getFamilyAdapterFactor(0, 5)).toBe(1);
    expect(getFamilyAdapterFactor(2_048, 5)).toBe(1.25);
  });

  it('applies inherited blueprints only to mechanical passive output and Family Adapter to Warren base CPS', () => {
    const state = unlockedState();
    state.prestige.totalShardsEarned = 2_500;
    state.robo!.lines.tin_cradle.owned = 1;
    expect(getRoboStableRps(state)).toBeCloseTo(0.51, 10);

    state.buildings.mushroom_nursery = 1;
    const beforeAdapter = getBaseCps(state);
    state.robo!.kernel.totalCoresEarned = 8;
    state.robo!.kernel.perks.family_adapter = 1;
    expect(getBaseCps(state)).toBeCloseTo(beforeAdapter * 1.01, 10);
  });

  it('keeps Clock out of the manual click basis and makes Spark the active choice', () => {
    const clock = unlockedState();
    clock.robo!.lines.thunderhead_coil.owned = 10;
    clock.robo!.firmware.control = 'clock';
    const spark = structuredClone(clock);
    spark.robo!.firmware.control = 'spark';
    expect(getRoboStableRps(clock)).toBeGreaterThan(getRoboStableRps(spark));
    expect(getRoboStableRps(spark) + 2 * getRoboClickPower(spark))
      .toBeGreaterThan(getRoboStableRps(clock) + 2 * getRoboClickPower(clock));
  });
});

describe('RoboGoblins batch production and actions', () => {
  it('conserves unreleased work across a batch boundary', () => {
    const before = integrateRoboLine(0, 0, 8, 32, 7);
    expect(before.paidRG).toBe(0);
    expect(before.pendingRG).toBe(224);
    const released = integrateRoboLine(before.phaseSeconds, before.pendingRG, 8, 32, 1);
    expect(released.paidRG).toBe(256);
    expect(released.pendingRG).toBe(0);
    expect(released.phaseSeconds).toBe(0);
  });

  it('normalizes floating-point dust at an exact batch boundary', () => {
    const almostExact = integrateRoboLine(3.1, 100, 4, 25, 0.9000000000000004);
    expect(almostExact.phaseSeconds).toBe(0);
    expect(almostExact.pendingRG).toBe(0);
    expect(almostExact.paidRG).toBeCloseTo(122.5, 10);
  });

  it('does not retroactively amplify pending work after a mid-batch line purchase', () => {
    let state = unlockedState(0);
    state.robo!.readyRG = 1_000;
    state = purchaseRoboLine(state, 'tin_cradle', 1, 0).state;
    state = tickGame(state, 1_000);
    expect(state.robo!.lines.tin_cradle.pendingRG).toBeCloseTo(0.5, 10);
    const beforeBuy = state.robo!.readyRG;
    const bought = purchaseRoboLine(state, 'tin_cradle', 1, 1_000);
    expect(bought.success).toBe(true);
    const cost = bought.amount;
    const released = tickGame(bought.state, 2_000);
    expect(released.robo!.readyRG - (beforeBuy - cost)).toBeCloseTo(1.5, 10);
  });

  it('advances both worlds over the same root interval and is partition invariant', () => {
    const seed = unlockedState(0);
    seed.buildings.mushroom_nursery = 1;
    seed.robo!.lines.tin_cradle.owned = 1;
    const whole = tickGame(seed, 600_000);
    let segmented = seed;
    for (let second = 1; second <= 600; second += 1) segmented = tickGame(segmented, second * 1_000);
    expect(whole.goblins).toBeCloseTo(segmented.goblins, 8);
    expect(whole.robo!.readyRG).toBeCloseTo(segmented.robo!.readyRG, 8);
    expect(whole.robo!.lines.tin_cradle.pendingRG).toBeCloseTo(segmented.robo!.lines.tin_cradle.pendingRG, 8);
    expect(whole.lastUpdateAt).toBe(600_000);
  });

  it('supports all four firmware combinations and settles cadence pending once', () => {
    for (const control of ['clock', 'spark'] as const) {
      for (const cadence of ['quick', 'heavy'] as const) {
        let state = unlockedState();
        state.robo!.runProducedRG = 1_000_000_000;
        state.robo!.lifetimeProducedRG = 1_000_000_000;
        state.robo!.readyRG = 2_000_000_000;
        state.robo!.lines.tin_cradle.owned = 1;
        state.robo!.lines.tin_cradle.phaseSeconds = 1;
        state.robo!.lines.tin_cradle.pendingRG = 7;
        state = purchaseRoboFirmware(state, 'control', control, 1_000).state;
        const beforeCadence = state.robo!.readyRG;
        const chosen = purchaseRoboFirmware(state, 'cadence', cadence, 1_000);
        expect(chosen.success).toBe(true);
        expect(chosen.state.robo!.firmware).toEqual({ control, cadence });
        expect(chosen.state.robo!.lines.tin_cradle.pendingRG).toBe(0);
        expect(chosen.state.robo!.lines.tin_cradle.phaseSeconds).toBe(0);
        expect(chosen.state.robo!.readyRG).toBe(beforeCadence + 7 - 500_000_000);
        expect(purchaseRoboFirmware(chosen.state, 'cadence', cadence, 1_000).success).toBe(false);
      }
    }
  });

  it('Overclock doubles only its 30-second window and pauses charge refill', () => {
    let state = unlockedState(0);
    state.robo!.lines.tin_cradle.owned = 1;
    state.robo!.capacitor.charge = 120;
    state = activateRoboOverclock(state, 0).state;
    expect(state.robo!.capacitor.charge).toBe(0);
    state = tickGame(state, 150_000);
    expect(state.robo!.lifetimeProducedRG).toBeCloseTo(90, 8);
    expect(state.robo!.capacitor.charge).toBe(120);
    expect(state.robo!.capacitor.overclockEndsAt).toBeNull();
  });

  it('Recompile counts pending exactly once and resets only mechanical run fields', () => {
    const state = unlockedState();
    state.goblins = 777;
    state.buildings.brood_matron = 12;
    state.robo!.lifetimeProducedRG = 9_999_999;
    state.robo!.lines.tin_cradle.owned = 1;
    state.robo!.lines.tin_cradle.pendingRG = 1;
    expect(getRoboRecompileGain(state)).toBe(1);
    const reset = performRoboRecompile(state, 1_000);
    expect(reset.success).toBe(true);
    expect(reset.amount).toBe(1);
    expect(reset.state.robo!.lifetimeProducedRG).toBe(10_000_000);
    expect(reset.state.robo!.kernel.totalCoresEarned).toBe(1);
    expect(reset.state.robo!.kernel.cores).toBe(1);
    expect(reset.state.robo!.kernel.recompiles).toBe(1);
    expect(reset.state.robo!.readyRG).toBe(20);
    expect(reset.state.robo!.lines.tin_cradle.owned).toBe(0);
    expect(reset.state.goblins).toBe(777);
    expect(reset.state.buildings.brood_matron).toBe(12);
    const noGain = performRoboRecompile(reset.state, 1_000);
    expect(noGain.success).toBe(false);
    expect(noGain.state.robo).toEqual(reset.state.robo);
  });

  it('Great Migration preserves the mechanical plane after advancing it to the action timestamp', () => {
    const state = unlockedState(0);
    state.lifetimeGoblins = 5_000_000;
    state.runGoblins = 5_000_000;
    state.robo!.lines.tin_cradle.owned = 1;
    state.robo!.capacitor.charge = 120;
    const overclocked = activateRoboOverclock(state, 0).state;
    const migrated = performPrestigeReset(overclocked, 1_000);
    expect(migrated.success).toBe(true);
    expect(migrated.state.prestige.resets).toBe(1);
    expect(migrated.state.robo!.lines.tin_cradle.owned).toBe(1);
    expect(migrated.state.robo!.lines.tin_cradle.pendingRG).toBeCloseTo(1, 10);
    expect(migrated.state.robo!.capacitor.overclockEndsAt).toBe(30_000);
  });

  it('grants Boot Cache and Warm Start exactly once per successful rank purchase', () => {
    const state = unlockedState();
    state.robo!.kernel.totalCoresEarned = 20;
    state.robo!.kernel.cores = 20;
    const startingReady = state.robo!.readyRG;
    const boot = purchaseKernelPerk(state, 'boot_cache', 1_000);
    expect(boot.success).toBe(true);
    expect(boot.amount).toBe(2);
    expect(boot.state.robo!.readyRG).toBe(startingReady + 100);
    const warm = purchaseKernelPerk(boot.state, 'warm_start', 1_000);
    expect(warm.success).toBe(true);
    expect(warm.state.robo!.capacitor.charge).toBe(30);
    expect(getKernelPerkCost(warm.state, 'boot_cache')).toBe(4);
    const roundTrip = deserializeGame(serializeGame(warm.state), 1_000).state;
    expect(roundTrip.robo!.readyRG).toBe(startingReady + 100);
    expect(roundTrip.robo!.capacitor.charge).toBe(30);
  });

  it('awards mechanical achievements without production multipliers from appearance', () => {
    let state = unlockedState();
    state = assembleRoboGoblin(state, 1_000).state;
    expect(state.robo!.achievements.rg_first_spark).toBe(1_000);
    const before = getRoboStableRps(state);
    expect(before).toBe(0);
    state.robo!.readyRG = 1_000;
    const bought = purchaseRoboLine(state, 'tin_cradle', 1, 1_000);
    expect(bought.state.robo!.achievements.rg_unattended).toBe(1_000);
  });

  it('purchases local and global blueprints sequentially', () => {
    const state = unlockedState();
    state.robo!.readyRG = 1e9;
    state.robo!.lines.tin_cradle.owned = 10;
    const local = purchaseRoboBlueprint(state, 'tin_cradle_stolen_plans', 1_000);
    expect(local.success).toBe(true);
    expect(local.state.robo!.lines.tin_cradle.blueprintRank).toBe(1);
    const skipped = purchaseRoboBlueprint(local.state, 'tin_cradle_recursive_tooling', 1_000);
    expect(skipped.success).toBe(false);
    const global = purchaseRoboBlueprint(local.state, 'common_thread', 1_000);
    expect(global.success).toBe(true);
    expect(global.state.robo!.globalBlueprintRank).toBe(1);
  });
});

describe('RoboGoblins offline and save behavior', () => {
  it('credits each world with its own offline policy and shared root timestamp', () => {
    const state = unlockedState(0);
    state.buildings.mushroom_nursery = 1;
    state.robo!.lines.tin_cradle.owned = 1;
    const twelveHours = 12 * 60 * 60 * 1_000;
    const result = applyOfflineProgress(state, twelveHours);
    expect(result.progress.creditedMs).toBe(8 * 60 * 60 * 1_000);
    expect(result.progress.goblinsProduced).toBeCloseTo(8 * 60 * 60 * 0.75, 8);
    expect(result.roboProgress?.creditedMs).toBe(8 * 60 * 60 * 1_000);
    expect(result.roboProgress?.producedRG).toBeCloseTo(0.5 * 8 * 60 * 60 * 0.8, 8);
    expect(result.state.lastUpdateAt).toBe(twelveHours);
  });

  it('lets robot offline perks reach 24 hours and 100% without changing Warren cap', () => {
    const state = unlockedState(0);
    state.buildings.mushroom_nursery = 1;
    state.robo!.lines.tin_cradle.owned = 1;
    state.robo!.kernel.perks.night_shift = 4;
    state.robo!.kernel.perks.deep_battery = 8;
    state.robo!.kernel.totalCoresEarned = 1_000;
    const result = applyOfflineProgress(state, 30 * 60 * 60 * 1_000);
    expect(result.progress.creditedMs).toBe(8 * 60 * 60 * 1_000);
    expect(result.roboProgress?.creditedMs).toBe(24 * 60 * 60 * 1_000);
    expect(result.roboProgress?.efficiency).toBe(1);
    expect(result.roboProgress?.producedRG).toBeCloseTo(0.5 * 24 * 60 * 60 * (1 + 0.1 * 1_000), 5);
  });

  it('migrates v5 saves to a locked/null mechanical plane', () => {
    const state = createInitialGameState(1_000, 7);
    const parsed = JSON.parse(serializeGame(state)) as { version: number; state: Record<string, unknown> };
    parsed.version = 5;
    parsed.state.version = 5;
    parsed.state.unlocks = { robogoblins: true };
    parsed.state.robo = { readyRG: 999_999 };
    const loaded = deserializeGame(JSON.stringify(parsed), 1_000);
    expect(loaded.migratedFrom).toBe(5);
    expect(loaded.state.unlocks.robogoblins).toBe(false);
    expect(loaded.state.robo).toBeNull();
    expect(loaded.state.version).toBe(6);
  });

  it('round-trips v6 mechanical state without replaying grants', () => {
    const state = unlockedState();
    state.robo!.readyRG = 4321.5;
    state.robo!.runProducedRG = 2_000;
    state.robo!.lifetimeProducedRG = 9_000;
    state.robo!.lines.cutlery_press.owned = 12;
    state.robo!.lines.cutlery_press.blueprintRank = 1;
    state.robo!.lines.cutlery_press.phaseSeconds = 3.5;
    state.robo!.lines.cutlery_press.pendingRG = 112;
    state.robo!.kernel.totalCoresEarned = 8;
    state.robo!.kernel.cores = 6;
    state.robo!.kernel.perks.boot_cache = 1;
    const loaded = deserializeGame(serializeGame(state), 1_000).state;
    expect(loaded.robo!.readyRG).toBe(4321.5);
    expect(loaded.robo!.lines.cutlery_press).toEqual(state.robo!.lines.cutlery_press);
    expect(loaded.robo!.kernel.perks.boot_cache).toBe(1);
    expect(loaded.robo!.kernel.cores).toBe(6);
  });

  it('drops locked mechanical payloads and recovers unlocked corrupt state', () => {
    const locked = createInitialGameState(1_000, 7);
    const lockedParsed = JSON.parse(serializeGame(locked)) as { state: Record<string, unknown> };
    lockedParsed.state.robo = { readyRG: 999 };
    const dropped = deserializeGame(JSON.stringify(lockedParsed), 1_000);
    expect(dropped.state.robo).toBeNull();
    expect(dropped.warnings.some((warning) => warning.includes('Locked RoboGoblins'))).toBe(true);

    const unlocked = createInitialGameState(1_000, 7);
    const unlockedParsed = JSON.parse(serializeGame(unlocked)) as { state: Record<string, unknown> };
    unlockedParsed.state.unlocks = { robogoblins: true };
    unlockedParsed.state.robo = null;
    const recovered = deserializeGame(JSON.stringify(unlockedParsed), 1_000);
    expect(recovered.state.unlocks.robogoblins).toBe(true);
    expect(recovered.state.robo?.readyRG).toBe(20);
    expect(recovered.warnings.some((warning) => warning.includes('empty mechanical run'))).toBe(true);
  });

  it('retains valid Kernel permanence when recovering missing mechanical run fields', () => {
    const state = unlockedState();
    const parsed = JSON.parse(serializeGame(state)) as { state: { robo: Record<string, unknown> } };
    parsed.state.robo = {
      kernel: {
        cores: 4,
        totalCoresEarned: 10,
        recompiles: 1,
        perks: { boot_cache: 1, warm_start: 1 },
      },
    };
    const recovered = deserializeGame(JSON.stringify(parsed), 1_000).state;
    expect(recovered.robo!.kernel.perks.boot_cache).toBe(1);
    expect(recovered.robo!.kernel.perks.warm_start).toBe(1);
    expect(recovered.robo!.readyRG).toBe(120);
    expect(recovered.robo!.capacitor.charge).toBe(30);
  });

  it('sanitizes unknown firmware, ranks, phase and impossible Kernel wallet', () => {
    const state = unlockedState();
    const parsed = JSON.parse(serializeGame(state)) as { state: { robo: Record<string, unknown> } };
    const robo = parsed.state.robo;
    robo.firmware = { control: 'hacked', cadence: 'quick' };
    robo.kernel = { cores: 999, totalCoresEarned: 3, recompiles: -2, perks: { better_bolts: 99, hacked: 99 } };
    robo.lines = { tin_cradle: { owned: 10.9, blueprintRank: 99, phaseSeconds: 999, pendingRG: 5 } };
    const loaded = deserializeGame(JSON.stringify(parsed), 1_000).state;
    expect(loaded.robo!.firmware.control).toBeNull();
    expect(loaded.robo!.firmware.cadence).toBe('quick');
    expect(loaded.robo!.lines.tin_cradle.owned).toBe(10);
    expect(loaded.robo!.lines.tin_cradle.blueprintRank).toBe(3);
    expect(loaded.robo!.lines.tin_cradle.phaseSeconds).toBeLessThan(1);
    expect(loaded.robo!.kernel.cores).toBeLessThanOrEqual(loaded.robo!.kernel.totalCoresEarned);
  });
});
