# Goblin Blocks — implementation

## 1. Module boundaries

| File | Responsibility |
| --- | --- |
| `src/game/blocks/pieces.ts` | The 32-piece library. Pure data plus derived lookup maps. |
| `src/game/blocks/rules.ts` | Pure board rules: placement legality, clear detection, scoring, game over. No state, no clock, no RNG. |
| `src/game/blocks/generator.ts` | Weighted trio generation against a board, driven by the save's seed/counter. |
| `src/game/blocks/state.ts` | `BlocksState` creation, the run lifecycle, and the reward contract. |
| `src/game/blocks/save.ts` | `sanitizeBlocksState` — the trust boundary for imported saves. |
| `src/game/blocks/index.ts` | Barrel re-exported from `src/game/index.ts`. |
| `src/components/BlocksWarehouse.tsx` | The modal: board, tray, drag, keyboard, result panel. |
| `src/components/BlocksEntry.tsx` | The giver button in the spawn-pit row. |
| `src/styles/blocks.css` | Feature stylesheet, imported by the component (the `expeditions.css` pattern). |
| `src/i18n/blocks.ts` | Seven-language copy object. |
| `src/utils/blocksAssets.ts` | Tile art indirection; returns `null` today so the CSS tile is used. |

`rules.ts` never imports from `state.ts`. That separation is what makes the rules exhaustively
testable without constructing a `GameState`.

## 2. State

Added to `GameState` as `blocks: BlocksState`. Save schema rises **6 → 7**.

```ts
export type BlocksLoot = 'gold' | 'weapon' | 'fungus' | 'crystal' | 'relic' | 'tool';
export type BlocksDifficulty = 'easy' | 'medium' | 'hard';

export interface BlocksCell { loot: BlocksLoot; variant: number }

export interface BlocksTrayPiece { pieceId: BlockPieceId; loot: BlocksLoot; variant: number }

export interface BlocksRunResult {
  score: number;
  rewardSeconds: number;
  dailyFactor: number;
  tokens: number;
}

export interface BlocksRun {
  startedAt: number;
  endedAt: number | null;
  /** 64 entries, row-major, index = y * 8 + x. */
  board: (BlocksCell | null)[];
  /** Exactly 3 slots; null means already placed this set. */
  tray: (BlocksTrayPiece | null)[];
  previousTrayIds: BlockPieceId[];
  setNumber: number;
  score: number;
  combo: number;
  bestCombo: number;
  largestClear: number;
  clearsThisSet: number;
  clearingPiecesThisSet: number;
  doubleScorePlacements: number;
  linesCleared: number;
  blocksPlaced: number;
  boardClears: number;
  perfectSets: number;
  rngSeed: number;
  rngCounter: number;
  result: BlocksRunResult | null;
}

export interface BlocksStats {
  runs: number; bestScore: number; lifetimeScore: number;
  totalLines: number; totalBlocks: number;
  bestCombo: number; largestClear: number;
  boardClears: number; perfectSets: number;
}

export interface BlocksState {
  unlocked: boolean;
  run: BlocksRun | null;
  stats: BlocksStats;
  tokens: number;
  lifetimeTokens: number;
  charges: { shuffle: number; hammer: number };
  daily: { day: number; runsFinished: number; tokensEarned: number };
  tutorialSeen: boolean;
}
```

`daily.day` is a local-calendar day index, `Math.floor((now − timezoneOffsetMs) / 86_400_000)`. It is
recomputed on every reward path; when it differs from the stored value, `runsFinished` and
`tokensEarned` reset to zero first.

A finished run is `run !== null && run.endedAt !== null && run.result !== null`. It stays in state
until collected.

## 3. Determinism

No `Math.random()` anywhere in the feature. Trio generation draws through `randomAt(seed, counter)`
from `src/game/rng.ts`, incrementing `rngCounter` for every draw, exactly as the Mooncap system does.
A run is therefore fully reproducible from its save, which is what makes reward validation and
regression tests possible.

The run seed comes from `seedFromTimestamp(now)` at run start.

## 4. Algorithms

**Placement legality.** For anchor `(x, y)` and piece cells `(dx, dy)`: every `(x+dx, y+dy)` must be
inside `0..7` on both axes and map to an empty board index. Checked with a flat index, no allocation.

**Clear detection.** After placement, collect the distinct rows and columns the piece touched, test
only those for fullness, then clear all of them simultaneously. A cell at an intersection of a cleared
row and a cleared column is cleared once.

**Game over.** `hasAnyLegalPlacement(board, trayPieces)` — for each non-null tray piece, scan anchors
`0..63` and return on the first legal placement. Worst case 3 × 64 × 9 cell tests, which is trivial at
the frequency it runs (once per placement).

**Board clear detection.** After clearing, if no cell is occupied, award the board-clear bonus. Note
this can only happen as a consequence of a clear, so it is checked in the same step.

**Scoring order within one placement.**

```text
placementScore = cells × 10 × doubleFactor
clearBase      = table(linesCleared)
comboMultiplier= min(5, 1 + (combo − 1) × 0.15)      // combo already incremented
clearScore     = round(clearBase × comboMultiplier) × doubleFactor
boardClearBonus= 2500 if the board is now empty
```

`doubleFactor` is 2 while `doubleScorePlacements > 0`, and that counter decrements once per placement
regardless of whether anything cleared.

## 5. Engine surface

Exposed from `src/game/blocks/state.ts`, each following the existing `EconomyActionResult` convention
of taking and returning a whole `GameState`:

```ts
startBlocksRun(state, now)                       // begins or restarts a run
placeBlocksPiece(state, slot, anchorIndex, now)  // the main verb
spendBlocksShuffle(state, now)
spendBlocksHammer(state, cellIndex, now)
collectBlocksRun(state, now)                     // credits goblins + tokens, clears the run
buyBlocksCharge(state, charge, now)              // spends tokens
markBlocksTutorialSeen(state)
```

Each is wired through `gameReducer` as a `GameAction` variant and re-exported from `src/game/index.ts`.
Every one calls `tickGame` first, matching `purchaseBuilding` and friends, so elapsed production is
always settled before the action mutates anything.

`collectBlocksRun` is the **only** place goblins are credited, via the existing `creditGoblins`.

## 6. Unlock

```ts
isBlocksUnlocked(state) === state.blocks.unlocked
```

latched to `true` inside `awardAchievements` (which already runs on every tick) the first time
`state.buildings.warren_den > 0`. Latching means a Great Migration, which zeroes buildings, never
re-locks the warehouse.

## 7. Save migration 6 → 7

* `CURRENT_SAVE_VERSION` becomes `7`.
* `sanitizeState` gains a `blocks` branch: for `declaredVersion >= 7`, run `sanitizeBlocksState`;
  below that, install `createInitialBlocksState()` and latch `unlocked` from the sanitized building
  counts. No warning — an older save simply predates the feature.
* `sanitizeBlocksState` rejects rather than repairs anything structurally wrong, and drops only the
  run when the run alone is bad:
  * board must be an array of exactly 64 entries, each `null` or a valid `{loot, variant}`;
  * tray must be exactly 3 entries, each `null` or a known `pieceId`;
  * a tray of three `null`s with no result is incoherent (a completed set always regenerates) → drop
    the run;
  * all counters clamped non-negative and integral; `score`, `combo` and totals clamped through
    `clampResource`;
  * `result.rewardSeconds` clamped to `0..600` and `result.dailyFactor` to `0..1`, which bounds the
    payout an edited save can claim;
  * tokens clamped to `0..1e9`; charges to `0..3`.
* Existing v6 save tests keep passing unchanged; new round-trip tests cover a mid-run save.

## 8. Rendering notes

The app ticks at 10Hz and replaces `GameState` each tick, so the modal re-renders ten times a second
while open. Two consequences:

* `BlocksWarehouse` returns `null` before deriving anything when `open` is false, after its hooks —
  the `ExpeditionMap` pattern. A closed warehouse costs nothing.
* Drag position is **component state**, never game state. Only a completed placement dispatches. This
  keeps dragging at pointer framerate and keeps the save free of transient UI data.

64 cells plus 3 tray previews is cheap to re-render; no memoisation is needed beyond keeping expensive
derivations (legal-placement maps) out of the render path.

## 9. Task checklist

### Rules and data
- [ ] `pieces.ts` — 32 shapes with cells, dimensions, weight, difficulty; derived `BLOCK_PIECE_BY_ID`.
- [ ] `rules.ts` — `canPlace`, `placePiece`, `findFullLines`, `clearLines`, `hasAnyLegalPlacement`,
      `scoreForLines`, `comboMultiplier`, `isBoardEmpty`.
- [ ] `generator.ts` — weighted draw, occupancy and run-length scaling, trio rejection rules, fallback.

### State and economy
- [ ] `BlocksState` types added to `src/game/types.ts`.
- [ ] `state.ts` — initial state, run lifecycle, `rewardSecondsForScore`, `dailyFactorFor`,
      `getBlocksRunReward`, the six engine actions.
- [ ] Unlock latch in `awardAchievements`.
- [ ] `gameReducer` actions and `src/game/index.ts` barrel export.

### Persistence
- [ ] `CURRENT_SAVE_VERSION` → 7 and the `sanitizeState` branch.
- [ ] `sanitizeBlocksState` with the clamps above.

### Interface
- [ ] `BlocksEntry` giver button beside the Contract Giver.
- [ ] `BlocksWarehouse` modal: header, board, tray, charges, footer stats.
- [ ] Pointer drag with touch offset; keyboard placement; live-region announcements.
- [ ] Placement preview including the completing-line pulse.
- [ ] Clear, combo, board-clear and game-over presentation, all honouring
      `reducedMotion` and `effects`.
- [ ] Result panel with score, best, lines, best combo, token and production payouts.
- [ ] Tutorial overlay, five beats, shown once.
- [ ] `blocks.css`.

### Integration
- [ ] `src/i18n/blocks.ts` in seven languages.
- [ ] New sound names in `src/audio.ts`.
- [ ] `blocksAssets.ts` seam.
- [ ] Toast on collection, matching the expedition-claim pattern.

### Verification
- [ ] `blocks.test.ts` — the gates in §10.
- [ ] `npm run check` clean.
- [ ] Manual pass in the browser preview: full run to game over, save/resume mid-run, keyboard-only
      run, reduced-motion pass, 390px-wide layout.

## 10. Acceptance gates

Each is a test, not a judgement call.

1. **Placement legality** — a piece cannot overlap, cannot leave the board, and a rejected placement
   leaves the board byte-identical.
2. **Simultaneous clears** — a placement completing two rows and one column clears all three at once
   and scores the triple band, not three singles.
3. **Combo arithmetic** — a chain of clears produces exactly
   `1.00, 1.15, 1.30 …` and caps at `5.00`; one non-clearing placement resets it to zero.
4. **Perfect Set** — three pieces each clearing at least one line pays 500 and one token; two out of
   three pays neither.
5. **Board clear** — emptying the board pays 2,500 and doubles exactly the next three placements.
6. **Game over is exact** — a board where only the 1×1 fits does **not** end; a board where nothing
   in the tray fits does.
7. **Generator liveness** — over 2,000 seeded trios against randomly filled boards, every generated
   trio has at least one legal placement, and no trio holds two hard pieces.
8. **Determinism** — the same seed and the same placement sequence produce an identical final board
   and score.
9. **Reward bounds** — `rewardSeconds` never exceeds 600 for any score including `Number.MAX_VALUE`;
   the daily factor sequence for four runs in one day is `1, 0.5, 0.25, 0.1`; tokens stop at 50 per
   day.
10. **Save round-trip** — a mid-run state serialises and deserialises to an identical run; a v6 save
    loads with a fresh, correctly-latched `blocks` state; a corrupt board of 63 cells drops the run
    without discarding lifetime stats or tokens.
11. **Prestige** — `performPrestigeReset` leaves `blocks` untouched, including an in-progress run.
12. **No wall-clock leakage** — the rules and generator modules contain no `Date.now()` and no
    `Math.random()`.
