# Goblin Blocks — art and interaction direction

## 1. Visual thesis

**A goblin warehouse where the shelving is better organised than the goblins.**

The board is a lit stone-and-timber vault floor with eight by eight marked storage squares, seen flat
from above. Loot lands on it as chunky painted crates and sacks. The surrounding chrome stays quiet:
this is the one screen in the game where the player is doing real spatial reading, so every pixel that
is not the board or the tray must stay out of the way.

Keep Brood & Burrow's illustrated character and its dark mossy palette. Do **not** introduce the
RoboGoblins gunmetal theme here — the warehouse belongs to the organic Warren.

## 2. Theme tokens

Scoped under `.blocks-modal`, layered on the existing root tokens. No new root variables.

| Token | Value | Purpose |
| --- | --- | --- |
| `--blocks-floor` | `#151c12` | Vault floor between cells |
| `--blocks-cell` | `rgba(11, 16, 10, 0.62)` | Empty storage square |
| `--blocks-cell-line` | `rgba(202, 226, 170, 0.17)` | Square edges; barely there |
| `--blocks-preview` | `var(--ember-bright)` | Valid placement preview |
| `--blocks-preview-line` | `var(--moss-bright)` | Row/column that this placement would complete |
| `--blocks-invalid` | `var(--danger)` | Refused placement |
| `--blocks-token` | `var(--ember)` | Hoard Token currency |

Empty cells read as *slightly* raised sockets, not as glowing tiles. The contrast between an empty and
an occupied cell must survive at 32px and in reduced-motion mode, because that contrast **is** the
game. Validate it with real colour pairs, not with intent.

## 3. Layout

```text
┌──────────────────────────────────────────────────────┐
│ Hoard Warehouse                    ◆ 124 tokens   ✕  │
│ Score 12,450          Best 18,920         Combo ×3   │
├──────────────────────────────────────────────────────┤
│                                                      │
│                 ████████  8×8 board                  │
│                 ████████                             │
│                 ████████                             │
│                                                      │
├──────────────────────────────────────────────────────┤
│        [piece]      [piece]      [piece]             │
├──────────────────────────────────────────────────────┤
│ ⟳ Shuffle ×2   🔨 Hammer ×1        Lines 46 · Sets 19│
└──────────────────────────────────────────────────────┘
```

Desktop: the warehouse is a near-fullscreen dialog — `97vw` wide up to 1600px, and `96vh` tall. Above
1100px it becomes three columns: **readouts on the left rail, board and tray in the centre, charges
and tallies on the right rail.** Only chrome moves to the sides; the pieces always sit directly under
the board, because that is where the hand expects them.

Giving the rails the chrome is what lets the board take the whole height: `--blocks-size` is the
smallest of `96vh - 250px`, 900px, and `100vw - 700px`, which is roughly a 700px board on a 1080p
screen. Every one of those viewport terms divides `--ui-scale` back out, because CSS `zoom` scales
viewport units as well as layout.

Below 640px the same single column holds: header, board, tray, charges. Charges stack one per row —
two side by side cannot hold a 44px target and a price at phone width without clipping the price off
screen — and the tally becomes a 2×2 grid. Tray slots never shrink below a 44×44px touch target, even
for a single-cell piece: the hit area is padded independently of the art, and all three slots share
one `--blocks-tray-cell` size so a 1×1 reads as small and a 3×3 reads as the board-hog it is.

The board is a CSS grid of 64 cells with `aspect-ratio: 1`. It must not reflow while dragging.

## 4. Tile language

A placed piece is one loot family, so it reads as a single delivered object rather than sixty-four
independent squares. Six families, all decorative:

| Family | Subject | Palette anchor |
| --- | --- | --- |
| `gold` | Coin crate, jewelled goblet | Ember gold |
| `weapon` | Crude blades, notched axe head | Deep red and iron |
| `fungus` | Burlap sack of glowing cave mushrooms | Moss green |
| `crystal` | Iron-banded crate of blue crystals | Cold blue |
| `relic` | Rune-carved artifact, violet leak | Prestige lilac |
| `tool` | Rusty tools, brass gears | Orange rust |

Each family ships one painted crate. The saved `variant` selects one of four presentations of it — as
placed, mirrored, half-turned or flipped — so a large flat region of one family does not tile visibly
without costing four times the art.

**Readability rule:** every tile keeps a visible square footprint with a 1–2px inner border. The art
may be irregular inside that square, never outside it. A player must be able to count cells at a
glance without decoding the illustration.

## 5. Asset seam

Every tile, the floor and the giver resolve through one indirection module, so swapping the painted
set — or adding a second board skin — touches only this file:

```text
src/utils/blocksAssets.ts   → blocksTileArt(family), blocksTileTransform(variant), blocksArt
```

The shipped set lives in `src/images/blocks/` at 256×256 for tiles (about 15 KB each), 768×768 for
the floor and 584×640 for the giver, roughly 262 KB in total.

### 5.1 How the shipped set was made

Generated locally with Qwen-Image 2.1 through ComfyUI. The gold crate was produced first and then
used as the **reference image for every other tile**, editing only the contents — that is what keeps
one crate, one light and one brushwork across the six families, which generating each from scratch
did not. The Hoardmaster was generated separately and cut out by hand.

Re-run the set from the brief below if the art is ever replaced. Tiles need no transparency, because
each one fills its cell; the giver needs a clean alpha silhouette at 220px. Keep source artwork
outside runtime paths and record provenance in `THIRD_PARTY_NOTICES.md`.

Shared brief:

> Chunky hand-painted fantasy game icon, square composition filling the entire frame edge to edge,
> rich hand-worked texture, painterly lighting, dark mossy green timber against the family's palette
> anchor, thick readable silhouette that stays legible at 48 pixels. Storybook fantasy illustration
> matching the existing Brood & Burrow building art — not photoreal, not flat vector. No letters, no
> text, no watermark, no user interface.

| File | Subject |
| --- | --- |
| `block-gold.webp` | Battered wooden crate overflowing with gold coins and one jewelled goblet |
| `block-weapon.webp` | Weapon crate bristling with crude notched blades, a rusty axe head, a bent spear shaft |
| `block-fungus.webp` | Bulging burlap sack stuffed with fat glowing cave mushrooms spilling over the tied neck |
| `block-crystal.webp` | Iron-banded container packed with glowing blue crystals jutting through the slats |
| `block-relic.webp` | Arcane relic crate, rune-carved artifact floating above the open lid, violet light from the seams |
| `block-tool.webp` | Goblin toolbox crate crammed with rusty tools, brass gears, a chipped hammer, a bent wrench |
| `blocks-giver.webp` | Goblin warehouse foreman, three-quarter view, crooked grin, leather apron, stamped clipboard under one arm, beside a teetering stack of loot crates and spilled coins |
| `vault-floor.webp` | Vault floor: stone flags and timber shelving frames, seamless, no focal point, no marked grid, no text. Rendered under a 68% black wash so placed crates carry all the contrast |

## 6. Feedback

Feedback density is the reason a placement puzzle feels good. Every one of these is cheap.

**Drag.** The lifted piece scales to 1.06 and casts a soft shadow; its tray slot dims to 35%. On
touch, the piece renders one cell height **above** the finger so the drop target is never hidden.

**Preview.** Valid target cells fill with `--blocks-preview` at 45% opacity. A row or column that this
placement would complete pulses gently along its whole length in `--blocks-preview-line`. That pulse
is the single most valuable piece of feedback in the game: it teaches multi-line engineering without
solving anything. Invalid positions tint the piece itself, not the board.

**Placement.** Cells pop in with a 120ms scale from 0.82 to 1.

**Clear.** Total 320ms: the line flashes (60ms), compresses toward its centre (100ms), bursts into
coins and dust (160ms), and the score counter ticks up. Clears never block input — a player who
already knows their next move can place during the animation.

**Combo.** The combo readout pops on every change and heats up as the chain grows — ember at ×5,
orange with a glow at ×8. Alongside it, a text flourish near the board, escalating and thematic:

| Combo | Text |
| --- | --- |
| ×2 | Nice Haul! |
| ×3 | Packed Tight! |
| ×5 | Goblin Engineering! |
| ×8 | HOARDMASTER! |
| ×10+ | ABSOLUTE GOBLIN GENIUS! |

**Clear sweep.** Every cleared row and column gets its own bar of light, drawn over the exact cells
that went and swept out along the line in 460ms. The engine reports which lines cleared, so this is
never an approximation.

**Board clear.** A radial wash over the whole board, then a card announcing the vault is empty and
naming the tile set that replaces it. This is the one moment in the run that changes how the game
looks, so it gets the longest beat at 1.7s.

**Game over.** The board dims, shelving creaks, and the result panel slides up. No punishing noise —
the run ending is the normal end of a session, not a failure state.

## 7. Audio

Reuse `src/audio.ts`'s synthesised tones; add no audio files. New sound names:

| Event | Character |
| --- | --- |
| `blockPick` | Short dry wooden click, 180Hz triangle |
| `blockPlace` | Low chunk, 120Hz triangle plus a 90Hz thud |
| `blockClear` | Rising two-tone coin burst; pitch rises one step per line cleared |
| `blockCombo` | Pitch rises with the multiplier, capped so ×20 is not shrill |
| `blockBoardClear` | Four-note celebratory arpeggio |
| `blockOver` | Descending three-note settle, not a buzzer |

All respect the existing `settings.sound` toggle.

## 8. Accessibility

The puzzle must be fully playable without a pointer and without motion.

**Keyboard.** `1`/`2`/`3` select a tray piece. Arrow keys move the placement cursor one cell. `Enter`
or `Space` places. `Escape` deselects, then closes. The cursor is a visible 2px focus ring on the
anchor cell, and the same preview logic applies.

**Screen readers.** The board is a grid with an accessible name per cell (`"row 3, column 5, empty"` /
`"… gold crate"`). Placements, clears and combos announce through a polite live region: `"Placed.
Cleared 2 lines. Combo 3."` The tray announces each piece by shape name and cell count.

**Reduced motion.** With `settings.reducedMotion`, the clear animation collapses to a 90ms opacity
fade, the combo flourish appears without movement, the board-clear wash is a single static flash, and
the drag preview stops pulsing — it holds a steady fill instead. No information is conveyed by motion
alone.

**Effects off.** With `settings.effects` disabled, particles and floating numbers are skipped; the
score counter still updates.

**Contrast and targets.** Empty against occupied cells clear 3:1 minimum. Interactive targets stay at
44×44px on touch. Nothing depends on distinguishing the six loot families, which is deliberate —
geometry carries the whole game, so the tile palette is safe for colour-blind players by construction.

## 9. Copy voice

The Directorate is bureaucratic; the warehouse is exhausted. Shipping manifests, porter complaints,
stamped forms. Short, dry, never winking too hard.

> "Warehouse full. The foreman has been located. He is fine. The furniture is not."

All strings live in `src/i18n/blocks.ts` in the same seven languages as the rest of the game, in the
per-feature copy-object shape used by `expeditions.ts` and `robogoblins.ts`.
