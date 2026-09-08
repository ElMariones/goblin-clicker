# Art, interface and interaction direction

## 1. Visual thesis

**A goblin has repaired a 1970s industrial control room using a kitchen drawer.**

Keep Brood & Burrow's illustrated character, dense incremental interface and CRT atmosphere. Replace fungal growth with purposeful mechanical assemblies: riveted plates, braided copper, ceramic sockets, punchcards and warm furnace mouths. Mechanical precision should be repeatedly interrupted by goblin choices: one fork for a hand, a soup-can chest, a crown held on by a bent nail.

The memorable feature is the **assembly cradle**: a small robot suspended in a repair jig, surrounded by three clearly grouped production circuits. Avoid making every panel a novelty. Wallets, prices and text remain quiet and highly readable.

The wireframe below specifies layout and information hierarchy. Its values are illustrative. Implementing models should use live engine values and create the illustrated assets described in this document.

## 2. Theme tokens

Scope variables under `.world--robogoblins`. Do not change the root organic theme.

| Token | Hex | Purpose |
| --- | --- | --- |
| Oiled steel | `#111A23` | Main background, almost no glow |
| Gunmetal | `#1E2C38` | Raised control surfaces |
| Porcelain | `#E8ECE7` | Main text, dial faces and robot eye whites |
| Instrument blue | `#88C8DE` | Selected tab, factory output, focus and charge |
| Copper | `#E9AE75` | Ready RG, physical wiring, available purchases |
| Core lilac | `#CEB8EB` | Kernel currency and Recompile, continuity with Cunning's prestige family |

Secondary text: `#A7B7C4`; unavailable text: `#82909B` with semantic disabled state and enough contrast for its context. Error accent may reuse organic danger `#E87362`, but never use red to mean normal waiting. Validate actual text/background pairs; translucent overlays alter contrast.

Use a subtle industrial grid only behind the stage, not beneath dense text. Add small plate seams at genuine structural boundaries. No decorative full-screen sparks, hologram fog, excessive hazard tape, chrome gradients or blue-glow borders around every control. CRT scanlines are faint and respect effects settings.

### Typography

Retain the existing `--font-ui` stack for descriptions, navigation and readable numbers. Use the existing `--font-display` monospace for short factory titles, core counters and compact technical labels where it fits the inherited game identity. Do not introduce a remote font request for this expansion.

Ready RG numeral: responsive 42–72px; panel titles 18–22px; body 14–16px; minimum secondary text 12px. Use tabular numerals on prices/countdowns, normal letter spacing, sentence case. Reserve all-caps only if reproducing a tiny diegetic stamped warning, never as the only readable instruction. Use real labels such as “In assembly” and “Ready in 12s”.

## 3. Layout

Desktop retains the recognizable three-column composition. Add the plane navigation as its own strip below the global header so new currencies do not compete with tabs.

```text
┌ Brand                       RG | Average /s | Kernel Cores       Settings ┐
│ Warren   [RoboGoblins]                     Warren producing 14.2M/s      │
├───────────────────┬────────────────────────────────┬───────────────────┤
│ Factory ledger    │                  Charge 84/120 │ Assembly lines    │
│ Ready / in batch  │ RoboGoblins                    │ 1 10 100 Max      │
│ This compile     │ 1.24M ready                    │                   │
│                   │                                │ Tin Cradle   49   │
│ Circuits          │     ROBOT IN ASSEMBLY JIG       │ +rate / batch bar │
│ Scrap     2/4     │       [ Assemble +120 ]        │ [Buy] [Next tier] │
│ Steam     0/4     │                                │                   │
│ Impossible 0/4   │ circuit expansion silhouettes  │ ...               │
│                   │                                │                   │
│ Blueprints        │ Next: Tin Cradle 50 → ×3 local │                   │
│ Kernel / Recompile│                                │                   │
└───────────────────┴────────────────────────────────┴───────────────────┘
```

The diagram's values are illustrative. Circuit “2/4” means reached circuit tiers, not two member lines owned; spell out “2 of 4 tiers” in actual accessible text. Members are separately shown as four sockets with named progress.

Desktop proportions: left 240–280px, flexible stage at least 380px, right 360–420px. Keep purchase rows aligned; the row art may be irregular but prices must not wander. Limit central decorative line sprites to one per type or a small fixed instance budget, not one DOM/image per owned factory. Avoid twelve independent high-frequency animated counters.

At widths below roughly 1100px, place the ledger/circuit controls in a compact row or collapsible drawer and retain stage + shop. Below 760px, use one document flow: tabs, wallet/average, compact assembly stage, Overclock, shop, circuits, blueprints/Kernel. Provide a sticky compact shortcut bar for Shop / Circuits / Kernel; preserve the selected world's scroll position. Do not force all twelve rows above the fold or put scrolling controls inside a tiny viewport.

Mobile stage may use a 200–250px robot; do not shrink purchase targets below 44×44px to keep a desktop composition. At 390px, a row can use two lines: name/owned, then rate/batch and price/button. Secondary lore expands on demand. Allow translated text to wrap.

## 4. Asset handoff

Production asset targets: central robots 768×768 transparent WebP, with clean silhouettes at 220px; line icons 384×384 transparent WebP, clear at 64px; theme background layers optional 1600×1000 WebP without embedded text. Keep source artwork outside runtime paths. Export optimized assets and record authorship/license provenance. Do not recolor existing organic art and call it complete.

### Common art brief

“Illustrated fantasy mechanical goblin, rich hand-worked texture, mischievous expressive face, asymmetrical pointed metal ears, stolen household hardware, copper and worn gunmetal, warm tiny furnace heart, instrument-blue eye detail, readable three-quarter silhouette, restrained edge highlights, transparent background, no letters, no watermark, no UI, no modern clean humanoid android. Match the chunky detailed fantasy illustration language of the existing Brood & Burrow assets while giving machinery real weight.”

Use the twelve line concepts in GAME_DESIGN.md as specific subjects under this shared brief. The progression should grow in scale and impossibility while keeping a recognizable shape at small sizes:

| Asset name | Composition note |
| --- | --- |
| `tin-cradle.webp` | Low oval tin nest; two little pointed ears emerging |
| `windup-workbench.webp` | Diagonal workbench; oversized key forms the silhouette |
| `cutlery-press.webp` | Tall press framing a fork-handed newborn |
| `magnet-nursery.webp` | Horseshoe magnet over a round scrap pool |
| `boiler-brood.webp` | Broad pot-bellied furnace mother; warm orange opening |
| `punchcard-den.webp` | Boxy nest with curling punched paper ribbons |
| `servo-scriptorium.webp` | Arched desk, two scribes, one long mechanical quill |
| `walking-foundry.webp` | Heavy furnace body on visibly unsuitable bent legs |
| `thunderhead-coil.webp` | Coil cage holding a small dark cloud and one bright spark |
| `moonwire-loom.webp` | Crescent spool feeding wire through a crooked loom |
| `clockwyrm-assembly.webp` | Coiled gear dragon, mouth and conveyor clearly separated |
| `paradox-nest.webp` | Nested impossible ring; small older/younger goblin pair assembling each other |

Central looks:

- `tin-rascal.webp`: soup-can chest, fork fingers, uneven ears, one glass lens and one painted eye, grin cut into sheet metal.
- `boiler-baron.webp`: same body language, pressure-gauge monocle, small stovepipe crown, warm boiler heart; no taller hitbox.
- `clockwork-ancestor.webp`: same silhouette, brass memory discs, a crescent halo made of mismatched gears, patched lilac robe made of circuit ribbons.

Use localized HTML for all labels; no text baked into illustrations. Provide placeholder silhouettes with exact dimensions until art arrives. Pixel snapping is not mandatory because existing assets are detailed illustrations, not strictly low-resolution sprites.

## 5. Interaction states and motion

| Element | Available / active | Waiting / unavailable | Completion |
| --- | --- | --- | --- |
| Plane tab | Underline + filled icon + selected semantics | Lock icon + clear Charter requirement | Unlock highlights once and offers entry |
| Line row | Copper purchase affordance, exact cost | Readable cost and shortage, disabled purchase | Owned count changes; one short mechanical click |
| Batch | Thin progress track, explicit countdown | Normal waiting is neutral | Short delivery sweep; aggregate RG toast if useful |
| Circuit | Blue wire and numbered tier badge | Hollow socket with named missing quantity | One line trace, no full-screen effect |
| Overclock | Visible charge and accessible button | “Charging · 36s” or active countdown | Cradle heart brightens; phase rate visualization changes |
| Recompile | Lilac “Recompile · +8 cores” | “Next core at …” | A brief memory-disc transfer; new run becomes authoritative immediately |

Manual action response: 70–100ms compression, 130–180ms release, one limited particle/floating-number group. Batches: at most one coalesced delivery animation per 250ms, maximum six floating groups. Rapid tapping must not allocate one persistent element or sound voice per event. Audio can play at most eight overlapping short mechanical effects; lower the rate for repeated input.

Recompile transition: about 700ms, optional; robot's eyes stay lit while the factory plates fold away and one memory disc remains. Persist the reset before any animation begins. With reduced motion or effects disabled, replace it with a short static success state and move focus immediately. Never tie an award to transition-end.

Avoid continuous camera shake, blinking warning lights and overclock strobing. When neither the document nor the mechanical plane is visible, stop decorative animations and audio cues for its batches. Its economy continues under the specified online/offline rules.

## 6. Copy and feedback

Flavor belongs beside a clear action, not instead of it. Use these canonical strings or faithful localized equivalents:

- “Assemble” / “Each press: +{amount} RoboGoblins”
- “Ready RoboGoblins” / “In assembly” / “Average assembly per second”
- “Next batch in {time}” / “Already assembled: {amount}”
- “Buy {quantity} · {cost} RG” / “Next milestone: {quantity} units”
- “Scrap circuit · {tier} of 4 tiers” / “Need {amount} more {line}”
- “Overclock · 30s at double assembly” / “Charging: {charge}/120”
- “Recompile · +{cores} Kernel Cores”
- “Recompile this foundry? Your robot stock, lines, blueprints and firmware reset. Your Kernel, discoveries and organic Warren stay.”
- “The factory is quiet. Buy a Tin Cradle to begin automatic assembly.”
- “Your Warren is still producing {rate} goblins/s.”

Avoid showing fictional telemetry, fabricated efficiency ratings or warnings about backend systems. Every value needs a defined engine source. A tooltip may show rate factors for players who want the math; the primary purchase flow needs only cost, output and the next meaningful threshold.

## 7. Audio direction

Retain user music/sound/mute/volume settings across worlds. Start with the existing music player: theme-specific music is optional until original tracks are licensed/created and reviewed. Do not invent a finished audio asset.

Desired sounds: small ratchet for assemble, soft tray clink for batched delivery, one rising relay chord for a circuit, low transformer hum during Overclock, a single warm tape-start tone for Recompile. Avoid high-frequency grinding under repeated input. Mute hidden-plane incidental sound. A later mechanical soundtrack could use muted marimba, low analog pulses and uneven percussion while keeping the current ambient mood.

## 8. Accessibility and acceptance

- Focus outline uses instrument blue and visible offset, with sufficient contrast. Selection always has a structural marker, not color alone.
- Every icon-only action has a localized accessible name. The central robot is decorative inside a clearly named Assemble button; do not repeat its art description on every activation.
- Wallet ticks are not an `aria-live` stream. Announce deliberate purchases, meaningful milestones and reset outcomes; throttle aggregated notices.
- Batch bars expose useful progress information without dozens of screen-reader updates per second. The countdown can update once per second or on focus, independent of 100ms engine ticks.
- Escape and focus restoration follow existing `Modal` behavior. Do not nest a new uncontrolled modal over Kernel confirmation.
- At 200% zoom and 390px, currency and purchase controls remain visible and no content depends on hover. Test long German strings and Arabic RTL.
- Effects-off and reduced-motion remove scanlines/warping, moving wires, robot jig oscillation and particles. Batch math, focus, toast text and all interactions remain intact.

Final critique: if the result reads as a generic cyberpunk blue dashboard, add the physical goblin objects and remove decorative glow. If it reads as a recolored Warren, change the assembly jig, batch rows and circuit wiring. If the art competes with the next purchase decision, reduce the art's motion and increase the text's clarity.
