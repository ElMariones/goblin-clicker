# Changelog

All notable user-visible changes to Brood & Burrow should be documented here.

The project follows the spirit of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and intends to use semantic versioning once public builds begin.

## [Unreleased]

### Added

- Four permanent Warren megaprojects with 20 stages, current-run ownership/research requirements, goblin and Ancestral Cunning costs, and production bonuses retained through migration.
- Eighteen deep innovations: a fourth local research tier for all twelve expansions plus new click, lunar, offline, mastery-network and global-production research. Fully localized and accessible from the research window.
- A next-milestone purchase button on each unmastered Warren expansion, using the exact bulk price and buying only the units needed.
- RoboGoblins mastery and circuit tiers at 600, 700, 800, 900 and 1,000 robots, with cumulative production rewards and localized tier names.
- Completing a circuit megaproject unlocks 1.5% price growth beyond 500 robots in that circuit. Opening prices and first-stage bulk fabrication remain unchanged.

- **Brood scale**: a small line under the goblin population, and one in the Warren Ledger for the all-time total, comparing the brood to a 50-rung ladder of real-world quantities — a busload of commuters, every car on Earth, every human alive, every chicken alive, the seconds since the Big Bang, the grains of salt in the oceans, the atoms in the Moon, the photons in the observable universe, and on to the Planck volumes in it. The multiplier is snapped to a 1-2-5 ladder so it reads ×2, ×5, ×10 instead of creeping through ×1.81, ×1.82; below ×2 it is dropped entirely. The next rung to overtake is on the line's tooltip. Localized in all seven interface languages and meaningful all the way to the `1e300` resource ceiling.
- RoboGoblins, the multi-tab save-ownership lease, the adjustable UI scale and the release-check commands are now documented in the README.

### Changed

- Number, percentage, duration and date formatters are cached per locale instead of being constructed on every call. A mid-game warren formats roughly 3,500 values per second, which cost about 70 ms of main thread per second and now costs about 3 ms.
- Research, achievement, prestige, cosmetics and contract view models are only built while their panel is open, instead of on every frame of the 10 Hz simulation loop.
- The surface expedition planner no longer derives its whole layout while the map is closed.
- `getBaseCps` resolves the global production multiplier once per call rather than once per expansion; the result is unchanged.
- The Overclock, Recompile and mechanical-achievement notices, and the second-tab save notice, now use the existing translations instead of hardcoded English.
- Game state is updated immutably in `tickGame` and `applyOfflineProgress`; both previously mutated a freshly built state object in place.
- The version shown in Warren Settings is read from `package.json` at build time.

### Removed

- `src/content/`, an unreferenced duplicate of the flavour text in `src/game/content.ts` that had already drifted out of date.

## [1.2.0] - 2026-09-07

### Added

- Hover and keyboard-focus production telemetry for every discovered Warren Expansion, showing per-unit output, combined owned output, its share of total CPS, and that expansion's all-time production.
- Persistent per-expansion production accounting for both foreground and capped offline progress, with safe defaults for older saves.

### Changed

- Rebuilt the central broodling artwork and spawn chamber presentation with a denser CRT reticle, activity-driven glow states, and stronger visual hierarchy.
- Reworked rapid-click feedback into spread-out pixel telemetry bursts instead of overlapping floating numbers.
- Localized the new expansion telemetry labels across all seven supported interface languages.

## [1.1.0] - 2026-09-07

### Added

- Full UI localization framework with English, Spanish, Simplified Chinese, French, German, Arabic, and Turkish.
- Automatic first-run language detection from the browser/system language, with English fallback.
- Persistent manual language selector in Warren Settings.
- Localized building, upgrade, achievement, prestige, Mooncap, save, offline-progress, and accessibility text.
- Locale-aware dates, durations, and number formatting.
- Right-to-left document direction and layout polish for Arabic.
- Desktop and mobile release screenshots under `docs/screenshots/`.
- Third-party attribution/license notice for the adapted React Bits CRTWarp component.

### Changed

- Reworked the visual language toward a restrained pixel/CRT presentation with larger text, sharper controls, scanlines, vignette, and a live CRTWarp shader backdrop.
- Enlarged and sharpened building SVG presentation in the shop.
- Purchased structures now appear around the central brood pit and visibly accumulate as the warren grows.
- Replaced the long root README with a concise project overview and screenshots while preserving the original as `README_ORIGINAL.md`.

## [1.0.0] - 2026-09-07

### Added

- Complete React/Vite/TypeScript incremental game with deterministic simulation.
- Central goblin-spawning interaction with responsive animation, floating values, and procedural Web Audio feedback.
- Twelve escalating automated production structures with buy 1/10/100/max and selling support.
- Thirty cycle upgrades, twenty-six achievements, and six ranked permanent bloodline perks.
- Great Migration prestige resets with Ancestral Cunning and persistent meta-progression.
- Timed Mooncap fortune events with instant-clutch, production-frenzy, and manual-spawn rewards.
- Versioned local saves, migration/sanitization, autosave, JSON export/import, and bounded offline production.
- Responsive three-column desktop interface with tablet/mobile layouts, keyboard-accessible modals, focus management, and reduced-motion support.
- Original goblin-burrow UI, SVG artwork, favicon, install manifest, lore, and flavor copy.
- CI workflow plus deterministic engine, save, and economy regression tests.
- Steam distribution planning and release QA documentation for a future desktop wrapper.
