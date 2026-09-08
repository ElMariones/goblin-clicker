# RoboGoblins — implementation handoff

**Status: implemented in the browser game with save schema 6, dual-world production, RoboGoblins progression, presentation assets, and production tests.**

Prepared against repository commit `61d091d`, save schema 5, on 2026-09-08. Source code takes precedence for descriptions of the existing game. The specifications below define the implemented expansion and remain the design contract for balance and behavior. The reference model is design support; production logic lives under `src/game/robo/`.

## Read in this order

1. [Current game audit](CURRENT_GAME.md): the systems RoboGoblins must coexist with.
2. [Game design](GAME_DESIGN.md): unlock, currencies, all expansions, upgrades, reset rules, goals and progression.
3. [Balance report](BALANCE_REPORT.md): measured scenarios, equations, assumptions and remaining playtest questions.
4. [Implementation design](IMPLEMENTATION.md): state, module boundaries, migration, accounting and acceptance gates.
5. [Art and interaction direction](AESTHETIC.md): appearance, layout, asset briefs, sound and accessibility.

## The implemented chapter

Reveal all twelve default Warren buildings to permanently discover the RoboGoblins frontier. From then on, the mirrored top-right control opens a **100 Ancestral Cunning** Mechanical Charter purchase popup even after later Great Migrations. Once bought, **RoboGoblins** remains permanently available and the organic Warren keeps running in parallel. Assemble a spendable stock of mechanical goblins, use them to construct twelve increasingly impossible factories, close circuits between groups of expansions, and **Recompile** only the mechanical plane to earn **Kernel Cores**. Those cores improve subsequent runs and can fund a small, capped benefit for the original Warren.

Its signature is a factory with a heartbeat: real batch payouts, a limited Overclock, and the choice between fast delivery and larger slower batches. The chapter uses two currencies: RoboGoblins for the current run and Kernel Cores for permanent progression. Charge is a bounded meter, not another economy.

## Reproduce the math

```sh
node --test docs/robogoblins/balance.test.mjs
node docs/robogoblins/run-balance.mjs
```

`balance-model.mjs` is the single source of proposed numerical constants; its exports can be inspected without running simulations. `balance-results.json` is generated scenario output. The report is generated too: edit the model or report generator, then regenerate it.

The laboratory baseline reaches eight cores in 27m 15s; a five-core purchase plan reaches the next eight in 17m 22s. These are heuristic results, not human playtest promises. There are 26 passing design-model tests. Production wiring has its own focused engine/save/offline tests under `src/game/robo/robo.test.ts`, alongside the existing application regression suite.

## Maintenance contract

Keep future changes aligned with the milestones and invariants in IMPLEMENTATION.md. Preserve unrelated work. Do not substitute a thirteenth organic building or a palette swap for the second plane. Do not merge currencies, reset both planes together, award production from animation callbacks, or copy the mutating laboratory state code directly into the immutable engine. Every gameplay milestone needs its stated verification before it is called complete.

The draft deliberately leaves future features in a separate backlog. Everything marked launch scope has a numerical rule or acceptance criterion. Art can begin from the asset briefs without changing the economy. If a balancing change is needed, update the constants, equations, tests and generated report together.
