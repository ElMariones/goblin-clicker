import test from 'node:test';
import assert from 'node:assert/strict';
import { TUNING, LINES, MILESTONES, KERNEL_PERKS, createState, corePotential, coreGain, cunningThreshold,
  perkCost, mastery, circuitLevels, rates, totalRate, clickPower, bulkCost, integrateLine, advance, recompile, simulate } from './balance-model.mjs';

const near = (a, b) => assert.ok(Math.abs(a - b) <= Math.max(1e-7, Math.abs(b) * 1e-10), `${a} ≈ ${b}`);
test('organic Cunning threshold helper maps lifetime prestige independently of remaining wallet', () => {
  assert.equal(cunningThreshold(TUNING.permitLifetimeCunning), 31_250_000_000_000);
  assert.equal(Math.floor(Math.sqrt(cunningThreshold(2500) / 5000000)), 2500);
  assert.equal(TUNING.permitCost / TUNING.permitLifetimeCunning, 0.04);
});
test('first autonomous producer costs exactly the one-time starter stock', () => {
  const s = createState(); assert.equal(bulkCost(s, 0, 1), s.stock);
  s.counts[0] = 1; assert.equal(totalRate(s), 0.5);
});
test('all 12 expansions have strictly rising cost and average output', () => {
  assert.equal(LINES.length, 12);
  for (let i = 1; i < LINES.length; i++) { assert.ok(LINES[i].cost > LINES[i - 1].cost); assert.ok(LINES[i].rate > LINES[i - 1].rate); }
});
test('geometric bulk price matches raw individual prices with one final rounding', () => {
  const s = createState();
  for (let i = 0; i < 12; i++) for (const n of [1, 10, 25, 100]) for (const owned of [0, 9, 49, 100]) {
    s.counts[i] = owned;
    const raw = Array.from({ length: n }, (_, j) => LINES[i].cost * TUNING.growth ** (owned + j)).reduce((a, b) => a + b, 0);
    near(bulkCost(s, i, n), Math.ceil(raw - 1e-9));
  }
});
test('bulk costs and mastery stay finite across the designed 0–300 ownership range', () => {
  const s = createState();
  for (let n = 0; n <= 300; n++) {
    s.counts.fill(n);
    assert.ok(Number.isFinite(totalRate(s)));
    LINES.forEach((_, i) => assert.ok(Number.isFinite(bulkCost(s, i, 100))));
  }
});
test('mastery multiplies cumulatively at exact ownership boundaries', () => {
  let multiplier = 1;
  for (const [n, m] of MILESTONES) { near(mastery(n - 1), multiplier); multiplier *= m; near(mastery(n), multiplier); }
  assert.equal(mastery(100), 48); assert.equal(mastery(300), 3456);
});
test('circuits require all four distinct member types and are bounded', () => {
  const s = createState(); s.counts[0] = 100000; assert.deepEqual(circuitLevels(s), [0, 0, 0]);
  s.counts.fill(100); assert.deepEqual(circuitLevels(s), [4, 4, 4]);
  const baseline = totalRate(s); s.perks.copper_memory = 5;
  near(totalRate(s) / baseline, 2.8 / 2.2);
});
test('a nearly complete circuit can make an old expansion a valuable marginal purchase', () => {
  const s = createState(); s.counts = [9, 10, 10, 10, 0, 0, 0, 0, 0, 0, 0, 0];
  const before = totalRate(s); const cost = bulkCost(s, 0, 1); s.counts[0]++;
  assert.ok((totalRate(s) - before) / cost > 1);
});
test('cube-root core thresholds have no repeat claim and no early floating-point unlock', () => {
  for (const n of [1, 4, 8, 16, 100, 1000]) {
    const threshold = TUNING.coreScale * n ** 3;
    assert.equal(corePotential(threshold * (1 - 1e-12)), n - 1);
    assert.equal(corePotential(threshold), n);
    assert.equal(corePotential(threshold * (1 + 1e-12)), n);
    assert.equal(coreGain({ lifetime: threshold, earned: n }), 0);
  }
  assert.equal(corePotential(1e300), 1_000_000_000);
});
test('spending cores never reduces the passive earned-core multiplier', () => {
  const s = createState({ earned: 8 }); s.counts[0] = 1;
  const before = totalRate(s); s.cores = 0; assert.equal(totalRate(s), before);
  near(before, 0.9);
});
test('no-gain Recompile has no side effects', () => {
  const s = createState(); s.pending[0] = 17;
  const before = structuredClone(s); assert.equal(recompile(s), null); assert.deepEqual(s, before);
});
test('Recompile drains pending exactly once and does not count starter grants as generated RG', () => {
  const s = createState({ lifetime: 9999999 }); s.pending[0] = 1;
  const next = recompile(s); assert.ok(next);
  assert.equal(next.earned, 1); assert.equal(next.lifetime, 10000000);
  assert.equal(next.run, 0); assert.equal(next.stock, 20);
  assert.equal(recompile(next), null); assert.equal(next.pending.reduce((a, b) => a + b, 0), 0);
});
test('Kernel ranks have finite maxima and concrete lifetime costs', () => {
  for (const perk of KERNEL_PERKS) {
    for (let r = 0; r < perk.max; r++) assert.ok(Number.isSafeInteger(perkCost(perk, r)));
    assert.equal(perkCost(perk, perk.max), Infinity);
  }
  assert.equal(perkCost(KERNEL_PERKS[0], 0) + perkCost(KERNEL_PERKS[0], 1) + perkCost(KERNEL_PERKS[1], 0), 5);
});
test('batch output is unavailable before release and conserves manufactured RG', () => {
  let a = integrateLine(0, 0, 8, 32, 7);
  assert.equal(a.paid, 0); assert.equal(a.pending, 224);
  a = integrateLine(a.phase, a.pending, 8, 32, 1);
  assert.equal(a.paid, 256); assert.equal(a.pending, 0); assert.equal(a.phase, 0);
});
test('changing output mid-batch does not retroactively amplify accrued stock', () => {
  const a = integrateLine(0, 0, 8, 10, 4);
  const b = integrateLine(a.phase, a.pending, 8, 100, 4);
  assert.equal(b.paid, 440);
});
test('batch integration is partition invariant for a range of cycles and rate changes', () => {
  for (const cycle of [1, 2, 4, 8, 16, 32, 64, 128]) {
    const whole = integrateLine(0.37, 6, cycle, 19.7, 10000.25);
    let phase = 0.37; let pending = 6; let paid = 0;
    for (let i = 0; i < 40001; i++) {
      const x = integrateLine(phase, pending, cycle, 19.7, 0.25);
      phase = x.phase; pending = x.pending; paid += x.paid;
    }
    near(whole.paid, paid); near(whole.pending, pending); near(whole.phase, phase);
  }
});
test('two online tabs are an attention choice: both independent economic states can advance', () => {
  // Algebra/model test only. Production wiring to the actual Warren remains an implementation gate.
  const a = createState(); const b = createState(); a.counts[0] = 1; b.counts[1] = 1;
  advance(a, 60); advance(b, 60); assert.equal(a.run, 30); assert.equal(b.run, 240);
});
test('offline cap and efficiency apply once; old pending stock retains its value', () => {
  const s = createState(); s.counts[0] = 1; s.phase[0] = 1; s.pending[0] = 0.5;
  advance(s, 24 * 3600, { offline: true });
  near(s.run + s.pending[0], 0.5 + 0.5 * 8 * 3600 * 0.8);
  const upgraded = createState({ perks: { night_shift: 4, deep_battery: 8 } }); upgraded.counts[0] = 1;
  advance(upgraded, 48 * 3600, { offline: true }); near(upgraded.run, 0.5 * 24 * 3600);
});
test('overclock ends at its boundary and its refill cannot overlap its duration', () => {
  const s = createState(); s.counts[0] = 1; s.overclockLeft = 30;
  advance(s, 150); near(s.run, 90); assert.equal(s.charge, 120);
  near(s.run / (0.5 * 150), 1.2);
});
test('offline dismisses overclock and never replays unattended activations', () => {
  const s = createState(); s.counts[0] = 1; s.overclockLeft = 30;
  advance(s, 150, { offline: true }); near(s.run, 60); assert.equal(s.overclockLeft, 0);
});
test('clock and spark have an explicit activity crossover and clicks ignore overclock', () => {
  const a = createState(); a.counts[8] = 10; const b = structuredClone(a);
  a.policy = 'clock'; b.policy = 'spark';
  assert.ok(totalRate(a) > totalRate(b));
  assert.ok(totalRate(b) + 2 * clickPower(b) > totalRate(a) + 2 * clickPower(a));
  near(totalRate(a) + (5 / 3) * clickPower(a), totalRate(b) + (5 / 3) * clickPower(b));
  const click = clickPower(b); b.overclockLeft = 30; assert.equal(clickPower(b), click);
});
test('quick cadence buys liquidity; heavy cadence buys long-run throughput', () => {
  const a = createState(); a.counts[7] = 1; a.cadence = 'quick'; const b = structuredClone(a); b.cadence = 'heavy';
  advance(a, 32); advance(b, 32); assert.ok(a.run > b.run);
  advance(a, 96); advance(b, 96); near(b.run / a.run, 1.15);
});
test('family bridges are bounded and depend on earned totals rather than current currencies', () => {
  const toRobo = c => 1 + 0.02 * [2500, 10000, 100000, 1000000, 10000000].filter(n => c >= n).length;
  const toWarren = (k, r) => 1 + 0.01 * r * [8, 32, 128, 512, 2048].filter(n => k >= n).length;
  assert.equal(toRobo(0), 1); near(toRobo(1e100), 1.1); near(toWarren(1e100, 5), 1.25);
});
test('deterministic first Recompile reaches eight cores within the proposed 15–45 minute lab window', () => {
  const result = simulate(); assert.ok(result.elapsed >= 900 && result.elapsed <= 2700);
  assert.ok(result.firstCircuit !== null); assert.ok(result.firstOwned[6] !== null);
});
test('milestone-aware reinvestment beats a single-purchase heuristic in this fixture', () => {
  assert.ok(simulate().elapsed < simulate({ strategy: 'single' }).elapsed);
});
test('first five-core permanent purchase plan shortens the next eight-core climb', () => {
  const first = simulate(); const next = recompile(first.state);
  next.perks.better_bolts = 2; next.perks.boot_cache = 1; next.cores -= 5;
  next.stock += 100; // Mid-run Boot Cache purchase grants only its incremental starting stock.
  const second = simulate({ initial: next }); assert.ok(second.elapsed < first.elapsed);
  assert.ok(coreGain({ ...second.state, lifetime: second.state.lifetime + second.state.pending.reduce((a, b) => a + b, 0) }) >= 8);
});
