# RoboGoblins progression and endgame — September 2026

This report supersedes the launch design model for progression. `src/game/robo/content.ts` and the shipped engine are authoritative. Run `npm run balance:robo` to regenerate [engine-balance-results.json](engine-balance-results.json). The short pacing scenarios also run in `npm test`.

## What changed

- The starting Tin Cradle still costs 20 RG. Later line prices spread progressively farther apart; Paradox Nest now costs 224 quadrillion RG. Base production and batch durations are unchanged.
- The first six global blueprints are spaced farther apart. Four more extend research through 1e26 RG. Each of the twelve lines also has two additional blueprints at 200 and 300 owned: 28 new blueprints total.
- Earned-core output stays `1 + 0.1 × cores` through 64 cores, then becomes `7.4 + 0.8 × (sqrt(cores) − 8)`. The cubic core-award thresholds, earned cores, wallet and existing perk ranks are preserved.
- Mastery has 15 tiers through 1,000 owned. Circuits have 13 tiers, ending at 1,000 on every member; five new thresholds at 600/700/800/900/1,000 reward continued investment.
- Four permanent megaprojects provide 20 stages. They consume ready RG and cores, require current-run ownership and research, and survive Recompile. Later stages cost 10 times as much in each currency and require 50 more robots per relevant line. Four new achievements recognize project and factory completion.
- The first stage of each circuit project unlocks bulk fabrication for that circuit: price growth falls from 14% to 3.5% after the first 100 units. This makes deep ownership practical only after reaching the endgame. The final stage of each circuit project also lowers growth beyond 500 robots to 1.5%. The all-circuit project adds a separate permanent production bonus.
- Existing schema-6 saves initialize projects to empty. Owned lines, blueprints, perks, currencies and achievements remain intact. New permanent spending participates in save validation. Offline summaries now count batches directly, avoiding cancellation against very large lifetime totals after Recompile.

## Measured scenarios

The simulator uses actual line costs, batch integration, click power, blueprint purchases, firmware, core math and Recompile actions. It visits every 30 seconds and chooses single units, ownership milestones and sequential blueprints using a waiting-time plus payback heuristic. Its saving horizon grows from five minutes to six hours. It is neither an optimal player nor a promise of human completion time.

The passive scenario stays online without clicking, Overclock or resets. The active scenario models **continuous two clicks per second**, activates Overclock when available, uses Spark/Heavy, and recompiles when the next gain doubles earned cores (minimum eight and fifteen minutes between resets). It buys Better Bolts and Boot Cache. Heritage bonuses, offline periods, human reading time and random Warren rewards are excluded. Projects, when enabled, are bought when both costs and factory requirements are met. Ownership requirements are never bypassed.

| Milestone | Passive, no resets | Active, repeated recompiles |
| --- | ---: | ---: |
| First automation | Immediately | Immediately |
| Wind-up Workbench | 4m 30s | 3m |
| Eight claimable cores | 58m | 45m 30s |
| Walking Foundry | 4h 6m | 2h 46m |
| Thunderhead Coil | 10h 1m 30s | 4h 17m |
| Moonwire Loom | 31h 39m 30s | 6h 43m 30s |
| Clockwyrm Assembly | Not reached within 72h | 10h 13m 30s |
| Paradox Nest | Not reached within 72h | 19h 33m 30s |

With project purchases enabled, the same active policy builds its first Scrap Archive stage at **33h 47m 30s**, Stellar Engine at **2d 19h 52m**, Causality Anchor at **4d 5h 7m**, and Eternity Foundry at **6d 8h 56m**. After 30 simulated days it has completed all 20 stages (5/5/5/5). These are continuous-attention benchmarks; idle play and different spending choices change the schedule. The old reference model reached its final producer in about 2h 17m under a different purchase policy, so that comparison is directional rather than a controlled speed ratio.

## Verification

Regression coverage includes early pacing, late unlock spacing, an attainable first project, both-currency spending, current-run requirements, maximum ranks, progressive stage costs, mixed bulk pricing across 100 owned, save sanitization, legacy saves, new blueprint ranks, offline production and Recompile persistence. All seven languages cover new content and permanent-project guidance.

Browser verification used an isolated seeded save at 1440×1000 and 390×844. A project was built, retained after reload, and retained after an actual UI Recompile. Every mobile project was reachable, no horizontal overflow was found, and there were no page errors. Screenshots: [desktop](../screenshots/robo-megaprojects-desktop.png), [mobile](../screenshots/robo-megaprojects-mobile.png).


## Thousand-robot extension

See [Warren progression and thousand-robot verification](../WARREN_PROGRESSION.md) for the new bonuses, late-game saving benchmarks and browser evidence. The 72-hour opening scenarios above are unchanged; the new late tiers accelerate the later megaproject loop.
