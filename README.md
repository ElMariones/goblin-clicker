# Brood & Burrow

**Raise a burrow. Grow a horde. Leave a dynasty.**

Brood & Burrow is an original browser incremental game about turning one noisy spawn chamber into an impossible subterranean civilization. Click to welcome goblins, invest them into production buildings, chase temporary Mooncap events, unlock achievements, and eventually found a new warren carrying permanent Ancestral Cunning.

The familiar appeal is classic idle-game escalation—manual input becoming automation, automation becoming absurd scale—while the world, writing, visual identity, progression names, assets, and balance are original to this project.

## Design pillars

1. **A satisfying first click.** The central brood interaction must feel responsive before any automation exists.
2. **Readable exponential growth.** Players should always understand what produces goblins, what an upgrade changes, and what the next meaningful goal is.
3. **Useful decisions, not busywork.** Buildings, upgrades, buying modes, prestige choices, and temporary events should create clear trade-offs without turning the game into spreadsheet maintenance.
4. **A burrow with personality.** Tooltips, achievements, building copy, events, and reset text tell the story of a scrappy settlement becoming a mythic goblin dynasty.
5. **Respect idle play.** Offline progress, autosave, export/import, reduced-motion support, and sane number formatting are core product features rather than afterthoughts.

## Core loop

- **Spawn goblins** manually from the central brood chamber.
- Spend goblins on **12 escalating production tiers**, from Brood Matrons to Reality Burrows.
- Buy **upgrades** that improve click power, building output, global production, and special systems.
- Catch **Mooncaps**, short-lived fortune events that reward attention without making active play mandatory.
- Earn **achievements** for production, ownership, clicking, rare events, and long-term milestones.
- Complete a **Great Migration / Found a New Warren** reset when a run is mature enough. The current economy resets and awards permanent Ancestral Cunning based on lifetime progress.
- Spend that prestige currency on **permanent ancestral upgrades** that accelerate later warrens and deepen progression.

## Project structure

The production code is intentionally separated by responsibility:

```text
public/                Static web assets and install manifest
src/
  components/          Presentational and interactive React UI
  content/             Optional display copy and lore; no simulation math
  game/                Deterministic state, economy math, saves, prestige
  styles/              Responsive visual system and component styling
  App.tsx               Application composition / integration
```

`src/content/lore.ts` contains original display copy keyed to the engine IDs for buildings, upgrades, achievements, prestige, offline progress, and the Mooncap event. It is data-only by design: save compatibility and economy math must never depend on flavor text.

## Local development

Requirements:

- A current LTS Node.js release
- npm

Typical Vite workflow:

```bash
npm install
npm run dev
npm test
npm run build
npm run preview
npm run check
```

`npm run check` is the release-oriented local gate: lint, deterministic game tests, then a TypeScript/Vite production build.

## Save-game expectations

Save data is player property. Production releases should preserve the following guarantees:

- Autosave regularly and on lifecycle transitions where the browser permits it.
- Version serialized data and migrate older supported saves deterministically.
- Never serialize transient UI state as required simulation state.
- Clamp corrupted or non-finite numeric values rather than allowing `NaN`/`Infinity` to poison the economy.
- Provide explicit export/import controls for backup and migration between devices.
- Calculate offline progress from trusted timestamps with a documented cap and no negative-time exploits.
- Prestige/reset actions require clear confirmation and must state what is lost and retained.

## Accessibility baseline

- All controls are keyboard reachable and show a visible focus state.
- The central click target has an accessible name and keyboard activation.
- Modals trap focus, expose an accessible title, close predictably, and restore focus.
- Information is never encoded by color alone.
- Text and controls maintain useful contrast against decorative backgrounds.
- Large-number changes and toasts do not spam screen readers; important state has a deliberate live-region strategy.
- `prefers-reduced-motion` disables or substantially reduces bouncing, shaking, particle motion, parallax, and count animations.
- Touch targets remain comfortably usable on phones and tablets.

## Production QA checklist

### Economy and deterministic simulation

- [ ] Fresh save starts with the intended resources, zero invalid values, and no purchased content.
- [ ] Click power exactly matches the displayed click value after every relevant upgrade/prestige modifier.
- [ ] CPS is deterministic for the same state and contains no display-rounding feedback into simulation math.
- [ ] Buying 1 / 10 / 100 / max uses the same authoritative price formula and never overspends.
- [ ] Selling uses the intended refund policy, cannot create resources through buy/sell cycling, and handles bulk quantities.
- [ ] Price growth remains stable at very high ownership counts.
- [ ] All multiplicative/additive modifiers apply exactly once and in a documented order.
- [ ] Temporary event effects start and expire exactly once, including across save/reload boundaries if persisted.
- [ ] No simulation value becomes negative, `NaN`, or `Infinity` during ordinary play.
- [ ] Large values format consistently without changing their stored precision.

### Prestige and progression

- [ ] Prestige-currency gain preview exactly matches the amount awarded by reset.
- [ ] Reset removes every run-scoped value that should be removed and preserves only documented permanent state.
- [ ] Permanent prestige purchases survive reloads and subsequent resets.
- [ ] A prestige cannot be triggered twice through double-clicking, keyboard repeat, or stale modal actions.
- [ ] Achievement conditions fire once, persist correctly, and never affect deterministic state accidentally through UI code.
- [ ] Locked/hidden content reveals at the intended milestones.
- [ ] A new dynasty remains playable even after extreme late-game prestige values.

### Saves and offline progress

- [ ] Autosave works after purchases, settings changes, achievements, prestige, and ordinary production.
- [ ] Exported saves round-trip into an identical deterministic state.
- [ ] Invalid import text is rejected with a user-facing error and does not overwrite the current save.
- [ ] At least one legacy/migration fixture is tested once serialized state reaches version 2+.
- [ ] Reload after seconds, minutes, hours, and the offline cap produces the expected reward.
- [ ] Clock rollback does not award negative resources or corrupt the last-seen timestamp.
- [ ] Huge clock jumps are clamped by the offline policy.
- [ ] Storage unavailability/private-mode failures degrade gracefully instead of crashing the game.

### Input, interaction, and responsive UI

- [ ] Mouse, touch, Space, and Enter can activate the primary brood target without double-firing.
- [ ] Rapid clicking does not select decorative art, drag the page, or create stuck visual states.
- [ ] Desktop layout is usable at common 1366×768, 1440×900, 1920×1080, and ultrawide sizes.
- [ ] Mobile layout is usable at 320 px width and common modern phone widths in portrait and landscape.
- [ ] Shop cards never hide price/owned/production information at supported widths.
- [ ] Modals remain fully usable with browser zoom at 200%.
- [ ] Content remains operable with long localized-looking strings even if localization is not yet shipped.
- [ ] Toasts, floating numbers, and events do not block critical controls.

### Accessibility and settings

- [ ] Full progression can be operated without a pointing device.
- [ ] Tab order follows visual/logical order; no focus traps exist outside intentional modal traps.
- [ ] Focus returns to the invoking control after closing each modal.
- [ ] Screen-reader labels distinguish buy, sell, quantity, close, prestige, export, and import actions.
- [ ] Reduced-motion mode is verified at OS level, not only through an in-game toggle.
- [ ] Sound/music toggles (if present) default safely and persist independently.
- [ ] Number notation, compact effects, and other readability settings persist after reload.

### Browser, install, and lifecycle

- [ ] Latest stable Chrome, Firefox, Safari, and Edge complete the core loop without console errors.
- [ ] iOS Safari and Android Chrome survive background/foreground transitions without duplicate offline rewards.
- [ ] `manifest.webmanifest` loads with the intended name, colors, scope, and SVG icon.
- [ ] Favicon renders legibly at 16×16 and 32×32 as well as larger install surfaces.
- [ ] Direct refresh and deep browser lifecycle events do not lose the active save.
- [ ] Production build contains no missing source maps/assets, accidental development endpoints, or placeholder art/copy.

### Performance and release quality

- [ ] Production stays responsive during rapid clicking and large floating-number bursts.
- [ ] Idle production does not cause unbounded timers, DOM nodes, particles, or event listeners.
- [ ] Animation work pauses or reduces appropriately while the tab is hidden.
- [ ] No React key, hydration, uncaught promise, or accessibility-critical warnings remain in the console.
- [ ] Bundle output is inspected for accidental secrets and unnecessary large assets.
- [ ] All shipped art, fonts, audio, code, and text have recorded redistribution rights.
- [ ] Store screenshots and marketing copy reflect features actually present in the release build.

## Originality and rights

Brood & Burrow may use the well-established incremental-game pattern of clicking a central target, purchasing automated producers, unlocking upgrades, and resetting for meta-progression. It must **not** copy another game's protected art, prose, sound, iconography, distinctive layout details, naming, or trade dress. New contributions should preserve the project's own goblin-burrow visual language and writing.

Third-party dependencies and media intended for commercial distribution should have their licenses recorded before a Steam build is prepared.

## Release discipline

User-visible changes belong in `CHANGELOG.md`. Distribution-specific decisions and pre-Steam work belong in `STEAM_NOTES.md`. A production candidate should not be tagged until the QA checklist above has been exercised against the built artifact rather than only the development server.
