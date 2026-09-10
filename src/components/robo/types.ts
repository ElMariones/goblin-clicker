import type { ReactNode } from 'react';

export type RoboCircuitId = 'scrap' | 'steam' | 'impossible';
export type RoboBuyAmount = 1 | 10 | 100 | 'max';

export interface RoboWorldSwitchView {
  label: string;
  detail?: string;
  locked?: boolean;
  badge?: string;
  onActivate: () => void;
}

export interface RoboAssemblyLineView {
  id: string;
  name: string;
  description: string;
  circuit: RoboCircuitId;
  artSrc?: string;
  ownedLabel: string;
  averageRateLabel: string;
  perRobotLabel?: string;
  shareLabel?: string;
  cycleLabel?: string;
  lifetimeLabel?: string;
  batchProgress: number;
  nextBatchLabel: string;
  pendingLabel: string;
  priceLabel: string;
  buyQuantityLabel: string;
  canAfford: boolean;
  locked?: boolean;
  lockLabel?: string;
  masteryLabel?: string;
  masteryFactorLabel?: string;
  nextMilestoneLabel?: string;
  nextMilestoneCostLabel?: string;
  canBuyNextMilestone?: boolean;
}

export interface RoboCircuitMemberView {
  id: string;
  name: string;
  ownedLabel: string;
  ready: boolean;
}

export interface RoboCircuitView {
  id: RoboCircuitId;
  name: string;
  tierLabel: string;
  tierProgressLabel: string;
  bonusLabel: string;
  members: readonly RoboCircuitMemberView[];
  bottleneckLabel?: string;
  bottleneckCostLabel?: string;
  canBuyBottleneck?: boolean;
}

export type RoboCatalogKind = 'local' | 'global';

export interface RoboBlueprintView {
  id: string;
  name: string;
  description: string;
  kind: RoboCatalogKind;
  circuit?: RoboCircuitId;
  lineName?: string;
  effectLabel: string;
  priceLabel: string;
  purchased: boolean;
  unlocked: boolean;
  canAfford: boolean;
  requirementLabel?: string;
}

export interface RoboFirmwareOptionView {
  id: string;
  name: string;
  description: string;
  effectLabel: string;
  priceLabel: string;
  selected: boolean;
  locked: boolean;
  canAfford: boolean;
}

export interface RoboFirmwareGroupView {
  id: string;
  name: string;
  unlockLabel: string;
  unlocked: boolean;
  lockedChoiceLabel?: string;
  options: readonly RoboFirmwareOptionView[];
}

export interface RoboKernelPerkView {
  id: string;
  name: string;
  description: string;
  effectLabel: string;
  nextEffectLabel?: string;
  rank: number;
  maxRank: number;
  costLabel: string;
  affordable: boolean;
  icon?: ReactNode;
}

export interface RoboRecompilePreviewView {
  gainLabel: string;
  currentMultiplierLabel: string;
  nextMultiplierLabel: string;
  resetItems: readonly string[];
  preservedItems: readonly string[];
}

export interface RoboAppearanceView {
  id: string;
  name: string;
  description: string;
  imageSrc: string;
  unlocked: boolean;
  equipped: boolean;
  unlockLabel?: string;
}

export interface RoboAchievementView {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAtLabel?: string;
}

