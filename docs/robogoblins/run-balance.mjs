import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { TUNING, LINES, KERNEL_PERKS, createState, simulate, recompile, totalRate, bulkCost, perkCost, cunningThreshold } from './balance-model.mjs';

const out = name => fileURLToPath(new URL(name, import.meta.url));
const time = s => s === null || s === undefined ? 'Not reached' : `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
const number = n => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
const scenarios = [
  ['Passive, decisions every 10s', {}],
  ['2 clicks/s throughout, Spark, Overclock', { clicksPerSecond: 2, policy: 'spark', useOverclock: true }],
  ['2 clicks/s for opening 2m, Clock, Overclock', { clicksPerSecond: 2, activeSeconds: 120, useOverclock: true }],
  ['Passive, decisions every 60s', { decisionSeconds: 60 }],
  ['Passive, decisions every 5m', { decisionSeconds: 300 }],
  ['Passive, single-unit candidate policy', { strategy: 'single' }],
  ['Passive, output −20%', { initial: createState({ blueprintMultiplier: 0.8 }) }],
  ['Passive, output +20%', { initial: createState({ blueprintMultiplier: 1.2 }) }],
  ['Passive, actual entry bridge +2%', { initial: createState({ blueprintMultiplier: 1.02 }) }],
  ['Passive, Quick cadence', { cadence: 'quick' }],
];
const results = scenarios.map(([name, options]) => {
  const r = simulate(options);
  return { name, options, seconds: r.elapsed, coreTimes: r.coreTimes, firstCircuit: r.firstCircuit, firstOwned: r.firstOwned, counts: r.state.counts, stableRate: totalRate(r.state), lifetime: r.state.lifetime, pending: r.state.pending.reduce((a, b) => a + b, 0) };
});
const first = simulate();
const reset = recompile(first.state);
reset.perks.better_bolts = 2; reset.perks.boot_cache = 1; reset.stock += 100; reset.cores -= 5;
const second = simulate({ initial: reset });
const noSpend = simulate({ initial: recompile(first.state) });
const deep = simulate({ hours: 8, stopAtTarget: false });
const offlineSeed = simulate({ hours: 1 / 6, stopAtTarget: false }).state;
const { advance } = await import('./balance-model.mjs');
const offline = structuredClone(offlineSeed);
const beforeOffline = offline.lifetime + offline.pending.reduce((a, b) => a + b, 0);
advance(offline, 12 * 3600, { offline: true });
const thresholds = [1, 4, 8, 16, 32, 64, 128, 512, 2048];
const maxPerksCost = KERNEL_PERKS.reduce((sum, perk) => sum + Array.from({ length: perk.max }, (_, r) => perkCost(perk, r)).reduce((a, b) => a + b, 0), 0);
const document = `# RoboGoblins balance report

Generated from the design-only reference model. Re-run <code>node docs/robogoblins/run-balance.mjs</code>. Assertions: <code>node --test docs/robogoblins/balance.test.mjs</code>. These files do not modify or exercise the shipped game engine.

## Method and limits

The player model starts with 20 RG, buys the first producer at time zero, advances batch payouts in one-second steps, and considers purchases every 10 seconds unless stated otherwise. It compares single units, the next local ownership milestone, eligible line blueprints and sequential global research. Candidate score is <code>wait-to-afford + price / marginal stable RG/s + half the base cycle</code>, within a 300-second saving horizon. It can perform multiple purchases per visit. Policies are bought when eligible and affordable. This is a reproducible heuristic, not an optimizer or a human session.

Clock and Heavy are defaults. Continuous 2 clicks/s is an upper-attention benchmark (thousands of clicks), not a required play pattern. Overclock scenarios activate it whenever available. No scenario auto-recompiles before its target. Baseline omits cross-plane bonuses to establish an isolated floor; the +2% row includes the actual minimum-entry heritage bonus. No random events, contract rewards, sales, future cosmetics, Warren production simulation, input latency, or reading time are modeled. Firmware purchase candidates use stable passive ROI rather than future manual income. Their buying policy is not proven optimal.

## First Recompile: eight newly claimable cores

Recompile preview includes already manufactured, unreleased batches. Consequently the reported delivered lifetime may be below the threshold; delivered lifetime plus pending must meet it.

| Scenario | First core | Four cores | Eight cores | First closed circuit |
| --- | ---: | ---: | ---: | ---: |
${results.map(r => `| ${r.name} | ${time(r.coreTimes[1])} | ${time(r.coreTimes[4])} | ${time(r.seconds)} | ${time(r.firstCircuit)} |`).join('\n')}

The baseline reaches eight cores in **${time(first.elapsed)}**. This supports a 15–45 minute laboratory target for frequent reinvestment and roughly an hour with sparse visits; it does not establish player completion time. The milestone-aware policy uses ${number((1 - first.elapsed / results[5].seconds) * 100)}% less time than the single-unit heuristic (the latter takes ${time(results[5].seconds)}). Comparing these policies demonstrates an opportunity for milestones, not that every bulk purchase is superior.

## Recompile recovery

| Starting from the first eight-core Recompile | Time to eight additional cores |
| --- | ---: |
| Keep all eight cores, innate ×1.8 output | ${time(noSpend.elapsed)} |
| Spend five: Better Bolts rank 2 and Boot Cache rank 1; keep three | ${time(second.elapsed)} |

The five-core plan applies ×1.10 additional passive output and an immediate 100 RG starter grant that does not count toward prestige. The second threshold is cumulative 16 cores (${number(TUNING.coreScale * 16 ** 3)} lifetime RG), not another fresh eight-core threshold. Second-run improvement with purchases: ${number(100 * (1 - second.elapsed / first.elapsed))}% less time than the first run. Spending does not reduce the innate ×1.8 multiplier.

## Producer ladder and observed unlocks

Eight-hour no-reset baseline, same purchase heuristic; these are first purchases, not all upgrades completed. The final producer is reached at **${time(deep.firstOwned[11])}**. A player who recompiles will follow a different path.

| Expansion | First cost (RG) | Average RG/s | Batch seconds | First-unit raw payback | First owned in baseline |
| --- | ---: | ---: | ---: | ---: | ---: |
${LINES.map((b, i) => `| ${b.name} | ${number(b.cost)} | ${number(b.rate)} | ${b.cycle} | ${time(b.cost / b.rate)} | ${time(deep.firstOwned[i])} |`).join('\n')}

Raw payback excludes mastery, blueprints, circuits, firmware and cores. Its increase is intentional: thresholds and Recompile must carry the later curve. Eight-hour baseline ends at ${number(deep.state.lifetime)} delivered RG and ${number(totalRate(deep.state))} stable RG/s, with counts <code>${deep.state.counts.join(', ')}</code>. This is a frontier sample, not a duration promised for the chapter or evidence of endless-game balance.

## Prestige and permanent upgrade budgets

| Total earned cores | Lifetime RG required | Innate production multiplier |
| ---: | ---: | ---: |
${thresholds.map(n => `| ${n} | ${number(TUNING.coreScale * n ** 3)} | ×${number(1 + 0.1 * n)} |`).join('\n')}

Each core threshold grows cubically; repeated claims at unchanged lifetime yield zero. Core totals cap at 1,000,000,000 for safe integer bookkeeping; this is far past the designed content horizon. The associated RG threshold is 1e34. Do not infer robust floating-point behavior at arbitrary imported magnitudes from this model.

| Kernel upgrade | Rank costs | Total to max |
| --- | --- | ---: |
${KERNEL_PERKS.map(p => `| ${p.name} | ${Array.from({ length: p.max }, (_, r) => perkCost(p, r)).join(', ')} | ${number(Array.from({ length: p.max }, (_, r) => perkCost(p, r)).reduce((a, b) => a + b, 0))} |`).join('\n')}

All eight permanent tracks total **${number(maxPerksCost)} cores**. Maxing them is a collection goal; a full optimal multi-Recompile schedule has not been simulated.

## Entry price in the current game

The Mechanical Charter costs 100 current Ancestral Cunning after the player has revealed all twelve default Warren buildings. That reveal is latched permanently, so a later Great Migration cannot hide the purchase option again. There is no migration-count or total-earned-Cunning gate. This report therefore treats entry timing as an organic-game progression/playtest question rather than deriving it from a Cunning threshold.

## Analytic checks

- **Batch conservation:** 32 RG/s over eight seconds produces 256 RG. At seven seconds, 224 are pending; nothing has been delivered. A rate change from 10 to 100 halfway through pays 440, not 800.
- **Milestone at 100:** local output ×48; three purchased local blueprints add ×8, giving ×384 before global effects. At 300, local mastery is ×3,456. These are separate factors, not additive percentages.
- **Closed circuit:** three groups × four tiers ×10% yields a maximum base network ×2.2. Copper Memory rank five raises the increment to 15%, giving ×2.8. The perk strengthens the bonus, not the entire ×2.2 multiplier.
- **Old-line value:** at counts [9,10,10,10] for the first circuit, buying Tin Cradle number 10 costs ${bulkCost({ ...createState(), counts: [9,10,10,10,0,0,0,0,0,0,0,0] }, 0, 1)} RG and increases the output of all lines by closing that circuit, in addition to its local milestone. This prevents its value from being determined solely by its base 0.5 RG/s.
- **Overclock:** double output for 30 seconds, then 120 seconds of refill, gives (60 + 120) / 150 = ×1.20 long-run passive output with perfect activation and constant production. It never boosts the base used for manual spawning. The bound is not a forecast of compounded progression speed.
- **Clock vs Spark:** let P be stable passive output before the firmware choice, and c clicks/s. Clock yields 1.2P + c(1 + .03P); Spark yields P + c(1 + .15P). The crossover is c = 5/3 clicks/s before Finger Servos. With r servo ranks it is 5/[3(1 + .1r)]. If Overclock operates at a long-run factor O, the crossover becomes 5O/[3(1 + .1r)]. With perfect Overclock, rank zero crosses at two clicks/s, so the two active policies tie in a constant-state average there; purchase timing still differs.
- **Cadence:** Quick halves payout intervals and preserves average output. Heavy doubles intervals and gives +15% average output. At 32 seconds a Walking Foundry on Quick has paid; Heavy has not. At 128 seconds Heavy has produced 15% more. This is an intentional liquidity-versus-throughput choice, not equal idle yield.
- **Cross-plane caps:** ancestry grants at most +10% Robo passive production; Family Adapter grants at most +25% Warren base passive production. These depend on finite earned-currency thresholds and do not recursively feed each other’s instantaneous output. Long-term feedback remains, but each factor is capped.
- **Offline sample:** after ten minutes of baseline play, stable output is ${number(totalRate(offlineSeed))} RG/s. Twelve hours away credits eight hours at 80%, creating ${number(offline.lifetime + offline.pending.reduce((a, b) => a + b, 0) - beforeOffline)} RG including pending work. No reinvestment or automatic Overclock occurs offline.

## Before shipping

Port the equations into actual pure engine functions and re-run the fixtures against them. Add save migration, timestamp rollback, multi-tab browser ownership, actual dual-plane advancement, and UI tests; the design model does not implement those systems. Human playtests should measure first automation, waiting between useful purchases, eight-core recovery, time to Paradox Nest, policy use and whether old lines remain attractive after the third circuit opens. Tune from those observations, preserving the accounting invariants.
`;
writeFileSync(out('BALANCE_REPORT.md'), document);
writeFileSync(out('balance-results.json'), JSON.stringify({ modelVersion: 1, results, recovery: { noSpend: noSpend.elapsed, fiveCorePlan: second.elapsed }, deepRun: { firstOwned: deep.firstOwned, lifetime: deep.state.lifetime, counts: deep.state.counts }, maxPerksCost }, null, 2) + '\n');
console.log(`Wrote BALANCE_REPORT.md and balance-results.json; ${results.length} first-run scenarios, recovery variants and an eight-hour frontier sample.`);
