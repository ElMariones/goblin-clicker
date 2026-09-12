# Brood & Burrow

**Brood & Burrow** is a goblin-themed incremental game built for the browser. Spawn the first goblins by hand, turn a cave into an industrial warren, specialize through research and migration doctrines, chase mastery milestones, send crews to the surface, and carry permanent bloodline upgrades into the next run. Reveal the whole warren and a second, mechanical world opens alongside it — with its own currency, its own factories, and its own prestige layer.

The presentation leans into a dark CRT terminal aesthetic with illustrated goblins, bespoke expansion art, animated effects, ambient music, and a deliberately dense late-game progression layer.

## Screenshots

### Main warren

![Brood & Burrow main warren](docs/screenshots/main-page.png)

### Contracts

![Warren Contract Board](docs/screenshots/contracts.png)

### Research tree — 55% zoom

![Warren Innovations research tree at 55 percent zoom](docs/screenshots/research-55.png)

### Expansion mastery

![Expansion mastery tiers on a shop card](docs/screenshots/expansion-mastery.png)

### Ancestral perks

![Permanent bloodline perks bought with Ancestral Cunning](docs/screenshots/ancestral-perks.png)

### Goblin cosmetics

![Goblin Cosmetics permanent wardrobe](docs/screenshots/goblin-cosmetics.png)

### Mobile layout

![Brood & Burrow on a phone-sized viewport](docs/screenshots/mobile.png)

## The two worlds

The game ships as two production planes that run **at the same time**, not as alternating modes.

| | The Warren (organic) | RoboGoblins (mechanical) |
| --- | --- | --- |
| **Run currency** | Goblins | RoboGoblins (RG) |
| **Permanent currency** | Ancestral Cunning | Kernel Cores |
| **Reset** | Great Migration | Recompile (mechanical plane only) |
| **Producers** | 12 warren expansions | 12 assembly lines |
| **Feel** | Continuous growth | Batch payouts with a charge meter and a limited Overclock |

RoboGoblins is discovered permanently once all twelve Warren expansions have been revealed, then unlocked with a one-time **100 Ancestral Cunning** Mechanical Charter. Both planes keep producing through offline progress, and a capped Kernel Core perk (Family Adapter) is the only place the mechanical plane feeds back into the organic one.

## Features

### The Warren

| System | What is currently in the game |
| --- | --- |
| **Incremental core** | Manual spawning, passive production, escalating structure costs, bulk purchasing/selling, one-click purchasing to the next mastery milestone, offline progress, compact number formatting, and persistent statistics. |
| **12 warren expansions** | From the Brood Matron and Mushroom Nursery through Deepforge Vats, Wyrm Hoards, Goblin Gates, and the Reality Burrow. Every expansion has bespoke artwork and production identity. |
| **Expansion mastery** | 8 ownership tiers — Established, Thriving, Veteran, Renowned, Elite, Legendary, Ancestral, and Mythic — with local production multipliers plus an all-warren mastery network bonus, and a veterancy factor that keeps early expansions relevant. |
| **Research & doctrines** | 74 research nodes: 48 foundation upgrades, 8 migration-scoped doctrines in four mutually exclusive pairs, and 18 deep innovations. The original tree retains pan/zoom controls; a separate innovations view shows late-game costs, effects and requirements. |
| **Warren megaprojects** | Four permanent wonders with five stages each: Worldroot Sanctuary, Moonforge Citadel, Worldgate Nexus and Everlasting Warren. Spend goblins and Ancestral Cunning, meet current-run ownership/research requirements, and retain production bonuses through migration. |
| **Great Migration** | Prestige into a new warren for permanent **Ancestral Cunning**, then spend it across 11 ranked bloodline perks affecting production, clicks, costs, offline play, Mooncaps, mastery, and starting resources. |
| **Contracts** | Three simultaneous Directorate contract horizons — Quick Order, Quartermaster Contract, and Grand Directive — with progress tracking, production-scaled rewards, completion effects, and immediately refreshed objectives. |
| **Mooncaps & Moon Dial** | Four event families — Clutchcap, Frenzycap, Bloodcap, and Oraclecap — with distinct rewards/buffs, lunar charge, charge spending, and animated event presentation. |
| **Surface expeditions** | Send a reserved slice of production to one of 3 destinations with 3 crew specialties and 3 duration bands. Expeditions continue through offline progress, can be recalled, and can recover persistent keepsakes. |
| **Goblin cosmetics** | 10 permanent wardrobe unlocks purchased with Ancestral Cunning and carried through Great Migration, with the selected look reflected on the central spawn goblin. |
| **Brood scale** | A 50-rung ladder of real-world quantities — a busload of commuters, every chicken alive on Earth, the seconds since the Big Bang, the grains of salt in the oceans, the photons in the observable universe, the Planck volumes in it — that turns the population counter into something a player can picture, all the way to `1e300`. The multiplier snaps to a 1-2-5 ladder so it steps ×2, ×5, ×10 rather than drifting digit by digit. |
| **Achievements** | 26 progression deeds covering brood size, clicks, expansion ownership, CPS, Mooncaps, migrations, and broad warren development. |

### RoboGoblins

| System | What is currently in the game |
| --- | --- |
| **Assembly** | A spendable RG stock built by hand and by 12 escalating assembly lines, from the Tin Cradle to the Paradox Nest. |
| **Blueprints** | 5 local blueprint tiers per line plus 10 global blueprints. |
| **Circuits** | Three line groups — scrap, steam, impossible — with 13 shared ownership tiers through 1,000 robots per line. Every closed tier adds 10% to the all-line bonus, increased by Copper Memory. |
| **Firmware** | Two mutually exclusive choices: Clockwork Consensus vs. Spark Personality, then Quick-release Latches vs. Heavy Batch Protocol (fast delivery or larger, slower batches). |
| **Charge & Overclock** | A bounded charge meter, not a third economy, spent on a limited Overclock that doubles mechanical passive assembly. |
| **Recompile** | Resets only the mechanical plane for **Kernel Cores**, spendable across 8 ranked kernel perks. |
| **Line mastery** | 15 ownership tiers through Thousandfold at 1,000 robots, including new bonuses at 600, 700, 800, 900 and 1,000. Each line has a next-milestone purchase button. |
| **Megaprojects & fabrication** | Four permanent wonders with 20 stages. The first circuit-project stage lowers price growth after 100 robots to 3.5%; its final stage lowers growth after 500 to 1.5%, supporting the path to 1,000. |
| **Robo achievements** | 16 mechanical deeds tracked separately from the Warren's. |

### Presentation & platform

| System | What is currently in the game |
| --- | --- |
| **Audio** | An 8-track ambient 16-bit soundtrack with persistent volume, mute, skip, and now-playing controls, plus game sound/effect settings. |
| **Save system** | Versioned local-storage saves, migration/sanitization for older saves, deterministic game state, JSON export/import, and guarded offline simulation. |
| **Multi-tab safety** | A save-ownership lease means a second tab on the same save opens read-only instead of silently forking or overwriting progress, with an explicit take-over control. |
| **Localization & UI** | UI support for English, Spanish, Chinese, French, German, Arabic, and Turkish; Arabic uses RTL layout. Includes keyboard-aware modals, focus trapping, reduced-motion support, an adjustable UI scale, and responsive layouts. |

## Progression loop

1. **Spawn** goblins manually and buy the first automated expansions.
2. **Scale** the warren through structures, research, mastery thresholds, and production synergies.
3. **React** to Mooncap events, complete Directorate contracts, and dispatch surface expeditions for extra goals and rewards.
4. **Migrate** when the current warren has matured, converting long-run progress into permanent Ancestral Cunning.
5. **Specialize** the next run through permanent perks, cosmetics, and mutually exclusive research doctrines.
6. **Mechanize** once the whole warren is revealed: buy the Mechanical Charter and run RoboGoblins alongside the Warren, recompiling it on its own schedule.

The goal is to keep old expansion tiers relevant instead of turning the game into a pure "buy only the newest building" curve. Mastery multipliers, the mastery network, contracts, expeditions, and migration perks all feed back into earlier layers of the economy.

## Tech stack

| Area | Technology |
| --- | --- |
| **UI** | React 19 + React DOM 19 |
| **Language** | TypeScript 6 |
| **Build tooling** | Vite 8 |
| **Graphics** | Three.js 0.180 for the CRT warp/background effect; CSS for the game UI, animation, responsive layout, and reduced-motion fallbacks |
| **Testing** | Vitest 5 with deterministic economy, save, contract, doctrine, expedition, scale, music, and component coverage, plus a Node test suite for the RoboGoblins balance model |
| **Code quality** | ESLint 10 + TypeScript ESLint + React Hooks/Refresh rules |
| **Runtime** | Node.js `>=22.12.0` for local development/build tooling |

The game intentionally keeps its simulation separate from most of the rendering layer. Core economy, save migration, events, contracts, expeditions, and prestige logic live under `src/game/`, while React components consume derived views built in `src/App.tsx`. Game state is treated as immutable: every engine action returns a new state rather than mutating the one it was given.

```text
src/
├── browser/      Save lifecycle and the multi-tab save-ownership lease
├── components/   React UI, modals, research tree, expedition map
│   └── robo/     RoboGoblins world shell, assembly stage, ledger and modals
├── game/         Economy, state, saves, contracts, events, prestige, expeditions, brood scale
│   └── robo/     Mechanical plane: lines, blueprints, circuits, kernel, offline
├── i18n/         Language tables and locale-aware formatting
├── images/       Game artwork and expansion/cosmetic assets
├── music/        Ambient soundtrack
├── styles/       Layout, CRT theme, effects, research, expedition and modal CSS
└── utils/        Asset and formatting helpers
```

## Run locally

Requirements: Node.js `>=22.12.0` and npm.

```bash
npm install
```

```bash
npm run dev
```

Vite will print the local development URL in the terminal.

## Validation

Run the complete release check with:

```bash
npm run check
```

Or run individual stages:

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run test:robo-balance
```

```bash
npm run build
```

## Save data

Brood & Burrow stores its active save in browser local storage under `goblin-clicker.save`. Saves use a versioned schema and are sanitized during load so older supported states can be migrated safely. The Settings screen provides JSON export/import for portable backups.

Opening the same save in a second tab is safe: the newer tab detects that the lease is held elsewhere and stays read-only until you explicitly take the save over, so two copies can never generate or overwrite the same progress.

## Project notes

- Warren megaprojects, new innovations and the 1,000-robot expansion: [`docs/WARREN_PROGRESSION.md`](docs/WARREN_PROGRESSION.md)

- Proposed RoboGoblins expansion — game design, architecture, art direction and balance tests (not implemented): [`docs/robogoblins/README.md`](docs/robogoblins/README.md)
- Surface expedition design and balance: [`docs/SURFACE_EXPEDITIONS.md`](docs/SURFACE_EXPEDITIONS.md)
- Surface map generation notes: [`docs/SURFACE_MAP_PROMPT.md`](docs/SURFACE_MAP_PROMPT.md)
- Release history: [`CHANGELOG.md`](CHANGELOG.md)
- Steam distribution planning: [`STEAM_NOTES.md`](STEAM_NOTES.md)
- Original long-form project README / QA notes: [`README_ORIGINAL.md`](README_ORIGINAL.md)
- Third-party notices: [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)

This repository currently ships the browser game itself; it does **not** claim native Steam API integration yet.
