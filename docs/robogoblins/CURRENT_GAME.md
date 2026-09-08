# Existing game: source-grounded audit

Inspected at `61d091d`. This is a design baseline, not a new implementation or a claim that every existing behavior is bug-free. Repository screenshot `docs/screenshots/main-page.png` was inspected for visual continuity; no current player save was accessed.

## Core loop

The player manually spawns organic goblins, spends that same currency on automated expansions, then multiplies production through research, ownership mastery, events and migration perks. Purchases reduce the available population but never reduce lifetime production. The currency is therefore an available workforce, not a census of all living goblins. RoboGoblins can retain that readable fiction.

`src/game/content.ts` defines twelve expansions; `src/game/math.ts` derives their prices and output:

| Expansion | First price | Base goblins/s |
| --- | ---: | ---: |
| Brood Matron | 15 | 0.1 |
| Mushroom Nursery | 100 | 1 |
| Warren Den | 1,100 | 8 |
| Bog Hatchery | 12,000 | 47 |
| Scrap Incubator | 130,000 | 260 |
| Shaman Circle | 1,400,000 | 1,400 |
| War Camp | 20,000,000 | 7,800 |
| Moonspore Cavern | 330,000,000 | 44,000 |
| Deepforge Vat | 5,100,000,000 | 260,000 |
| Goblin Gate | 75,000,000,000 | 1,600,000 |
| Wyrm Hoard | 1,000,000,000,000 | 10,000,000 |
| Reality Burrow | 14,000,000,000,000 | 65,000,000 |

Every expansion price grows by 1.15 per owned unit. Bulk purchases use the geometric sum with a final ceiling. Selling returns 25% of the current adjusted geometric price equivalent, credits only the wallet, and can remove mastery benefits. It is not fresh production.

Mastery thresholds are 10/25/50/100/150/200/250/300. Their cumulative local factors are built from ×1.25/1.35/2/3/2/2.5/3/4. Every reached tier also adds a global network bonus: .006/.009/.015/.025/.03/.04/.05/.07. Older producers receive an additional per-tier veterancy factor tapering from ×1.18 on Matrons to ×1 on Reality Burrows. Doctrine effects can further alter mastery.

## Research and permanent upgrades

There are 48 foundation research entries: six click upgrades, six global-output upgrades and three local ×2 upgrades for each of twelve expansions. Eight more entries form four mutually exclusive doctrine pairs, chosen again after migration:

| Pair | Strategic distinction |
| --- | --- |
| Matron Dynasty / Fungal Symbiosis | Early mastery versus manual spawning, nursery production and Mooncap rewards |
| Scrap Standardization / Redline Industry | Selected industrial discounts versus greater industrial output and +8% global building prices |
| Moon Cult / Ancestor Choir | Lunar rewards and duration versus steadier output and offline efficiency, with weaker Mooncaps |
| Gate Network / Impossible Brood | Broad mastery network versus later producers at the expense of the first six |

The ordinary click formula is `(1 + unbuffedBaseCps × sumOfClickCpsFractions) × clickMultipliers`. Temporary click buffs affect the outer multiplier. The passive base incorporates local and global effects but excludes temporary CPS buffs and expedition reservations.

The Great Migration currency is called **Ancestral Cunning** in the UI and `shards` in code:

```text
potential = floor(sqrt(lifetimeGoblins / 5,000,000))
gain = max(0, potential - prestige.totalShardsEarned)
```

The five-million threshold is explicit. It uses lifetime production, not this run's production or current wallet. Spending Cunning does not lower `totalShardsEarned`, so it cannot create repeat claims. Unspent Cunning does not itself grant a generic production multiplier; purchases provide benefits.

| Permanent perk | Effect per rank | Maximum |
| --- | --- | ---: |
| Ancestral Fertility | +5% to its additive production factor | 20 |
| Stronger Spawn | +10% to its click factor | 20 |
| Scavenger Memory | −1% to initial expansion cost factor | 10 |
| Lucky Totem | Delay divided by `1 + .1 × rank` | 5 |
| Deep Warrens | +2 offline hours over eight | 8 |
| Starter Clutch | 50 starting goblins next migration | 5 |
| Founders' Legacy | +20% strength of the mastery-network bonus | 5 |
| Ancestral Momentum | +1% per completed migration per rank; counts at most 25 migrations | 5 |
| Tireless Lineage | +5 percentage points offline efficiency over 75%; cap 100% | 5 |
| Moonlit Blood | +10% reward/duration factor | 5 |
| Heirloom Matrons | One starting Matron next migration | 8 |

Rank prices use `ceil(baseCost × costGrowth^rank)` and each track has its own growth. The source's cost-factor floor is applied before research cost modifiers, despite some descriptions suggesting a shared final floor; do not silently copy that wording into new rules.

Migration clears current wallet (replaced by starting grants), owned expansions, purchased research including doctrines, buffs and active expedition. It preserves lifetime totals, statistics, achievements, permanent upgrades, cosmetics and expedition discoveries/completion. Completed expeditions are collected before calculating gain; traveling crews lose their reserved haul. Contract objectives are regenerated. Mooncap activity is cleared and rescheduled; lunar charge/bias and RNG state are preserved by the current spread-based reset.

## Parallel activities

- **Mooncaps:** random 120–300s base delay, a 13s claim window. Clutch gives currency; Frenzy gives ×7 passive for 77s; Blood gives ×25 clicks for 13s; Oracle empowers the next contract. Overlapping Frenzy and Blood can trigger Eclipse. Lunar charge caps at six and buys timing/bias/extension actions.
- **Contracts:** three simultaneous horizons with baseline reward durations of 10/60/240 seconds of production and minimum payouts. Objectives include manual production, ownership, Mooncaps, run production and mastery. Oracle boosts are capped.
- **Expeditions:** one mission at a time, three destinations, crews and durations. They reserve some organic passive output and return a scaled haul. Returned missions restore production before collection and keep their reward indefinitely. Keepsakes persist.
- **Collection:** 26 achievements and ten cosmetics bought with Cunning. These are not currencies or extra production engines.
- **Offline:** eight hours at 75%, extendable to 24 hours and 100%. Temporary buffs and Mooncap spawns are omitted. Expedition reservation overlaps are accounted for. The offline path currently runs on load/import; the foreground timer continues attempting ticks while the document is hidden.

## Implementation and presentation constraints

The existing game is React 19/TypeScript/Vite, with economy logic in `src/game/`. `App.tsx` currently owns mutable references to the latest immutable game state and invokes engine functions directly; `gameReducer` is an alternative adapter, not the application's primary dispatcher. A 100ms interval calls `tickGame`. Reset animations temporarily suppress that loop while an authoritative reset state is already stored.

Save version is **5**, stored at `goblin-clicker.save`. `save.ts` reconstructs known fields; adding a TypeScript property alone will not preserve it on load. Earlier expedition documentation mentions version 4 and is historical. The engine holds one root timestamp. Currency calculations use `number`, with a resource cap of `1e300` in common helpers; not every old reward path uses those helpers.

The current UI has a top resource bar, three-column shell, left ledger/research/prestige panels, a central illustrated spawn goblin surrounded by expansion art, and a dense right shop. It uses moss, amber and lilac over a dim CRT grid. Seven languages and Arabic RTL, reduced motion, effects settings, keyboard modals, export/import, audio and mobile layout are established expectations.

The extension should preserve this recognizable frame, isolate mechanical rules, and explicitly update shared time/save boundaries. It should not make every original perk affect RoboGoblins by accident.
