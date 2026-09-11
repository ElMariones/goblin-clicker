import { useMemo, useState, type ReactNode } from 'react';
import {
  KERNEL_PERKS,
  ROBO_ACHIEVEMENTS,
  ROBO_APPEARANCES,
  ROBO_CHARGE_CAP,
  ROBO_CIRCUIT_THRESHOLDS,
  ROBO_CORE_SCALE,
  ROBO_PROJECTS,
  getRoboCoreMultiplier,
  type RoboProjectId,
  ROBO_CIRCUITS,
  ROBO_FIRMWARE,
  ROBO_GLOBAL_BLUEPRINTS,
  ROBO_LINES,
  ROBO_LOCAL_BLUEPRINTS,
  ROBO_MASTERY_LEVELS,
  getKernelPerkCost,
  getKernelPerkRank,
  getRoboCircuitMultiplier,
  getRoboCircuitSummary,
  getRoboClickPower,
  getRoboLineBulkCost,
  getRoboLineCycle,
  getRoboLineMastery,
  getRoboLineRate,
  getRoboMaxAffordableLineCount,
  getRoboRecompileGain,
  getRoboStableRps,
  getRoboTotalPending,
  isRoboAppearanceUnlocked,
  isRoboLineRevealed,
  type CadenceFirmware,
  type ControlFirmware,
  type GameState,
  type KernelPerkId,
  type RoboAppearanceId,
  type RoboBlueprintId,
  type RoboFirmwareGroup,
  type RoboLineId,
  type RoboPurchaseAmount,
} from '../../game';
import { robogoblinAppearanceArt, robogoblinLineArt } from '../../utils/robogoblinAssets';
import { useI18n, type LanguageCode } from '../../i18n';
import { formatRobo, getRoboCopy } from '../../i18n/robogoblins';
import { ROBO_GUIDE } from '../../i18n/roboGuide';
import { Modal } from '../Modal';
import { CRTWarp } from '../CRTWarp';
import { FloatingNumbers, type FloatingNumberView } from '../FloatingNumbers';
import { GameShell } from '../GameShell';
import { Icon } from '../Icon';
import { ResourceHeader } from '../ResourceHeader';
import { RoboAssemblyShop } from './RoboAssemblyShop';
import { RoboAssemblyStage } from './RoboAssemblyStage';
import { RoboBlueprintFirmwareModal } from './RoboBlueprintFirmwareModal';
import { RoboCircuitsPanel } from './RoboCircuitsPanel';
import { RoboCollectionModal } from './RoboCollectionModal';
import { RoboFactoryLedger } from './RoboFactoryLedger';
import { ROBO_ENDGAME } from '../../i18n/roboEndgame';
import { RoboProjectsModal } from './RoboProjectsModal';
import { RoboKernelModal } from './RoboKernelModal';
import { RoboWorldSwitch } from './RoboWorldSwitch';
import type {
  RoboAchievementView,
  RoboAppearanceView,
  RoboAssemblyLineView,
  RoboBlueprintView,
  RoboBuyAmount,
  RoboCircuitView,
  RoboFirmwareGroupView,
  RoboKernelPerkView,
} from './types';

interface RoboGameWorldProps {
  game: GameState;
  buyAmount: RoboBuyAmount;
  onBuyAmountChange: (amount: RoboBuyAmount) => void;
  onAssemble: () => void;
  onBuyLine: (id: RoboLineId, amount: RoboPurchaseAmount) => void;
  onBuyBlueprint: (id: RoboBlueprintId) => void;
  onChooseFirmware: (group: RoboFirmwareGroup, choice: ControlFirmware | CadenceFirmware) => void;
  onOverclock: () => void;
  onBuyKernelPerk: (id: KernelPerkId) => void;
  onBuildProject: (id: RoboProjectId) => void;
  onRecompile: () => void;
  onEquipAppearance: (id: RoboAppearanceId) => void;
  onPurchaseAppearance: (id: RoboAppearanceId) => void;
  onSwitchToWarren: () => void;
  onOpenSettings: () => void;
  musicMuted: boolean;
  musicTitle?: string;
  musicArtist?: string;
  onToggleMusic: () => void;
  onSkipMusic: () => void;
  effects: boolean;
  reducedMotion: boolean;
  floating?: FloatingNumberView[];
  overlay?: ReactNode;
  formatNumber: (value: number, precision?: number) => string;
  formatInteger: (value: number) => string;
  formatDuration: (milliseconds: number) => string;
  formatDate: (timestamp: number) => string;
  warrenRate: number;
}

type RoboModal = 'blueprints' | 'firmware' | 'circuits' | 'kernel' | 'collection' | 'projects' | null;

const KERNEL_EFFECT_COPY: Record<LanguageCode, Record<KernelPerkId, (rank: number) => string>> = {
  en: {
    better_bolts: (rank) => `Passive assembly ×${(1 + rank * 0.05).toFixed(2)}`,
    boot_cache: (rank) => `Start future compiles with ${20 + rank * 100} RG`,
    night_shift: (rank) => `${Math.min(100, 80 + rank * 5)}% offline efficiency`, deep_battery: (rank) => `${8 + rank * 2}h offline cap`,
    copper_memory: (rank) => `Each circuit tier adds +${10 + rank}%`, warm_start: (rank) => `Start future compiles with ${Math.min(120, rank * 30)} Charge`,
    finger_servos: (rank) => `Manual assembly ×${(1 + rank * 0.1).toFixed(2)}`, family_adapter: (rank) => `Organic bridge rank ${rank}/5`,
  },
  es: {
    better_bolts: (rank) => `Montaje pasivo ×${(1 + rank * 0.05).toFixed(2)}`, boot_cache: (rank) => `Futuras compilaciones empiezan con ${20 + rank * 100} RG`,
    night_shift: (rank) => `${Math.min(100, 80 + rank * 5)}% de eficiencia sin conexión`, deep_battery: (rank) => `Límite sin conexión: ${8 + rank * 2} h`,
    copper_memory: (rank) => `Cada nivel de circuito añade +${10 + rank}%`, warm_start: (rank) => `Futuras compilaciones empiezan con ${Math.min(120, rank * 30)} de Carga`,
    finger_servos: (rank) => `Montaje manual ×${(1 + rank * 0.1).toFixed(2)}`, family_adapter: (rank) => `Rango del puente orgánico ${rank}/5`,
  },
  zh: {
    better_bolts: (rank) => `被动装配 ×${(1 + rank * 0.05).toFixed(2)}`, boot_cache: (rank) => `未来编译以 ${20 + rank * 100} RG 开始`,
    night_shift: (rank) => `离线效率 ${Math.min(100, 80 + rank * 5)}%`, deep_battery: (rank) => `离线上限 ${8 + rank * 2} 小时`,
    copper_memory: (rank) => `每个回路等级 +${10 + rank}%`, warm_start: (rank) => `未来编译以 ${Math.min(120, rank * 30)} 电荷开始`,
    finger_servos: (rank) => `手动装配 ×${(1 + rank * 0.1).toFixed(2)}`, family_adapter: (rank) => `有机桥梁等级 ${rank}/5`,
  },
  fr: {
    better_bolts: (rank) => `Assemblage passif ×${(1 + rank * 0.05).toFixed(2)}`, boot_cache: (rank) => `Prochaines compilations : ${20 + rank * 100} RG au départ`,
    night_shift: (rank) => `${Math.min(100, 80 + rank * 5)} % d’efficacité hors ligne`, deep_battery: (rank) => `Plafond hors ligne : ${8 + rank * 2} h`,
    copper_memory: (rank) => `Chaque niveau de circuit ajoute +${10 + rank} %`, warm_start: (rank) => `Prochaines compilations : ${Math.min(120, rank * 30)} Charge au départ`,
    finger_servos: (rank) => `Assemblage manuel ×${(1 + rank * 0.1).toFixed(2)}`, family_adapter: (rank) => `Rang du pont organique ${rank}/5`,
  },
  de: {
    better_bolts: (rank) => `Passive Montage ×${(1 + rank * 0.05).toFixed(2)}`, boot_cache: (rank) => `Künftige Kompilierungen starten mit ${20 + rank * 100} RG`,
    night_shift: (rank) => `${Math.min(100, 80 + rank * 5)} % Offline-Effizienz`, deep_battery: (rank) => `${8 + rank * 2} Std. Offline-Limit`,
    copper_memory: (rank) => `Jede Schaltkreisstufe gibt +${10 + rank} %`, warm_start: (rank) => `Künftige Kompilierungen starten mit ${Math.min(120, rank * 30)} Ladung`,
    finger_servos: (rank) => `Manuelle Montage ×${(1 + rank * 0.1).toFixed(2)}`, family_adapter: (rank) => `Organischer Brückenrang ${rank}/5`,
  },
  ar: {
    better_bolts: (rank) => `التجميع السلبي ×${(1 + rank * 0.05).toFixed(2)}`, boot_cache: (rank) => `ابدأ التجميعات المقبلة بـ${20 + rank * 100} RG`,
    night_shift: (rank) => `كفاءة دون اتصال ${Math.min(100, 80 + rank * 5)}٪`, deep_battery: (rank) => `حد دون اتصال ${8 + rank * 2} ساعة`,
    copper_memory: (rank) => `كل مستوى دائرة يضيف +${10 + rank}٪`, warm_start: (rank) => `ابدأ التجميعات المقبلة بـ${Math.min(120, rank * 30)} شحنة`,
    finger_servos: (rank) => `التجميع اليدوي ×${(1 + rank * 0.1).toFixed(2)}`, family_adapter: (rank) => `رتبة الجسر العضوي ${rank}/5`,
  },
  tr: {
    better_bolts: (rank) => `Pasif montaj ×${(1 + rank * 0.05).toFixed(2)}`, boot_cache: (rank) => `Gelecek derlemelere ${20 + rank * 100} RG ile başla`,
    night_shift: (rank) => `%${Math.min(100, 80 + rank * 5)} çevrimdışı verimlilik`, deep_battery: (rank) => `${8 + rank * 2} saat çevrimdışı sınırı`,
    copper_memory: (rank) => `Her devre kademesi +%${10 + rank} ekler`, warm_start: (rank) => `Gelecek derlemelere ${Math.min(120, rank * 30)} Şarj ile başla`,
    finger_servos: (rank) => `Elle montaj ×${(1 + rank * 0.1).toFixed(2)}`, family_adapter: (rank) => `Organik köprü rütbesi ${rank}/5`,
  },
};

const FIRMWARE_EFFECT_COPY: Record<LanguageCode, Record<string, string>> = {
  en: { clock: '×1.20 passive assembly', spark: 'Manual CPS share 3% → 15%', quick: 'Batch cycles ×0.50', heavy: 'Cycles ×2 · passive ×1.15' },
  es: { clock: 'Montaje pasivo ×1,20', spark: 'Porción manual 3% → 15%', quick: 'Ciclos de lote ×0,50', heavy: 'Ciclos ×2 · pasivo ×1,15' },
  zh: { clock: '被动装配 ×1.20', spark: '手动产量占比 3% → 15%', quick: '批次周期 ×0.50', heavy: '周期 ×2 · 被动 ×1.15' },
  fr: { clock: 'Assemblage passif ×1,20', spark: 'Part manuelle 3 % → 15 %', quick: 'Cycles de lot ×0,50', heavy: 'Cycles ×2 · passif ×1,15' },
  de: { clock: 'Passive Montage ×1,20', spark: 'Manueller Anteil 3 % → 15 %', quick: 'Chargenzyklen ×0,50', heavy: 'Zyklen ×2 · passiv ×1,15' },
  ar: { clock: 'التجميع السلبي ×1.20', spark: 'حصة اليدوي 3٪ → 15٪', quick: 'دورات الدفعات ×0.50', heavy: 'الدورات ×2 · السلبي ×1.15' },
  tr: { clock: 'Pasif montaj ×1,20', spark: 'Elle üretim payı %3 → %15', quick: 'Parti döngüleri ×0,50', heavy: 'Döngüler ×2 · pasif ×1,15' },
};

function nextMastery(owned: number) {
  return ROBO_MASTERY_LEVELS.find((level) => owned < level.threshold) ?? null;
}

function currentMastery(owned: number) {
  const reached = ROBO_MASTERY_LEVELS.filter((level) => owned >= level.threshold);
  return reached.length > 0 ? reached[reached.length - 1] : null;
}

export function RoboGameWorld({
  game, buyAmount, onBuyAmountChange, onAssemble, onBuyLine, onBuyBlueprint, onChooseFirmware,
  onOverclock, onBuyKernelPerk, onBuildProject, onRecompile, onEquipAppearance, onPurchaseAppearance, onSwitchToWarren, onOpenSettings,
  musicMuted, musicTitle, musicArtist, onToggleMusic, onSkipMusic, effects, reducedMotion, floating = [], overlay,
  formatNumber, formatInteger, formatDuration, formatDate, warrenRate,
}: RoboGameWorldProps) {
  const { language, t } = useI18n();
  const copy = getRoboCopy(language);
  const guide = ROBO_GUIDE[language];
  const endgame = ROBO_ENDGAME[language];
  const [modal, setModal] = useState<RoboModal>(null);
  // This screen is mounted only after the one-time Mechanical Charter creates robo state.
  const robo = game.robo!;

  const now = game.lastUpdateAt;
  const stableRps = getRoboStableRps(game);
  const clickPower = getRoboClickPower(game);
  const totalPending = getRoboTotalPending(game);
  const recompileGain = getRoboRecompileGain(game);
  const overclockActive = robo.capacitor.overclockEndsAt !== null && robo.capacitor.overclockEndsAt > now;

  const lines = useMemo<RoboAssemblyLineView[]>(() => ROBO_LINES.map((definition) => {
    const line = robo.lines[definition.id];
    const revealed = isRoboLineRevealed(robo, definition.id);
    const maxAffordable = getRoboMaxAffordableLineCount(game, definition.id);
    const selectedQuantity = buyAmount === 'max' ? maxAffordable : buyAmount;
    const priceQuantity = Math.max(1, selectedQuantity);
    const cost = getRoboLineBulkCost(game, definition.id, priceQuantity);
    const cycle = getRoboLineCycle(game, definition.id);
    const mastery = currentMastery(line.owned);
    const next = nextMastery(line.owned);
    const nextQuantity = next ? next.threshold - line.owned : 1;
    const nextCost = getRoboLineBulkCost(game, definition.id, nextQuantity);
    const hasBatch = line.owned > 0 && cycle > 0;
    return {
      id: definition.id,
      name: copy.lines[definition.id]?.name ?? definition.name,
      description: copy.lines[definition.id]?.description ?? definition.description,
      circuit: definition.circuit,
      artSrc: revealed ? robogoblinLineArt[definition.id] : undefined,
      ownedLabel: formatInteger(line.owned),
      averageRateLabel: formatNumber(getRoboLineRate(game, definition.id)),
      perRobotLabel: line.owned > 0 ? formatNumber(getRoboLineRate(game, definition.id) / line.owned) : "—",
      shareLabel: `${formatNumber(stableRps > 0 ? getRoboLineRate(game, definition.id) / stableRps * 100 : 0, 1)}%`,
      cycleLabel: formatDuration(cycle * 1000),
      lifetimeLabel: formatNumber(robo.statistics.lifetimeProducedByLine[definition.id]),
      batchProgress: hasBatch ? Math.max(0, Math.min(1, line.phaseSeconds / cycle)) : 0,
      nextBatchLabel: hasBatch ? formatRobo(copy.nextBatchIn, { duration: formatDuration(Math.max(0, cycle - line.phaseSeconds) * 1_000) }) : copy.assignToStart,
      pendingLabel: formatRobo(copy.assembled, { amount: formatNumber(line.pendingRG) }),
      priceLabel: Number.isFinite(cost) ? formatNumber(cost) : '—',
      buyQuantityLabel: buyAmount === 'max'
        ? (selectedQuantity > 0 ? formatRobo(copy.buy, { count: formatInteger(selectedQuantity) }) : copy.buyMax)
        : formatRobo(copy.buy, { count: formatInteger(selectedQuantity) }),
      canAfford: revealed && selectedQuantity > 0 && Number.isFinite(cost) && robo.readyRG >= cost,
      locked: !revealed,
      lockLabel: copy.lineLocked,
      masteryLabel: mastery ? copy.masteryNames[mastery.name] ?? mastery.name : copy.unbolted,
      masteryFactorLabel: `×${formatNumber(getRoboLineMastery(game, definition.id), 2)}`,
      nextMilestoneLabel: next ? `${copy.masteryNames[next.name] ?? next.name} · ${formatInteger(next.threshold)}` : copy.masteryComplete,
      nextMilestoneCostLabel: next && Number.isFinite(nextCost) ? formatNumber(nextCost) : undefined,
      canBuyNextMilestone: Boolean(next && revealed && Number.isFinite(nextCost) && robo.readyRG >= nextCost),
    };
  }), [buyAmount, copy, formatDuration, formatInteger, formatNumber, game, robo, stableRps]);

  const circuitSummaries = getRoboCircuitSummary(game);
  const circuitFactor = getRoboCircuitMultiplier(robo);
  const circuits = useMemo<RoboCircuitView[]>(() => circuitSummaries.map((summary) => {
    const threshold = summary.nextThreshold;
    const bottleneck = summary.bottleneck;
    const bottleneckCost = bottleneck && bottleneck.needed > 0
      ? getRoboLineBulkCost(game, bottleneck.lineId, bottleneck.needed)
      : 0;
    return {
      id: summary.id,
      name: copy.circuitNames[summary.id],
      tierLabel: summary.tiers >= ROBO_CIRCUIT_THRESHOLDS.length ? copy.circuitAllClosed : formatRobo(copy.circuitTier, { tier: summary.tiers }),
      tierProgressLabel: threshold ? formatRobo(copy.circuitBringAll, { amount: formatInteger(threshold) }) : copy.circuitFullySynchronized,
      bonusLabel: formatRobo(copy.circuitShared, { factor: formatNumber(circuitFactor, 2) }),
      members: ROBO_CIRCUITS[summary.id].map((id) => ({
        id,
        name: copy.lines[id]?.name ?? ROBO_LINES.find((line) => line.id === id)?.name ?? id,
        ownedLabel: formatInteger(robo.lines[id].owned),
        ready: threshold === null || robo.lines[id].owned >= threshold,
      })),
      bottleneckLabel: bottleneck ? formatRobo(copy.circuitNeeded, { name: copy.lines[bottleneck.lineId]?.name ?? bottleneck.lineId, amount: formatInteger(bottleneck.needed) }) : copy.circuitNoBottleneck,
      bottleneckCostLabel: bottleneck && Number.isFinite(bottleneckCost) ? formatNumber(bottleneckCost) : undefined,
      canBuyBottleneck: Boolean(bottleneck && bottleneck.needed > 0 && Number.isFinite(bottleneckCost) && robo.readyRG >= bottleneckCost),
    };
  }), [circuitFactor, circuitSummaries, copy, formatInteger, formatNumber, game, robo]);

  const blueprints = useMemo<RoboBlueprintView[]>(() => {
    const local = ROBO_LOCAL_BLUEPRINTS.map((blueprint) => {
      const line = robo.lines[blueprint.lineId];
      const localizedLine = copy.lines[blueprint.lineId]?.name ?? ROBO_LINES.find((item) => item.id === blueprint.lineId)?.name ?? blueprint.lineId;
      const lineBlueprints = ROBO_LOCAL_BLUEPRINTS.filter((item) => item.lineId === blueprint.lineId);
      const index = lineBlueprints.findIndex((item) => item.id === blueprint.id);
      const purchased = line.blueprintRank > index;
      const unlocked = purchased || (line.blueprintRank === index && line.owned >= blueprint.threshold);
      return {
        id: blueprint.id,
        name: `${localizedLine}: ${copy.blueprintTiers[blueprint.tierId] ?? blueprint.name.split(': ').at(-1) ?? blueprint.name}`,
        description: formatRobo(copy.localBlueprintDescription, { line: localizedLine }),
        kind: 'local' as const,
        circuit: ROBO_LINES.find((item) => item.id === blueprint.lineId)?.circuit,
        lineName: localizedLine,
        effectLabel: formatRobo(copy.localBlueprintEffect, { factor: formatNumber(blueprint.multiplier, 2) }),
        priceLabel: formatNumber(blueprint.cost),
        purchased,
        unlocked,
        canAfford: unlocked && !purchased && robo.readyRG >= blueprint.cost,
        requirementLabel: purchased ? undefined : formatRobo(copy.localBlueprintRequirement, { amount: formatInteger(blueprint.threshold) }),
      };
    });
    const anyLine = ROBO_LINES.some((line) => robo.lines[line.id].owned > 0);
    const global = ROBO_GLOBAL_BLUEPRINTS.map((blueprint, index) => {
      const purchased = robo.globalBlueprintRank > index;
      const unlocked = purchased || (robo.globalBlueprintRank === index && anyLine);
      return {
        id: blueprint.id,
        name: copy.globalBlueprints[blueprint.id] ?? blueprint.name,
        description: copy.globalBlueprintDescription,
        kind: 'global' as const,
        effectLabel: formatRobo(copy.globalBlueprintEffect, { factor: formatNumber(blueprint.multiplier, 2) }),
        priceLabel: formatNumber(blueprint.cost),
        purchased,
        unlocked,
        canAfford: unlocked && !purchased && robo.readyRG >= blueprint.cost,
        requirementLabel: purchased ? undefined : copy.globalBlueprintRequirement,
      };
    });
    return [...local, ...global];
  }, [copy, formatInteger, formatNumber, robo]);

  const firmwareGroups = useMemo<RoboFirmwareGroupView[]>(() => ([
    {
      id: 'control',
      name: copy.firmwareGroups.control,
      unlockLabel: formatRobo(copy.firmwareUnlock, { amount: formatNumber(ROBO_FIRMWARE.control.unlockProducedRG) }),
      unlocked: robo.runProducedRG >= ROBO_FIRMWARE.control.unlockProducedRG,
      lockedChoiceLabel: robo.firmware.control ? copy.firmwareChoiceCommitted : undefined,
      options: [
        { id: 'clock', name: copy.firmwareOptions.clock.name, description: copy.firmwareOptions.clock.description, effectLabel: FIRMWARE_EFFECT_COPY[language].clock, priceLabel: formatNumber(ROBO_FIRMWARE.control.cost), selected: robo.firmware.control === 'clock', locked: robo.firmware.control !== null && robo.firmware.control !== 'clock', canAfford: robo.readyRG >= ROBO_FIRMWARE.control.cost },
        { id: 'spark', name: copy.firmwareOptions.spark.name, description: copy.firmwareOptions.spark.description, effectLabel: FIRMWARE_EFFECT_COPY[language].spark, priceLabel: formatNumber(ROBO_FIRMWARE.control.cost), selected: robo.firmware.control === 'spark', locked: robo.firmware.control !== null && robo.firmware.control !== 'spark', canAfford: robo.readyRG >= ROBO_FIRMWARE.control.cost },
      ],
    },
    {
      id: 'cadence',
      name: copy.firmwareGroups.cadence,
      unlockLabel: formatRobo(copy.firmwareUnlock, { amount: formatNumber(ROBO_FIRMWARE.cadence.unlockProducedRG) }),
      unlocked: robo.runProducedRG >= ROBO_FIRMWARE.cadence.unlockProducedRG,
      lockedChoiceLabel: robo.firmware.cadence ? copy.firmwareChoiceCommitted : undefined,
      options: [
        { id: 'quick', name: copy.firmwareOptions.quick.name, description: copy.firmwareOptions.quick.description, effectLabel: FIRMWARE_EFFECT_COPY[language].quick, priceLabel: formatNumber(ROBO_FIRMWARE.cadence.cost), selected: robo.firmware.cadence === 'quick', locked: robo.firmware.cadence !== null && robo.firmware.cadence !== 'quick', canAfford: robo.readyRG >= ROBO_FIRMWARE.cadence.cost },
        { id: 'heavy', name: copy.firmwareOptions.heavy.name, description: copy.firmwareOptions.heavy.description, effectLabel: FIRMWARE_EFFECT_COPY[language].heavy, priceLabel: formatNumber(ROBO_FIRMWARE.cadence.cost), selected: robo.firmware.cadence === 'heavy', locked: robo.firmware.cadence !== null && robo.firmware.cadence !== 'heavy', canAfford: robo.readyRG >= ROBO_FIRMWARE.cadence.cost },
      ],
    },
  ]), [copy, formatNumber, language, robo]);

  const kernelPerks = useMemo<RoboKernelPerkView[]>(() => KERNEL_PERKS.map((perk) => {
    const rank = getKernelPerkRank(game, perk.id);
    const cost = getKernelPerkCost(game, perk.id);
    const perkCopy = copy.kernelPerks[perk.id];
    const iconName = perk.id === 'deep_battery' || perk.id === 'warm_start' ? 'hourglass' : perk.id === 'finger_servos' ? 'click' : perk.id === 'family_adapter' ? 'burrow' : perk.id === 'better_bolts' ? 'hammer' : 'memory';
    return {
      id: perk.id,
      name: perkCopy?.name ?? perk.name,
      description: perkCopy?.description ?? perk.name,
      effectLabel: KERNEL_EFFECT_COPY[language][perk.id](rank),
      nextEffectLabel: rank < perk.maxRank ? KERNEL_EFFECT_COPY[language][perk.id](rank + 1) : undefined,
      rank,
      maxRank: perk.maxRank,
      costLabel: Number.isFinite(cost) ? formatInteger(cost) : '—',
      affordable: Number.isFinite(cost) && robo.kernel.cores >= cost,
      icon: <Icon name={iconName} size={19} />,
    };
  }), [copy, formatInteger, game, language, robo.kernel.cores]);

  const appearances = useMemo<RoboAppearanceView[]>(() => ROBO_APPEARANCES.map((definition) => ({
    id: definition.id,
    name: copy.appearancesCopy[definition.id]?.name ?? definition.id,
    description: copy.appearancesCopy[definition.id]?.description ?? definition.id,
    imageSrc: robogoblinAppearanceArt[definition.id],
    priceLabel: definition.cost > 0 ? formatInteger(definition.cost) : undefined,
    owned: isRoboAppearanceUnlocked(robo, definition.id),
    equipped: robo.appearance === definition.id,
    affordable: definition.cost === 0 || robo.kernel.cores >= definition.cost,
    isDefault: definition.id === 'goblin',
  })), [copy, formatInteger, robo]);

  const achievements = useMemo<RoboAchievementView[]>(() => ROBO_ACHIEVEMENTS.map((achievement) => {
    const unlockedAt = robo.achievements[achievement.id];
    return {
      id: achievement.id,
      name: copy.achievementsCopy[achievement.id]?.name ?? achievement.name,
      description: copy.achievementsCopy[achievement.id]?.description ?? achievement.description,
      unlocked: unlockedAt !== undefined,
      unlockedAtLabel: unlockedAt !== undefined ? t('achievement.unlockedAt', { date: formatDate(unlockedAt) }) : undefined,
    };
  }), [copy, formatDate, robo.achievements, t]);

  const eligibleLifetime = robo.lifetimeProducedRG + totalPending;
  const nextCoreIndex = Math.min(1_000_000_000, robo.kernel.totalCoresEarned + 1);
  const nextCoreThreshold = ROBO_CORE_SCALE * nextCoreIndex ** 3;
  const overclockStatus = overclockActive && robo.capacitor.overclockEndsAt
    ? formatRobo(copy.overclockRemaining, { duration: formatDuration(Math.max(0, robo.capacitor.overclockEndsAt - now)) })
    : robo.capacitor.charge >= ROBO_CHARGE_CAP
      ? copy.overclockReady
      : formatRobo(copy.chargeUntilReady, { amount: formatInteger(Math.ceil(ROBO_CHARGE_CAP - robo.capacitor.charge)) });
  const anyLineOwned = ROBO_LINES.some((line) => robo.lines[line.id].owned > 0);
  const unlockedAchievements = Object.keys(robo.achievements).length;
  const appearanceName = copy.appearancesCopy[robo.appearance]?.name ?? robo.appearance;
  const nextProjectIndex = ROBO_PROJECTS.findIndex((project) => (robo.kernel.projects[project.id] ?? 0) < project.maxRank);
  const objective = robo.lines.paradox_nest.owned > 0 && nextProjectIndex >= 0
    ? formatRobo(endgame.objective, { name: endgame.projects[nextProjectIndex], rank: (robo.kernel.projects[ROBO_PROJECTS[nextProjectIndex].id] ?? 0) + 1 })
    : !anyLineOwned
    ? copy.objectiveStarter
    : recompileGain > 0
      ? formatRobo(copy.objectiveRecompile, { amount: formatInteger(recompileGain) })
      : (() => {
          const target = ROBO_LINES.find((line) => nextMastery(robo.lines[line.id].owned));
          const milestone = target ? nextMastery(robo.lines[target.id].owned) : null;
          return target && milestone
            ? formatRobo(copy.objectiveMastery, {
                line: copy.lines[target.id]?.name ?? target.name,
                amount: formatInteger(milestone.threshold),
                mastery: copy.masteryNames[milestone.name] ?? milestone.name,
              })
            : copy.objectiveComplete;
        })();

  const left = <div className="left-stack">
    <RoboFactoryLedger
      stats={[
        { id: 'compile', label: copy.thisCompile, value: formatNumber(robo.runProducedRG), accent: 'blue' },
        { id: 'lifetime', label: copy.allTimeRG, value: formatNumber(robo.lifetimeProducedRG) },
        { id: 'manual', label: copy.manualAssembly, value: formatNumber(robo.statistics.manuallyAssembledRG), accent: 'copper' },
        { id: 'best', label: copy.bestStable, value: formatNumber(robo.statistics.highestStableRps) },
        { id: 'cores', label: copy.kernelEarned, value: formatInteger(robo.kernel.totalCoresEarned), accent: 'lilac' },
        { id: 'recompiles', label: copy.recompiles, value: formatInteger(robo.kernel.recompiles) },
      ]}
      warrenRateLabel={`${formatNumber(warrenRate)}/s`}
      nextGoalLabel={objective}
      achievementCountLabel={`${formatInteger(unlockedAchievements)}/${formatInteger(ROBO_ACHIEVEMENTS.length)}`}
      onOpenAchievements={() => setModal('collection')}
      onOpenAppearances={() => setModal('collection')}
    />
    <section className="robo-controls" aria-label={guide.controls}>
      <h2>{guide.controls}</h2>
      {([
        ['blueprints', 'hammer', guide.blueprints, guide.blueprintHint, blueprints.filter((item) => item.canAfford).length],
        ['circuits', 'sparkles', copy.circuits, guide.circuitHint, `×${formatNumber(circuitFactor, 2)}`],
        ['firmware', 'settings', copy.firmware, guide.firmwareHint, `${Number(Boolean(robo.firmware.control)) + Number(Boolean(robo.firmware.cadence))}/2`],
        ['kernel', 'memory', guide.kernel, guide.kernelHint, `${formatInteger(robo.kernel.cores)} ${copy.cores}`],
        ['projects', 'sparkles', endgame.title, endgame.hint, `${ROBO_PROJECTS.reduce((sum, project) => sum + (robo.kernel.projects[project.id] ?? 0), 0)}/20`],
      ] as const).map(([id, icon, title, hint, badge]) => <button key={id} type="button" className={`robo-control robo-control--${id}`} onClick={() => setModal(id)}>
        <span className="robo-control__icon"><Icon name={icon} size={23} /></span><span><strong>{title}</strong><small>{hint}</small></span><b>{badge}</b>
      </button>)}
    </section>
  </div>;

  const center = <RoboAssemblyStage
    readyLabel={formatNumber(robo.readyRG)}
    averagePerSecondLabel={formatNumber(stableRps)}
    inAssemblyLabel={formatNumber(totalPending)}
    clickPowerLabel={formatNumber(clickPower)}
    robotImageSrc={robogoblinAppearanceArt[robo.appearance]}
    robotAppearanceName={appearanceName}
    charge={robo.capacitor.charge}
    maxCharge={ROBO_CHARGE_CAP}
    overclockActive={overclockActive}
    overclockStatusLabel={overclockStatus}
    canOverclock={anyLineOwned && robo.capacitor.charge >= ROBO_CHARGE_CAP}
    onAssemble={onAssemble}
    onOverclock={onOverclock}
    statusLabel={overclockActive ? copy.statusOverclocked : copy.statusOnline}
    worldSwitch={<RoboWorldSwitch direction="to-warren" label={copy.switchToWarren} detail={formatRobo(copy.switchWarrenDetail, { rate: formatNumber(warrenRate) })} onActivate={onSwitchToWarren} />}
    effectsLayer={effects ? <FloatingNumbers items={floating} /> : undefined}
  />;

  const right = <RoboAssemblyShop
    lines={lines}
    buyAmount={buyAmount}
    onBuyAmountChange={onBuyAmountChange}
    onBuy={(rawId) => onBuyLine(rawId as RoboLineId, buyAmount)}
    onBuyNextMilestone={(rawId) => onBuyLine(rawId as RoboLineId, 'nextMilestone')}
  />;

  const currentMultiplier = getRoboCoreMultiplier(robo.kernel.totalCoresEarned);
  const nextMultiplier = getRoboCoreMultiplier(robo.kernel.totalCoresEarned + recompileGain);
  const roboOverlay = <>
    <RoboProjectsModal open={modal === 'projects'} robo={robo} formatNumber={formatNumber} onBuild={onBuildProject} onClose={() => setModal(null)} />
    <Modal open={modal === 'circuits'} title={copy.circuits} subtitle={guide.circuitHint} icon={<Icon name="sparkles" />} onClose={() => setModal(null)} size="lg" className="robo-modal">
      <p className="robo-explainer">{guide.circuitHelp}</p>
      <div className="robo-circuit-bonus"><span>{guide.sharedBonus}</span><strong>×{formatNumber(circuitFactor, 2)}</strong></div>
      <RoboCircuitsPanel
        circuits={circuits}
        onBuyBottleneck={(circuitId) => {
          const bottleneck = circuitSummaries.find((item) => item.id === circuitId)?.bottleneck;
          if (bottleneck && bottleneck.needed > 0) onBuyLine(bottleneck.lineId, bottleneck.needed);
        }}
      />
    </Modal>
    <RoboBlueprintFirmwareModal
      open={modal === 'blueprints' || modal === 'firmware'}
      mode={modal === 'firmware' ? 'firmware' : 'blueprints'}
      readyLabel={formatNumber(robo.readyRG)}
      blueprints={blueprints}
      firmwareGroups={firmwareGroups}
      onPurchaseBlueprint={(id) => onBuyBlueprint(id as RoboBlueprintId)}
      onChooseFirmware={(groupId, optionId) => onChooseFirmware(groupId as RoboFirmwareGroup, optionId as ControlFirmware | CadenceFirmware)}
      onClose={() => setModal(null)}
    />
    <RoboKernelModal
      open={modal === 'kernel'}
      coresLabel={formatInteger(robo.kernel.cores)}
      totalEarnedLabel={formatInteger(robo.kernel.totalCoresEarned)}
      claimableCoresLabel={formatInteger(recompileGain)}
      canRecompile={recompileGain > 0}
      nextCoreLabel={recompileGain > 0 ? undefined : formatRobo(copy.nextCore, { amount: formatNumber(Math.max(0, nextCoreThreshold - eligibleLifetime)) })}
      preview={{
        gainLabel: formatInteger(recompileGain),
        currentMultiplierLabel: `×${formatNumber(currentMultiplier, 2)}`,
        nextMultiplierLabel: `×${formatNumber(nextMultiplier, 2)}`,
        resetItems: copy.resetItems,
        preservedItems: copy.preservedItems,
      }}
      perks={kernelPerks}
      onBuyPerk={(id) => onBuyKernelPerk(id as KernelPerkId)}
      onRecompile={() => { onRecompile(); setModal(null); }}
      onClose={() => setModal(null)}
    />
    <RoboCollectionModal open={modal === 'collection'} coresLabel={formatInteger(robo.kernel.cores)} appearances={appearances} achievements={achievements} onPurchaseAppearance={(id) => onPurchaseAppearance(id as RoboAppearanceId)} onEquipAppearance={(id) => onEquipAppearance(id as RoboAppearanceId)} onClose={() => setModal(null)} />
    {overlay}
  </>;

  return <GameShell
    className="world--robogoblins"
    ariaLabels={{ left: copy.ariaFactoryControls, center: copy.ariaAssemblyCradle, right: copy.ariaAssemblyLines }}
    header={<ResourceHeader
      title={copy.world}
      brandLogoSrc={`${import.meta.env.BASE_URL}assets/robogoblins-logo.svg`}
      brandLogoAlt={copy.world}
      prestigeLabel={guide.kernel}
      subtitle={copy.foundrySubtitle}
      stats={[
        { id: 'ready-rg', label: copy.readyRG, value: formatNumber(robo.readyRG), icon: 'brood', accent: true },
        { id: 'assembly-rps', label: copy.averageShort, value: formatNumber(stableRps), icon: 'cps' },
        { id: 'kernel-cores', label: copy.kernelCores, value: formatInteger(robo.kernel.cores), icon: 'memory' },
      ]}
      onOpenAchievements={() => setModal('collection')}
      onOpenPrestige={() => setModal('kernel')}
      onOpenCosmetics={() => setModal('collection')}
      onOpenSettings={onOpenSettings}
      musicMuted={musicMuted}
      musicTitle={musicTitle}
      musicArtist={musicArtist}
      onToggleMusic={onToggleMusic}
      onSkipMusic={onSkipMusic}
    />}
    left={left}
    center={center}
    right={right}
    background={<CRTWarp
      color="#88c8de"
      backgroundColor="#070d12"
      speed={0.12}
      curvature={0.28}
      scanlineStrength={0.34}
      waveAmplitude={0.11}
      waveFrequency={1.5}
      bloom={0.58}
      noise={0.035}
      vignette={0.83}
      brightness={0.64}
      pixelation={4}
      rgbShift={0.0025}
      mouseReact={false}
      dpr={1}
      fps={reducedMotion || !effects ? 1 : 24}
      paused={reducedMotion || !effects}
    />}
    overlay={roboOverlay}
  />;
}
