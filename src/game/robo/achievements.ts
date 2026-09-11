import { KERNEL_PERKS, ROBO_ACHIEVEMENTS, ROBO_LINES, ROBO_PROJECTS } from './content';
import { getRoboCircuitTierCount } from './math';
import { getRawKernelPerkRank } from './state';
import type { RoboAchievementId, RoboAppearanceId, RoboState } from './types';

function achievementMet(robo: RoboState, id: RoboAchievementId): boolean {
  switch (id) {
    case 'rg_first_spark': return robo.statistics.manualActions >= 1;
    case 'rg_unattended': return robo.lines.tin_cradle.owned >= 1;
    case 'rg_bolted': return ROBO_LINES.some((line) => robo.lines[line.id].owned >= 10);
    case 'rg_scrap_circuit': return getRoboCircuitTierCount(robo, 'scrap') >= 1;
    case 'rg_first_million': return robo.lifetimeProducedRG >= 1_000_000;
    case 'rg_overclock': return robo.statistics.overclocksActivated >= 1;
    case 'rg_firmware': return robo.firmware.control !== null;
    case 'rg_recompile': return robo.kernel.recompiles >= 1;
    case 'rg_steam_circuit': return getRoboCircuitTierCount(robo, 'steam') >= 1;
    case 'rg_three_circuits': return getRoboCircuitTierCount(robo, 'scrap') >= 1
      && getRoboCircuitTierCount(robo, 'steam') >= 1
      && getRoboCircuitTierCount(robo, 'impossible') >= 1;
    case 'rg_paradox': return robo.lines.paradox_nest.owned >= 1;
    case 'rg_megaproject': return ROBO_PROJECTS.some((project) => (robo.kernel.projects[project.id] ?? 0) >= 1);
    case 'rg_four_wonders': return ROBO_PROJECTS.every((project) => (robo.kernel.projects[project.id] ?? 0) >= 1);
    case 'rg_deep_mastery': return ROBO_LINES.every((line) => robo.lines[line.id].owned >= 500);
    case 'rg_eternal_foundry': return ROBO_PROJECTS.every((project) => (robo.kernel.projects[project.id] ?? 0) >= project.maxRank);
    case 'rg_kernel_complete': return KERNEL_PERKS.every((perk) => getRawKernelPerkRank(robo, perk.id) >= perk.maxRank);
  }
}

export function awardRoboAchievements(robo: RoboState, now: number): RoboState {
  const additions: Partial<Record<RoboAchievementId, number>> = {};
  for (const achievement of ROBO_ACHIEVEMENTS) {
    if (robo.achievements[achievement.id] === undefined && achievementMet(robo, achievement.id)) additions[achievement.id] = now;
  }
  return Object.keys(additions).length > 0
    ? { ...robo, achievements: { ...robo.achievements, ...additions } }
    : robo;
}

export function isRoboAppearanceUnlocked(robo: RoboState, appearance: RoboAppearanceId): boolean {
  return appearance === 'goblin' || robo.kernel.ownedAppearances[appearance] === true;
}
