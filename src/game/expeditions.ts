import { getBaseCps, getBuildingBaseCps, getReachedExpansionMasteryLevels } from './math';
import { clampResource, creditGoblins } from './state';
import type { BuildingId, ExpeditionBand, ExpeditionCrew, ExpeditionDestination, ExpeditionMission, ExpeditionPlan, ExpeditionState, GameState } from './types';

export const EXPEDITION_DESTINATIONS: Record<ExpeditionDestination, { buildings: BuildingId[]; x: number; y: number }> = {
  mine: { buildings: ['scrap_incubator', 'deepforge_vat'], x: 24, y: 33 },
  ruins: { buildings: ['shaman_circle', 'moonspore_cavern'], x: 76, y: 28 },
  cellar: { buildings: ['brood_matron', 'mushroom_nursery', 'warren_den', 'bog_hatchery'], x: 77, y: 73 },
};
export const EXPEDITION_CREWS: Record<ExpeditionCrew, { time: number; reservation: number; reward: number }> = {
  scouts: { time: 0.65, reservation: 0.15, reward: 1.45 },
  haulers: { time: 1, reservation: 0.20, reward: 1.60 },
  keepers: { time: 1, reservation: 0.10, reward: 1.50 },
};
export const EXPEDITION_BANDS: Record<ExpeditionBand, number> = { short: 5 * 60_000, medium: 20 * 60_000, long: 60 * 60_000 };

export function isExpeditionUnlocked(state: GameState): boolean {
  return state.buildings.war_camp > 0 || state.buildings.goblin_gate > 0 || state.buildings.reality_burrow > 0;
}

export function isExpeditionPlan(value: unknown): value is ExpeditionPlan {
  if (!value || typeof value !== 'object') return false;
  const p = value as ExpeditionPlan;
  return Object.hasOwn(EXPEDITION_DESTINATIONS, p.destination) && Object.hasOwn(EXPEDITION_CREWS, p.crew)
    && Object.hasOwn(EXPEDITION_BANDS, p.band) && typeof p.complication === 'boolean';
}

/** Affinity is bounded and locked at departure; income remains live throughout the trip. */
export function getExpeditionQuote(state: GameState, plan: ExpeditionPlan) {
  const buildings = EXPEDITION_DESTINATIONS[plan.destination].buildings;
  const base = getBaseCps(state);
  const share = base > 0 ? buildings.reduce((sum, id) => sum + getBuildingBaseCps(state, id), 0) / base : 0;
  const counts = buildings.map(id => state.buildings[id]);
  const balance = Math.max(...counts) > 0 ? Math.min(...counts) / Math.max(...counts) : 0;
  const affinity = Math.min(1, plan.destination === 'cellar' ? share * 0.5 + balance * 0.5 : share);
  const veteranTiers = buildings.reduce((sum, id) => sum + Math.max(0, getReachedExpansionMasteryLevels(state, id).length - 2), 0);
  const masteryReduction = Math.min(0.25, veteranTiers * 0.05);
  const crew = EXPEDITION_CREWS[plan.crew];
  const durationMs = Math.round(EXPEDITION_BANDS[plan.band] * crew.time * (1 - masteryReduction) * (plan.complication ? 1.25 : 1));
  const reservation = crew.reservation + (plan.complication ? 0.03 : 0);
  const rewardMultiplier = crew.reward + affinity * 0.30 + (plan.complication ? 0.15 : 0);
  const estimatedReserved = base * reservation * durationMs / 1000;
  return { affinity, masteryReduction, durationMs, reservation, rewardMultiplier,
    estimatedReward: clampResource(estimatedReserved * rewardMultiplier),
    estimatedProfit: clampResource(estimatedReserved * (rewardMultiplier - 1)) };
}

/** Caller must settle elapsed production first (the public engine actions do this). */
export function launchExpedition(state: GameState, plan: ExpeditionPlan): GameState {
  if (!isExpeditionPlan(plan) || state.expeditions.active || !isExpeditionUnlocked(state) || !(getBaseCps(state) > 0)) return state;
  const quote = getExpeditionQuote(state, plan);
  const active: ExpeditionMission = { ...plan, startedAt: state.lastUpdateAt, endsAt: state.lastUpdateAt + quote.durationMs,
    reservation: quote.reservation, rewardMultiplier: quote.rewardMultiplier, reserved: 0 };
  return { ...state, expeditions: { ...state.expeditions, active } };
}

export function collectExpedition(state: GameState): { state: GameState; reward: number } {
  const mission = state.expeditions.active;
  if (!mission || state.lastUpdateAt < mission.endsAt) return { state, reward: 0 };
  const reward = clampResource(mission.reserved * mission.rewardMultiplier);
  const next = creditGoblins(state, reward);
  return { reward, state: { ...next, expeditions: {
    active: null, completed: Math.min(Number.MAX_SAFE_INTEGER, state.expeditions.completed + 1),
    artifacts: { ...state.expeditions.artifacts, ...(mission.reserved > 0 ? { [mission.destination]: true as const } : {}) },
  } } };
}

export function getClaimableExpeditionReward(state: GameState): number {
  const mission = state.expeditions.active;
  if (!mission || state.lastUpdateAt < mission.endsAt) return 0;
  return clampResource(mission.reserved * mission.rewardMultiplier);
}

/** Narrow trust boundary for v4 additive saves, including malformed imported mission data. */
export function sanitizeExpeditions(value: unknown, lastUpdateAt: number): ExpeditionState {
  const empty: ExpeditionState = { active: null, completed: 0, artifacts: {} };
  if (!value || typeof value !== 'object') return empty;
  const raw = value as Record<string, unknown>;
  if (typeof raw.completed === 'number' && Number.isFinite(raw.completed)) empty.completed = Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(raw.completed)));
  if (raw.artifacts && typeof raw.artifacts === 'object') {
    for (const id of Object.keys(EXPEDITION_DESTINATIONS) as ExpeditionDestination[]) {
      if ((raw.artifacts as Record<string, unknown>)[id] === true) empty.artifacts[id] = true;
    }
  }
  const m = raw.active;
  if (!isExpeditionPlan(m)) return empty;
  const mission = m as ExpeditionMission;
  if (![mission.startedAt, mission.endsAt, mission.reservation, mission.rewardMultiplier, mission.reserved].every(n => typeof n === 'number' && Number.isFinite(n))) return empty;
  const crew = EXPEDITION_CREWS[mission.crew];
  const maxDuration = EXPEDITION_BANDS[mission.band] * crew.time * (mission.complication ? 1.25 : 1);
  const duration = mission.endsAt - mission.startedAt;
  if (mission.startedAt < 0 || mission.startedAt > lastUpdateAt || duration < Math.round(maxDuration * 0.75) || duration > Math.round(maxDuration)
    || mission.reservation !== crew.reservation + (mission.complication ? 0.03 : 0)
    || mission.rewardMultiplier < crew.reward + (mission.complication ? 0.15 : 0)
    || mission.rewardMultiplier > crew.reward + 0.30 + (mission.complication ? 0.15 : 0) || mission.reserved < 0) return empty;
  empty.active = { destination: mission.destination, crew: mission.crew, band: mission.band, complication: mission.complication,
    startedAt: mission.startedAt, endsAt: mission.endsAt, reservation: mission.reservation,
    rewardMultiplier: mission.rewardMultiplier, reserved: clampResource(mission.reserved) };
  return empty;
}
