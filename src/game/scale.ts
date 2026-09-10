/**
 * Real-world quantities used to describe how large the brood has become.
 *
 * Every amount is an accepted order-of-magnitude estimate, not a precise count;
 * the point is to give an unreadable number like 3.4e27 a shape a player can
 * picture. Entries must stay sorted strictly ascending — `scale.test.ts`
 * enforces it, and the lookup below relies on it.
 *
 * Spacing matters as much as the values: rungs closer than about 3x flicker past
 * in seconds, and very wide rungs leave the line stalled on one comparison. The
 * ladder therefore stretches only at the tail, past 1e120, where real quantities
 * genuinely run out.
 */
export const SCALE_REFERENCES = [
  { id: 'bus', amount: 60 },
  { id: 'stadium', amount: 100_000 },
  { id: 'pyramid', amount: 2_300_000 },
  { id: 'libraryItems', amount: 1.7e7 },
  { id: 'cars', amount: 1.5e9 },
  { id: 'humans', amount: 8.2e9 },
  { id: 'chickens', amount: 2.6e10 },
  { id: 'milkyWayStars', amount: 1e11 },
  { id: 'trees', amount: 3e12 },
  { id: 'cells', amount: 3.7e13 },
  { id: 'dinosaurSeconds', amount: 2.08e15 },
  { id: 'ants', amount: 2e16 },
  { id: 'bigBangSeconds', amount: 4.35e17 },
  { id: 'sand', amount: 7.5e18 },
  { id: 'rubik', amount: 4.3e19 },
  { id: 'oceanLitres', amount: 1.35e21 },
  { id: 'raindrops', amount: 1.01e22 },
  { id: 'universeStars', amount: 2e23 },
  { id: 'waterSpoon', amount: 1.7e24 },
  { id: 'oceanDrops', amount: 2.7e25 },
  { id: 'oceanSalt', amount: 8.5e26 },
  { id: 'bodyAtoms', amount: 7e27 },
  { id: 'bacteria', amount: 5e30 },
  { id: 'whaleAtoms', amount: 1.6e31 },
  { id: 'sunGrams', amount: 1.99e33 },
  { id: 'snowflakes', amount: 1e34 },
  { id: 'pyramidAtoms', amount: 3e35 },
  { id: 'allHumanAtoms', amount: 5.74e37 },
  { id: 'sandToFillTheSun', amount: 2.3e39 },
  { id: 'milkyWayKilos', amount: 1.5e42 },
  { id: 'atmosphereMolecules', amount: 1.07e44 },
  { id: 'chessPositions', amount: 4.8e44 },
  { id: 'oceanMolecules', amount: 4.5e46 },
  { id: 'moonAtoms', amount: 3.7e48 },
  { id: 'earthAtoms', amount: 1.33e50 },
  { id: 'jupiterAtoms', amount: 1.1e54 },
  { id: 'sunAtoms', amount: 1.2e57 },
  { id: 'planckTimes', amount: 8.1e60 },
  { id: 'galaxyAtoms', amount: 1e68 },
  { id: 'superclusterAtoms', amount: 1e72 },
  { id: 'keys256', amount: 1.16e77 },
  { id: 'universeAtoms', amount: 1e80 },
  { id: 'photonsInUniverse', amount: 1e89 },
  { id: 'sandToFillTheUniverse', amount: 5.8e92 },
  { id: 'googol', amount: 1e100 },
  { id: 'chessGames', amount: 1e120 },
  { id: 'keys512', amount: 1.34e154 },
  { id: 'factorial100', amount: 9.33e157 },
  { id: 'goPositions', amount: 2.08e170 },
  { id: 'planckVolumes', amount: 4.65e185 },
] as const satisfies readonly { id: string; amount: number }[];

export type ScaleReference = (typeof SCALE_REFERENCES)[number];
export type ScaleReferenceId = ScaleReference['id'];

export interface ScaleComparison {
  /** Largest reference the brood has passed, or null while below the first. */
  passed: ScaleReference | null;
  /** How many times the passed reference the brood is worth. At least 1. */
  multiple: number;
  /** `multiple` snapped down to the 1-2-5 ladder, for display. */
  steppedMultiple: number;
  /** The next reference to overtake, or null once every one has been passed. */
  next: ScaleReference | null;
}

/**
 * Snaps a multiplier down to the nearest 1, 2 or 5 in its decade, so the line
 * reads x2, x5, x10, x20 instead of ticking through 1.81, 1.82, 1.83. Returns 1
 * for anything below 2, which callers render as a bare comparison with no
 * multiplier at all.
 */
export function getSteppedMultiple(multiple: number): number {
  if (!Number.isFinite(multiple) || multiple < 2) return 1;
  let decade = 10 ** Math.floor(Math.log10(multiple));
  let leading = multiple / decade;
  // Guard against log10 rounding at exact powers of ten.
  if (leading >= 10) { decade *= 10; leading /= 10; }
  else if (leading < 1) { decade /= 10; leading *= 10; }
  return (leading >= 5 ? 5 : leading >= 2 ? 2 : 1) * decade;
}

/**
 * Describes a brood size against the reference ladder. Runs on every frame, so
 * it walks the (short, static) list from the top rather than allocating.
 */
export function getScaleComparison(goblins: number): ScaleComparison {
  if (!Number.isFinite(goblins) || goblins < SCALE_REFERENCES[0].amount) {
    return { passed: null, multiple: 0, steppedMultiple: 1, next: SCALE_REFERENCES[0] };
  }
  for (let index = SCALE_REFERENCES.length - 1; index >= 0; index -= 1) {
    const reference = SCALE_REFERENCES[index];
    if (goblins < reference.amount) continue;
    const multiple = goblins / reference.amount;
    return {
      passed: reference,
      multiple,
      steppedMultiple: getSteppedMultiple(multiple),
      next: SCALE_REFERENCES[index + 1] ?? null,
    };
  }
  return { passed: null, multiple: 0, steppedMultiple: 1, next: SCALE_REFERENCES[0] };
}
