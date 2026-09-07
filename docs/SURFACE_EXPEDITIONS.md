# Surface Expeditions — idea 7

## Shipped scope

Three destinations, one concurrent mission, three crews, three duration bands, an optional complication, and three permanent cosmetic discoveries. No spendable currency, random loss, required event, or login schedule. Unlock by owning a War Camp, Goblin Gate, or Reality Burrow. The additional proposed Wyrm and dimensional routes are outside this three-destination release.

The generated 1536 × 1024 map uses HTML landmark buttons with hover/focus information, selection seals, a traveling route marker, and arrival/claim feedback. The responsive planner uses the existing palette and modal, putting the map before the controls and moving the collection below the controls on phones. All copy supports English, Spanish, Chinese, French, German, Arabic, and Turkish. Arabic reverses text/layout, not geographic coordinates. Reduced motion and effects-off disable decorative route and return animation.

## Decisions and tuning

All crews reserve a share of **whole-warren passive output**. Destination affinity rewards specialization without making early-building routes worthless after a new producer unlocks. These are temporary allocations of production, not lost buildings or upfront goblin charges. Manual spawning and event bonuses remain available.

| Crew | Duration factor | Output reserved | Base haul / reserved output | Reason to choose |
| --- | ---: | ---: | ---: | --- |
| Trail scouts | 0.65 | 15% | 1.45 | Fast payout, earlier chance to invest or switch route |
| Scrap haulers | 1.00 | 20% | 1.60 | Highest throughput; more working production tied up |
| Warren keepers | 1.00 | 10% | 1.50 | Preserve the most production for purchases at home |

Base durations are 5, 20, and 60 minutes. Duration bands have equal profit per minute under constant production; short trips offer liquidity, long trips reduce attention. Haulers intentionally win static throughput; scouts and keepers trade that for return timing and available production. Tests do not claim identical optimality for every objective.

The overgrown trail takes 25% longer, reserves another 3 percentage points, and adds 0.15 to the haul multiplier. It increases return and opportunity cost with no random losses. Every Veteran-or-higher mastery tier in a route's favored buildings reduces time by 5%, capped at 25%.

Affinity adds up to 0.30 to the haul multiplier:

- Mine: the share of base CPS from Scrap Incubators and Deepforge Vats.
- Ruins: the share from Shaman Circles and Moonspore Caverns.
- Cellar: half the share from the first four producers, plus half their smallest/largest owned-count ratio. This keeps a reason to maintain a broad early warren.

Affinity and duration are fixed at departure. Reserved output stays live: purchases, sales, research and temporary CPS buffs change the amount banked. With constant output, total returned production is `ordinary production × [1 + reservation × (haul multiplier − 1)]`. The theoretical uplift is 5–24.15%, before the opportunity cost of delaying reinvestment. The UI's net-gain estimate compares with unchanged passive production; it does not forecast future purchases, buffs, or play style. Reward estimations exclude buffs, while actual online reservations include them. Fun and longer-term pacing still benefit from human playtesting.

## Simulation and saves

- Engine actions tick to their timestamp before dispatch, recall, or claim. UI timers never award resources.
- Production integration splits at buff starts/ends and departure/arrival boundaries. Every unit either reaches the warren or the expedition ledger; no double credit.
- Per-building lifetime production records only output delivered to the warren. The returned haul is credited as a reward, not falsely attributed as new passive production.
- Arrivals restore CPS automatically even when unclaimed. A claim consumes the mission once and never expires. No automatic relaunch while offline.
- Offline progress uses the existing time cap and efficiency, ignores temporary buffs as before, and reserves only the overlapping part of the credited interval. All possible trip durations fit inside the base eight-hour cap.
- Recall immediately restores production and forfeits only an in-flight reserved haul. Migration does the same for crews still traveling, but automatically banks a crew that has already returned before calculating prestige; completed count and curios persist.
- Additive `expeditions` state keeps save version 4 and the stable storage key. Existing v1–v4 migration paths remain; saves lacking this field get empty state. Imported enum values, timestamps, duration limits, reservation and reward ranges are validated.

## Verification

`npm run check` runs lint, 138 tests and the production build. The new strategy matrix evaluates all 54 combinations against all 16 mutually compatible doctrine builds, both online and offline (1,728 completion scenarios), including conservation, bounded gain, identical preview/settlement for constant production, one-time claims and save round trips.

Additional checks cover route specialization, crew tradeoffs, duration neutrality, mastery caps, buff boundaries and tick partition independence, building purchases/sales, research/manual spawning, aggregate versus per-building CPS, recalls, migration, clock rollback, malformed imports, legacy saves, offline caps and mixed online/offline segments. Presentation tests cover the seven languages, unlock explanation, map buttons and lifecycle controls.

Live browser QA used an isolated localhost save, with a fresh-game lock check, import, route/crew/duration/complication changes, dispatch, cancellation, actual timed arrival, claim, keepsake unlock, save/reload, mobile 390 × 844, Arabic RTL, keyboard focus/tooltips/Escape restoration and reduced-motion checks. The short trip survived reload and paid once after arrival, restoring full CPS.
