import { describe, expect, it } from 'vitest';
import { SCALE_BANDS, SCALE_REFERENCES, getScaleComparison } from './scale';
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

  it('names every reference in every supported language', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      const copy = SCALE_COPY[language];
      expect(copy, language).toBeDefined();
      for (const { id } of SCALE_REFERENCES) {
        expect(copy.references[id], `${language}/${id}`).toBeTruthy();
      }
    }
  });

  it('writes a remark for every band in every supported language', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      for (const band of SCALE_BANDS) {
        expect(SCALE_COPY[language].remarks[band], `${language}/${band}`).toBeTruthy();
      }
    }
  });

  it('never moves a band backwards along the ladder', () => {
    let highest = 0;
    for (const reference of SCALE_REFERENCES) {
      const index = SCALE_BANDS.indexOf(reference.band);
      expect(index, reference.id).toBeGreaterThanOrEqual(highest);
      highest = index;
    }
    // Every band is actually reachable.
    const used = new Set(SCALE_REFERENCES.map(({ band }) => band));
    for (const band of SCALE_BANDS) expect(used.has(band), band).toBe(true);
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
