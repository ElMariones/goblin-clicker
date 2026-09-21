# Goblin Blocks — implementation handoff

**The Hoard Warehouse.** An 8×8 block-placement puzzle reached from the Warren, in which goblins
try to organize a vault that is receiving loot faster than they can shelve it. Runs last two to ten
minutes, end when no remaining piece fits, and pay the Warren in *seconds of its own production*
plus a dedicated **Hoard Token** currency.

Prepared against save schema 6, on 2026-09-21. Source code takes precedence for descriptions of the
existing game. The specifications below define the shipped feature and remain the design contract
for balance and behaviour.

## Read in this order

1. [Game design](GAME_DESIGN.md) — fantasy, loop, board, piece library, scoring, generation,
   game over, and the full economy contract.
2. [Art and interaction direction](AESTHETIC.md) — appearance, layout, tile language, asset briefs,
   audio, accessibility and reduced-motion behaviour.
3. [Implementation](IMPLEMENTATION.md) — state shape, module boundaries, save migration, algorithms,
   the task checklist and acceptance gates.

## Design decisions already made

These were settled before implementation and are not open questions:

| Decision | Choice | Rationale |
| --- | --- | --- |
| Reward model | Hoard Tokens **and** seconds-of-production goblins | Mirrors `contracts.ts`, which already pays `getBaseCps × rewardSeconds`. Stays relevant at every scale of the clicker economy. |
| Token power | Tokens buy **puzzle-side** charges only | Tokens never buy Warren production, so the puzzle cannot distort the incremental economy. |
| Placement | Giver button in the Warren spawn-pit row | Sits beside the Contract Giver and Expedition Entry, opens a large modal. No third world tab. |
| Unlock | First **Warren Den** owned, latched permanently | Third building. Late enough not to crowd the opening, early enough that the reward still matters. |
| Rotation | None in Classic Mode | Rotated variants live in the piece pool as separate entries. Simpler input, stronger spatial planning. |
| Prestige | Survives the Great Migration entirely | Scores, tokens, stats and an in-progress run all persist. |

## Scope of the first pass

Built: board, tray, 32-piece pool, pointer **and** keyboard placement, row/column clears, scoring,
combos, set and perfect-set bonuses, board clears, controlled random generation, game-over detection,
high scores and statistics, save/resume mid-run, reward conversion with daily diminishing returns,
Hoard Tokens, two capped power-ups, goblin theming, sound effects, seven-language copy, and tests.

Deliberately **not** built: bomb/mimic/golden special blocks, alternative board sizes, Blitz Mode,
daily challenges and objectives, warehouse upgrade tracks, cosmetic shops, seasonal events and
leaderboards. Those are catalogued in [GAME_DESIGN.md §13](GAME_DESIGN.md#13-deliberate-backlog) and
depend on the core puzzle proving enjoyable first.

## Run the checks

```sh
npm run test -- src/game/blocks.test.ts
npm run check
```

## Maintenance contract

Keep the puzzle rules in `src/game/blocks.ts` pure and deterministic: no `Math.random()`, no `Date.now()`
inside rules, no scoring awarded from animation callbacks. Every run is reproducible from its stored
`rngSeed`/`rngCounter` pair, exactly like the Mooncap event system. Reward conversion lives in one
function so the economy has a single audit point. If a balance change is needed, update the constants,
the tests and this document together.
