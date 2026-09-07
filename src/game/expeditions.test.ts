import { describe, expect, it } from 'vitest';
import { applyOfflineProgress, BASE_OFFLINE_CAP_MS, getOfflineEfficiency } from './offline';
import { cancelExpedition, claimExpedition, hatchGoblin, performPrestigeReset, purchaseBuilding, purchaseUpgrade, sellBuilding, startExpedition, tickGame } from './engine';
import { EXPEDITION_BANDS, EXPEDITION_CREWS, EXPEDITION_DESTINATIONS, getExpeditionQuote, isExpeditionUnlocked } from './expeditions';
import { BUILDINGS } from './content';
import { getBaseCps, getBuildingCps, getCps, getExpeditionReservation, getPrestigeShardGain } from './math';
import { deserializeGame, serializeGame } from './save';
import { createInitialGameState } from './state';
import type { ExpeditionBand, ExpeditionCrew, ExpeditionDestination, ExpeditionPlan, GameState } from './types';

const START = 1000;
const basePlan: ExpeditionPlan = { destination: 'mine', crew: 'scouts', band: 'short', complication: false };
function warren(route: ExpeditionDestination = 'mine', mask = 0): GameState {
  const s = createInitialGameState(START, 7);
  s.buildings.war_camp = 1;
  for (const id of EXPEDITION_DESTINATIONS[route].buildings) s.buildings[id] = 100;
  const pairs = [['matron_dynasty', 'fungal_symbiosis'], ['scrap_standardization', 'redline_industry'], ['moon_cult', 'ancestor_choir'], ['gate_network', 'impossible_brood']];
  pairs.forEach((pair, i) => { s.purchasedUpgrades[`doctrine_${pair[(mask >> i) & 1]}`] = true; });
  return s;
}
const plans: ExpeditionPlan[] = (Object.keys(EXPEDITION_DESTINATIONS) as ExpeditionDestination[]).flatMap(destination =>
  (Object.keys(EXPEDITION_CREWS) as ExpeditionCrew[]).flatMap(crew => (Object.keys(EXPEDITION_BANDS) as ExpeditionBand[]).flatMap(band =>
    [false, true].map(complication => ({ destination, crew, band, complication })))));
const relative = (actual: number, expected: number) => expect(actual / expected).toBeCloseTo(1, 9);

describe('expedition strategy matrix: 54 plans × 16 doctrine builds × online/offline', () => {
  it.each(plans)('$destination / $crew / $band / complication $complication', plan => {
    for (let mask = 0; mask < 16; mask++) {
      const state = warren(plan.destination, mask);
      const quote = getExpeditionQuote(state, plan);
      expect(quote.durationMs).toBeGreaterThanOrEqual(146250);
      expect(quote.durationMs).toBeLessThanOrEqual(4500000);
      expect(quote.reservation).toBeGreaterThanOrEqual(.10);
      expect(quote.reservation).toBeLessThanOrEqual(.23);
      const dispatched = startExpedition(state, plan);
      expect(dispatched.expeditions.active).not.toBeNull();
      const end = dispatched.expeditions.active!.endsAt;
      const baseline = getBaseCps(state) * (end - START) / 1000;
      const arrived = tickGame(dispatched, end);
      expect(getExpeditionReservation(arrived)).toBe(0);
      relative(arrived.goblins + arrived.expeditions.active!.reserved, baseline);
      const claimed = claimExpedition(arrived);
      relative(claimed.reward, quote.estimatedReward);
      relative(claimed.state.goblins - baseline, quote.estimatedProfit);
      const improvement = claimed.state.goblins / baseline;
      expect(improvement).toBeGreaterThanOrEqual(1.045);
      expect(improvement).toBeLessThanOrEqual(1.242);
      expect(claimed.state.expeditions.artifacts[plan.destination]).toBe(true);
      expect(claimExpedition(claimed.state).reward).toBe(0);
      const offline = applyOfflineProgress(dispatched, end);
      const offlineClaim = claimExpedition(offline.state);
      relative(offlineClaim.reward, claimed.reward * getOfflineEfficiency(state));
      relative(offlineClaim.state.goblins, claimed.state.goblins * getOfflineEfficiency(state));
      const loaded = deserializeGame(serializeGame(arrived), end).state;
      expect(loaded.expeditions).toEqual(arrived.expeditions);
    }
  });
});

describe('planning decisions', () => {
  it('each route wins on the warren it favors', () => {
    for (const destination of Object.keys(EXPEDITION_DESTINATIONS) as ExpeditionDestination[]) {
      const state = warren(destination);
      const scores = Object.keys(EXPEDITION_DESTINATIONS).map(id => ({ id, score: getExpeditionQuote(state, { ...basePlan, destination: id as ExpeditionDestination }).estimatedProfit }));
      expect(scores.sort((a, b) => b.score - a.score)[0].id).toBe(destination);
    }
  });
  it('crews offer distinct liquidity, throughput and reservation tradeoffs', () => {
    const state = warren();
    const scouts = getExpeditionQuote(state, basePlan);
    const haulers = getExpeditionQuote(state, { ...basePlan, crew: 'haulers' });
    const keepers = getExpeditionQuote(state, { ...basePlan, crew: 'keepers' });
    expect(scouts.durationMs).toBeLessThan(haulers.durationMs);
    expect(haulers.estimatedProfit / haulers.durationMs).toBeGreaterThan(scouts.estimatedProfit / scouts.durationMs);
    expect(keepers.reservation).toBeLessThan(scouts.reservation);
    expect(keepers.rewardMultiplier).toBeGreaterThan(scouts.rewardMultiplier);
  });
  it('long bands have the same per-minute profit, without rewarding frequent login', () => {
    const state = warren();
    const quotes = (Object.keys(EXPEDITION_BANDS) as ExpeditionBand[]).map(band => getExpeditionQuote(state, { ...basePlan, band }));
    for (const q of quotes) relative(q.estimatedProfit / q.durationMs, quotes[0].estimatedProfit / quotes[0].durationMs);
  });
  it('complications increase profit but require more production and time', () => {
    const plain = getExpeditionQuote(warren(), basePlan);
    const hard = getExpeditionQuote(warren(), { ...basePlan, complication: true });
    expect(hard.reservation).toBeGreaterThan(plain.reservation);
    expect(hard.durationMs).toBeGreaterThan(plain.durationMs);
    expect(hard.estimatedProfit / hard.durationMs).toBeGreaterThan(plain.estimatedProfit / plain.durationMs);
  });
  it('mastery time reduction caps at 25%, with no runaway reward multiplier', () => {
    const s = warren();
    for (const b of BUILDINGS) s.buildings[b.id] = 300;
    const q = getExpeditionQuote(s, basePlan);
    expect(q.masteryReduction).toBe(.25);
    expect(q.rewardMultiplier).toBeLessThanOrEqual(1.75);
  });
});

describe('expedition integrity and regressions', () => {
  it('keeps fresh gameplay unchanged and unlocks at War Camp or dimensional structures', () => {
    const state = createInitialGameState(START);
    expect(isExpeditionUnlocked(state)).toBe(false);
    expect(startExpedition(state, basePlan).expeditions.active).toBeNull();
    expect(hatchGoblin(state).amount).toBe(1);
    for (const id of ['war_camp', 'goblin_gate', 'reality_burrow'] as const) expect(isExpeditionUnlocked({ ...state, buildings: { ...state.buildings, [id]: 1 } })).toBe(true);
  });
  it('rejects invalid plans and a second simultaneous crew', () => {
    const active = startExpedition(warren(), basePlan);
    expect(startExpedition(active, { ...basePlan, destination: 'cellar' }).expeditions.active).toEqual(active.expeditions.active);
    expect(startExpedition(warren(), { ...basePlan, crew: '__proto__' } as unknown as ExpeditionPlan).expeditions.active).toBeNull();
  });
  it('integrates buff and arrival boundaries exactly regardless of tick size', () => {
    const state = startExpedition(warren(), basePlan);
    const end = state.expeditions.active!.endsAt;
    state.buffs = [{ id: 'moon_frenzy', target: 'cps', startedAt: START + 10000, expiresAt: end - 20000, multiplier: 7 }];
    const once = tickGame(state, end + 10000);
    let stepped = state;
    for (let t = START + 500; t < end + 10000; t += 500) stepped = tickGame(stepped, t);
    stepped = tickGame(stepped, end + 10000);
    relative(stepped.goblins, once.goblins);
    relative(stepped.expeditions.active!.reserved, once.expeditions.active!.reserved);
    const base = getBaseCps(state);
    const grossBeforeEnd = base * ((end - START) / 1000 + 6 * ((end - 20000 - START - 10000) / 1000));
    relative(once.expeditions.active!.reserved, grossBeforeEnd * state.expeditions.active!.reservation);
    relative(Object.values(once.statistics.lifetimeProducedByBuilding).reduce((a, b) => a + b, 0), once.goblins);
  });
  it('production investment and sales affect actual reservations, without changing locked affinity', () => {
    let state = warren(); state.goblins = 1e20;
    state = startExpedition(state, basePlan);
    const quoteMultiplier = state.expeditions.active!.rewardMultiplier;
    const before = tickGame(state, START + 1000);
    const bought = purchaseBuilding(before, 'scrap_incubator', 10, before.lastUpdateAt).state;
    const after = tickGame(bought, START + 2000);
    expect(after.expeditions.active!.reserved - before.expeditions.active!.reserved).toBeGreaterThan(before.expeditions.active!.reserved);
    const sold = sellBuilding(after, 'scrap_incubator', 110, after.lastUpdateAt).state;
    const final = tickGame(sold, START + 3000);
    expect(final.expeditions.active!.rewardMultiplier).toBe(quoteMultiplier);
    expect(final.expeditions.active!.reserved - after.expeditions.active!.reserved).toBeLessThan(after.expeditions.active!.reserved - before.expeditions.active!.reserved);
  });
  it('research, hatching and per-building CPS continue to work during a trip', () => {
    const state = startExpedition(warren(), basePlan); state.goblins = 1e20;
    state.statistics.totalClicks = 25;
    const upgraded = purchaseUpgrade(state, 'sharpened_nails');
    expect(upgraded.success).toBe(true);
    expect(hatchGoblin(upgraded.state).amount).toBeGreaterThan(hatchGoblin(state).amount);
    relative(BUILDINGS.reduce((sum, b) => sum + getBuildingCps(state, b.id), 0), getCps(state));
  });
  it('recalling forfeits only the haul and immediately restores production', () => {
    const state = startExpedition(warren(), basePlan);
    const ticked = tickGame(state, START + 10000);
    const recalled = cancelExpedition(state, START + 10000);
    expect(recalled.goblins).toBe(ticked.goblins);
    expect(recalled.expeditions.active).toBeNull();
    expect(getCps(recalled)).toBe(getBaseCps(recalled));
    expect(recalled.buildings).toEqual(state.buildings);
    expect(claimExpedition(recalled).reward).toBe(0);
  });
  it('cannot erase a completed haul through an arrival-edge recall', () => {
    const state = startExpedition(warren(), basePlan);
    const end = state.expeditions.active!.endsAt;
    for (const now of [end, end + 1]) {
      const recalled = cancelExpedition(state, now);
      expect(recalled.expeditions.active).not.toBeNull();
      expect(recalled.lastUpdateAt).toBeGreaterThanOrEqual(end);
      expect(claimExpedition(recalled, now).reward).toBeGreaterThan(0);
    }
  });
  it('arrival restores output and leaves a non-expiring, exactly-once claim', () => {
    const state = startExpedition(warren(), basePlan);
    const end = state.expeditions.active!.endsAt;
    expect(claimExpedition(state, end - 1).reward).toBe(0);
    const arrived = tickGame(state, end);
    const later = tickGame(arrived, end + 86400000);
    expect(later.expeditions.active!.reserved).toBe(arrived.expeditions.active!.reserved);
    expect(claimExpedition(later).reward).toBe(claimExpedition(arrived).reward);
  });
  it('offline progress respects its cap, never duplicates rewards, and attributes net output', () => {
    const state = startExpedition(warren(), { ...basePlan, band: 'long' });
    const end = START + BASE_OFFLINE_CAP_MS * 10;
    const offline = applyOfflineProgress(state, end);
    const cap = applyOfflineProgress(state, START + BASE_OFFLINE_CAP_MS);
    expect(offline.progress.goblinsProduced).toBe(cap.progress.goblinsProduced);
    expect(offline.state.expeditions).toEqual(cap.state.expeditions);
    const repeat = applyOfflineProgress(offline.state, end);
    expect(repeat.state.goblins).toBe(offline.state.goblins);
    expect(repeat.state.expeditions).toEqual(offline.state.expeditions);
    relative(Object.values(offline.state.statistics.lifetimeProducedByBuilding).reduce((a, b) => a + b, 0), offline.progress.goblinsProduced);
  });
  it('offline and online segments settle the exact respective reserved output', () => {
    const state = startExpedition(warren(), basePlan);
    const end = state.expeditions.active!.endsAt;
    const halfway = (START + end) / 2;
    const online = tickGame(state, halfway);
    const offline = applyOfflineProgress(online, end);
    const expected = getBaseCps(state) * (end - START) / 1000 * state.expeditions.active!.reservation * (1 + getOfflineEfficiency(state)) / 2;
    relative(offline.state.expeditions.active!.reserved, expected);
  });
  it('migration recalls the crew, preserves curios and clears reservation', () => {
    let state = startExpedition(warren(), basePlan);
    state = claimExpedition(state, state.expeditions.active!.endsAt).state;
    state = startExpedition(state, basePlan);
    state.runGoblins = 1e12; state.lifetimeGoblins = 1e12;
    const reset = performPrestigeReset(state);
    expect(reset.success).toBe(true);
    expect(reset.state.expeditions).toEqual({ active: null, completed: 1, artifacts: { mine: true } });
    expect(getExpeditionReservation(reset.state)).toBe(0);
  });
  it('migration automatically banks a crew that already returned before calculating shards', () => {
    const active = startExpedition(warren(), basePlan);
    const end = active.expeditions.active!.endsAt;
    const arrived = tickGame(active, end);
    arrived.lifetimeGoblins = 4_999_999;
    arrived.runGoblins = 4_999_999;
    const expected = claimExpedition(arrived).state;
    const expectedGain = getPrestigeShardGain(expected);
    expect(expectedGain).toBeGreaterThan(0);
    const reset = performPrestigeReset(arrived);
    expect(reset.success).toBe(true);
    expect(reset.amount).toBe(expectedGain);
    expect(reset.state.expeditions.active).toBeNull();
    expect(reset.state.expeditions.completed).toBe(1);
    expect(reset.state.expeditions.artifacts.mine).toBe(true);
  });
  it('old v3 and v4 saves get empty expeditions, with no loss of existing progress', () => {
    for (const version of [3, 4]) {
      const raw = JSON.parse(serializeGame(warren())); delete raw.state.expeditions; raw.version = version;
      const loaded = deserializeGame(JSON.stringify(raw), START).state;
      expect(loaded.expeditions).toEqual({ active: null, completed: 0, artifacts: {} });
      expect(loaded.buildings).toEqual(warren().buildings);
    }
  });
  it('malformed reservations, timelines, multipliers and enum values cannot poison saves', () => {
    const state = startExpedition(warren(), basePlan);
    for (const patch of [{ reservation: -.1 }, { reservation: 1 }, { rewardMultiplier: 1e300 }, { startedAt: START + 1 }, { endsAt: START }, { reserved: -1 }, { crew: '__proto__' }, { destination: 'missing' }, { band: 'forever' }, { complication: 'yes' }]) {
      const raw = JSON.parse(serializeGame(state)); Object.assign(raw.state.expeditions.active, patch);
      const result = deserializeGame(JSON.stringify(raw), START).state;
      expect(result.expeditions.active).toBeNull();
      expect(getCps(result)).toBe(getBaseCps(result));
    }
  });
  it('a backwards clock neither produces nor spends expedition output', () => {
    const state = tickGame(startExpedition(warren(), basePlan), START + 10000);
    const next = tickGame(state, START);
    expect(next.goblins).toBe(state.goblins);
    expect(next.expeditions).toEqual(state.expeditions);
  });
});
