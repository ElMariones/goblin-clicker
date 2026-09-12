# Warren megaprojects and the thousand-robot frontier

The game has two independent production economies sharing a clock and save. The Warren produces continuously, has eight mastery thresholds through 300 expansions, research/doctrine choices, contracts, Mooncaps, expeditions and Great Migration. RoboGoblins produces in batches, with blueprints, firmware, circuit bonuses, Overclock, Kernel progression and Recompile. Each world's permanent projects affect only its own economy. Existing capped heritage bridges remain unchanged.

## Warren megaprojects

Four wonders have five stages each. Every stage spends available goblins and Ancestral Cunning, requires at least one completed Great Migration and one Reality Burrow in the current run, and checks the current building counts and deep innovations. Workers and research are not consumed. Permanent project stages survive selling, migration, reload and offline progress; research is rebuilt after migration.

| Project | Expansions affected | First goblin cost | First Cunning cost | Initial minimum per expansion | Initial innovations |
| --- | --- | ---: | ---: | ---: | ---: |
| Worldroot Sanctuary | Matron, Nursery, Den, Hatchery | 1e14 | 100 | 100 | 3 |
| Moonforge Citadel | Incubator, Circle, Camp, Cavern | 1e17 | 1,000 | 75 | 6 |
| Worldgate Nexus | Vat, Gate, Hoard, Reality Burrow | 1e20 | 10,000 | 25 | 9 |
| Everlasting Warren | All twelve expansions | 1e23 | 100,000 | 50 | 12 |

For a project with `r` completed stages, its next stage costs `baseGoblins × 10^r` and `baseCunning × 5^r`, requires `baseOwned + 50r` of every relevant expansion, and requires `baseInnovations + r` purchased deep innovations. Project stages cannot exceed five. Full completion costs 86,769,100 Cunning across all four wonders.

Each district wonder adds 25 percentage points per stage to its permanent local output factor, reaching ×2.25. Everlasting Warren adds ten percentage points per stage to a separate all-expansion factor, reaching ×1.5. Completing all projects therefore grants ×3.375 output before the existing research, mastery, bloodline and event factors. Project purchases settle elapsed production before applying new effects.

## Eighteen deep innovations

The research window keeps its original 48 foundation nodes and eight mutually exclusive doctrines, plus an accessible Deep innovations view. All 74 entries use the same engine purchase validation and save registry.

- Each of the twelve expansions gains Living Architecture at 150 owned. It costs `baseCost × 1e10` and triples that expansion's output.
- Collective Instinct: ×2 manual spawning, 1e13 goblins; unlocks at 1e14 lifetime goblins.
- Lunar Almanac: ×1.25 Mooncap rewards and durations, 1e15 goblins; requires 100 Moonspore Caverns.
- Sleeping Shifts: +10 percentage points offline efficiency, capped at 100%, 1e16 goblins; requires 100 Deepforge Vats.
- Ancestral Curriculum: ×1.5 mastery-network bonus, 1e18 goblins; requires 100 Goblin Gates.
- Brood Resonance: clicks gain another 2% of unbuffed base production, 1e20 goblins; requires 100 Wyrm Hoards.
- Boundless Warren: ×2 all production, 1e22 goblins; requires 100 Reality Burrows.

Next milestone appears on every revealed, unmastered Warren expansion. It quotes the full geometric bulk price and buys exactly the gap to 10/25/50/100/150/200/250/300. The button is disabled unless the whole gap is affordable and disappears after final mastery. It remains independent of the 1/10/100/Max selector.

## RoboGoblins through 1,000

| Owned on one line | Mastery | Additional local multiplier |
| ---: | --- | ---: |
| 600 | Transcendent | ×3 |
| 700 | Omnipresent | ×3 |
| 800 | Starforged | ×4 |
| 900 | Reality Engine | ×4 |
| 1,000 | Thousandfold | ×5 |

These multiply cumulatively with the ten earlier mastery tiers. Each circuit now has thirteen thresholds: 10, 25, 50, 100, 150, 200, 300, 500, 600, 700, 800, 900 and 1,000. Every tier requires all four of that circuit's lines and adds 0.1 to the global circuit factor, plus 0.01 per Copper Memory rank. All 39 circuit tiers give ×4.9 without Copper Memory or ×6.85 with its five ranks. Circuit counts, next targets, bottleneck purchases and localized mastery labels use the extended definitions.

The first stage of a circuit wonder retains 3.5% price growth above 100. Its fifth stage adds 1.5% growth above 500, only for the corresponding circuit. Prices before 500 are unchanged. A bulk purchase crossing 100 or 500 is split into the correct geometric segments; Max uses these same prices.

A static passive benchmark starts every line at the same threshold, with five local blueprint ranks, ten global blueprints, maximum earned cores, all project stages, Better Bolts/Copper Memory, Clockwork/Heavy firmware and no inherited bonus. It saves the cost of 100 additional robots on **every** line without clicks, Overclock or reinvestment:

| From → to | Days of passive saving |
| --- | ---: |
| 500 → 600 | 2.11 |
| 600 → 700 | 2.37 |
| 700 → 800 | 2.76 |
| 800 → 900 | 2.47 |
| 900 → 1,000 | 2.26 |

These are endgame affordability checks, not new-player completion estimates. Lower core totals take longer; reinvestment and active play change the curve. With the old 3.5% growth, the final step alone required about 57 years in this same fixture.

The shipped 30-day active reinvestment simulation was also regenerated in [engine-balance-results.json](robogoblins/engine-balance-results.json). It completes all twenty robot project stages; the existing 72-hour opening benchmarks remain unchanged. See [the engine report](robogoblins/ENGINE_BALANCE.md) for the policy and limitations.

## Saves and verification

Schema-6 saves without `prestige.projects` load an empty project record. The loader accepts only known finite ranks, caps them at five, and validates project spending against earned Cunning after permanent perks/cosmetics. Old saves without projects retain their balances and upgrades. No project purchase changes earned prestige totals or produces new lifetime currency.

The complete release check passes 282 game/UI tests and 26 historical balance-model tests, plus lint, TypeScript and a production build. Regression coverage includes all project stages and gates, both currencies, migration, offline accounting, invalid saves, every organic milestone, every new robot tier, mixed bulk prices, Max-buy boundaries, localized labels and late affordability.

Browser checks use isolated synthetic saves, never the player's browser save. At 1440×1200, they exercise the actual 149→150 organic purchase, project building, innovation buying, reload, keyboard focus restoration, Great Migration, and robot 899→900→1,000 purchases. At 390×844, English, Spanish and Arabic layouts expose every project and all eighteen innovations with scrollable content and no horizontal overflow. A 320px project layout and a fresh save's locked project buttons are also checked. No page errors occurred.

Screenshots:

- [Warren megaprojects, desktop](screenshots/warren-megaprojects-desktop.png)
- [Warren megaprojects, mobile](screenshots/warren-megaprojects-mobile-en.png)
- [Deep innovations, desktop](screenshots/warren-innovations-desktop.png)
- [Deep innovations, Arabic mobile](screenshots/warren-innovations-mobile-ar.png)
- [Warren next-milestone buying](screenshots/warren-next-milestone-desktop.png)
- [Robot circuits targeting 1,000](screenshots/robo-circuits-1000-desktop.png)
- [Robot mastery at 1,000](screenshots/robo-milestone-1000-desktop.png)
