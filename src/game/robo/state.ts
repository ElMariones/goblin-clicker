import { clampResource } from '../state';
import { KERNEL_PERKS, ROBO_CHARGE_CAP, ROBO_LINES, ROBO_STARTING_STOCK } from './content';
import type { KernelPerkId, RoboLineId, RoboLineState, RoboState } from './types';

export function createEmptyRoboLines(): Record<RoboLineId, RoboLineState> {
  return Object.fromEntries(ROBO_LINES.map(({ id }) => [id, {
    owned: 0,
    blueprintRank: 0,
    phaseSeconds: 0,
    pendingRG: 0,
  }])) as Record<RoboLineId, RoboLineState>;
}

export function createEmptyRoboLineProduction(): Record<RoboLineId, number> {
  return Object.fromEntries(ROBO_LINES.map(({ id }) => [id, 0])) as Record<RoboLineId, number>;
}

export function getRawKernelPerkRank(robo: RoboState, id: KernelPerkId): number {
  const definition = KERNEL_PERKS.find((perk) => perk.id === id);
  return Math.min(definition?.maxRank ?? 0, Math.max(0, Math.floor(robo.kernel.perks[id] ?? 0)));
}

export function createInitialRoboState(permanent?: Pick<RoboState, 'kernel' | 'statistics' | 'achievements' | 'appearance'>): RoboState {
  const kernel = permanent?.kernel ?? { cores: 0, totalCoresEarned: 0, recompiles: 0, perks: {} };
  const bootRank = Math.max(0, Math.floor(kernel.perks.boot_cache ?? 0));
  const warmRank = Math.max(0, Math.floor(kernel.perks.warm_start ?? 0));
  return {
    readyRG: clampResource(ROBO_STARTING_STOCK + 100 * bootRank),
    runProducedRG: 0,
    lifetimeProducedRG: 0,
    lines: createEmptyRoboLines(),
    globalBlueprintRank: 0,
    firmware: { control: null, cadence: null },
    capacitor: { charge: Math.min(ROBO_CHARGE_CAP, 30 * warmRank), overclockEndsAt: null },
    kernel: {
      cores: Math.max(0, Math.floor(kernel.cores)),
      totalCoresEarned: Math.max(0, Math.floor(kernel.totalCoresEarned)),
      recompiles: Math.max(0, Math.floor(kernel.recompiles)),
      perks: { ...kernel.perks },
    },
    statistics: permanent?.statistics
      ? {
        ...permanent.statistics,
        lifetimeProducedByLine: { ...permanent.statistics.lifetimeProducedByLine },
      }
      : {
        manualActions: 0,
        manuallyAssembledRG: 0,
        highestStableRps: 0,
        lifetimeProducedByLine: createEmptyRoboLineProduction(),
        overclocksActivated: 0,
      },
    achievements: { ...(permanent?.achievements ?? {}) },
    appearance: permanent?.appearance ?? 'goblin_cap',
  };
}

export function createRecompiledRoboState(robo: RoboState): RoboState {
  const next = createInitialRoboState({
    kernel: robo.kernel,
    statistics: robo.statistics,
    achievements: robo.achievements,
    appearance: robo.appearance,
  });
  next.lifetimeProducedRG = robo.lifetimeProducedRG;
  return next;
}

export function creditRoboProduction(robo: RoboState, amount: number, lineId?: RoboLineId): RoboState {
  if (!(amount > 0) || !Number.isFinite(amount)) return robo;
  const credited = Math.min(1e300, amount);
  const byLine = { ...robo.statistics.lifetimeProducedByLine };
  if (lineId) byLine[lineId] = clampResource(byLine[lineId] + credited);
  return {
    ...robo,
    readyRG: clampResource(robo.readyRG + credited),
    runProducedRG: clampResource(robo.runProducedRG + credited),
    lifetimeProducedRG: clampResource(robo.lifetimeProducedRG + credited),
    statistics: { ...robo.statistics, lifetimeProducedByLine: byLine },
  };
}

export function creditRoboGrant(robo: RoboState, amount: number): RoboState {
  if (!(amount > 0) || !Number.isFinite(amount)) return robo;
  return { ...robo, readyRG: clampResource(robo.readyRG + Math.min(1e300, amount)) };
}
