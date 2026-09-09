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
 *
 * `band` groups rungs by how absurd the number has become, and drives the
 * goblin-voice remark under the comparison. Bands never go backwards along the
 * ladder.
 */
export const SCALE_BANDS = ['room', 'warren', 'world', 'sky', 'void', 'beyond'] as const;
export type ScaleBand = (typeof SCALE_BANDS)[number];

export const SCALE_REFERENCES = [
  { id: 'bus', amount: 60, band: 'room' },
  { id: 'stadium', amount: 100_000, band: 'room' },
  { id: 'pyramid', amount: 2_300_000, band: 'room' },
  { id: 'libraryItems', amount: 1.7e7, band: 'room' },
  { id: 'cars', amount: 1.5e9, band: 'room' },

  { id: 'humans', amount: 8.2e9, band: 'warren' },
  { id: 'chickens', amount: 2.6e10, band: 'warren' },
  { id: 'milkyWayStars', amount: 1e11, band: 'warren' },
  { id: 'trees', amount: 3e12, band: 'warren' },
  { id: 'cells', amount: 3.7e13, band: 'warren' },
  { id: 'dinosaurSeconds', amount: 2.08e15, band: 'warren' },
  { id: 'ants', amount: 2e16, band: 'warren' },
  { id: 'bigBangSeconds', amount: 4.35e17, band: 'warren' },

  { id: 'sand', amount: 7.5e18, band: 'world' },
  { id: 'rubik', amount: 4.3e19, band: 'world' },
  { id: 'oceanLitres', amount: 1.35e21, band: 'world' },
  { id: 'raindrops', amount: 1.01e22, band: 'world' },
  { id: 'universeStars', amount: 2e23, band: 'world' },
  { id: 'waterSpoon', amount: 1.7e24, band: 'world' },
  { id: 'oceanDrops', amount: 2.7e25, band: 'world' },
  { id: 'oceanSalt', amount: 8.5e26, band: 'world' },
  { id: 'bodyAtoms', amount: 7e27, band: 'world' },

  { id: 'bacteria', amount: 5e30, band: 'sky' },
  { id: 'whaleAtoms', amount: 1.6e31, band: 'sky' },
  { id: 'sunGrams', amount: 1.99e33, band: 'sky' },
  { id: 'snowflakes', amount: 1e34, band: 'sky' },
  { id: 'pyramidAtoms', amount: 3e35, band: 'sky' },
  { id: 'allHumanAtoms', amount: 5.74e37, band: 'sky' },
  { id: 'sandToFillTheSun', amount: 2.3e39, band: 'sky' },
  { id: 'milkyWayKilos', amount: 1.5e42, band: 'sky' },
  { id: 'atmosphereMolecules', amount: 1.07e44, band: 'sky' },
  { id: 'chessPositions', amount: 4.8e44, band: 'sky' },
  { id: 'oceanMolecules', amount: 4.5e46, band: 'sky' },
  { id: 'moonAtoms', amount: 3.7e48, band: 'sky' },

  { id: 'earthAtoms', amount: 1.33e50, band: 'void' },
  { id: 'jupiterAtoms', amount: 1.1e54, band: 'void' },
  { id: 'sunAtoms', amount: 1.2e57, band: 'void' },
  { id: 'planckTimes', amount: 8.1e60, band: 'void' },
  { id: 'galaxyAtoms', amount: 1e68, band: 'void' },
  { id: 'superclusterAtoms', amount: 1e72, band: 'void' },
  { id: 'keys256', amount: 1.16e77, band: 'void' },
  { id: 'universeAtoms', amount: 1e80, band: 'void' },
  { id: 'photonsInUniverse', amount: 1e89, band: 'void' },

  { id: 'sandToFillTheUniverse', amount: 5.8e92, band: 'beyond' },
  { id: 'googol', amount: 1e100, band: 'beyond' },
  { id: 'chessGames', amount: 1e120, band: 'beyond' },
  { id: 'keys512', amount: 1.34e154, band: 'beyond' },
  { id: 'factorial100', amount: 9.33e157, band: 'beyond' },
  { id: 'goPositions', amount: 2.08e170, band: 'beyond' },
  { id: 'planckVolumes', amount: 4.65e185, band: 'beyond' },
] as const satisfies readonly { id: string; amount: number; band: ScaleBand }[];

export type ScaleReference = (typeof SCALE_REFERENCES)[number];
export type ScaleReferenceId = ScaleReference['id'];

export interface ScaleComparison {
  /** Largest reference the brood has passed, or null while below the first. */
  passed: ScaleReference | null;
  /** How many times the passed reference the brood is worth. At least 1. */
  multiple: number;
  /** The next reference to overtake, or null once every one has been passed. */
  next: ScaleReference | null;
}

/**
 * Describes a brood size against the reference ladder. Runs on every frame, so
 * it walks the (short, static) list from the top rather than allocating.
 */
export function getScaleComparison(goblins: number): ScaleComparison {
  if (!Number.isFinite(goblins) || goblins < SCALE_REFERENCES[0].amount) {
    return { passed: null, multiple: 0, next: SCALE_REFERENCES[0] };
  }
  for (let index = SCALE_REFERENCES.length - 1; index >= 0; index -= 1) {
    const reference = SCALE_REFERENCES[index];
    if (goblins < reference.amount) continue;
    return {
      passed: reference,
      multiple: goblins / reference.amount,
      next: SCALE_REFERENCES[index + 1] ?? null,
    };
  }
  return { passed: null, multiple: 0, next: SCALE_REFERENCES[0] };
}
