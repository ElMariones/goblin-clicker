import { useMemo, useState, type ReactNode } from 'react';
import {
  KERNEL_PERKS,
  ROBO_ACHIEVEMENTS,
  ROBO_CHARGE_CAP,
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
  onRecompile: () => void;
  onEquipAppearance: (id: RoboAppearanceId) => void;
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

type RoboModal = 'blueprints' | 'kernel' | 'collection' | null;

const APPEARANCE_COPY: Record<RoboAppearanceId, { name: string; description: string; unlock?: string }> = {
  tin_rascal: { name: 'Tin Rascal', description: 'Soup-can chest, fork fingers and a grin cut into sheet metal.' },
  boiler_baron: { name: 'Boiler Baron', description: 'Pressure-gauge monocle, stovepipe crown and a warm boiler heart.', unlock: 'Close the first Steam circuit tier.' },
  clockwork_ancestor: { name: 'Clockwork Ancestor', description: 'Brass memory discs, gear halo and a patched lilac circuit robe.', unlock: 'Own a Paradox Nest.' },
};

const KERNEL_COPY: Record<KernelPerkId, { description: string; effect: (rank: number) => string }> = {
  better_bolts: { description: 'Tighter fasteners improve every mechanical passive line.', effect: (rank) => `Passive assembly ×${(1 + rank * 0.05).toFixed(2)}` },
  boot_cache: { description: 'Keep a small pile of ready robots between recompiles; each rank also grants 100 RG now.', effect: (rank) => `Start future compiles with ${20 + rank * 100} RG` },
  night_shift: { description: 'Teach the foundry to waste less work while the browser is away.', effect: (rank) => `${Math.min(100, 80 + rank * 5)}% offline efficiency` },
  deep_battery: { description: 'Larger storage cells extend the mechanical offline production window.', effect: (rank) => `${8 + rank * 2}h offline cap` },
  copper_memory: { description: 'Circuit completions remember how to cooperate more efficiently.', effect: (rank) => `Each circuit tier adds +${10 + rank}%` },
  warm_start: { description: 'Pre-charge the capacitor after Recompile; each purchased rank also grants 30 Charge now.', effect: (rank) => `Start future compiles with ${Math.min(120, rank * 30)} Charge` },
  finger_servos: { description: 'Faster manual assembly without changing automated batch output.', effect: (rank) => `Manual assembly ×${(1 + rank * 0.1).toFixed(2)}` },
  family_adapter: { description: 'Translate hard-earned machine knowledge into a small capped Warren production bridge.', effect: (rank) => `Organic bridge rank ${rank}/5` },
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
  onOverclock, onBuyKernelPerk, onRecompile, onEquipAppearance, onSwitchToWarren, onOpenSettings,
  musicMuted, musicTitle, musicArtist, onToggleMusic, onSkipMusic, effects, reducedMotion, floating = [], overlay,
  formatNumber, formatInteger, formatDuration, formatDate, warrenRate,
}: RoboGameWorldProps) {
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
      name: definition.name,
      description: definition.description,
      circuit: definition.circuit,
      artSrc: revealed ? robogoblinLineArt[definition.id] : undefined,
      ownedLabel: formatInteger(line.owned),
      averageRateLabel: formatNumber(getRoboLineRate(game, definition.id)),
      batchProgress: hasBatch ? Math.max(0, Math.min(1, line.phaseSeconds / cycle)) : 0,
      nextBatchLabel: hasBatch ? `Next batch in ${formatDuration(Math.max(0, cycle - line.phaseSeconds) * 1_000)}` : 'Assign robots to start this line',
      pendingLabel: `${formatNumber(line.pendingRG)} assembled`,
      priceLabel: Number.isFinite(cost) ? formatNumber(cost) : '—',
      buyQuantityLabel: buyAmount === 'max' ? (selectedQuantity > 0 ? `Buy ${formatInteger(selectedQuantity)}` : 'Buy Max') : `Buy ${formatInteger(selectedQuantity)}`,
      canAfford: revealed && selectedQuantity > 0 && Number.isFinite(cost) && robo.readyRG >= cost,
      locked: !revealed,
      lockLabel: 'Own at least one of the preceding assembly line to reveal this machine.',
      masteryLabel: mastery?.name ?? 'Unbolted',
      masteryFactorLabel: `×${formatNumber(getRoboLineMastery(game, definition.id), 2)}`,
      nextMilestoneLabel: next ? `${next.name} · ${formatInteger(next.threshold)}` : 'Mastery complete',
      nextMilestoneCostLabel: next && Number.isFinite(nextCost) ? formatNumber(nextCost) : undefined,
      canBuyNextMilestone: Boolean(next && revealed && Number.isFinite(nextCost) && robo.readyRG >= nextCost),
    };
  }), [buyAmount, formatDuration, formatInteger, formatNumber, game, robo]);

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
      name: summary.id === 'scrap' ? 'Scrap Circuit' : summary.id === 'steam' ? 'Steam Circuit' : 'Impossible Circuit',
      tierLabel: summary.tiers >= 4 ? 'All four tiers closed' : `Tier ${summary.tiers} / 4`,
      tierProgressLabel: threshold ? `Bring all four lines to ${formatInteger(threshold)}` : 'Circuit fully synchronized',
      bonusLabel: `Shared ×${formatNumber(circuitFactor, 2)}`,
      members: ROBO_CIRCUITS[summary.id].map((id) => ({
        id,
        name: ROBO_LINES.find((line) => line.id === id)?.name ?? id,
        ownedLabel: formatInteger(robo.lines[id].owned),
        ready: threshold === null || robo.lines[id].owned >= threshold,
      })),
      bottleneckLabel: bottleneck ? `${ROBO_LINES.find((line) => line.id === bottleneck.lineId)?.name}: ${formatInteger(bottleneck.needed)} needed` : 'No bottleneck',
      bottleneckCostLabel: bottleneck && Number.isFinite(bottleneckCost) ? formatNumber(bottleneckCost) : undefined,
      canBuyBottleneck: Boolean(bottleneck && bottleneck.needed > 0 && Number.isFinite(bottleneckCost) && robo.readyRG >= bottleneckCost),
    };
  }), [circuitFactor, circuitSummaries, formatInteger, formatNumber, game, robo]);

  const blueprints = useMemo<RoboBlueprintView[]>(() => {
    const local = ROBO_LOCAL_BLUEPRINTS.map((blueprint) => {
      const line = robo.lines[blueprint.lineId];
      const lineBlueprints = ROBO_LOCAL_BLUEPRINTS.filter((item) => item.lineId === blueprint.lineId);
      const index = lineBlueprints.findIndex((item) => item.id === blueprint.id);
      const purchased = line.blueprintRank > index;
      const unlocked = purchased || (line.blueprintRank === index && line.owned >= blueprint.threshold);
      return {
        id: blueprint.id,
        name: blueprint.name,
        description: `A permanent-for-this-compile tooling upgrade for ${ROBO_LINES.find((item) => item.id === blueprint.lineId)?.name ?? blueprint.lineId}.`,
        kind: 'local' as const,
        circuit: ROBO_LINES.find((item) => item.id === blueprint.lineId)?.circuit,
        lineName: ROBO_LINES.find((item) => item.id === blueprint.lineId)?.name,
        effectLabel: `×${formatNumber(blueprint.multiplier, 2)} line output`,
        priceLabel: formatNumber(blueprint.cost),
        purchased,
        unlocked,
        canAfford: unlocked && !purchased && robo.readyRG >= blueprint.cost,
        requirementLabel: purchased ? undefined : `Requires ${formatInteger(blueprint.threshold)} owned and the previous local blueprint.`,
      };
    });
    const anyLine = ROBO_LINES.some((line) => robo.lines[line.id].owned > 0);
    const global = ROBO_GLOBAL_BLUEPRINTS.map((blueprint, index) => {
      const purchased = robo.globalBlueprintRank > index;
      const unlocked = purchased || (robo.globalBlueprintRank === index && anyLine);
      return {
        id: blueprint.id,
        name: blueprint.name,
        description: 'Shared control-room instructions propagated through every active assembly line.',
        kind: 'global' as const,
        effectLabel: `×${formatNumber(blueprint.multiplier, 2)} all mechanical output`,
        priceLabel: formatNumber(blueprint.cost),
        purchased,
        unlocked,
        canAfford: unlocked && !purchased && robo.readyRG >= blueprint.cost,
        requirementLabel: purchased ? undefined : 'Install the preceding global blueprint first.',
      };
    });
    return [...local, ...global];
  }, [formatInteger, formatNumber, robo]);

  const firmwareGroups = useMemo<RoboFirmwareGroupView[]>(() => ([
    {
      id: 'control',
      name: 'Control logic',
      unlockLabel: `Unlocks at ${formatNumber(ROBO_FIRMWARE.control.unlockProducedRG)} RG produced this compile`,
      unlocked: robo.runProducedRG >= ROBO_FIRMWARE.control.unlockProducedRG,
      lockedChoiceLabel: robo.firmware.control ? 'Choice committed until Recompile' : undefined,
      options: [
        { id: 'clock', name: 'Clockwork Consensus', description: 'Prefer reliable unattended throughput.', effectLabel: '×1.20 passive assembly', priceLabel: formatNumber(ROBO_FIRMWARE.control.cost), selected: robo.firmware.control === 'clock', locked: robo.firmware.control !== null && robo.firmware.control !== 'clock', canAfford: robo.readyRG >= ROBO_FIRMWARE.control.cost },
        { id: 'spark', name: 'Spark Personality', description: 'Route more factory output through manual assembly.', effectLabel: 'Manual CPS share 3% → 15%', priceLabel: formatNumber(ROBO_FIRMWARE.control.cost), selected: robo.firmware.control === 'spark', locked: robo.firmware.control !== null && robo.firmware.control !== 'spark', canAfford: robo.readyRG >= ROBO_FIRMWARE.control.cost },
      ],
    },
    {
      id: 'cadence',
      name: 'Batch cadence',
      unlockLabel: `Unlocks at ${formatNumber(ROBO_FIRMWARE.cadence.unlockProducedRG)} RG produced this compile`,
      unlocked: robo.runProducedRG >= ROBO_FIRMWARE.cadence.unlockProducedRG,
      lockedChoiceLabel: robo.firmware.cadence ? 'Choice committed until Recompile' : undefined,
      options: [
        { id: 'quick', name: 'Quick-release Latches', description: 'Release smaller intervals without changing average production.', effectLabel: 'Batch cycles ×0.50', priceLabel: formatNumber(ROBO_FIRMWARE.cadence.cost), selected: robo.firmware.cadence === 'quick', locked: robo.firmware.cadence !== null && robo.firmware.cadence !== 'quick', canAfford: robo.readyRG >= ROBO_FIRMWARE.cadence.cost },
        { id: 'heavy', name: 'Heavy Batch Protocol', description: 'Wait longer for a stronger stable production line.', effectLabel: 'Cycles ×2 · passive ×1.15', priceLabel: formatNumber(ROBO_FIRMWARE.cadence.cost), selected: robo.firmware.cadence === 'heavy', locked: robo.firmware.cadence !== null && robo.firmware.cadence !== 'heavy', canAfford: robo.readyRG >= ROBO_FIRMWARE.cadence.cost },
      ],
    },
  ]), [formatNumber, robo]);

  const kernelPerks = useMemo<RoboKernelPerkView[]>(() => KERNEL_PERKS.map((perk) => {
    const rank = getKernelPerkRank(game, perk.id);
    const cost = getKernelPerkCost(game, perk.id);
    const copy = KERNEL_COPY[perk.id];
    const iconName = perk.id === 'deep_battery' || perk.id === 'warm_start' ? 'hourglass' : perk.id === 'finger_servos' ? 'click' : perk.id === 'family_adapter' ? 'burrow' : perk.id === 'better_bolts' ? 'hammer' : 'memory';
    return {
      id: perk.id,
      name: perk.name,
      description: copy.description,
      effectLabel: copy.effect(rank),
      rank,
      maxRank: perk.maxRank,
      costLabel: Number.isFinite(cost) ? formatInteger(cost) : '—',
      affordable: Number.isFinite(cost) && robo.kernel.cores >= cost,
      icon: <Icon name={iconName} size={19} />,
    };
  }), [formatInteger, game, robo.kernel.cores]);

  const appearances = useMemo<RoboAppearanceView[]>(() => (Object.keys(APPEARANCE_COPY) as RoboAppearanceId[]).map((id) => ({
    id,
    name: APPEARANCE_COPY[id].name,
    description: APPEARANCE_COPY[id].description,
    imageSrc: robogoblinAppearanceArt[id],
    unlocked: isRoboAppearanceUnlocked(robo, id),
    equipped: robo.appearance === id,
    unlockLabel: APPEARANCE_COPY[id].unlock,
  })), [robo]);

  const achievements = useMemo<RoboAchievementView[]>(() => ROBO_ACHIEVEMENTS.map((achievement) => {
    const unlockedAt = robo.achievements[achievement.id];
    return {
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      unlocked: unlockedAt !== undefined,
      unlockedAtLabel: unlockedAt !== undefined ? `Unlocked ${formatDate(unlockedAt)}` : undefined,
    };
  }), [formatDate, robo.achievements]);

  const eligibleLifetime = robo.lifetimeProducedRG + totalPending;
  const nextCoreIndex = Math.min(1_000_000_000, robo.kernel.totalCoresEarned + 1);
  const nextCoreThreshold = 10_000_000 * nextCoreIndex ** 3;
  const overclockStatus = overclockActive && robo.capacitor.overclockEndsAt
    ? `${formatDuration(Math.max(0, robo.capacitor.overclockEndsAt - now))} remaining · ×2 passive`
    : robo.capacitor.charge >= ROBO_CHARGE_CAP
      ? 'Capacitor full · 30s at ×2 passive'
      : `${formatInteger(Math.ceil(ROBO_CHARGE_CAP - robo.capacitor.charge))} Charge until ready`;
  const anyLineOwned = ROBO_LINES.some((line) => robo.lines[line.id].owned > 0);
  const unlockedAchievements = Object.keys(robo.achievements).length;
  const appearanceName = APPEARANCE_COPY[robo.appearance].name;
  const objective = !anyLineOwned
    ? 'Assign the starter stock to one Tin Cradle.'
    : recompileGain > 0
      ? `Recompile now for +${formatInteger(recompileGain)} Kernel Cores, or push farther.`
      : (() => {
          const target = ROBO_LINES.find((line) => nextMastery(robo.lines[line.id].owned));
          const milestone = target ? nextMastery(robo.lines[target.id].owned) : null;
          return target && milestone ? `Bring ${target.name} to ${formatInteger(milestone.threshold)} for ${milestone.name}.` : 'Complete the Kernel and close every circuit.';
        })();

  const left = <div className="left-stack">
    <RoboFactoryLedger
      stats={[
        { id: 'compile', label: 'This compile', value: formatNumber(robo.runProducedRG), accent: 'blue' },
        { id: 'lifetime', label: 'All-time RG', value: formatNumber(robo.lifetimeProducedRG) },
        { id: 'manual', label: 'Manual assembly', value: formatNumber(robo.statistics.manuallyAssembledRG), accent: 'copper' },
        { id: 'best', label: 'Best stable /s', value: formatNumber(robo.statistics.highestStableRps) },
        { id: 'cores', label: 'Kernel earned', value: formatInteger(robo.kernel.totalCoresEarned), accent: 'lilac' },
        { id: 'recompiles', label: 'Recompiles', value: formatInteger(robo.kernel.recompiles) },
      ]}
      warrenRateLabel={`${formatNumber(warrenRate)}/s`}
      nextGoalLabel={objective}
      achievementCountLabel={`${formatInteger(unlockedAchievements)}/${formatInteger(ROBO_ACHIEVEMENTS.length)}`}
      onOpenAchievements={() => setModal('collection')}
      onOpenAppearances={() => setModal('collection')}
    />
    <RoboCircuitsPanel
      circuits={circuits}
      onBuyBottleneck={(circuitId) => {
        const bottleneck = circuitSummaries.find((item) => item.id === circuitId)?.bottleneck;
        if (bottleneck && bottleneck.needed > 0) onBuyLine(bottleneck.lineId, bottleneck.needed);
      }}
      onOpenBlueprints={() => setModal('blueprints')}
      onOpenKernel={() => setModal('kernel')}
    />
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
    statusLabel={overclockActive ? 'Pressure beyond warranty' : 'Assembly cradle online'}
    worldSwitch={<RoboWorldSwitch direction="to-warren" label="Return to Warren" detail={`Organic production continues at ${formatNumber(warrenRate)}/s`} onActivate={onSwitchToWarren} />}
    effectsLayer={effects ? <FloatingNumbers items={floating} /> : undefined}
  />;

  const right = <RoboAssemblyShop
    lines={lines}
    buyAmount={buyAmount}
    onBuyAmountChange={onBuyAmountChange}
    onBuy={(rawId) => onBuyLine(rawId as RoboLineId, buyAmount)}
    onBuyNextMilestone={(rawId) => onBuyLine(rawId as RoboLineId, 'nextMilestone')}
  />;

  const currentMultiplier = 1 + robo.kernel.totalCoresEarned * 0.1;
  const nextMultiplier = 1 + (robo.kernel.totalCoresEarned + recompileGain) * 0.1;
  const roboOverlay = <>
    <RoboBlueprintFirmwareModal
      open={modal === 'blueprints'}
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
      nextCoreLabel={recompileGain > 0 ? undefined : `${formatNumber(Math.max(0, nextCoreThreshold - eligibleLifetime))} RG until the next Core`}
      preview={{
        gainLabel: formatInteger(recompileGain),
        currentMultiplierLabel: `×${formatNumber(currentMultiplier, 2)}`,
        nextMultiplierLabel: `×${formatNumber(nextMultiplier, 2)}`,
        resetItems: ['Ready RG and compile production', 'Assembly-line ownership and batch phases', 'Blueprints and firmware choices', 'Charge and active Overclock'],
        preservedItems: ['Warren and Mechanical Charter', 'Kernel wallet, earned Cores and perks', 'Mechanical lifetime statistics', 'Achievements and robot appearances'],
      }}
      perks={kernelPerks}
      onBuyPerk={(id) => onBuyKernelPerk(id as KernelPerkId)}
      onRecompile={() => { onRecompile(); setModal(null); }}
      onClose={() => setModal(null)}
    />
    <RoboCollectionModal open={modal === 'collection'} appearances={appearances} achievements={achievements} onEquipAppearance={(id) => onEquipAppearance(id as RoboAppearanceId)} onClose={() => setModal(null)} />
    {overlay}
  </>;

  return <GameShell
    className="world--robogoblins"
    ariaLabels={{ left: 'RoboGoblins factory controls', center: 'RoboGoblin assembly cradle', right: 'RoboGoblin assembly lines' }}
    header={<ResourceHeader
      title="RoboGoblins"
      subtitle="Unlicensed mechanical foundry"
      stats={[
        { id: 'ready-rg', label: 'Ready RG', value: formatNumber(robo.readyRG), icon: 'brood', accent: true },
        { id: 'assembly-rps', label: 'Average /s', value: formatNumber(stableRps), icon: 'cps' },
        { id: 'kernel-cores', label: 'Kernel Cores', value: formatInteger(robo.kernel.cores), icon: 'memory' },
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
