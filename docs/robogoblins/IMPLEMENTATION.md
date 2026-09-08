# RoboGoblins implementation design

This specifies future production work. The accompanying `.mjs` model is a mutable numerical laboratory, not an implementation of the game's immutable state, persistence or UI.

## 1. Architecture decision

Keep the existing Warren fields at the root of `GameState`. Add one nullable `robo` substate and a separate typed permanent-unlock record. Do not move every legacy field into a new `worlds` map in the same release. A smaller additive migration makes the original game easier to preserve and review.

Keep `BuildingId`, ordinary research IDs and existing `PermanentUpgradeId` organic-only. Mechanical lines and upgrades get distinct unions. The Charter is an entitlement, not an organic ranked perk. Separate wallets and explicit action names prevent a component from accidentally buying robots with goblins.

One root timestamp and one authoritative engine advance both worlds. UI view selection never controls simulation. Engine actions, import/export and background transitions all use the same advancement boundary. Both reset functions preserve the other plane after advancing it to the action time.

## 2. Proposed file map

```text
src/game/
  types.ts                  Add schema v6, WorldId, unlocks and RoboState reference
  state.ts                  Create empty unlocks and robo: null
  engine.ts                 Shared tick coordinator and existing Warren actions
  math.ts                   Add bounded Family Adapter factor to organic base CPS
  offline.ts                Coordinate both planes with separate caps/efficiencies
  save.ts                   Explicit v1–v5 -> v6 migration and mechanical sanitization
  reducer.ts                Adapt new typed actions; retain existing ones
  index.ts                  Export public entry points
  worlds.ts                 Charter eligibility/purchase, bridge factors, world summaries
  robo/
    types.ts                Mechanical IDs, state, action result types
    content.ts              Port reviewed constants and complete definitions
    state.ts                Initial run, grant-only credit, production credit helpers
    math.ts                 Prices, output, clicks, mastery, circuits, core thresholds
    production.ts           Constant-rate batch integration and Overclock boundaries
    engine.ts               Mechanical purchase/spawn/policy/core/reset transitions
    offline.ts              Mechanical offline calculation, no UI dependency
    achievements.ts         Mechanical conditions and persistent appearance unlocks
    save.ts                 Mechanical validation, no import-time economic effects
    *.test.ts               Production code tests and migrated lab fixtures
src/components/
  WorldTabs.tsx             Locked/unlocked tabs and inactive-world summary
  warren/WarrenView.tsx     Extract original view assembly from App without rebalance
  robo/
    RoboWorld.tsx            Compose mechanical shell slots
    AssemblyStage.tsx        Illustrated spawn action and earned-look selection
    AssemblyShop.tsx         Rows, bulk controls, batch forecasts and actual prices
    AssemblyLineCard.tsx     One line, state-driven progress, milestone affordance
    CircuitBoard.tsx         Three four-member circuits and bottleneck purchase
    BlueprintModal.tsx       Available/all/circuit filters and firmware pairs
    KernelModal.tsx          Core shop, wishlist, Recompile preview and confirmation
    OverclockControl.tsx     Charge, effect duration and one engine action
  hooks/
    useGameClock.ts          One foreground/visibility/offline lifecycle
    useSaveOwnership.ts     Prevent competing browser documents writing same save
src/i18n/robogoblins.ts     All UI/content strings in seven languages
src/styles/robogoblins.css  Theme-scoped palette, factory layout and effects
src/images/robogoblins/     Twelve line images and three central robot looks
```

These are proposed paths, not existing files. Avoid extracting a universal plugin engine or adding a state library just to support two planes. Share generic layout and controls where their semantics fit. `GameShell` currently hardcodes organic landmark labels: add explicit translated label props with current defaults. `ShopPanel` and header callbacks also need neutral props or mechanical wrappers; do not expose “Warren Expansion” or “Great Migration” as accidental robot labels.

`App.tsx` currently calls engine functions directly and commits via `gameRef`; extending only `gameReducer` will not wire the feature. Use an application action adapter, or consistently extend the existing callbacks. Both adapters must invoke the same pure engine operations, with one state commit per action.

## 3. State contract

Illustrative TypeScript; ID unions should be generated from immutable content tables where appropriate.

```ts
type WorldId = 'warren' | 'robogoblins';
type ControlFirmware = 'clock' | 'spark';
type CadenceFirmware = 'quick' | 'heavy';

interface RoboLineState {
  owned: number;               // integer, 0..1_000_000
  blueprintRank: number;       // integer, 0..3; sequential purchases
  phaseSeconds: number;        // [0, effectiveCycleSeconds)
  pendingRG: number;           // accrued output not yet in ready stock
}

interface RoboState {
  readyRG: number;
  runProducedRG: number;       // actual deliveries/manual production; excludes grants
  lifetimeProducedRG: number;
  lines: Record<RoboLineId, RoboLineState>;
  globalBlueprintRank: number; // 0..6, sequential
  firmware: {
    control: ControlFirmware | null;
    cadence: CadenceFirmware | null;
  };
  capacitor: {
    charge: number;            // 0..120, fractional seconds supported
    overclockEndsAt: number | null;
  };
  kernel: {
    cores: number;             // integer wallet, <= totalCoresEarned
    totalCoresEarned: number;  // monotonic integer, <= 1e9
    recompiles: number;
    perks: Partial<Record<KernelPerkId, number>>;
  };
  statistics: {
    manualActions: number;
    manuallyAssembledRG: number;
    highestStableRps: number;
    lifetimeProducedByLine: Record<RoboLineId, number>;
    overclocksActivated: number;
  };
  achievements: Partial<Record<RoboAchievementId, number>>;
  appearance: 'tin_rascal' | 'boiler_baron' | 'clockwork_ancestor';
}

// Additions to the EXISTING GameState, not a replacement:
interface WorldAdditions {
  unlocks: { robogoblins: boolean };
  robo: RoboState | null;
}
```

Do not persist derived rates, costs, potential cores, mastery or circuit tiers. The Charter owns whether the plane exists. Valid locked state is exactly `false/null`; valid unlocked state is `true/RoboState`. Use explicit initialization once inside the Charter action.

Persist `activeWorld` as a UI preference alongside settings, not in production calculations. Normalize to Warren if a save import removes the entitlement. Persist independent shop quantity, scroll, catalog filter and focus restoration per world if useful. A Kernel wishlist is local UI state; it does not reserve or spend cores.

Per-line lifetime counters count completed deliveries, including pending work drained during a successful Recompile/cadence purchase. Pending remains separate until delivery. At reset, preserve these statistics while clearing run lines. Starter grants and Kernel Boot Cache grants only change ready stock; never attribute them to a line or lifetime production.

## 4. Public actions and mutation order

Every normal action validates its input, advances both planes once, revalidates conditions against that state, applies one immutable mutation, and awards applicable achievements. Unknown IDs, negative/NaN quantities and stale eligibility return a typed failure rather than indexing unknown tables.

| Action | Inputs | Authoritative checks / result |
| --- | --- | --- |
| `purchaseMechanicalCharter` | now | Permanent all-Warren-buildings eligibility; not owned; at least 100 current Cunning; subtract once; initialize robo |
| `assembleRoboGoblin` | now | Entitlement; compute current unbuffed click basis; credit RG and manual stats |
| `purchaseRoboLine` | lineId, amount or `max`/`nextMilestone`, now | Predecessor owned, finite cost, enough ready RG, valid cap |
| `purchaseRoboBlueprint` | discriminated line/global ID, now | Prior ranks, ownership, budget; increase one rank |
| `purchaseRoboFirmware` | group, choice, now | Group unset; correct run threshold and price; cadence drains before phase restart |
| `activateRoboOverclock` | now | At least one line, charge 120, no current effect; charge becomes zero |
| `purchaseKernelPerk` | perkId, now | Rank below max, enough cores; grant Boot Cache/Warm Start increment once |
| `performRoboRecompile` | now | Preview gain >=1 after pending settlement; scoped reset; atomic gain |
| `equipRoboAppearance` | appearanceId, now | Default or corresponding persistent achievement |
| `setActiveWorld` | worldId | UI-only navigation; entitlement checked; no credit/reset |

Use result reasons such as `locked`, `insufficientFunds`, `alreadyOwned`, `maxRank`, `firmwareCommitted`, `noNewCores`, `invalidInput`. UI messages map those reasons to translations. Unknown imported IDs are dropped; unknown live action IDs fail harmlessly.

Rank/perk purchase effects must be applied after ticking, so buying a multiplier cannot change production before its purchase time. Never trust displayed affordability from the previous render. No success notification or acquisition grant on a failed purchase.

## 5. Exact economy equations

For line i with n units, base cost B, growth g=1.14 and purchase quantity q:

```text
price(i,n,q) = ceil(B × g^n × (g^q - 1) / (g - 1) - 1e-9)
M_i = product of all reached local mastery multipliers
U_i = 2^(local blueprint rank)
N = 1 + sum(circuit tiers) × (.10 + .01 × CopperMemoryRank)
K = 1 + .10 × totalCoresEarned
F = 1 + .05 × BetterBoltsRank
G = product of bought global blueprint factors
H = InheritedBlueprints factor, 1..1.10
D = 1.15 for Heavy, otherwise 1
C = 1.20 for Clock, otherwise 1
stable rate_i = n × baseRate_i × M_i × U_i × N × K × F × G × H × D × C
P = sum(stable rate_i) / C
manual = (1 + P × (Spark ? .15 : .03)) × (1 + .10 × FingerServosRank)
online accrual_i = stable rate_i × (Overclock active ? 2 : 1)
offline accrual_i = stable rate_i × offlineEfficiency
cycle_i = baseCycle_i × (Quick ? .5 : Heavy ? 2 : 1)
```

Use finite guards before ceiling, log, multiplication or purchases. Out-of-range/infinite cost means unbuyable, never zero. For Max use a log estimate plus corrections against actual rounded bulk cost, bounded at 1,000,000 owned. Compare exact state values with rounded computed prices; formatted numbers are never inputs. The resource cap remains 1e300, but report a late-game saturation state instead of allowing NaN propagation. Validate finite behavior at the intended 0–300 milestone range separately from extreme-import defense.

For core potential use a cube-root candidate, capped at 1e9, then correct against `10_000_000 × candidate^3` so exact represented thresholds behave consistently. If cumulative saturation prevents further gain, explain that there are no new cores; never reset for zero. Core wallet/ranks use safe integers.

## 6. Batch/time integration

Store elapsed cycle seconds and pending RG, not a CSS progress percentage. Over a constant-rate segment of duration dt:

1. Let `remaining = effectiveCycle - phase`.
2. If dt is shorter, add `rate × dt` to pending and dt to phase; pay nothing.
3. Otherwise pay `pending + rate × remaining`, consume that boundary, and clear pending.
4. Calculate complete remaining cycles arithmetically. Pay `fullCycles × rate × cycle` without iterating each one.
5. Store `phase = leftoverSeconds`, `pending = rate × leftoverSeconds`.

Split online integration only at actual rate changes, especially Overclock expiry. Purchases already split intervals by advancing before mutating. Root-timestamp partitions must yield the same wallet plus pending. Buying a new unit mid-batch adds only future production at the new rate.

`tickGame` should capture `start = state.lastUpdateAt`, normalize `end = max(start, floor(now))`, compute both worlds over that same interval, then write root time once. It may reuse the old organic implementation as a private interval function. Do not run robotic advancement from an already updated timestamp, or that world receives zero elapsed time. Do not call the public coordinator recursively from either world's interval integrator.

Bridge multipliers depend on claimed prestige totals and purchased perks, which change only at actions. Thus they are constant during an uninterrupted production interval. Advance first, then alter the bridge after Charter/migration/recompile/perk purchase. No iteration to find a shared CPS fixed point is needed.

Overclock refill is paused while active. At expiry, the remainder of a long online interval recharges normally, without automatically firing again. A Warm Start acquisition at full charge is clamped. After a reset, `overclockEndsAt=null` and phase is zero; its visual replay cannot produce resources.

### Shared visibility and saving

The current app saves when hidden but continues its 100ms interval. Replace that lifecycle with one owner: when hiding, advance once, persist and stop foreground ticking; on visibility restoration, apply offline progress once, commit and restart the interval. Import and cold boot call the same offline coordinator. Do not combine an uncapped catch-up tick and a capped offline reward for the same interval.

For each plane use the lesser of elapsed time and its own cap. Apply its own efficiency to newly accrued work; preserve the value of previously accrued pending output. After credited robot time, preserve its phase. Discard excess elapsed time for production and move the shared root timestamp to now. The organic expedition overlap uses its existing logic and cap.

Support browser throttling/OS sleep explicitly: detect a visible-loop gap exceeding 60 seconds, route that gap through the offline path, and surface the offline summary. This is a new shared time policy; regression-test it and document it. Small foreground stalls continue through exact online integration. UI reset effects must not stop the authoritative world clock for their duration; the existing 1.42s organic transition currently catches up afterward, so preserve that catch-up for both planes.

Two browser documents must not both accrue/write the same save. Add one-save ownership and a read-only secondary-document message, with explicit takeover after the old owner releases/expires. Use a supported browser coordination primitive with a tested fallback; settle from the latest persisted timestamp on takeover. In-game WorldTabs are unrelated to this browser-document lock.

## 7. Save version 6 and migration

Keep `goblin-clicker.save` and the existing legacy-key lookup. Bump both state/envelope version to 6 at implementation time. Never replace a player's entire save just because the new field is absent.

| Input | Result |
| --- | --- |
| Supported v1–v5 save | Existing sanitization plus `unlocks.robogoblins=false`, `robo=null`; preserve old progress |
| v6, valid entitlement and state | Restore all known mechanical fields; no grants or purchases replayed |
| v6, locked but has mechanical payload | Drop the inaccessible payload and warn; do not infer purchase from balances |
| v6, unlocked but missing/corrupt mechanical payload | Preserve entitlement and organic game, recover an empty mechanical run with a warning; retain independently valid permanent fields where possible |
| Unsupported future version | Existing explicit rejection; do not overwrite it |

For missing-state recovery, initialize starter stock once in the recovered saved state, then persist; do not repeatedly grant on every reload. For partial corruption, sanitize valid subtrees rather than dropping the complete Kernel. Keep a backup/export opportunity before replacing a corrupted save. This is corruption recovery, not a free normal-game reset.

Validate all numeric fields for finiteness/nonnegativity; floor owned counts, ranks, core totals and action counts; clamp to declared maxima. Strip unknown IDs; normalize firmware to its union or null; normalize phase using effective cycle; discard pending for zero-owned lines; preserve valid pending without multiplying it from current rates. Expired/invalid Overclock timestamps clear the effect. On import, timestamps cannot create negative elapsed time or implausibly long active effects.

Repair `lifetimeProducedRG >= runProducedRG` but **do not** force lifetime >= ready stock: starter grants make that false legitimately. Clamp `cores <= totalCoresEarned <= 1e9`. Enforce purchased-perk spending lower bounds conservatively if data conflicts; never increase available wallet to fund imported ranks. Appearance selection must be backed by its achievement. Unknown UI world preferences fall back to Warren.

Do not derive total cores earned from current wallet or from pending potential. Spending and unclaimed potential must remain distinguishable. Do not run unlock/achievement reward logic on deserialize except harmless condition reconciliation with no resource grants.

## 8. UI flow contracts

- The mirrored top-right world control is the purchase/entry surface. Before eligibility it is visibly locked and explains that all default Warren buildings must be discovered; once eligible it opens the 100-Cunning Charter popup. After purchase it enters the mechanical world.
- Mechanical header shows RG, average assembly rate and cores. The original Cunning wallet stays in the original world's header and the top-right Charter popup. Use labeled currencies on every price.
- Mount only the active world's heavy visual tree. Keep simulation outside both trees. Switching during a modal closes that world-specific modal and restores focus to the selected tab; shared Settings can stay open if navigation is unavailable behind it.
- Blueprint/perk purchase previews use live selectors; disable a button while its action is being committed if necessary to avoid duplicate UI feedback. Engine idempotence remains the real protection.
- Recompile preview and confirm share a pure selector. Include pending output in both. Default confirmation focus is Cancel; Escape cancels; confirm settles the action once. Return focus to Kernel after completion.
- Core shop and Recompile are within Kernel, but one action must never silently buy the wishlist. Show current wallet and actual earned gain separately.
- Offline return uses one summary with two named rows. Show credited hours/efficiency for each and distinguish ready versus still-in-assembly RG if relevant.
- Show stable average, active Overclock rate and batch countdown as distinct concepts. Progress animation is cosmetic and can interpolate between snapshots; it cannot release money.
- Add full English, Spanish, Chinese, French, German, Arabic and Turkish coverage. Parameterize quantities, names and descriptions. Arabic mirrors reading layout and logical spacing; robot art and circuit geometry need not be flipped.

## 9. Implementation milestones and acceptance

| Milestone | Work | Required evidence before completion |
| --- | --- | --- |
| 1. Save and entitlement | Add v6 state, persistent full-Warren reveal eligibility, Charter action, locked/unlocked world control | v1–v5 fixtures retain organic values; reveal survives migration; duplicate/unaffordable Charter tests; export/import includes both worlds |
| 2. Autonomous mechanical loop | Twelve lines, batches, manual spawn, bulk purchases, core selectors | Price/production tests; partition invariance; pending conservation; usable fresh-entry browser flow |
| 3. Mechanical strategy | All blueprints, mastery/circuits, firmware and Overclock | Port analytic fixtures; all four firmware combinations; timing boundaries; no retroactive gain; complete localized controls |
| 4. Prestige and bridges | Recompile, all Kernel perks, ancestry/Family Adapter | Reset matrix; first/second run fixtures; grant exactly once; both bridge caps; original event/expedition regressions |
| 5. Time and persistence | Dual-world offline, visibility lifecycle, save ownership | Hidden/visible/reload/import/clock rollback; unequal caps; overlapping browsers; no duplicated interval or grant |
| 6. Presentation and collection | Art, robot looks, 12 achievements, audio, polish | Real screenshots/interactions desktop/mobile/RTL; keyboard and reduced-motion QA; truthful README/release notes |

These are implementation slices within one feature, not permission checkpoints. A developer can proceed through all of them under an implementation request. The current task delivers the design package only.

## 10. Required production test matrix

Port the 26 reference tests against the actual production functions rather than maintaining a second hand-copied equation inside assertions. Add integration fixtures for behaviors the model intentionally does not implement:

1. Original game's existing tests remain green, with explicit default-no-bridge fixtures preserving old math.
2. Exact full-Warren reveal boundary; eligibility latches before/through migration; insufficient current Cunning; second click spends nothing; root lifetime unaffected.
3. Distinct-wallet operations; no change to organic achievements/statistics from robot clicks or batches.
4. One 10-minute root tick versus equivalent segmented ticks; both planes advance; same timestamp is a no-op for income.
5. Purchase midway through a batch and a buff-expiry boundary; joining a phase never amplifies accumulated value.
6. Firmware mid-batch drain; phase restart; choice lock; all four pairs; Recompile unlocks choices again.
7. Max/next milestone at exact funds; rounded price consistency; zero, negative, huge, NaN and unknown IDs.
8. Core potential/gain at thresholds and immediately after spending/reset; pending drainage counted once; zero-gain reset preserves state.
9. Boot Cache and Warm Start purchase grants once; reload and equipment switching never regrant them.
10. Organic migration while robots have pending batches and Overclock; robot Recompile while an organic expedition travels/returns. Apply the reset matrix precisely.
11. Bridges at every threshold, after spending, and at cap; organic click/contracts/expedition reward paths receive exactly their existing base-CPS-derived benefit.
12. Different offline caps/efficiencies; prior pending retained; repeated load at the same timestamp; rollback; long visible stall; stop/start effects; browser ownership takeover.
13. v1–v6 round trips, absent/partial robot data, unknown enums, invalid ranks, future version, saturated floats, stale active-world preference.
14. Achievement/equipment persistence through both reset types; no additional production factors from cosmetics.
15. UI price labels, locked tab explanations, click versus keyboard equivalence, focus after modal/reset, no ghost organic labels, seven languages and Arabic layout.

Run `npm run check` once the actual implementation is complete. For browser QA, use an isolated local test save, never a player's live save. Verify 1440×900 and 390×844, keyboard-only interaction, 200% browser zoom, RTL, reduced motion and effects-off. Screenshots alone do not prove reset/accounting behavior; engine tests alone do not prove navigation or legibility.

## 11. Balance handoff discipline

The reference model excludes production save handling, UI and organic entry timing. `run-balance.mjs` uses a known heuristic and explicit assumptions. Keep a machine-readable content fixture or port the same reviewed table into production; add a comparison test so prices/rates cannot silently drift between the report and shipped game.

Before declaring final balance, run actual-engine sessions for first Recompile, second recovery, sparse purchases, late unlocks and several subsequent Recompiles. A +20% Overclock average is not a +20% bound on total progression speed, because reinvestment compounds. A bounded bridge is not proof that the original game needs no pacing playtest. Treat these as measured design hypotheses with clear accounting guarantees.
