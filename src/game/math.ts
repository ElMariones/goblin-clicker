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
  UpgradeEffect,
} from './types';

const EPSILON = 1e-9;

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

/** Product of every local mastery multiplier earned by the expansion. */
export function getExpansionMasteryProductionMultiplier(state: GameState, buildingId: BuildingId): number {
  return getReachedExpansionMasteryLevels(state, buildingId)
    .reduce((multiplier, level) => multiplier * level.productionMultiplier, 1);
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
  return baseBonus * legacyFactor;
}

export function getExpansionMasteryNetworkMultiplier(state: GameState): number {
  return 1 + getExpansionMasteryNetworkBonus(state);
}

export function getAncestralMomentumMultiplier(state: GameState): number {
  const rank = getPermanentRank(state, 'ancestral_momentum');
  const countedMigrations = Math.min(25, Math.max(0, Math.floor(state.prestige.resets)));
  return 1 + countedMigrations * rank * 0.01;
}

export function getBuildingCostMultiplier(state: GameState): number {
  const rank = getPermanentRank(state, 'scavenger_memory');
  return Math.max(0.5, 1 - rank * 0.01);
}

export function getBuildingUnitCost(state: GameState, buildingId: BuildingId, ownedOffset = 0): number {
  const definition = BUILDING_BY_ID[buildingId];
  const owned = Math.max(0, Math.floor(state.buildings[buildingId] + ownedOffset));
  const raw = definition.baseCost * definition.costGrowth ** owned * getBuildingCostMultiplier(state);
  return Number.isFinite(raw) ? Math.max(1, Math.ceil(raw - EPSILON)) : Number.POSITIVE_INFINITY;
}

export function getBuildingBulkCost(state: GameState, buildingId: BuildingId, count = 1): number {
  const quantity = Math.max(0, Math.floor(count));
  if (quantity === 0) return 0;
  const definition = BUILDING_BY_ID[buildingId];
  const owned = Math.max(0, Math.floor(state.buildings[buildingId]));
  const first = definition.baseCost * definition.costGrowth ** owned * getBuildingCostMultiplier(state);
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
  const first = definition.baseCost * definition.costGrowth ** firstOwnedIndex * getBuildingCostMultiplier(state);
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
  const first = definition.baseCost * definition.costGrowth ** owned * getBuildingCostMultiplier(state);
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

export function getBuildingProductionMultiplier(state: GameState, buildingId: BuildingId): number {
  let multiplier = getExpansionMasteryProductionMultiplier(state, buildingId);
  for (const effect of getPurchasedEffects(state)) {
    if (effect.type === 'buildingMultiplier' && effect.buildingId === buildingId) multiplier *= effect.multiplier;
  }
  return multiplier;
}

export function getGlobalCpsMultiplier(state: GameState): number {
  let multiplier = (1 + getPermanentRank(state, 'ancestral_fertility') * 0.05)
    * getExpansionMasteryNetworkMultiplier(state)
    * getAncestralMomentumMultiplier(state);
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
  return getBuildingUnitBaseCps(state, buildingId) * getActiveCpsMultiplier(state, now);
}

/** Current total output of all owned units of one building, including active temporary CPS buffs. */
export function getBuildingCps(state: GameState, buildingId: BuildingId, now = state.lastUpdateAt): number {
  return Math.max(0, state.buildings[buildingId]) * getBuildingUnitCps(state, buildingId, now);
}

export function getBaseCps(state: GameState): number {
  let total = 0;
  for (const definition of BUILDINGS) {
    total += getBuildingBaseCps(state, definition.id);
  }
  return total;
}

export function getCps(state: GameState, now = state.lastUpdateAt): number {
  return getBaseCps(state) * getActiveCpsMultiplier(state, now);
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
  return !state.purchasedUpgrades[upgradeId] && isUpgradeUnlocked(state, upgradeId) && state.goblins + EPSILON >= definition.cost;
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
