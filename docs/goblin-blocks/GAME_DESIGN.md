# Goblin Blocks — game design

## 1. Fantasy

The goblins have discovered the one enemy they cannot stab: **inventory management**.

They steal faster than they can shelve. The Hoard Warehouse is where the overflow lands, and the
player is the poor soul who has to make it fit. Loot arrives in awkward clumps. Complete a shelf row
or column and a porter crew hauls the finished shipment away, freeing the space. Fail to keep space
open and the warehouse jams shut under a mountain of stolen furniture.

The loop the player feels: **loot arrives → pack it → shelves fill → complete a shipment → porters
haul it away → more loot arrives.**

## 2. Core loop

1. The board starts empty (or resumes exactly where the player left it).
2. Three pieces appear in the tray.
3. The player drags any one of them onto the board, in any order.
4. Valid cells preview in gold; invalid placement is refused and the piece returns.
5. On release the piece is placed permanently.
6. Every full row and every full column clears, simultaneously.
7. Score, combo and bonuses resolve.
8. When all three tray pieces are placed, a new trio is generated.
9. The run ends when **none** of the remaining tray pieces has a legal placement anywhere.
10. The result screen converts the score into Warren rewards.

There is no timer and no falling piece. The player may think for as long as they want, and may close
the warehouse and come back to the same board later.

## 3. Board

**8×8, 64 cells.** Row-major, indexed `y * 8 + x`.

A cell is either empty or occupied. An occupied cell carries a **loot family** and an art variant,
which are decoration only — the entire game is geometry. Colour never gates a placement or a clear,
because layering colour matching onto the core mechanic would obscure the one thing the player has
to read.

A cell's slot is one of six, and a piece is a single slot, so a placed piece reads as one object
rather than a confetti of cells. The saved `variant` picks a mirror or quarter-turn, which stops a
large single-slot region reading as one repeated texture.

### 3.1 Tile sets

Five sets fill those six slots: **Stolen Loot** (crates of coins, weapons, mushrooms, crystals,
relics and tools), **Goblin Heads**, **Cut Gems**, **Bottled Brews** and **Clockwork**. A set is
purely a change of costume — the geometry is identical, so nothing about a set affects play.

A run opens on a random set and **rotates to a different one every time the vault is emptied**. That
makes a board clear pay out three ways: score, tokens, and a warehouse that visibly restocks with
something new for the rest of the run.

## 4. Piece library

31 shapes, each a static cell list. **Rotated variants are separate entries**; the player cannot
rotate. Every shape is defined in `BLOCK_PIECES` with `cells`, `width`, `height`, `weight` and
`difficulty`.

| Group | Entries | Difficulty | Weight each |
| --- | --- | --- | --- |
| `dot` (1×1) | 1 | easy | 6 |
| Lines of 2 (`h2`, `v2`) | 2 | easy | 10 |
| Lines of 3 (`h3`, `v3`) | 2 | easy | 9 |
| Lines of 4 (`h4`, `v4`) | 2 | medium | 6 |
| Lines of 5 (`h5`, `v5`) | 2 | hard | 3 |
| 2×2 square | 1 | medium | 8 |
| 3×3 square | 1 | hard | 2.5 |
| 3-cell corners (4 rotations) | 4 | easy | 7 |
| L tetromino (4 rotations) | 4 | medium | 4 |
| J tetromino (4 rotations) | 4 | medium | 4 |
| T tetromino (4 rotations) | 4 | medium | 4 |
| S and Z tetromino (2 rotations each) | 4 | hard | 2.5 |

The 3×3 square is the run-killer by design: it needs a preserved nine-cell pocket, which is exactly
the discipline good play rewards. Its weight is deliberately the lowest of any non-S/Z piece.

The U pentomino and other large irregulars are excluded from the first pool. They raise the
difficulty ceiling faster than they raise the interest.

## 5. Scoring

### 5.1 Placement

**+50 per occupied cell.** A 1×1 pays 50; a 2×2 pays 200; a 3×3 pays 450.

### 5.2 Line clears

Base reward for clearing *n* lines in one placement, where rows and columns count equally:

| Lines | Base |
| --- | --- |
| 1 | 750 |
| 2 | 2,000 |
| 3 | 4,000 |
| 4 | 7,000 |
| 5 | 11,000 |
| 6+ | 11,000 + 4,500 per line beyond five |

The gap between four separate single clears (3,000) and a genuine quad (7,000) is the whole reason to
engineer multi-line placements instead of clearing greedily.

The whole table sits an order of magnitude above a cautious first tuning, because a score worth
chasing should read in the hundreds of thousands. The reward brackets in §8.1 moved by the same
factor, so what a given quality of run actually pays is unchanged.

### 5.3 Combo

`combo` counts **placements that cleared at least one line**. A chain survives up to two dry
placements; the third in a row breaks it. Losing six moves of accumulated combo to one awkward piece
punished the wrong thing — the player should be able to spend a move tidying the board without
forfeiting everything they have built.

```text
clearScore = base × min(5.0, 1 + (combo − 1) × 0.15)
```

The first clear of a chain is ×1.00, the second ×1.15, the tenth ×2.35. The multiplier is capped at
×5.00 (reached at a 28-clear chain) so a single extraordinary run cannot run away with the reward
brackets.

### 5.4 Set bonuses

Awarded when the third piece of a trio is placed:

* **+500** for placing all three.
* **+1,000** more if at least one line cleared during the set.
* **+5,000** for a **Perfect Set** — every one of the three pieces cleared at least one line. A
  Perfect Set also pays **+1 Hoard Token** directly.

### 5.5 Board clear

Emptying the board completely:

* **+25,000**
* the next **three** placements score **×2** on both placement and clear score,
* **+3 Hoard Tokens**,
* and the vault restocks with a different tile set (§3.1).

Board clears should feel like an event, and they should not be so rare that most players never see
one — hence the generator assist in §6.

## 6. Piece generation

Pure random generation produces runs that die for reasons the player cannot learn from. The generator
is therefore **controlled random**, seeded from the run's `rngSeed`/`rngCounter` pair so every trio is
reproducible from a save.

Per trio:

1. Measure `occupancy = filled / 64`.
2. Scale the static weights:
   * `easyScale = 1 + occupancy × 0.8`
   * `mediumScale = 1`
   * `hardScale = clamp(1.10 − occupancy × 1.10, 0.20, 1.10)`

   A crowded board stops being handed 3×3 squares and long bars; an open board sees them often.
3. Apply a slow run-length pressure so very long runs do not become indefinite: after set 15,
   `hardScale` is multiplied by `1 + min(0.35, (setNumber − 15) × 0.01)`.
4. Draw three pieces by weight.
5. Reject and redraw the trio when:
   * two or more of the three are `difficulty: hard`, or
   * the trio is identical (same three ids, any order) to the previous trio, or
   * **no** piece in the trio has a legal placement on the current board.
6. After 12 rejected attempts, fall back to the highest-weight piece that *does* fit in slot 0 and
   draw the rest freely.

Rule 5's last clause is the whole anti-frustration policy, and it is narrow on purpose: the generator
guarantees the player gets **one** legal move, never that the set is survivable. Deaths come from the
board the player built, not from a trio that was dead on arrival.

### 6.1 Board-clear assist

Before the normal draw, when the board holds **22 cells or fewer** and a seeded roll passes (55%), the
generator looks for a finishing set: if every occupied cell already lies on one row or one column, it
offers the straight pieces that exactly fill that line's gaps, which empties the board.

This is deliberately conditional on the player having already done the work. The assist never appears
on a crowded board, and it can only ever hand over pieces that complete a line the player has already
set up — it turns a board clear from a lucky accident into a reachable goal, without clearing the
board for anyone.

## 7. Game over

Checked after every placement and immediately after every generation:

```text
for piece in remaining tray pieces:
    for anchor in board cells:
        if canPlace(piece, anchor): the run continues
the run ends
```

One unplaceable piece does **not** end the run. If the 3×3 cannot fit but the 1×1 can, play continues.

## 8. Economy

The run result pays two separate things. Both are computed once, at the moment the run ends, and held
on the finished run until the player collects — closing the warehouse never loses a payout.

### 8.1 Production goblins

```text
rewardGoblins = max(rewardSeconds, floor(getBaseCps(state) × rewardSeconds × dailyFactor))
```

`rewardSeconds` by final score:

| Score | Seconds of production |
| --- | --- |
| < 20,000 | 20 |
| 20,000 – 49,999 | 45 |
| 50,000 – 99,999 | 90 |
| 100,000 – 199,999 | 180 |
| 200,000 – 399,999 | 300 |
| 400,000+ | 300 + 60 per further 200,000, capped at **600** |

For calibration against the existing board: a Quick Order pays 10s, a Quartermaster Contract 60s, a
Grand Directive 240s. A good ten-minute puzzle run therefore lands in the same band as a Grand
Directive, and the 600s ceiling bounds the best conceivable run at ten minutes of production.

Using `getBaseCps` — production *before* temporary buffs — means a Mooncap frenzy cannot be banked
into an inflated puzzle payout.

### 8.2 Daily diminishing returns

`dailyFactor` depends on how many runs the player has already **finished** today, by local calendar
day:

| Runs finished today | Factor |
| --- | --- |
| 0 (this is the first) | 1.00 |
| 1 | 0.50 |
| 2 | 0.25 |
| 3 or more | 0.10 |

The counter increments when the run *ends*, not when it is collected, so finished runs cannot be
stockpiled and collected all at full rate. The factor is snapshotted onto the finished run at that
moment; the `getBaseCps` term is evaluated at collection, matching how contracts already behave.

This is the mechanism that keeps the puzzle **useful but optional**. A player who never opens the
warehouse is not behind; a player who grinds it for an hour is not ahead.

### 8.3 Hoard Tokens

```text
tokens = floor(score / 10,000) + perfectSetTokens + boardClearTokens
```

capped so that **no more than 50 tokens are earned per local day**. Tokens are *not* multiplied by
`dailyFactor` — the charges track should stay reachable for a player who enjoys the puzzle, while the
production payout is what tapers.

Tokens buy puzzle-side charges only. They never buy Warren production, Ancestral Cunning, or anything
that alters the incremental economy. That boundary is what makes it safe to be generous.

### 8.4 Power-ups

Two, bought with tokens from the warehouse screen, held as charges across runs:

| Charge | Cost | Effect | Cap |
| --- | --- | --- | --- |
| **Shuffle** | 6 tokens | Replace the three current tray pieces with a freshly generated trio. | 3 held |
| **Hammer** | 10 tokens | Destroy one occupied cell. | 3 held |

Using a charge does **not** break an active combo, and does not itself score. Both are capped at three
held charges so a run can be rescued but never played on rails. Neither can be used after the run has
ended.

A Shuffle can rescue a trio, but it draws from the same generator against the same board — it is not
a guaranteed survival button. Removing a cell can never complete a line, so the Hammer runs no clear
check, and a Hammer that happens to empty the last cell does **not** award a board clear — otherwise
the 2,500-point bonus would be purchasable with tokens.

### 8.5 Prestige

Everything about the warehouse survives a Great Migration: the unlock, tokens, charges, statistics,
high scores, and an in-progress run. The puzzle is a skill track, not a production track, so wiping it
on migration would only punish the player for engaging with it.

## 9. Statistics and high scores

Tracked lifetime, shown on the warehouse screen:

`runs`, `bestScore`, `lifetimeScore`, `totalLines`, `totalBlocks`, `bestCombo`, `largestClear`,
`boardClears`, `perfectSets`, `lifetimeTokens`.

These cost almost nothing to maintain and give the feature a long tail of self-set goals.

## 10. Difficulty curve

There are no levels. Difficulty is emergent and comes from four places:

* occupancy rises, so safe placements disappear;
* large pieces need preserved pockets that crowded boards no longer have;
* poor early placements leave isolated single cells that nothing but a `dot` can use;
* the generator applies a slow hard-piece pressure after set 15.

Target run lengths: a new player 2–4 minutes, an average player 5–8, a skilled player 10–20+.

The design test for every balance change is whether the player thinks *"I filled the board badly"*
rather than *"the game killed me"*.

## 11. Strategy the design rewards

* **Space preservation** — keep one open 3×3 pocket at all times.
* **Line preparation** — hold rows and columns at seven of eight.
* **Corner management** — avoid stranding single cells.
* **Multi-line engineering** — set up one placement that completes a row *and* a column.
* **Set awareness** — all three pieces are visible, so the correct question is never "where does this
  piece go" but "in what order do these three go". Placing the small pieces first often destroys the
  only pocket the large one could have used. This is where the depth lives.

## 12. Tutorial

Five beats, under thirty seconds, shown once and then never again:

1. "Drag the loot onto the warehouse floor."
2. "Fill a whole row or column."
3. "Completed shipments get hauled away."
4. "Place all three to get three more."
5. "Don't run out of space."

The first run is not scripted. The generator's early-board weighting already favours small and medium
pieces enough that the first clear arrives on its own.

## 13. Deliberate backlog

Not built, in rough priority order, each gated on the core puzzle proving enjoyable:

**Phase two** — Hoard Token cosmetic shop (board skins, block sets, porter costumes); daily objectives
feeding the Warren contract board; a Hoardmaster level track; warehouse upgrade tiers; a seeded daily
challenge with one attempt.

**Phase three** — special blocks (bomb crate, mimic, explosive mushroom, golden block, wild goblin);
alternative board sizes (7×7 Tiny Vault, 10×10 Massive Warehouse, Cursed Vault with blocked cells);
Blitz Mode; seasonal block sets; goblin specialist bonuses tied to existing cosmetics; hand-authored
puzzle levels.

Two rules for anything in this list. Special blocks belong in their own mode or behind an explicit
toggle, never quietly added to Classic. And no addition may make tokens buy Warren production.
