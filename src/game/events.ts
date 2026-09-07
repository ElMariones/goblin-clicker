import { getCps, getPermanentRank } from './math';
import { randomAt } from './rng';
import type { GameState, MooncapReward } from './types';

export const MOONCAP_MIN_DELAY_MS = 120_000;
export const MOONCAP_MAX_DELAY_MS = 300_000;
export const MOONCAP_DURATION_MS = 13_000;

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
      spawnedAt: null,
      expiresAt: null,
      nextSpawnAt: Math.floor(fromTime) + getMooncapDelayMs(advanced, roll),
    },
  };
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
  return {
    ...state,
    mooncap: {
      ...state.mooncap,
      active: true,
      spawnedAt,
      expiresAt: spawnedAt + MOONCAP_DURATION_MS,
    },
  };
}

export interface MooncapClickResult {
  state: GameState;
  reward: MooncapReward | null;
}

export function clickMooncap(state: GameState, now: number): MooncapClickResult {
  if (!state.mooncap.active || state.mooncap.expiresAt === null || now >= state.mooncap.expiresAt) {
    return { state: advanceMooncap(state, now), reward: null };
  }

  const [roll, advanced] = nextRandom(state);
  let next = advanced;
  let reward: MooncapReward;

  if (roll < 0.55) {
    const baseAmount = Math.max(13, Math.floor(state.goblins * 0.1), Math.floor(getCps(state, now) * 60));
    const amount = Math.floor(baseAmount * getMoonlitBloodFactor(state));
    reward = { type: 'goblins', amount, label: 'Mooncap Clutch' };
    next = {
      ...next,
      goblins: next.goblins + amount,
      runGoblins: next.runGoblins + amount,
      lifetimeGoblins: next.lifetimeGoblins + amount,
    };
  } else if (roll < 0.82) {
    const duration = Math.round(77_000 * getMoonlitBloodFactor(state));
    const buff = {
      id: 'moon_frenzy' as const,
      multiplier: 7,
      startedAt: now,
      expiresAt: now + duration,
      target: 'cps' as const,
    };
    reward = { type: 'buff', buff, label: 'Moon Frenzy' };
    next = { ...next, buffs: [...next.buffs.filter(({ id }) => id !== buff.id), buff] };
  } else {
    const duration = Math.round(13_000 * getMoonlitBloodFactor(state));
    const buff = {
      id: 'hatching_fever' as const,
      multiplier: 25,
      startedAt: now,
      expiresAt: now + duration,
      target: 'click' as const,
    };
    reward = { type: 'buff', buff, label: 'Hatching Fever' };
    next = { ...next, buffs: [...next.buffs.filter(({ id }) => id !== buff.id), buff] };
  }

  next = {
    ...next,
    statistics: {
      ...next.statistics,
      goldenEventsClicked: next.statistics.goldenEventsClicked + 1,
    },
  };

  return { state: scheduleNextMooncap(next, now), reward };
}
