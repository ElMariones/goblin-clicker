# Steam Distribution Notes

Brood & Burrow is currently a browser-first React/Vite game. These notes define the work required to turn a verified web release into a responsible desktop/Steam build without coupling the simulation to a particular wrapper too early.

## Packaging approach

Keep the web game as the source product and add a thin desktop shell only when the browser build is stable. Electron, Tauri, or another suitable wrapper can provide the Steam executable, but that choice should be made after measuring bundle size, platform requirements, updater strategy, and the needs of Steamworks integration.

The deterministic game engine should remain platform-agnostic. Steam-specific APIs belong behind a small adapter so a missing Steam client does not break local development or the browser version.

## Steamworks integration candidates

- **Steam achievements:** map a curated subset of in-game achievements to stable Steam stat/achievement IDs. Never derive API IDs directly from mutable display names.
- **Cloud saves:** synchronize a compact exported save or desktop save file. Conflict handling must prefer explicit player choice or a clearly documented newest-valid-save policy.
- **Rich Presence:** optionally surface current dynasty, broad production tier, or prestige level without exposing noisy rapidly changing counters.
- **Overlay:** verify focus, keyboard input, fullscreen/windowed transitions, and modal behavior with the overlay enabled.
- **Stats:** only send stable, intentionally selected lifetime metrics. Avoid high-frequency network updates for every click or CPS tick.

None of these systems should be assumed to exist until the actual Steamworks adapter is implemented and tested.

## Desktop expectations

- Windowed mode must remain usable at the minimum supported window size.
- High-DPI scaling should stay crisp at 100%, 125%, 150%, 200%, and macOS Retina scaling.
- The game must survive minimize/restore, sleep/wake, monitor changes, and system clock adjustments without duplicate offline progress.
- Close/quit should flush the current save where the platform lifecycle allows it.
- Keyboard shortcuts must not conflict dangerously with the desktop shell; destructive reset/import actions still require deliberate confirmation.
- The app should not require administrator privileges or write saves into the install directory.

## Save location and cloud policy

Before enabling Steam Cloud, define a single canonical desktop save location per OS and document it for support. Persist a schema version inside the save. Cloud synchronization should cover only player data, not caches, logs, screenshots, or machine-specific graphics/audio preferences unless there is a strong reason.

Recommended conflict test matrix:

1. Newer local save vs. older cloud save.
2. Older local save vs. newer cloud save.
3. One valid save vs. one corrupted save.
4. Two independently progressed valid saves with similar timestamps.
5. Offline play on machine A, then offline play on machine B before either syncs.

## Store-page asset checklist

- Capsule art in every current Steam-required dimension, built from owned/licensed source assets.
- Library hero/logo assets that remain legible at small sizes.
- At least five representative gameplay screenshots captured from the shipping build.
- Trailer footage that shows genuine interaction and progression rather than mockups.
- Short and long descriptions that accurately state idle/offline/prestige features present at launch.
- Supported-language list matching the actual in-game text, not planned localization.
- Accessibility and input notes kept factual and current.

## Commercial rights checklist

- [ ] Project name and store branding checked for obvious conflicts before commercial launch.
- [ ] All visual assets are original or have commercial redistribution rights recorded.
- [ ] Fonts are licensed for embedding/distribution in the chosen desktop wrapper.
- [ ] Audio/music licenses explicitly allow commercial game distribution.
- [ ] Dependency licenses have been audited, including transitive desktop-wrapper dependencies.
- [ ] No copied prose, artwork, sound, distinctive iconography, or trade dress from other incremental games ships in the build.
- [ ] Privacy disclosures accurately describe analytics/crash reporting if any is later added.

## Release-candidate gate

A Steam candidate should be cut only after the browser production build passes the QA checklist in `README.md`, then the packaged executable also passes:

- [ ] Windows fresh install / launch / save / quit / relaunch / uninstall.
- [ ] macOS signed/notarized launch and save-cycle validation if macOS is supported.
- [ ] Linux launch and save-cycle validation on declared distributions if Linux is supported.
- [ ] Steam client online, offline mode, and client-not-running behavior.
- [ ] Steam Overlay on/off.
- [ ] Controller behavior documented accurately if controller support is advertised.
- [ ] Cloud-save conflicts and a deliberately corrupted cloud/local save.
- [ ] Achievement unlocks are idempotent and never relock after a local reset.
- [ ] Offline production is not awarded twice around app suspend/resume or cloud restoration.
- [ ] No development menus, test multipliers, source credentials, or verbose debug logging ship enabled.
- [ ] Store build depot contains only intended redistributable files.

## Support information to capture per release

Record the app version, save-schema version, wrapper version, Steamworks SDK/integration version, supported OS versions, known migration boundaries, and a SHA/checksum for the final depot artifact in release notes kept with the build pipeline.
