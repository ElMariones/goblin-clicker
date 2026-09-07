# Brood & Burrow — 10 high-confidence ideas for the next stage

**Date:** 2026-09-07  
**Purpose:** brainstorm systems that add decisions, replayability, active and idle play, personality, and a stronger Steam proposition **without replacing or destabilizing the current economy**.

This is deliberately not a list of “add more buildings and make the numbers bigger.” The project already has enough raw incremental scaffolding to support a real game. The next gains should come from **different kinds of decisions, goals, discoveries, and run identities**.

No feature can guarantee commercial success on Steam. The goal here is to increase the things we can actually control: a clear hook, satisfying session structure, strategic depth, replayability, visual identity, a finishable campaign, and a technically safe path from the browser build to a desktop release.

---

## 1. What I audited before proposing anything

I reviewed the current game, its screenshots, game-state architecture, deterministic math, event code, save migration, tests, UI, localization, existing Markdown documentation, and Steam notes.

The current foundation is already substantial:

- **12 expansion types**, from Brood Matrons to Reality Burrows.
- **48 cycle research upgrades** in a draggable/zoomable research tree.
- **8 expansion mastery tiers** with local multipliers and a global mastery network.
- **11 Ancestral perks** and a Great Migration prestige loop.
- **26 achievements**.
- Deterministic **Mooncap events** with temporary CPS/manual-spawn buffs.
- Per-building lifetime production statistics.
- Offline progress, autosave, export/import, save sanitization and migration.
- Seven languages, RTL support, reduced motion and accessibility work.
- A strong CRT/pixel visual identity and a central “living” presentation area.
- Existing `STEAM_NOTES.md` already correctly recommends keeping the game engine platform-agnostic and adding a thin Steam adapter later.

The current baseline is healthy: `npm run check` passes lint, **31/31 tests**, TypeScript compilation, and the production Vite build.

### The main design gap

The existing game has a good **growth loop**, but most decisions still converge on the same answer:

> spawn → buy expansions → buy every available research node → hit mastery thresholds → migrate → buy permanent multipliers → repeat faster.

The research screen visually looks like a strategy tree, but the economy is still largely a catalog of upgrades the player eventually buys. The Great Migration is satisfying progression, but it currently changes **speed** more than it changes **how a run is played**. Mooncaps are the only major short active-play interruption. There is also no authored campaign climax or clear “I finished the game” moment yet.

Those are the areas I would attack next.

---

## 2. What I took from other successful incrementals

I compared Brood & Burrow with several established incremental/idle games. The useful lesson is not to copy their volume of content; it is to copy the **design purpose** of their best systems.

| Game | Useful pattern to adapt | Lesson for Brood & Burrow |
| --- | --- | --- |
| [Cookie Clicker](https://store.steampowered.com/app/1454400/Cookie_Clicker/) | Minigames, active event windows, permanent prestige unlocks, huge long-tail collection | Give old producers lateral mechanics and give active players short opportunities without invalidating idle play. |
| [(the) Gnorp Apologue](https://store.steampowered.com/app/1473350/the_Gnorp_Apologue/) | Builds, extreme synergies, producers with different roles, visible cause-and-effect | “How do I make the number go up?” should have several answers, and the answer should be visible on screen. |
| [Magic Research 2](https://store.steampowered.com/app/2864890/Magic_Research_2/) | Automation, secrets/storylines, feature-changing unlocks, prestige catch-up, clear ending | Repeated runs should remove old chores and reveal new rules; an incremental can still have a satisfying ending. |
| [Orb of Creation](https://store.steampowered.com/app/1910680/Orb_of_Creation/) | Interlocking layers and buildcraft rather than one optimal linear ladder | New systems should connect to existing systems instead of becoming isolated currencies and menus. |
| [Melvor Idle](https://store.steampowered.com/app/1267910/Melvor_Idle/) | Interdependent progression systems, mastery, pets/collection, strong idle support | Progress in one area should create reasons to revisit another area. |
| [Farmer Against Potatoes Idle](https://store.steampowered.com/app/1535560/Farmer_Against_Potatoes_Idle/) | Reallocatable talent choices, classes on reincarnation, challenges and minigames | Experimentation is much safer when choices are powerful but reversible on the next prestige. |
| [Rusty's Retirement](https://store.steampowered.com/app/2666510/Rustys_Retirement/) | A deliberately low-attention desktop presentation and visible automation | A Steam build can have a product-level presentation hook beyond “the website inside a window.” |
| [Leaf Blower Revolution](https://store.steampowered.com/app/1468260/Leaf_Blower_Revolution__Idle_Game/) | Many mechanics, pets, crafting and minigames | Breadth works, but it is also a warning: do not bolt on ten unrelated currencies and turn the game into menu maintenance. |

The repeated pattern is **decision density**, not feature count. Strong incrementals keep adding a new question:

- What should I specialize in?
- What short goal am I chasing?
- What do I sacrifice for this run?
- Which system should I automate now?
- What secret am I close to finding?
- What changes after this prestige?

That is the direction of the 10 ideas below.

---

## 3. Non-breaking rules for all future systems

Before the ideas, these should be treated as project rules.

1. **The deterministic simulation stays authoritative.** Economy effects belong in `src/game/**`, not UI timers or React effects.
2. **Old saves must load.** Any new persistent fields require sanitization/defaults and migration tests.
3. **Fix the storage-key coupling before save version 4.** `App.tsx` currently uses `goblin-clicker.save.v3` as the localStorage key. Simply changing the schema to v4 and also changing that key would make an existing v3 autosave appear to vanish unless fallback loading is implemented. Prefer a stable storage key plus schema-version migration, or explicitly probe legacy keys.
4. **Run choices should usually reset on Great Migration.** This gives us powerful experimentation without permanently bricking a player build.
5. **No progression should depend on catching a random event.** Random events can accelerate or diversify play, but they must not be the only path to required progress.
6. **Offline players remain first-class.** New timed systems must resolve from timestamps when the player returns rather than requiring the app to stay open.
7. **New layers should eventually automate old chores.** A late-game feature must not make the player maintain five more checklists forever.
8. **Avoid calendar FOMO.** No mandatory login streaks, disappearing daily rewards, or “come back at exactly 19:00” mechanics.
9. **Unlock complexity gradually.** The fresh game should remain readable; most of these systems should appear after the player already understands spawning, expansions, research and mastery.
10. **Every new system gets reduced-motion, keyboard, mobile, RTL/localization and save-round-trip checks.** The project already has these standards; do not regress them for new content.

---

# The 10 ideas

## Idea 1 — The Warren Contract Board: always give the player a next objective

**Impact:** Very high  
**Engineering effort:** Small–medium  
**Economy risk:** Low  
**Best time to add:** First

### Concept

Add a **Warren Contract Board** with three concurrent goals at different horizons:

- **Quick Order** — approximately one short active session.
- **Quartermaster Contract** — a medium-term objective that nudges a build choice.
- **Grand Directive** — a run-scale target that can survive several sessions.

Examples:

- “Raise Brood Matrons to the next mastery tier.”
- “Make Mushroom Nurseries produce 30% of total CPS.”
- “Spawn 2,000 goblins manually this cycle.”
- “Catch two Mooncaps during one migration.”
- “Reach Veteran mastery on three different expansions.”
- “Reach a new highest CPS without selling any structures.”
- “Own 25 each of the Matron, Nursery and Warren Den.”

The important part: **contracts should be generated from what is currently possible**. Never assign a Reality Burrow objective to a player who cannot discover it yet.

### Why this is unusually good for this project

The fresh screen is polished, but the player still has to infer the next meaningful target from numbers and locked expansion cards. Contracts solve the “what should I do now?” problem without a tutorial arrow constantly pointing at buttons.

They also make existing systems more valuable. The game already tracks clicks, manually spawned goblins, mastery, expansion ownership, Mooncap catches, lifetime output and CPS. Most contract predicates can therefore be built from **existing state**.

### Reward design

For the MVP, do **not** invent another spendable currency. Reward one of:

- an immediate goblin payout scaled from current base CPS,
- a choice of two temporary buffs,
- a cosmetic Warren Ledger stamp/title,
- progress toward a non-economic “Directorate Rank” collection track.

Later, completing unusual contracts can unlock challenge modifiers or Foremen from Idea 5.

### How to keep it safe

- Contracts are optional accelerators, never mandatory gates.
- No real-world daily timer. A contract remains until completed, replaced, or manually rerolled after a reasonable in-game cooldown.
- Generate objectives from explicit templates with min/max progression requirements.
- Rewards scale from **base CPS or current run milestones**, not raw arbitrary constants.
- Unit-test that every generated contract is satisfiable from the state in which it appears.

### MVP success test

After adding the board, a player should be able to glance at the game at any point and identify one interesting thing to pursue in under five seconds.

---

## Idea 2 — Make the Research Tree a real build tree: exclusive specializations and synergies

**Impact:** Very high  
**Engineering effort:** Medium  
**Economy risk:** Medium, controllable  
**Best time to add:** Early

### Concept

Keep the existing 48 upgrades exactly as the stable “foundation” research. Extend the right side of the tree with **new specialization nodes that cannot all be owned in the same migration**.

The current tree looks strategically rich, but eventually buying everything means there is little reason for two mature runs to look different. New doctrine nodes fix that.

Example specialization pairs:

**Broodcraft**
- **Matron Dynasty** — early expansions scale harder from mastery; rewards large populations of cheap structures.
- **Fungal Symbiosis** — Mushroom Nurseries feed a percentage bonus into manual spawning and Mooncap rewards.

**Industry**
- **Scrap Standardization** — Scrap Incubators and Deepforge Vats become dramatically more cost-efficient.
- **Redline Industry** — higher raw CPS, but expansion-price growth is slightly harsher.

**Occult**
- **Moon Cult** — Shaman Circles/Moonspore Caverns strengthen Mooncap windows.
- **Ancestor Choir** — steadier passive production and stronger offline efficiency, but weaker event spikes.

**Dimensional**
- **Gate Network** — Goblin Gates make lower-tier mastery network bonuses stronger.
- **Impossible Brood** — Reality Burrows get multiplicative late-game power at the cost of weaker early expansion bonuses.

### The key rule: specialization is per migration

Choosing one node locks its sibling **for the current run only**. Great Migration clears the ordinary research map anyway, so the player can try something else next time.

That is ideal for Brood & Burrow: meaningful decisions without a permanent respec problem.

### Why it fits the architecture

The safest first implementation can use new upgrade definitions plus an `exclusiveGroup` metadata field. A purchase is rejected if another purchased upgrade belongs to the same group. Because `purchasedUpgrades` already resets at prestige, no separate persistent “class” state is necessary.

Most first-generation specialization effects can also use existing effect types—building multipliers, global CPS, click multipliers and CPS-to-click fractions—before inventing more exotic math.

### Why it improves the Steam proposition

This turns a visually impressive screen into a system players can actually **theorycraft and discuss**. Gnorp, Orb of Creation and talent-heavy idle games benefit enormously from players sharing builds because the optimization question has multiple plausible answers.

### Safety constraints

- Do not make any of the existing 48 nodes mutually exclusive; old saves must remain valid.
- Exclusive nodes are new content only.
- Every choice should have both a visible upside and a readable tradeoff.
- The difference between two good builds should be interesting, not 100× versus 1×.
- Add a “locked by your choice this migration” state distinct from “not yet unlocked.”
- The research-tree tooltip should preview the sibling it will lock before purchase.

### MVP success test

Two players at the same lifetime population should be able to show each other their research trees and have meaningfully different answers to “what is your build this migration?”

---

## Idea 3 — Cursed Warrens: optional Great Migration challenge runs

**Impact:** Very high  
**Engineering effort:** Medium  
**Economy risk:** Low–medium  
**Best time to add:** After specialization choices

### Concept

After a few Great Migrations, unlock **Cursed Warrens**: optional challenge rules chosen when beginning a new warren.

Examples:

- **The Silent Brood** — manual spawning is disabled after the first automatic producer is bought.
- **Matronless** — Brood Matrons cannot be purchased; the opening has to be solved another way.
- **Moonless** — no Mooncaps, but passive mastery grows faster.
- **Inflationary Tunnels** — expansion prices rise faster; selling refunds more and becomes strategically useful.
- **One Big Family** — only four expansion types may be owned at once.
- **The Chief Must Work** — passive CPS is weakened, manual spawn power gains a large CPS fraction.
- **Old Ways Only** — late expansions are sealed; reach a target using early expansion mastery and synergies.

### Why challenge runs are better than another prestige layer

The game already has a clean reset boundary. A challenge can change the rules of **one run**, then disappear. That means we can create replayability without adding a second or third reset currency.

The best challenge systems make the player re-evaluate mechanics they thought they had solved. They are also excellent post-campaign content because they reuse the entire game under different constraints.

### Rewards

Use a **Challenge Crown** completion record rather than a grindable currency. First completion can grant:

- a modest permanent Ancestral perk unlock,
- a cosmetic CRT frame/title,
- a Foreman,
- a special research doctrine,
- a Steam achievement,
- or a small one-time Cunning award.

Harder versions can track personal best completion time or fewest manual spawns without changing the main economy.

### Safety design

- Challenges are opt-in and can be abandoned at any time; abandoning returns to a normal fresh migration with no penalty.
- Challenges must never delete permanent progress.
- Challenge rules should be centralized as explicit modifiers in game math, not scattered `if` statements through components.
- Any challenge that disables a mechanic must have a proven route to its completion target.
- Use the existing deterministic engine so challenge personal bests are trustworthy and testable.

### MVP success test

Ship three challenges first. If each one makes an experienced player prioritize different expansions/research instead of merely taking longer, the system is working.

---

## Idea 4 — Mooncap Observatory: turn the one random event into a small active-play system

**Impact:** High  
**Engineering effort:** Medium  
**Economy risk:** Low–medium  
**Best time to add:** Early

### Concept

The existing Mooncap is a perfect extension seam: it already has deterministic RNG, spawn timing, a dedicated event module and clear visual feedback. Instead of adding a completely separate minigame, deepen **this** one.

Add four Mooncap families, each readable by silhouette/color/icon even under CRT filtering:

- **Clutchcap** — immediate goblin burst.
- **Frenzycap** — short production spike.
- **Bloodcap** — manual-spawn combo window.
- **Oraclecap** — reveals/strengthens the next contract, research discount or mastery target.

Then add a tiny **Moon Dial** beneath the event system. Catching caps fills lunar charge. Charge can be spent to:

- shorten the next spawn delay,
- bias the next cap toward a chosen family,
- extend a currently active cap effect,
- or trigger a short “Eclipse” combo if two compatible effects are chained.

### Why this is better than simply adding more random rewards

The player gets a decision about **when to cash in** lunar charge. Active players can create deliberate combo windows; idle players still receive the existing passive economy and lose nothing important by missing events.

It creates Cookie Clicker-style moments of excitement while avoiding the worst part of event RNG: progression depending on luck.

### Architecture fit

`src/game/events.ts` already isolates Mooncap delay, deterministic rolls and rewards. That makes this one of the safer places to create more game without touching building cost formulas or prestige math.

One important technical detail: `save.ts` currently whitelists only `moon_frenzy` and `hatching_fever` buff IDs. New persistent buff types must be added to the type union **and** save sanitizer, with tests. Alternatively, represent most new Mooncap effects as event-state fields rather than generic buffs.

### Safety constraints

- Missed Mooncaps never reduce baseline production.
- Required unlocks are never RNG-only.
- Lunar charge has a cap; no need to keep the game open all day.
- Offline time does not simulate missed clickable events; it can optionally grant a small deterministic “moon residue” amount instead.
- Effects integrate through the same exact buff-boundary calculation already used by `tickGame`.

### MVP success test

The player should occasionally think, “I am going to wait 30 seconds before buying this upgrade because I can line it up with an Eclipse,” without feeling punished for closing the game.

---

## Idea 5 — Named Goblin Foremen: a collectible loadout powered by existing lifetime statistics

**Impact:** High  
**Engineering effort:** Medium  
**Economy risk:** Low  
**Best time to add:** Midgame

### Concept

Turn each expansion family into a source of a named character. The player gradually discovers **Foremen, Matrons, Shamans, Quartermasters and impossible little bureaucrats** who can be assigned to the warren.

Examples:

- **Matron Gribba, Keeper of the Ladle** — boosts Brood Matrons; at Veteran mastery she also improves Mushroom Nurseries.
- **Chief Rivet-Ear** — Scrap Incubators make Deepforge Vats cheaper.
- **Sister Mothcap** — Moonspore production adds lunar charge over time.
- **Quartermaster Nix** — selling structures returns slightly more, enabling respec-style runs.
- **Gate Clerk Vzzip** — every mastered early expansion gives a small bonus to Goblin Gates.

The player may own many Foremen but equip only **three** at a time. That makes them a loadout, not another page of passive +5% bonuses.

### The elegant part: unlock them from data already tracked

The game now records `lifetimeProducedByBuilding` for every expansion. That can become the Foreman discovery track:

> “Brood Matrons have produced 1e9 goblins across all warrens → Gribba joins the Directorate.”

No loot boxes. No random rarity. No need to retrospectively reconstruct progress from owned buildings.

### Why it adds interest

Incremental games benefit from **collection goals that are not simply more currency**. A named goblin is memorable, can have portrait art, quotes, unlock animations, lore and Steam achievements. It also gives the central Warren view more characters to show.

Because only three can be active, Foremen reinforce the buildcraft introduced by Idea 2 instead of becoming another flat permanent multiplier stack.

### Safety constraints

- Unlock thresholds are based on lifetime statistics that already survive prestige.
- Equipping is free outside a short anti-spam cooldown; no permanent bad choice.
- Start with simple bounded effects such as ×1.25 to one building or +10–20% to a mastery interaction.
- Avoid proc-on-every-tick abilities in the MVP; they complicate deterministic/offline simulation for little gain.
- Save only unlocked/equipped IDs and sanitize them against a content registry.

### MVP success test

Six Foremen with distinctive effects should already produce recognizable loadouts. Do not build 40 characters before proving that three-slot choice is fun.

---

## Idea 6 — The Overseer: prestige should buy automation, not only bigger multipliers

**Impact:** Very high  
**Engineering effort:** Medium  
**Economy risk:** Medium  
**Best time to add:** Before adding lots more late-game content

### Concept

One of the most important rewards in a long incremental is **being allowed to stop doing solved chores**.

Add an Ancestral automation system called **The Overseer**. New automation rules unlock across migrations:

1. Auto-buy a selected expansion when affordable.
2. Maintain a target ratio between two expansion types.
3. Auto-buy selected foundation research.
4. Auto-buy up to the next mastery threshold.
5. Spend only when a minimum goblin reserve remains.
6. Later: load/save an “opening plan” for the first part of a migration.

Crucially, do **not** let the game immediately play itself from minute one. Automation is earned after the player has manually demonstrated understanding of that layer.

### Why this matters specifically now

Brood & Burrow has recently added a much deeper late-game research/mastery/prestige structure. Every new layer makes repeated Great Migrations more interesting—but also makes replaying the same first five minutes more tedious.

Magic Research 2 and other deep incrementals understand this well: prestige is satisfying when old content becomes dramatically faster and less laborious so attention can move to the new frontier.

### Implementation shape

Do not process automation on every 100 ms render/tick. Give the simulation a deterministic **automation cadence** (for example, one decision boundary per second or a small scheduled interval) and run all purchases through existing purchase functions.

The automation rule should say **what the player wants**, while the existing engine remains responsible for affordability and actual transactions.

### Safety constraints

- Automation calls `purchaseBuilding` / `purchaseUpgrade`; it never edits resources directly.
- It cannot buy mutually exclusive specialization nodes unless the player explicitly whitelists one.
- It never auto-confirms Great Migration.
- It never auto-clicks Mooncaps by default; active event play stays meaningful.
- It has a visible pause switch and a transaction log for debugging.
- Tests cover large time jumps, insufficient funds, max-buy behavior and prestige reset.

### MVP success test

After several migrations, the player should be able to automate the part of the game they have already solved and spend their attention on challenges, build choices and new tiers instead.

---

## Idea 7 — Surface Expeditions: a parallel loop that uses the warren instead of replacing it

**Impact:** High  
**Engineering effort:** Large  
**Economy risk:** Medium  
**Best time to add:** After the first six ideas are stable

### Concept

Unlock a small **Surface Expedition Map** around the War Camp / Goblin Gate stage. The player sends a crew on one deterministic expedition while the warren continues producing.

Possible destinations:

- **Abandoned Mine** — favors Scrap Incubators and Deepforge Vats.
- **Moonlit Ruin** — favors Shamans and Moonspore Caverns.
- **Merchant Cellar** — favors a balanced early-expansion warren.
- **Wyrm’s Old Road** — late-game, rewards high mastery rather than raw CPS.
- **The Wrong Door** — dimensional expedition unlocked by Goblin Gates/Reality Burrows.

For each expedition, choose:

- one crew specialty,
- one duration band,
- and one optional complication for a better reward.

### Do not make it a generic mobile-game timer

The expedition should be a **planning problem**, not “wait 4 hours and tap a chest.”

A mission might say:

> “Reserve 15% of Scrap Incubator output for 20 minutes. Every Veteran-or-higher industrial mastery tier reduces the duration by 5%. Return reward scales from the output actually reserved.”

Now the expedition connects directly to the current build.

### Reward philosophy

Start without a full crafting economy. Expeditions can award:

- a lump of current-run goblins,
- a temporary research discount,
- a cosmetic recovered artifact,
- Foreman lore/unlock progress,
- one-use “Contraband” that rerolls a Contract,
- or access to a new Storyline.

Only add a permanent expedition currency if playtesting proves there is a real spending loop that needs it.

### Why it is safe enough to be feasible

The game already supports offline elapsed-time calculation. Expedition completion can be timestamp-based and deterministic. It does not need real-time pathfinding, combat simulation, or a second game engine.

### Safety constraints

- No random permanent loss of goblins or progress.
- A mission completes from timestamps while offline.
- Only one expedition initially; no “fleet management” chore.
- The production reservation is explicit in CPS breakdowns.
- The player can cancel and recover normal production immediately, forfeiting only the expedition reward.

### MVP success test

Three destinations should be enough. If the player changes which expedition they choose based on their current research/Foremen/mastery, it is adding strategy rather than merely another timer.

---

## Idea 8 — Warren Chronicles: secrets and storylines that unlock rules, not just lore text

**Impact:** Very high  
**Engineering effort:** Medium–large  
**Economy risk:** Low if rewards are controlled  
**Best time to add:** Throughout development

### Concept

The project already has excellent flavor copy in `src/content/lore.ts`, but it is mostly presentation. Turn that personality into a **discoverable Chronicle system**.

Storylines trigger from unusual combinations of existing facts:

- own 50 Brood Matrons and 50 Mushroom Nurseries,
- sell a large expansion after reaching a mastery tier,
- catch a Mooncap during a specific research specialization,
- make an early expansion become your top lifetime producer again in a late run,
- complete a migration with a strange building distribution,
- finish a Cursed Warren,
- reach a dimensional expansion while an old Foreman is equipped.

Example storyline:

### “THE MATRONS HAVE UNIONIZED AGAIN”

The Directorate receives a list of demands written on the back of a mushroom crate.

Current-run choice:

- **Recognize the Ladle Council** — stronger Matrons and cheaper early mastery.
- **Replace Every Ladle With A Whistle** — stronger manual spawning and War Camp synergy.

Completing the storyline permanently records it in the Chronicle and may unlock a new Foreman, challenge or specialization for future runs.

### Why this works

Magic Research 2 demonstrates how powerful secrets are when they do more than hand out a percentage: storylines can **change rules or reveal new systems**. That creates anticipation and makes exploration itself part of the incremental loop.

### Do not make secrets hostile

Fully opaque conditions are fun only until players need an external wiki. The Chronicle should show progressive hints:

- silhouette + vague hint when the storyline is undiscovered,
- clearer clue after the player satisfies one prerequisite,
- exact condition after several migrations if it is still unresolved.

### Architecture fit

Keep the separation already documented in `lore.ts`: prose/content data remains separate from math. Story definitions can contain predicate IDs and reward IDs; engine helpers evaluate them. Do not put numerical rules inside narrative strings.

### Safety constraints

- Story choices should not create irreversible weak accounts. Permanent completion unlocks **options**; the power choice itself should normally last one migration.
- Existing achievements remain achievements; Chronicles are discovery/narrative, not a duplicate achievement list.
- Every storyline has a testable predicate and a hint path.

### MVP success test

Ten carefully authored stories are worth more than 100 generic text popups. Players should begin trying weird things because they suspect the warren has secrets.

---

## Idea 9 — The Descent: structure the whole game as a finite campaign with an endless postgame

**Impact:** Very high for a paid Steam release  
**Engineering effort:** Large, mostly content/pacing  
**Economy risk:** Medium  
**Best time to add:** Plan now, complete before 1.0 Steam launch

### Concept

Give Brood & Burrow an authored macro-arc called **The Descent**. The existing content already implies escalating eras—from mud and mushrooms to gates, wyrms and reality itself. Make that escalation explicit.

Possible chapters:

1. **The First Clutch** — manual spawning, Matrons, Nurseries.
2. **A Proper Warren** — Dens, mastery, first meaningful research branches.
3. **Goblin Industry** — Scrap Incubators, War Camps, automation begins.
4. **The Moon Below** — Shamans, Moonspores, deeper Mooncap mechanics.
5. **Old Blood** — first Great Migrations and Ancestral buildcraft.
6. **The Deep Forge** — high mastery, challenge runs and Foremen interactions.
7. **Doors That Should Not Open** — Goblin Gates and expeditions into impossible places.
8. **The Burrow Beyond Reality** — authored final objective, climax and credits.

After the ending, unlock **Endless Dynasty**: all normal progression remains, plus Cursed Warren tiers, speedrun/personal-best goals and optional extreme mastery.

### Why a clear ending matters

An endless sandbox can be excellent, but a paid Steam game benefits from being able to answer:

> “What am I ultimately trying to accomplish?”

Magic Research 2 explicitly markets a long incremental experience with a clear ending. Gnorp and other authored incrementals also feel more like complete games because their escalation resolves into a climax instead of simply running out of upgrade rows.

Brood & Burrow already has the perfect final fantasy: **a goblin civilization literally burrowing through reality**.

### Important: this does not mean removing endless play

The ending is a milestone, not a hard stop. Credits roll, the final Chronicle entry resolves the central joke/story, and then the player can continue with a new postgame ruleset.

### Pacing strategy

Use chapter gates to introduce the other ideas gradually. Do not show Contracts, Foremen, Expeditions, Challenges, advanced Mooncaps and automation to a new player simultaneously.

The chapter structure becomes the tutorial:

- a mechanic appears,
- the player proves they understand it,
- automation later reduces its maintenance,
- the next chapter introduces a new decision.

### Safety constraints

- Do not hard-code final chapter thresholds until real playtime telemetry/playtesting exists.
- The existing base economy remains the baseline; chapters mostly gate presentation and side systems.
- Every chapter transition is derived from stable progression facts rather than fragile UI state.
- Postgame does not require invalidating pre-ending saves.

### MVP success test

Even before all eight chapters are complete, the UI should be able to tell the player “You are in Chapter 3 of the descent; here is the next civilization-scale objective.”

---

## Idea 10 — The Living Warren + optional Desk Mode: turn the simulation into the Steam marketing hook

**Impact:** High for enjoyment, very high for presentation/marketability  
**Engineering effort:** Large  
**Economy risk:** Very low if kept presentation-driven  
**Best time to add:** Iteratively; Desk Mode after desktop wrapper exists

### Concept

The central spawn field already shows purchased structures. Push this much further until the player can **see their economy happen**.

The full-screen Living Warren could show:

- tiny goblin workers moving between visible expansion landmarks,
- population density increasing with milestones rather than with every raw unit,
- Scrap carts traveling toward Deepforge Vats,
- Shamans gathering around Moonspore events,
- War Camp patrols,
- Goblin Gates periodically admitting impossible cousins,
- the resident Wyrm moving/sleeping as the hoard grows,
- Reality Burrows causing subtle visual duplication/glitches,
- equipped Foremen appearing at the structures they affect,
- challenge-specific environmental changes,
- Contract/Chronicle events represented by small diegetic scenes.

This should be **state visualization**, not hidden simulation. The engine calculates production; the visual layer reads state and stages a believable burrow from it.

### Then make it a Steam-only presentation option: Desk Mode

Once the game is wrapped in Tauri/Electron or another desktop shell, add an optional narrow **bottom-of-screen or side-of-screen Warren view** inspired by the low-attention strength of Rusty’s Retirement.

Desk Mode would show:

- the living burrow strip,
- current goblins/CPS,
- active Mooncap alert,
- one Contract objective,
- a compact buy/return-to-full-game control.

The player can let the goblins work while doing something else, then open the full Directorate interface for serious planning.

### Why I would treat this as a product feature, not cosmetic polish

Brood & Burrow already has a recognizable visual identity. A living goblin industrial ecosystem gives screenshots, GIFs, trailers and streamer clips a much stronger answer to “why this incremental instead of another incremental?”

Gnorp succeeds partly because the growing absurdity is visually legible. Rusty’s Retirement turns its window format into the whole product hook. Brood & Burrow can borrow both principles without copying either game.

### Safety constraints

- Visual actors never own economy state.
- Cap actor counts aggressively; represent 1e12 goblins symbolically, not with 1e12 sprites.
- Respect reduced motion and an “effects” toggle.
- Desk Mode is optional; the existing responsive full UI remains primary.
- Do not begin platform-specific implementation inside `src/game/**`; follow the current `STEAM_NOTES.md` adapter philosophy.

### MVP success test

Record a 15-second silent clip of a developed warren. A viewer who has never played should be able to understand that the goblin civilization is becoming larger, stranger and more industrial without reading a tooltip.

---

# 4. Priority matrix

| # | System | Player value | Engineering | Balance risk | Save risk | Recommendation |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Warren Contracts | ★★★★★ | S–M | Low | Low | **Build first** |
| 2 | True branching research | ★★★★★ | M | Medium | Low if new nodes only | **Build early** |
| 3 | Cursed Warrens | ★★★★★ | M | Low–medium | Medium | **Build early-mid** |
| 4 | Mooncap Observatory | ★★★★☆ | M | Low–medium | Medium | **Build early** |
| 5 | Named Foremen | ★★★★☆ | M | Low | Medium | **Build midgame** |
| 6 | Overseer automation | ★★★★★ | M | Medium | Medium | **Build before content explosion** |
| 7 | Surface Expeditions | ★★★★☆ | L | Medium | Medium | **Build after core depth** |
| 8 | Warren Chronicles | ★★★★★ | M–L | Low | Medium | **Author continuously** |
| 9 | The Descent / ending | ★★★★★ | L | Medium | Low–medium | **Must exist for Steam 1.0** |
| 10 | Living Warren + Desk Mode | ★★★★☆ | L | Very low | Very low | **Strong differentiator / parallel track** |

---

# 5. The implementation order I would actually use

Trying to build all ten at once would be the fastest way to make the game worse. I would sequence them so each new layer solves a real problem and reuses the last one.

## Wave A — Improve every current session

1. **Warren Contracts** — adds immediate goals using existing data.
2. **Mooncap Observatory MVP** — adds short active-play decisions using the existing event seam.
3. **Overseer automation MVP** — prevents the expanding game from making prestige openings tedious.

These three create a better minute-to-minute loop without fundamentally rewriting progression.

## Wave B — Make migrations genuinely different

4. **Branching research specializations**.
5. **Three Cursed Warren challenges**.
6. **Six Foremen and three loadout slots**.

At this point, a migration has a build identity, a challenge identity and a small permanent collection layer.

## Wave C — Make it feel like an authored game, not a calculator

7. **Warren Chronicles** threaded through existing milestones.
8. **Surface Expeditions** that interact with those builds.
9. **The Descent** chapter structure and final objective.

## Parallel presentation track

10. Keep improving the **Living Warren** as each mechanic lands. Build Desk Mode only after the desktop shell is real and the full UI is stable.

---

# 6. Ideas I deliberately rejected for now

This list went through a few iterations. These are ideas that sound impressive but currently have a worse value/risk ratio than the ten above.

### Full RPG combat with gear rarity

War Camps and Wyrms make combat tempting, but a full battle system, enemy scaling, gear stats, inventories and drops would create a second game requiring its own balancing and UI. Expeditions and challenges can deliver adventure first without that scope.

### Five new crafting currencies

Scrap, spores, blood, ore and dimensional residue all sound thematic. They also risk turning one readable resource economy into five shopping lists. Add a new currency only when a specific system has proven it needs one.

### Randomized gacha-style Goblin rarity

Collectible goblins are fun; rolling the same goblin hundreds of times is not necessary here. Deterministic Foreman unlocks fit the current “respect the player’s time” philosophy much better.

### Mandatory daily quests / streak bonuses

They improve retention metrics by making the player anxious about missing a day. That is the wrong kind of retention for this game. Persistent Contracts give reasons to return without punishing absence.

### Online multiplayer or global leaderboards before launch

They add moderation, anti-cheat, server cost and platform complexity. Deterministic personal-best challenges provide competition-shaped goals with almost none of that risk. Community leaderboards can be reconsidered after the single-player game is stable.

### “Just add another 20 buildings and 100 ×2 upgrades”

The current 12 expansions already travel from a Matron to a hole in reality. More linear tiers will not fix the lack of strategic choice. New content should create new interactions first; additional expansion tiers can come later if the campaign pacing genuinely needs them.

---

# 7. Steam release work that should happen alongside the gameplay roadmap

These are **not counted among the 10 gameplay ideas**, because most are already anticipated in `STEAM_NOTES.md`, but they are necessary if the goal is a credible commercial Steam release.

## Before changing the save schema again

- Decouple the localStorage filename/key from schema version, or implement explicit legacy-key probing.
- Add golden-save fixtures for v1/v2/v3 and every future schema.
- Decide what the desktop build writes to disk so Steam Cloud syncs a small, stable save file rather than browser-specific storage.

Steam Cloud is designed to synchronize save files between machines; Auto-Cloud may be enough if the desktop wrapper writes a normal save file in a stable location. See [Steam Cloud documentation](https://partner.steamgames.com/doc/features/cloud).

## Create a real Steam vertical slice/demo

Valve recommends that a demo be a high-quality playable portion that demonstrates the core mechanics and leaves the player wanting more. A Brood & Burrow demo should therefore prove the game is **more than clicking**:

- satisfying spawn feedback,
- first automation,
- first mastery threshold,
- a visible research choice,
- a Mooncap interaction,
- a Contract,
- and a strong tease of the Great Migration / deeper burrow.

Do not expose ten unfinished systems. It is better to show one polished loop. Steam supports shared Cloud storage between a demo and the full app, so a demo save can later carry into the purchased game if configured appropriately. See [Steam demo documentation](https://partner.steamgames.com/doc/store/application/demos).

## Put up the Coming Soon page early enough to collect wishlists

Steam’s own wishlist documentation recommends putting up a Coming Soon page as soon as the product is ready to be discussed publicly and staying engaged over time rather than appearing only on launch day. See [Steam wishlists](https://partner.steamgames.com/doc/marketing/wishlist) and [Coming Soon](https://partner.steamgames.com/doc/store/coming_soon).

The current artwork is already much closer to store-page quality than the average prototype. The Living Warren idea would make trailers and short clips substantially stronger.

## Steam-native minimum set

- Steam achievements mapped from the existing achievement system.
- Steam Cloud.
- Rich Presence such as “Deep Warren · 4th Migration · 2.3B goblins/s”.
- Proper desktop save location and clean shutdown/autosave.
- Resolution/window testing and optional fullscreen.
- Overlay testing.
- Controller support only if it is genuinely comfortable; do not claim it just to add a store icon.
- Keep all seven current languages in the release pipeline and complete any English-fallback gaps in later Ancestral content.

Workshop/mod support can be excellent later, but I would **not** freeze a public mod API until content IDs, save schema and the new build systems are stable.

---

# 8. Verification checklist for every one of these ideas

Before calling any feature ship-ready:

- `npm run check` remains clean.
- Add unit tests for every new economy modifier and interaction order.
- Current v3 saves load with identical pre-feature core progression.
- Export → import round-trip preserves the new state.
- A save containing unknown future content is sanitized rather than crashing.
- Great Migration explicitly documents what new state resets and what persists.
- Offline progress produces the same result whether elapsed time is simulated foreground or resolved on return, except for intentionally foreground-only events such as clickable Mooncaps.
- No active-only mechanic is required for baseline progression.
- Test fresh game, first automatic producer, first mastery, first research, first Mooncap, first prestige and a mature late-game save.
- Test 390 px mobile, 1440/1600 desktop, keyboard-only navigation, reduced motion and Arabic RTL.
- Run a long deterministic simulation/save cycle to catch `NaN`, infinity and runaway multiplier interactions.
- For every multiplicative system, add a CPS breakdown source so the player can understand **why** their number changed.

---

# 9. Final recommendation

If I had to reduce the entire document to one strategy, it would be this:

> **Stop expanding the vertical number ladder for a while. Make the existing ladder playable in multiple ways.**

Brood & Burrow already has the visual identity, deterministic foundation, prestige, mastery, research surface and escalating fantasy needed for a strong incremental. Its highest-value next step is to make players form a plan and then give them reasons to form a **different** plan next migration.

The strongest package is:

**Contracts for goals → Research specializations for builds → Challenges for replayability → Foremen for collection/loadouts → Automation for respect → Mooncaps for active excitement → Chronicles/Expeditions for discovery → The Descent for a real ending → Living Warren/Desk Mode for the Steam hook.**

That combination adds depth without throwing away the current game, and most importantly, each system has a clean place to connect to state and mechanics that already exist.

