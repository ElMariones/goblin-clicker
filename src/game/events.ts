import { getCps, getPermanentRank } from './math';
import { randomAt } from './rng';
import type { BuffInstance, GameState, MooncapFamily, MooncapReward } from './types';

export const MOONCAP_MIN_DELAY_MS = 120_000;
export const MOONCAP_MAX_DELAY_MS = 300_000;
export const MOONCAP_DURATION_MS = 13_000;
export const MAX_LUNAR_CHARGE = 6;

export type MoonDialAction =
  | { type: 'hasten' }
  | { type: 'bias'; family: MooncapFamily }
  | { type: 'extend' };

export interface MoonDialResult {
  state: GameState;
  success: boolean;
  cost: number;
}

export function getMoonlitBloodFactor(state: GameState): number {
  return 1 + getPermanentRank(state, 'moonlit_blood') * 0.1;
}

function nextRandom(state: GameState): [number, GameState] {
  const value = randomAt(state.mooncap.rngSeed, state.mooncap.rngCounter);
  return [
    value,
    {
      ...state,
      mooncap: { ...state.mooncap, rngCounter: state.mooncap.rngCounter + 1 },
    },
  ];
}

export function getMooncapDelayMs(state: GameState, roll: number): number {
  const luckyRank = getPermanentRank(state, 'lucky_totem');
  const luckFactor = 1 / (1 + luckyRank * 0.1);
  const normalizedRoll = Math.min(0.999999999, Math.max(0, roll));
  const baseDelay = MOONCAP_MIN_DELAY_MS + normalizedRoll * (MOONCAP_MAX_DELAY_MS - MOONCAP_MIN_DELAY_MS);
  return Math.max(30_000, Math.round(baseDelay * luckFactor));
}

export function scheduleNextMooncap(state: GameState, fromTime: number): GameState {
  const [roll, advanced] = nextRandom(state);
  return {
    ...advanced,
    mooncap: {
      ...advanced.mooncap,
      active: false,
      family: null,
      spawnedAt: null,
      expiresAt: null,
      nextSpawnAt: Math.floor(fromTime) + getMooncapDelayMs(advanced, roll),
    },
  };
}

function familyFromRoll(roll: number): MooncapFamily {
  if (roll < 0.4) return 'clutch';
  if (roll < 0.67) return 'frenzy';
  if (roll < 0.89) return 'blood';
  return 'oracle';
}

export function advanceMooncap(state: GameState, now: number): GameState {
  const timestamp = Math.max(state.lastUpdateAt, Math.floor(now));

  if (state.mooncap.active) {
    const expiresAt = state.mooncap.expiresAt ?? timestamp;
    if (timestamp < expiresAt) return state;
    return scheduleNextMooncap(
      {
        ...state,
        mooncap: { ...state.mooncap, active: false, spawnedAt: null, expiresAt: null },
      },
      timestamp,
    );
  }

  if (timestamp < state.mooncap.nextSpawnAt) return state;

  // A long foreground stall should not resurrect an event that expired while no
  // frames were being simulated. It simply starts a fresh countdown.
  if (timestamp >= state.mooncap.nextSpawnAt + MOONCAP_DURATION_MS) {
    return scheduleNextMooncap(state, timestamp);
  }

  const spawnedAt = state.mooncap.nextSpawnAt;
  const [familyRoll, advanced] = nextRandom(state);
  const family = state.mooncap.nextFamilyBias ?? familyFromRoll(familyRoll);
  return {
    ...advanced,
    mooncap: {
      ...advanced.mooncap,
      active: true,
      family,
      spawnedAt,
      expiresAt: spawnedAt + MOONCAP_DURATION_MS,
      nextFamilyBias: null,
    },
  };
}

export interface MooncapClickResult {
  state: GameState;
  reward: MooncapReward | null;
  eclipseTriggered: boolean;
}

function triggerEclipseIfReady(state: GameState, now: number): { state: GameState; triggered: boolean } {
  const active = (id: BuffInstance['id']) => state.buffs.some((buff) => buff.id === id && buff.expiresAt > now);
  if (!active('moon_frenzy') || !active('hatching_fever') || active('eclipse')) return { state, triggered: false };
  const duration = Math.round(20_000 * getMoonlitBloodFactor(state));
  const eclipse: BuffInstance = {
    id: 'eclipse',
    multiplier: 2,
    startedAt: now,
    expiresAt: now + duration,
    target: 'cps',
  };
  return { state: { ...state, buffs: [...state.buffs, eclipse] }, triggered: true };
}

export function clickMooncap(state: GameState, now: number): MooncapClickResult {
  if (!state.mooncap.active || state.mooncap.expiresAt === null || now >= state.mooncap.expiresAt) {
    return { state: advanceMooncap(state, now), reward: null, eclipseTriggered: false };
  }

  let next = state;
  let reward: MooncapReward;
  const family = state.mooncap.family ?? 'clutch';

  if (family === 'clutch') {
    const baseAmount = Math.max(13, Math.floor(state.goblins * 0.1), Math.floor(getCps(state, now) * 60));
    const amount = Math.floor(baseAmount * getMoonlitBloodFactor(state));
    reward = { type: 'goblins', family, amount, label: 'Clutchcap' };
    next = {
      ...next,
      goblins: next.goblins + amount,
      runGoblins: next.runGoblins + amount,
      lifetimeGoblins: next.lifetimeGoblins + amount,
    };
  } else if (family === 'frenzy') {
    const duration = Math.round(77_000 * getMoonlitBloodFactor(state));
    const buff = {
      id: 'moon_frenzy' as const,
      multiplier: 7,
      startedAt: now,
      expiresAt: now + duration,
      target: 'cps' as const,
    };
    reward = { type: 'buff', family, buff, label: 'Frenzycap' };
    next = { ...next, buffs: [...next.buffs.filter(({ id }) => id !== buff.id), buff] };
  } else if (family === 'blood') {
    const duration = Math.round(13_000 * getMoonlitBloodFactor(state));
    const buff = {
      id: 'hatching_fever' as const,
      multiplier: 25,
      startedAt: now,
      expiresAt: now + duration,
      target: 'click' as const,
    };
    reward = { type: 'buff', family, buff, label: 'Bloodcap' };
    next = { ...next, buffs: [...next.buffs.filter(({ id }) => id !== buff.id), buff] };
  } else {
    const oracleBoost = Math.min(2, next.contracts.oracleBoost + 1);
    reward = { type: 'oracle', family, contractMultiplier: 1 + oracleBoost * 0.5, label: 'Oraclecap' };
    next = { ...next, contracts: { ...next.contracts, oracleBoost } };
  }

  next = { ...next, mooncap: { ...next.mooncap, lunarCharge: Math.min(MAX_LUNAR_CHARGE, next.mooncap.lunarCharge + 1) } };
  next = {
    ...next,
    statistics: {
      ...next.statistics,
      goldenEventsClicked: next.statistics.goldenEventsClicked + 1,
    },
  };

  const eclipse = triggerEclipseIfReady(next, now);
  return { state: scheduleNextMooncap(eclipse.state, now), reward, eclipseTriggered: eclipse.triggered };
}

export function applyMoonDialAction(state: GameState, action: MoonDialAction, now: number): MoonDialResult {
  const timestamp = Math.max(state.lastUpdateAt, Math.floor(now));
  if (action.type === 'hasten') {
    const cost = 3;
    if (state.mooncap.active || state.mooncap.lunarCharge < cost || state.mooncap.nextSpawnAt <= timestamp + 8_000) return { state, success: false, cost };
    return {
      state: {
        ...state,
        mooncap: {
          ...state.mooncap,
          lunarCharge: state.mooncap.lunarCharge - cost,
          nextSpawnAt: Math.min(state.mooncap.nextSpawnAt, timestamp + 8_000),
        },
      },
      success: true,
      cost,
    };
  }

  if (action.type === 'bias') {
    const cost = 2;
    if (state.mooncap.active || state.mooncap.lunarCharge < cost || state.mooncap.nextFamilyBias === action.family) return { state, success: false, cost };
    return {
      state: {
        ...state,
        mooncap: {
          ...state.mooncap,
          lunarCharge: state.mooncap.lunarCharge - cost,
          nextFamilyBias: action.family,
        },
      },
      success: true,
      cost,
    };
  }

  const cost = 2;
  const lunarIds: BuffInstance['id'][] = ['moon_frenzy', 'hatching_fever', 'eclipse'];
  const extendable = state.buffs.some((buff) => lunarIds.includes(buff.id) && buff.expiresAt > timestamp);
  if (state.mooncap.lunarCharge < cost || !extendable) return { state, success: false, cost };
  return {
    state: {
      ...state,
      buffs: state.buffs.map((buff) => lunarIds.includes(buff.id) && buff.expiresAt > timestamp
        ? { ...buff, expiresAt: buff.expiresAt + 15_000 }
        : buff),
      mooncap: { ...state.mooncap, lunarCharge: state.mooncap.lunarCharge - cost },
    },
    success: true,
    cost,
  };
}
