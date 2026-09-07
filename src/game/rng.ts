/**
 * Small deterministic PRNG helpers. Nothing in game simulation calls Math.random(),
 * making event sequences reproducible from a save's seed/counter pair.
 */
export function normalizeSeed(seed: number): number {
  const normalized = Number.isFinite(seed) ? Math.floor(seed) >>> 0 : 0;
  return normalized === 0 ? 0x6d2b79f5 : normalized;
}

export function seedFromTimestamp(timestamp: number): number {
  let value = normalizeSeed(timestamp);
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return normalizeSeed(value);
}

/** Returns a stable pseudo-random float in [0, 1) for a seed/counter pair. */
export function randomAt(seed: number, counter: number): number {
  let value = normalizeSeed(seed) ^ Math.imul((Math.floor(counter) + 1) >>> 0, 0x9e3779b9);
  value ^= value >>> 16;
  value = Math.imul(value, 0x21f0aaad);
  value ^= value >>> 15;
  value = Math.imul(value, 0x735a2d97);
  value ^= value >>> 15;
  return (value >>> 0) / 0x1_0000_0000;
}

export function randomInt(seed: number, counter: number, minInclusive: number, maxInclusive: number): number {
  if (maxInclusive < minInclusive) {
    throw new RangeError('maxInclusive must be greater than or equal to minInclusive');
  }
  const span = maxInclusive - minInclusive + 1;
  return minInclusive + Math.floor(randomAt(seed, counter) * span);
}
