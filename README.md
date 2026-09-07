# Brood & Burrow

An original goblin-themed incremental clicker built for the browser. Spawn goblins manually, turn the brood into an automated subterranean industry, unlock upgrades and achievements, catch Mooncap events, and eventually begin a new warren with permanent Ancestral Cunning.

## Screenshots

![Desktop mid-game view](docs/screenshots/desktop.png)

![Responsive mobile view](docs/screenshots/mobile.png)

## Tech stack

- React 19 + TypeScript
- Vite 8
- Three.js for the CRTWarp background shader
- Vitest for deterministic game/save/economy tests
- CSS-only responsive UI, effects, and reduced-motion fallbacks

## Run locally

```bash
npm install
npm run dev
```

Release check:

```bash
npm run check
```

The game stores versioned saves in local storage and supports JSON export/import. The complete original project README, architecture notes, and QA checklist are preserved in [`README_ORIGINAL.md`](README_ORIGINAL.md).

Third-party notices are recorded in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
