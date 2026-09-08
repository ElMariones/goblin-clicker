# RoboGoblins balance report

Generated from the design-only reference model. Re-run <code>node docs/robogoblins/run-balance.mjs</code>. Assertions: <code>node --test docs/robogoblins/balance.test.mjs</code>. These files do not modify or exercise the shipped game engine.

## Method and limits

The player model starts with 20 RG, buys the first producer at time zero, advances batch payouts in one-second steps, and considers purchases every 10 seconds unless stated otherwise. It compares single units, the next local ownership milestone, eligible line blueprints and sequential global research. Candidate score is <code>wait-to-afford + price / marginal stable RG/s + half the base cycle</code>, within a 300-second saving horizon. It can perform multiple purchases per visit. Policies are bought when eligible and affordable. This is a reproducible heuristic, not an optimizer or a human session.

Clock and Heavy are defaults. Continuous 2 clicks/s is an upper-attention benchmark (thousands of clicks), not a required play pattern. Overclock scenarios activate it whenever available. No scenario auto-recompiles before its target. Baseline omits cross-plane bonuses to establish an isolated floor; the +2% row includes the actual minimum-entry heritage bonus. No random events, contract rewards, sales, future cosmetics, Warren production simulation, input latency, or reading time are modeled. Firmware purchase candidates use stable passive ROI rather than future manual income. Their buying policy is not proven optimal.

## First Recompile: eight newly claimable cores

Recompile preview includes already manufactured, unreleased batches. Consequently the reported delivered lifetime may be below the threshold; delivered lifetime plus pending must meet it.

| Scenario | First core | Four cores | Eight cores | First closed circuit |
| --- | ---: | ---: | ---: | ---: |
| Passive, decisions every 10s | 14m 37s | 21m 28s | 27m 15s | 11m 40s |
| 2 clicks/s throughout, Spark, Overclock | 10m 27s | 16m 1s | 20m 37s | 8m 30s |
| 2 clicks/s for opening 2m, Clock, Overclock | 10m 45s | 16m 29s | 21m 11s | 8m 50s |
| Passive, decisions every 60s | 19m 7s | 26m 54s | 33m 31s | 16m 0s |
| Passive, decisions every 5m | 36m 21s | 50m 0s | 57m 33s | 35m 0s |
| Passive, single-unit candidate policy | 18m 20s | 28m 16s | 35m 37s | 16m 30s |
| Passive, output −20% | 17m 42s | 26m 4s | 33m 3s | 14m 10s |
| Passive, output +20% | 12m 9s | 17m 49s | 22m 34s | 9m 50s |
| Passive, actual entry bridge +2% | 14m 22s | 21m 4s | 26m 43s | 12m 0s |
| Passive, Quick cadence | 14m 37s | 21m 28s | 27m 38s | 11m 40s |

The baseline reaches eight cores in **27m 15s**. This supports a 15–45 minute laboratory target for frequent reinvestment and roughly an hour with sparse visits; it does not establish player completion time. The milestone-aware policy uses 23.49% less time than the single-unit heuristic (the latter takes 35m 37s). Comparing these policies demonstrates an opportunity for milestones, not that every bulk purchase is superior.

## Recompile recovery

| Starting from the first eight-core Recompile | Time to eight additional cores |
| --- | ---: |
| Keep all eight cores, innate ×1.8 output | 19m 37s |
| Spend five: Better Bolts rank 2 and Boot Cache rank 1; keep three | 17m 22s |

The five-core plan applies ×1.10 additional passive output and an immediate 100 RG starter grant that does not count toward prestige. The second threshold is cumulative 16 cores (40,960,000,000 lifetime RG), not another fresh eight-core threshold. Second-run improvement with purchases: 36.27% less time than the first run. Spending does not reduce the innate ×1.8 multiplier.

## Producer ladder and observed unlocks

Eight-hour no-reset baseline, same purchase heuristic; these are first purchases, not all upgrades completed. The final producer is reached at **136m 40s**. A player who recompiles will follow a different path.

| Expansion | First cost (RG) | Average RG/s | Batch seconds | First-unit raw payback | First owned in baseline |
| --- | ---: | ---: | ---: | ---: | ---: |
| Tin Cradle | 20 | 0.5 | 2 | 0m 40s | 0m 0s |
| Wind-up Workbench | 160 | 4 | 4 | 0m 40s | 3m 10s |
| Cutlery Press | 2,000 | 32 | 8 | 1m 3s | 7m 10s |
| Magnet Nursery | 26,000 | 240 | 16 | 1m 48s | 9m 30s |
| Boiler Brood | 350,000 | 1,800 | 8 | 3m 14s | 13m 10s |
| Punchcard Den | 5,000,000 | 13,000 | 16 | 6m 25s | 18m 40s |
| Servo Scriptorium | 80,000,000 | 95,000 | 32 | 14m 2s | 24m 30s |
| Walking Foundry | 1,400,000,000 | 700,000 | 64 | 33m 20s | 32m 30s |
| Thunderhead Coil | 28,000,000,000 | 5,200,000 | 16 | 89m 45s | 47m 30s |
| Moonwire Loom | 600,000,000,000 | 40,000,000 | 32 | 250m 0s | 69m 20s |
| Clockwyrm Assembly | 14,000,000,000,000 | 320,000,000 | 64 | 729m 10s | 94m 0s |
| Paradox Nest | 350,000,000,000,000 | 2,600,000,000 | 64 | 2243m 35s | 136m 40s |

Raw payback excludes mastery, blueprints, circuits, firmware and cores. Its increase is intentional: thresholds and Recompile must carry the later curve. Eight-hour baseline ends at 398,543,689,537,458,900 delivered RG and 58,229,873,395,470 stable RG/s, with counts <code>150, 150, 150, 123, 119, 113, 107, 101, 77, 69, 55, 33</code>. This is a frontier sample, not a duration promised for the chapter or evidence of endless-game balance.

## Prestige and permanent upgrade budgets

| Total earned cores | Lifetime RG required | Innate production multiplier |
| ---: | ---: | ---: |
| 1 | 10,000,000 | ×1.1 |
| 4 | 640,000,000 | ×1.4 |
| 8 | 5,120,000,000 | ×1.8 |
| 16 | 40,960,000,000 | ×2.6 |
| 32 | 327,680,000,000 | ×4.2 |
| 64 | 2,621,440,000,000 | ×7.4 |
| 128 | 20,971,520,000,000 | ×13.8 |
| 512 | 1,342,177,280,000,000 | ×52.2 |
| 2048 | 85,899,345,920,000,000 | ×205.8 |

Each core threshold grows cubically; repeated claims at unchanged lifetime yield zero. Core totals cap at 1,000,000,000 for safe integer bookkeeping; this is far past the designed content horizon. The associated RG threshold is 1e34. Do not infer robust floating-point behavior at arbitrary imported magnitudes from this model.

| Kernel upgrade | Rank costs | Total to max |
| --- | --- | ---: |
| Better Bolts | 1, 2, 4, 8, 16, 32, 64, 128, 256, 512 | 1,023 |
| Boot Cache | 2, 4, 8, 16, 32 | 62 |
| Night Shift | 2, 4, 8, 16 | 30 |
| Deep Battery | 3, 6, 12, 24, 48, 96, 192, 384 | 765 |
| Copper Memory | 3, 6, 12, 24, 48 | 93 |
| Warm Start | 4, 8, 16, 32 | 60 |
| Finger Servos | 2, 4, 8, 16, 32 | 62 |
| Family Adapter | 5, 10, 20, 40, 80 | 155 |

All eight permanent tracks total **2,250 cores**. Maxing them is a collection goal; a full optimal multi-Recompile schedule has not been simulated.

## Entry price in the current game

The Mechanical Charter costs 100 unspent Ancestral Cunning, requires 2,500 earned Cunning and three completed Great Migrations. The earned-Cunning gate corresponds to **31,250,000,000,000 lifetime organic goblins** under the current formula. At that gate the price consumes 4% of the minimum earned total, provided the player has kept 100 unspent. This is a resource gate, not a claimed number of play hours. The existing game economy and its event luck were not simulated here.

Sensitivity: 500 earned Cunning means 1,250,000,000,000 goblins; 1,000 means 5,000,000,000,000; 5,000 means 125,000,000,000,000. Raising the gate from 2,500 to 5,000 quadruples the lifetime requirement. The draft uses 2,500 so entry follows meaningful original-warren investment without demanding 100 of every original expansion.

## Analytic checks

- **Batch conservation:** 32 RG/s over eight seconds produces 256 RG. At seven seconds, 224 are pending; nothing has been delivered. A rate change from 10 to 100 halfway through pays 440, not 800.
- **Milestone at 100:** local output ×48; three purchased local blueprints add ×8, giving ×384 before global effects. At 300, local mastery is ×3,456. These are separate factors, not additive percentages.
- **Closed circuit:** three groups × four tiers ×10% yields a maximum base network ×2.2. Copper Memory rank five raises the increment to 15%, giving ×2.8. The perk strengthens the bonus, not the entire ×2.2 multiplier.
- **Old-line value:** at counts [9,10,10,10] for the first circuit, buying Tin Cradle number 10 costs 66 RG and increases the output of all lines by closing that circuit, in addition to its local milestone. This prevents its value from being determined solely by its base 0.5 RG/s.
- **Overclock:** double output for 30 seconds, then 120 seconds of refill, gives (60 + 120) / 150 = ×1.20 long-run passive output with perfect activation and constant production. It never boosts the base used for manual spawning. The bound is not a forecast of compounded progression speed.
- **Clock vs Spark:** let P be stable passive output before the firmware choice, and c clicks/s. Clock yields 1.2P + c(1 + .03P); Spark yields P + c(1 + .15P). The crossover is c = 5/3 clicks/s before Finger Servos. With r servo ranks it is 5/[3(1 + .1r)]. If Overclock operates at a long-run factor O, the crossover becomes 5O/[3(1 + .1r)]. With perfect Overclock, rank zero crosses at two clicks/s, so the two active policies tie in a constant-state average there; purchase timing still differs.
- **Cadence:** Quick halves payout intervals and preserves average output. Heavy doubles intervals and gives +15% average output. At 32 seconds a Walking Foundry on Quick has paid; Heavy has not. At 128 seconds Heavy has produced 15% more. This is an intentional liquidity-versus-throughput choice, not equal idle yield.
- **Cross-plane caps:** ancestry grants at most +10% Robo passive production; Family Adapter grants at most +25% Warren base passive production. These depend on finite earned-currency thresholds and do not recursively feed each other’s instantaneous output. Long-term feedback remains, but each factor is capped.
- **Offline sample:** after ten minutes of baseline play, stable output is 4,145 RG/s. Twelve hours away credits eight hours at 80%, creating 95,500,800 RG including pending work. No reinvestment or automatic Overclock occurs offline.

## Before shipping

Port the equations into actual pure engine functions and re-run the fixtures against them. Add save migration, timestamp rollback, multi-tab browser ownership, actual dual-plane advancement, and UI tests; the design model does not implement those systems. Human playtests should measure first automation, waiting between useful purchases, eight-core recovery, time to Paradox Nest, policy use and whether old lines remain attractive after the third circuit opens. Tune from those observations, preserving the accounting invariants.
