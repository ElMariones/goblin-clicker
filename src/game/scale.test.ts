import { describe, expect, it } from 'vitest';
import { SCALE_REFERENCES, getScaleComparison, getSteppedMultiple } from './scale';
import { SCALE_COPY } from '../i18n/scale';
import { SUPPORTED_LANGUAGES } from '../i18n';

describe('brood scale references', () => {
  it('is sorted strictly ascending', () => {
    for (let index = 1; index < SCALE_REFERENCES.length; index += 1) {
      expect(SCALE_REFERENCES[index].amount).toBeGreaterThan(SCALE_REFERENCES[index - 1].amount);
    }
  });

  it('uses unique ids', () => {
    const ids = SCALE_REFERENCES.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('offers a multiplier-free phrasing in every supported language', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      expect(SCALE_COPY[language].outnumbersPlain, language).toBeTruthy();
      expect(SCALE_COPY[language].allTimePlain, language).toBeTruthy();
    }
  });

  it('names every reference in every supported language', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      const copy = SCALE_COPY[language];
      expect(copy, language).toBeDefined();
      for (const { id } of SCALE_REFERENCES) {
        expect(copy.references[id], `${language}/${id}`).toBeTruthy();
      }
    }
  });

  it('spaces rungs so the line neither flickers nor stalls', () => {
    for (let index = 1; index < SCALE_REFERENCES.length; index += 1) {
      const ratio = SCALE_REFERENCES[index].amount / SCALE_REFERENCES[index - 1].amount;
      // Closer than 3x and a rung is passed before the player reads it.
      expect(ratio, SCALE_REFERENCES[index].id).toBeGreaterThanOrEqual(3);
      // Past 1e120 real quantities run out, so the tail is allowed to stretch.
      expect(Math.log10(ratio), SCALE_REFERENCES[index].id).toBeLessThan(40);
    }
  });
});

describe('getScaleComparison', () => {
  it('reports no reference below the first rung', () => {
    const comparison = getScaleComparison(59);
    expect(comparison.passed).toBeNull();
    expect(comparison.multiple).toBe(0);
    expect(comparison.next).toBe(SCALE_REFERENCES[0]);
  });

  it('treats a value equal to a rung as passed', () => {
    const comparison = getScaleComparison(60);
    expect(comparison.passed?.id).toBe('bus');
    expect(comparison.multiple).toBe(1);
    expect(comparison.next?.id).toBe('stadium');
  });

  it('picks the largest reference below the count', () => {
    const comparison = getScaleComparison(2.05e10);
    expect(comparison.passed?.id).toBe('humans');
    expect(comparison.multiple).toBeCloseTo(2.5, 5);
    expect(comparison.next?.id).toBe('chickens');
  });

  it('has no next reference once the ladder is exhausted', () => {
    const top = SCALE_REFERENCES[SCALE_REFERENCES.length - 1];
    const comparison = getScaleComparison(top.amount * 10);
    expect(comparison.passed).toBe(top);
    expect(comparison.next).toBeNull();
    expect(comparison.multiple).toBeCloseTo(10, 5);
  });

  it('is defined for every rung and never returns a stale multiple', () => {
    for (const reference of SCALE_REFERENCES) {
      const comparison = getScaleComparison(reference.amount * 3);
      expect(comparison.passed).toBe(reference);
      expect(comparison.multiple).toBeGreaterThanOrEqual(1);
    }
  });

  it('handles zero, negatives and non-finite counts', () => {
    for (const value of [0, -1, Number.NaN]) {
      const comparison = getScaleComparison(value);
      expect(comparison.passed).toBeNull();
      expect(comparison.next).toBe(SCALE_REFERENCES[0]);
    }
    expect(getScaleComparison(Number.POSITIVE_INFINITY).passed).toBeNull();
  });
});

describe('getSteppedMultiple', () => {
  it('snaps down to the 1-2-5 ladder', () => {
    expect(getSteppedMultiple(1.81)).toBe(1);
    expect(getSteppedMultiple(1.99)).toBe(1);
    expect(getSteppedMultiple(2)).toBe(2);
    expect(getSteppedMultiple(4.9)).toBe(2);
    expect(getSteppedMultiple(5)).toBe(5);
    expect(getSteppedMultiple(9.9)).toBe(5);
    expect(getSteppedMultiple(10)).toBe(10);
    expect(getSteppedMultiple(34)).toBe(20);
    expect(getSteppedMultiple(99)).toBe(50);
    expect(getSteppedMultiple(100)).toBe(100);
    expect(getSteppedMultiple(340)).toBe(200);
  });

  it('never reports more than the brood actually has', () => {
    for (let exponent = 0; exponent < 60; exponent += 1) {
      for (const leading of [1, 1.3, 1.999, 2, 3.7, 4.999, 5, 7.2, 9.999]) {
        const multiple = leading * 10 ** exponent;
        const stepped = getSteppedMultiple(multiple);
        expect(stepped, String(multiple)).toBeLessThanOrEqual(multiple * (1 + 1e-9));
        expect(stepped, String(multiple)).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('holds steady across a whole step before changing', () => {
    // Everything from 2x up to just under 5x reads the same, which is the point.
    const seen = new Set([2, 2.4, 3, 4.2, 4.99].map(getSteppedMultiple));
    expect(seen).toEqual(new Set([2]));
  });

  it('handles degenerate inputs', () => {
    for (const value of [0, 1, -3, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(getSteppedMultiple(value), String(value)).toBe(1);
    }
  });

  it('is exposed on every comparison', () => {
    expect(getScaleComparison(2.6e10 * 3.4).steppedMultiple).toBe(2);
    expect(getScaleComparison(60 * 12).steppedMultiple).toBe(10);
    expect(getScaleComparison(0).steppedMultiple).toBe(1);
  });
});
