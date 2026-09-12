import {
  ACHIEVEMENTS,
  BUILDING_BY_ID,
  BUILDINGS,
  EXPANSION_MASTERY_LEVELS,
  PERMANENT_UPGRADE_BY_ID,
  UPGRADES,
  UPGRADE_BY_ID,
  type AchievementId,
  type UpgradeId,
} from './content';
import type {
  AchievementCondition,
  BuildingId,
  GameState,
  PermanentUpgradeId,
  UnlockRequirement,
  UpgradeDefinition,
  UpgradeExclusiveGroup,
  UpgradeEffect,
} from './types';
import { getWarrenProjectMultiplier } from './projects';
import { getFamilyAdapterFactor } from './robo/math';
import { getRawKernelPerkRank } from './robo/state';

const EPSILON = 1e-9;
const MAX_MASTERY_VETERANCY_BONUS_PER_LEVEL = 0.18;

export function getPermanentRank(state: GameState, id: PermanentUpgradeId): number {
  return Math.max(0, Math.floor(state.prestige.permanentUpgrades[id] ?? 0));
}

export function getReachedExpansionMasteryLevels(state: GameState, buildingId: BuildingId) {
  const owned = Math.max(0, Math.floor(state.buildings[buildingId]));
  return EXPANSION_MASTERY_LEVELS.filter((level) => owned >= level.threshold);
}

export function getExpansionMasteryLevel(state: GameState, buildingId: BuildingId) {
  const reached = getReachedExpansionMasteryLevels(state, buildingId);
  return reached.length > 0 ? reached[reached.length - 1] : null;
}

export function getNextExpansionMasteryLevel(state: GameState, buildingId: BuildingId) {
  const owned = Math.max(0, Math.floor(state.buildings[buildingId]));
  return EXPANSION_MASTERY_LEVELS.find((level) => owned < level.threshold) ?? null;
}

export function getNextExpansionMilestoneQuantity(state: GameState, buildingId: BuildingId): number {
  const next = getNextExpansionMasteryLevel(state, buildingId);
  return next ? next.threshold - state.buildings[buildingId] : 0;
}

/** Product of every local mastery multiplier earned by the expansion. */
export function getExpansionMasteryProductionMultiplier(state: GameState, buildingId: BuildingId): number {
  const reached = getReachedExpansionMasteryLevels(state, buildingId);
  let multiplier = reached.reduce((current, level) => current * level.productionMultiplier, 1);

  // Older expansion types need a little more help staying relevant because base
  // CPS rises by orders of magnitude across the shop. Each reached mastery tier
  // therefore adds a small veterancy factor that is strongest for Brood Matrons
  // and tapers linearly to zero for the newest Reality Burrows. This keeps the
  // 50/100 ownership breakpoints meaningful without inflating late buildings by
  // the same amount and leaving production shares unchanged.
  const buildingIndex = BUILDINGS.findIndex((building) => building.id === buildingId);
  const oldestWeight = buildingIndex < 0 || BUILDINGS.length <= 1
    ? 0
    : (BUILDINGS.length - 1 - buildingIndex) / (BUILDINGS.length - 1);
  multiplier *= (1 + oldestWeight * MAX_MASTERY_VETERANCY_BONUS_PER_LEVEL) ** reached.length;

  for (const effect of getPurchasedEffects(state)) {
    if (effect.type === 'masteryLevelMultiplier' && effect.buildingId === buildingId) {
      multiplier *= effect.multiplier ** reached.length;
    }
  }
  return multiplier;
}

/**
 * Additive global CPS contribution from all currently maintained expansion
 * mastery levels. Founders' Legacy strengthens the contribution without
 * changing the visible mastery thresholds or local production multipliers.
 */
export function getExpansionMasteryNetworkBonus(state: GameState): number {
  let baseBonus = 0;
  for (const building of BUILDINGS) {
    for (const level of getReachedExpansionMasteryLevels(state, building.id)) {
      baseBonus += level.networkCpsBonus;
    }
  }
  const legacyFactor = 1 + getPermanentRank(state, 'founders_legacy') * 0.2;
  let bonus = baseBonus * legacyFactor;
  for (const effect of getPurchasedEffects(state)) {
    if (effect.type === 'masteryNetworkMultiplier') bonus *= effect.multiplier;
  }
  return bonus;
}

export function getExpansionMasteryNetworkMultiplier(state: GameState): number {
  return 1 + getExpansionMasteryNetworkBonus(state);
}

export function getAncestralMomentumMultiplier(state: GameState): number {
  const rank = getPermanentRank(state, 'ancestral_momentum');
  const countedMigrations = Math.min(25, Math.max(0, Math.floor(state.prestige.resets)));
  return 1 + countedMigrations * rank * 0.01;
}

export function getFamilyAdapterOrganicMultiplier(state: GameState): number {
  if (!state.unlocks.robogoblins || !state.robo) return 1;
  return getFamilyAdapterFactor(
    state.robo.kernel.totalCoresEarned,
    getRawKernelPerkRank(state.robo, 'family_adapter'),
  );
}

export function getBuildingCostMultiplier(state: GameState, buildingId?: BuildingId): number {
  const rank = getPermanentRank(state, 'scavenger_memory');
  let multiplier = Math.max(0.5, 1 - rank * 0.01);
  for (const effect of getPurchasedEffects(state)) {
    if (effect.type === 'globalBuildingCostMultiplier') multiplier *= effect.multiplier;
    if (buildingId && effect.type === 'buildingCostMultiplier' && effect.buildingId === buildingId) multiplier *= effect.multiplier;
  }
  return multiplier;
}

export function getBuildingUnitCost(state: GameState, buildingId: BuildingId, ownedOffset = 0): number {
  const definition = BUILDING_BY_ID[buildingId];
  const owned = Math.max(0, Math.floor(state.buildings[buildingId] + ownedOffset));
  const raw = definition.baseCost * definition.costGrowth ** owned * getBuildingCostMultiplier(state, buildingId);
  return Number.isFinite(raw) ? Math.max(1, Math.ceil(raw - EPSILON)) : Number.POSITIVE_INFINITY;
}

export function getBuildingBulkCost(state: GameState, buildingId: BuildingId, count = 1): number {
  const quantity = Math.max(0, Math.floor(count));
  if (quantity === 0) return 0;
  const definition = BUILDING_BY_ID[buildingId];
  const owned = Math.max(0, Math.floor(state.buildings[buildingId]));
  const first = definition.baseCost * definition.costGrowth ** owned * getBuildingCostMultiplier(state, buildingId);
  const growth: number = definition.costGrowth;
  const raw = growth === 1
    ? first * quantity
    : first * ((growth ** quantity - 1) / (growth - 1));
  return Number.isFinite(raw) ? Math.max(1, Math.ceil(raw - EPSILON)) : Number.POSITIVE_INFINITY;
}

export function getBuildingSellRefund(state: GameState, buildingId: BuildingId, count = 1, refundRate = 0.25): number {
  const quantity = Math.min(Math.max(0, Math.floor(count)), state.buildings[buildingId]);
  if (quantity === 0) return 0;
  const definition = BUILDING_BY_ID[buildingId];
  const firstOwnedIndex = state.buildings[buildingId] - quantity;
  const first = definition.baseCost * definition.costGrowth ** firstOwnedIndex * getBuildingCostMultiplier(state, buildingId);
  const rawPaidEquivalent = first * ((definition.costGrowth ** quantity - 1) / (definition.costGrowth - 1));
  const refund = rawPaidEquivalent * Math.min(1, Math.max(0, refundRate));
  return Number.isFinite(refund) ? Math.max(0, Math.floor(refund + EPSILON)) : Number.MAX_VALUE;
}

export function getMaxAffordableBuildingCount(state: GameState, buildingId: BuildingId, budget = state.goblins): number {
  if (!(budget > 0) || !Number.isFinite(budget)) {
    return budget === Number.POSITIVE_INFINITY ? 1_000_000 : 0;
  }
  const definition = BUILDING_BY_ID[buildingId];
  const owned = Math.max(0, Math.floor(state.buildings[buildingId]));
  const first = definition.baseCost * definition.costGrowth ** owned * getBuildingCostMultiplier(state, buildingId);
  if (budget + EPSILON < first) return 0;

  const growth: number = definition.costGrowth;
  const estimate = growth === 1
    ? Math.floor(budget / first)
    : Math.floor(Math.log1p((budget * (growth - 1)) / first) / Math.log(growth));
  let count = Math.max(0, Math.min(1_000_000, estimate));
  while (count < 1_000_000 && getBuildingBulkCost(state, buildingId, count + 1) <= budget + EPSILON) count += 1;
  while (count > 0 && getBuildingBulkCost(state, buildingId, count) > budget + EPSILON) count -= 1;
  return count;
}

function getPurchasedEffects(state: GameState): UpgradeEffect[] {
  const effects: UpgradeEffect[] = [];
  for (const definition of UPGRADES) {
    if (state.purchasedUpgrades[definition.id]) effects.push(...definition.effects);
  }
  return effects;
}

export function getPurchasedUpgradeInExclusiveGroup(state: GameState, group: UpgradeExclusiveGroup): UpgradeId | null {
  for (const definition of UPGRADES as readonly UpgradeDefinition[]) {
    if (definition.exclusiveGroup === group && state.purchasedUpgrades[definition.id]) return definition.id as UpgradeId;
  }
  return null;
}

export function getUpgradeChoiceBlocker(state: GameState, upgradeId: UpgradeId): UpgradeId | null {
  const definition = UPGRADE_BY_ID[upgradeId];
  if (!definition.exclusiveGroup) return null;
  const chosen = getPurchasedUpgradeInExclusiveGroup(state, definition.exclusiveGroup);
  return chosen && chosen !== upgradeId ? chosen : null;
}

export function isUpgradeBlockedByChoice(state: GameState, upgradeId: UpgradeId): boolean {
  return getUpgradeChoiceBlocker(state, upgradeId) !== null;
}

export function getOfflineEfficiencyResearchBonus(state: GameState): number {
  return getPurchasedEffects(state).reduce((bonus, effect) => effect.type === 'offlineEfficiencyBonus' ? bonus + effect.bonus : bonus, 0);
}

export function getMooncapRewardMultiplier(state: GameState): number {
  return getPurchasedEffects(state).reduce((multiplier, effect) => effect.type === 'mooncapRewardMultiplier' ? multiplier * effect.multiplier : multiplier, 1);
}

export function getMooncapDurationMultiplier(state: GameState): number {
  return getPurchasedEffects(state).reduce((multiplier, effect) => effect.type === 'mooncapDurationMultiplier' ? multiplier * effect.multiplier : multiplier, 1);
}

export function getBuildingProductionMultiplier(state: GameState, buildingId: BuildingId): number {
  let multiplier = getExpansionMasteryProductionMultiplier(state, buildingId) * getWarrenProjectMultiplier(state, buildingId);
  for (const effect of getPurchasedEffects(state)) {
    if (effect.type === 'buildingMultiplier' && effect.buildingId === buildingId) multiplier *= effect.multiplier;
  }
  return multiplier;
}

export function getGlobalCpsMultiplier(state: GameState): number {
  let multiplier = (1 + getPermanentRank(state, 'ancestral_fertility') * 0.05)
    * getExpansionMasteryNetworkMultiplier(state)
    * getAncestralMomentumMultiplier(state)
    * getFamilyAdapterOrganicMultiplier(state);
  for (const effect of getPurchasedEffects(state)) {
    if (effect.type === 'globalCpsMultiplier') multiplier *= effect.multiplier;
  }
  return multiplier;
}

export function getActiveCpsMultiplier(state: GameState, now = state.lastUpdateAt): number {
  let multiplier = 1;
  for (const buff of state.buffs) {
    if (buff.target === 'cps' && buff.startedAt <= now && buff.expiresAt > now) multiplier *= buff.multiplier;
  }
  return multiplier;
}

/** Current per-unit output before temporary CPS buffs. */
export function getBuildingUnitBaseCps(state: GameState, buildingId: BuildingId): number {
  const definition = BUILDING_BY_ID[buildingId];
  return definition.baseCps * getBuildingProductionMultiplier(state, buildingId) * getGlobalCpsMultiplier(state);
}

/** Current total output of all owned units of one building before temporary CPS buffs. */
export function getBuildingBaseCps(state: GameState, buildingId: BuildingId): number {
  return Math.max(0, state.buildings[buildingId]) * getBuildingUnitBaseCps(state, buildingId);
}

/** Current per-unit output including active temporary CPS buffs. */
export function getBuildingUnitCps(state: GameState, buildingId: BuildingId, now = state.lastUpdateAt): number {
  return getBuildingUnitBaseCps(state, buildingId) * getActiveCpsMultiplier(state, now) * (1 - getExpeditionReservation(state, now));
}

/** Current total output of all owned units of one building, including active temporary CPS buffs. */
export function getBuildingCps(state: GameState, buildingId: BuildingId, now = state.lastUpdateAt): number {
  return Math.max(0, state.buildings[buildingId]) * getBuildingUnitCps(state, buildingId, now);
}

export function getBaseCps(state: GameState): number {
  // The global multiplier is identical for every expansion, so it is resolved
  // once and applied to the sum. Resolving it per building made this function —
  // which runs several times per simulation tick and per render — an order of
  // magnitude more expensive for the same result.
  let total = 0;
  for (const definition of BUILDINGS) {
    total += Math.max(0, state.buildings[definition.id])
      * definition.baseCps
      * getBuildingProductionMultiplier(state, definition.id);
  }
  return total * getGlobalCpsMultiplier(state);
}

export function getCps(state: GameState, now = state.lastUpdateAt): number {
  return getBaseCps(state) * getActiveCpsMultiplier(state, now) * (1 - getExpeditionReservation(state, now));
}

export function getClickPower(state: GameState, now = state.lastUpdateAt): number {
  let clickMultiplier = 1 + getPermanentRank(state, 'stronger_spawn') * 0.1;
  let cpsFraction = 0;
  for (const effect of getPurchasedEffects(state)) {
    if (effect.type === 'clickMultiplier') clickMultiplier *= effect.multiplier;
    if (effect.type === 'clickCpsFraction') cpsFraction += effect.fraction;
  }
  for (const buff of state.buffs) {
    if (buff.target === 'click' && buff.startedAt <= now && buff.expiresAt > now) clickMultiplier *= buff.multiplier;
  }
  return (1 + getBaseCps(state) * cpsFraction) * clickMultiplier;
}

export function meetsRequirement(state: GameState, requirement: UnlockRequirement): boolean {
  switch (requirement.type) {
    case 'buildingOwned': return state.buildings[requirement.buildingId] >= requirement.amount;
    case 'lifetimeGoblins': return state.lifetimeGoblins >= requirement.amount;
    case 'totalClicks': return state.statistics.totalClicks >= requirement.amount;
    case 'prestigeResets': return state.prestige.resets >= requirement.amount;
    case 'prestigeShardsEarned': return state.prestige.totalShardsEarned >= requirement.amount;
  }
}

export function isUpgradeUnlocked(state: GameState, upgradeId: UpgradeId): boolean {
  const definition = UPGRADE_BY_ID[upgradeId];
  return definition.requirements.every((requirement) => meetsRequirement(state, requirement));
}

export function canPurchaseUpgrade(state: GameState, upgradeId: UpgradeId): boolean {
  const definition = UPGRADE_BY_ID[upgradeId];
  return !state.purchasedUpgrades[upgradeId]
    && !isUpgradeBlockedByChoice(state, upgradeId)
    && isUpgradeUnlocked(state, upgradeId)
    && state.goblins + EPSILON >= definition.cost;
}

export function getPrestigePotential(state: GameState): number {
  if (state.lifetimeGoblins < 5_000_000) return 0;
  return Math.floor(Math.sqrt(state.lifetimeGoblins / 5_000_000));
}

export function getPrestigeShardGain(state: GameState): number {
  return Math.max(0, getPrestigePotential(state) - state.prestige.totalShardsEarned);
}

export function getPermanentUpgradeCost(state: GameState, id: PermanentUpgradeId): number {
  const definition = PERMANENT_UPGRADE_BY_ID[id];
  const rank = getPermanentRank(state, id);
  if (rank >= definition.maxRank) return Number.POSITIVE_INFINITY;
  return Math.max(1, Math.ceil(definition.baseCost * definition.costGrowth ** rank - EPSILON));
}

export function canPurchasePermanentUpgrade(state: GameState, id: PermanentUpgradeId): boolean {
  const cost = getPermanentUpgradeCost(state, id);
  return Number.isFinite(cost) && state.prestige.shards >= cost;
}

export function meetsAchievementCondition(state: GameState, condition: AchievementCondition, now = state.lastUpdateAt): boolean {
  switch (condition.type) {
    case 'buildingOwned': return state.buildings[condition.buildingId] >= condition.amount;
    case 'lifetimeGoblins': return state.lifetimeGoblins >= condition.amount;
    case 'totalClicks': return state.statistics.totalClicks >= condition.amount;
    case 'cps': return getCps(state, now) >= condition.amount;
    case 'goldenEventsClicked': return state.statistics.goldenEventsClicked >= condition.amount;
    case 'prestigeResets': return state.prestige.resets >= condition.amount;
    case 'allBuildingsOwned': return BUILDINGS.every(({ id }) => state.buildings[id] >= condition.amount);
  }
}

export function getNewlyUnlockedAchievements(state: GameState, now = state.lastUpdateAt): AchievementId[] {
  return ACHIEVEMENTS
    .filter((achievement) => !state.unlockedAchievements[achievement.id] && meetsAchievementCondition(state, achievement.condition, now))
    .map((achievement) => achievement.id);
}

/** Reservations end automatically at arrival, even before the haul is claimed. */
export function getExpeditionReservation(state: GameState, now = state.lastUpdateAt): number {
  const mission = state.expeditions.active;
  return mission && now >= mission.startedAt && now < mission.endsAt ? mission.reservation : 0;
}
