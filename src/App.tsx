import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AchievementModal,
  FloatingNumbers,
  GameShell,
  Icon,
  PrestigeModal,
  ResourceHeader,
  SettingsModal,
  ShopCard,
  ShopPanel,
  SidePanel,
  SpawnPit,
  ToastStack,
  UpgradeModal,
  type FloatingNumberView,
  type ToastView,
} from './components';
import {
  ACHIEVEMENTS,
  BUILDINGS,
  BUILDING_BY_ID,
  PERMANENT_UPGRADES,
  UPGRADES,
  applyOfflineProgress,
  canPurchasePermanentUpgrade,
  canPurchaseUpgrade,
  claimMooncap,
  createInitialGameState,
  deserializeGame,
  getBaseCps,
  getBuildingBulkCost,
  getBuildingProductionMultiplier,
  getClickPower,
  getCps,
  getGlobalCpsMultiplier,
  getMaxAffordableBuildingCount,
  getPermanentRank,
  getPermanentUpgradeCost,
  getPrestigeShardGain,
  hatchGoblin,
  isUpgradeUnlocked,
  performPrestigeReset,
  purchaseBuilding,
  purchasePermanentUpgrade,
  purchaseUpgrade,
  sellBuilding,
  serializeGame,
  tickGame,
  type BuildingId,
  type GameState,
  type PermanentUpgradeId,
} from './game';
import { playSound } from './audio';
import { formatDateTime, formatDuration, formatInteger, formatNumber } from './utils/format';
import './App.css';

const SAVE_KEY = 'goblin-clicker.save.v3';
const SETTINGS_KEY = 'goblin-clicker.settings.v1';

type ModalName = 'upgrades' | 'achievements' | 'prestige' | 'settings' | null;
type BuyAmount = 1 | 10 | 100 | 'max';

interface UiSettings {
  sound: boolean;
  effects: boolean;
  reducedMotion: boolean;
}

const DEFAULT_SETTINGS: UiSettings = { sound: true, effects: true, reducedMotion: false };

function loadSettings(): UiSettings {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<UiSettings>;
    return {
      sound: parsed.sound ?? DEFAULT_SETTINGS.sound,
      effects: parsed.effects ?? DEFAULT_SETTINGS.effects,
      reducedMotion: parsed.reducedMotion ?? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function loadInitialState() {
  const now = Date.now();
  let raw: string | null;
  try {
    raw = localStorage.getItem(SAVE_KEY);
  } catch {
    return {
      state: createInitialGameState(now),
      offline: 0,
      warning: 'Browser storage is unavailable. This session can be played, but automatic persistence may not work.',
    };
  }
  if (!raw) return { state: createInitialGameState(now), offline: 0, warning: '' };
  try {
    const loaded = deserializeGame(raw, now);
    const offline = applyOfflineProgress(loaded.state, now);
    return {
      state: offline.state,
      offline: offline.progress.goblinsProduced,
      warning: loaded.warnings.join(' '),
    };
  } catch (error) {
    console.error('Unable to load save:', error);
    return { state: createInitialGameState(now), offline: 0, warning: 'Your previous save could not be read, so a fresh warren was started.' };
  }
}

function getStatusLine(state: GameState, cps: number): string {
  if (state.prestige.resets >= 10) return 'The bloodline remembers every tunnel.';
  if (state.prestige.resets > 0) return 'An old instinct guides the new brood.';
  if (cps >= 1_000_000) return 'The mountain trembles beneath tiny feet.';
  if (cps >= 10_000) return 'Every tunnel is full. Dig faster.';
  if (cps >= 100) return 'The warren has become a proper industry.';
  if (cps >= 1) return 'The brood no longer needs constant supervision.';
  if (state.statistics.totalClicks >= 25) return 'Something in the dark has learned the rhythm.';
  return 'The brood stirs below…';
}

function getUpgradeEffectLabel(upgrade: (typeof UPGRADES)[number]): string {
  return upgrade.effects.map((effect) => {
    switch (effect.type) {
      case 'clickMultiplier': return `Manual spawning ×${effect.multiplier}`;
      case 'globalCpsMultiplier': return `All production ×${effect.multiplier}`;
      case 'buildingMultiplier': return `${BUILDING_BY_ID[effect.buildingId].name} ×${effect.multiplier}`;
      case 'clickCpsFraction': return `Clicks gain +${Math.round(effect.fraction * 100)}% of base CPS`;
    }
  }).join(' · ');
}

function buildingArtPath(id: BuildingId): string {
  return `/assets/building-${id.replace(/_/g, '-')}.svg`;
}

function App() {
  const [boot] = useState(loadInitialState);
  const [game, setGame] = useState<GameState>(() => boot.state);
  const [modal, setModal] = useState<ModalName>(null);
  const [buyAmount, setBuyAmount] = useState<BuyAmount>(1);
  const [settings, setSettings] = useState<UiSettings>(loadSettings);
  const [toasts, setToasts] = useState<ToastView[]>([]);
  const [floating, setFloating] = useState<FloatingNumberView[]>([]);
  const [saveStatus, setSaveStatus] = useState('Autosave ready');
  const toastSequence = useRef(0);
  const floatSequence = useRef(0);
  const gameRef = useRef(game);
  const previousAchievements = useRef(game.unlockedAchievements);

  useEffect(() => { gameRef.current = game; }, [game]);

  const commitGame = useCallback((next: GameState) => {
    gameRef.current = next;
    setGame(next);
  }, []);

  const addToast = useCallback((toast: Omit<ToastView, 'id'>) => {
    const id = `toast-${Date.now()}-${toastSequence.current++}`;
    setToasts((current) => [...current.slice(-3), { ...toast, id }]);
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 4_800);
  }, []);

  useEffect(() => {
    if (boot.offline > 0.5) {
      addToast({
        title: 'The warren worked while you were away',
        message: `+${formatNumber(boot.offline)} goblins from offline production.`,
        icon: 'cps',
        tone: 'success',
      });
    }
    if (boot.warning) {
      addToast({ title: 'Save notice', message: boot.warning, icon: 'settings' });
    }
  }, [addToast, boot.offline, boot.warning]);

  useEffect(() => {
    const old = previousAchievements.current;
    const newlyUnlocked = ACHIEVEMENTS.filter(({ id }) => game.unlockedAchievements[id] && !old[id]);
    previousAchievements.current = game.unlockedAchievements;
    if (newlyUnlocked.length > 0) {
      const newest = newlyUnlocked[newlyUnlocked.length - 1];
      playSound('achievement', settings.sound);
      addToast({ title: `Deed unlocked: ${newest.name}`, message: newest.description, icon: 'trophy', tone: 'success' });
    }
  }, [game.unlockedAchievements, settings.sound, addToast]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      commitGame(tickGame(gameRef.current, Date.now()));
    }, 100);
    return () => window.clearInterval(timer);
  }, [commitGame]);

  const saveNow = useCallback((label = 'Saved') => {
    try {
      localStorage.setItem(SAVE_KEY, serializeGame(gameRef.current, Date.now()));
      setSaveStatus(`${label} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('Save failed');
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => saveNow('Autosaved'), 15_000);
    const onVisibility = () => { if (document.visibilityState === 'hidden') saveNow('Saved'); };
    const onBeforeUnload = () => saveNow('Saved');
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [saveNow]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Some hardened/private browser modes expose localStorage but reject writes.
    }
  }, [settings]);

  const now = game.lastUpdateAt;
  const cps = getCps(game, now);
  const baseCps = getBaseCps(game);
  const clickPower = getClickPower(game, now);
  const prestigeGain = getPrestigeShardGain(game);
  const totalBuildings = BUILDINGS.reduce((sum, building) => sum + game.buildings[building.id], 0);
  const availableUpgrades = UPGRADES.filter((upgrade) => !game.purchasedUpgrades[upgrade.id] && isUpgradeUnlocked(game, upgrade.id)).length;
  const unlockedAchievementCount = Object.keys(game.unlockedAchievements).length;

  const spawn = () => {
    const result = hatchGoblin(gameRef.current, Date.now());
    commitGame(result.state);
    playSound('spawn', settings.sound);
    if (settings.effects) {
      const id = `float-${floatSequence.current++}`;
      setFloating((items) => [...items.slice(-8), {
        id,
        text: `+${formatNumber(result.amount)}`,
        x: 44 + Math.random() * 12,
        y: 42 + Math.random() * 11,
      }]);
      window.setTimeout(() => setFloating((items) => items.filter((item) => item.id !== id)), 850);
    }
  };

  const resolveBuyQuantity = (state: GameState, buildingId: BuildingId): number => {
    if (buyAmount === 'max') return getMaxAffordableBuildingCount(state, buildingId);
    return buyAmount;
  };

  const buyBuilding = (rawId: string) => {
    const id = rawId as BuildingId;
    const current = gameRef.current;
    const quantity = resolveBuyQuantity(current, id);
    if (quantity <= 0) return;
    const result = purchaseBuilding(current, id, quantity, Date.now());
    commitGame(result.state);
    if (result.success) playSound('buy', settings.sound);
  };

  const sellOneBuilding = (rawId: string) => {
    const result = sellBuilding(gameRef.current, rawId as BuildingId, 1, Date.now());
    commitGame(result.state);
    if (result.success) playSound('buy', settings.sound);
  };

  const buyUpgrade = (id: string) => {
    const result = purchaseUpgrade(gameRef.current, id as (typeof UPGRADES)[number]['id'], Date.now());
    commitGame(result.state);
    if (result.success) {
      playSound('upgrade', settings.sound);
      const definition = UPGRADES.find((upgrade) => upgrade.id === id);
      if (definition) addToast({ title: definition.name, message: 'Warren innovation purchased.', icon: 'sparkles', tone: 'success' });
    }
  };

  const buyPermanent = (id: string) => {
    const result = purchasePermanentUpgrade(gameRef.current, id as PermanentUpgradeId, Date.now());
    commitGame(result.state);
    if (result.success) playSound('upgrade', settings.sound);
  };

  const prestige = () => {
    if (prestigeGain <= 0) return;
    if (!window.confirm(`Begin a new warren for ${formatInteger(prestigeGain)} Ancestral Cunning? Current goblins, buildings and cycle upgrades will reset.`)) return;
    const result = performPrestigeReset(gameRef.current, gameRef.current.lastUpdateAt);
    if (!result.success) return;
    commitGame(result.state);
    playSound('prestige', settings.sound);
    addToast({ title: 'A new warren begins', message: `+${formatInteger(result.amount)} Ancestral Cunning carried in the bloodline.`, icon: 'crown', tone: 'prestige' });
  };

  const clickMooncap = () => {
    const result = claimMooncap(gameRef.current, Date.now());
    commitGame(result.state);
    if (!result.reward) return;
    playSound('mooncap', settings.sound);
    const message = result.reward.type === 'goblins'
      ? `The cap bursts into +${formatNumber(result.reward.amount)} goblins.`
      : result.reward.buff.target === 'cps'
        ? `Production ×${result.reward.buff.multiplier} for ${formatDuration(result.reward.buff.expiresAt - result.reward.buff.startedAt)}.`
        : `Manual spawning ×${result.reward.buff.multiplier} for ${formatDuration(result.reward.buff.expiresAt - result.reward.buff.startedAt)}.`;
    addToast({ title: result.reward.label, message, icon: 'sparkles', tone: 'success' });
  };

  const exportSave = () => {
    const serialized = serializeGame(gameRef.current, Date.now());
    const blob = new Blob([serialized], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `goblin-clicker-save-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    addToast({ title: 'Save exported', message: 'Keep the file somewhere safe from rival warrens.', icon: 'settings', tone: 'success' });
  };

  const importSave = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.txt,application/json,text/plain';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const imported = deserializeGame(await file.text(), Date.now());
        const withOffline = applyOfflineProgress(imported.state, Date.now());
        commitGame(withOffline.state);
        previousAchievements.current = withOffline.state.unlockedAchievements;
        localStorage.setItem(SAVE_KEY, serializeGame(withOffline.state, Date.now()));
        setSaveStatus(`Imported ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
        addToast({ title: 'Warren restored', message: 'Imported save data is now active.', icon: 'settings', tone: 'success' });
      } catch (error) {
        addToast({ title: 'Import failed', message: error instanceof Error ? error.message : 'The selected file was not a valid save.', icon: 'settings' });
      }
    };
    input.click();
  };

  const hardReset = () => {
    if (!window.confirm('Erase ALL progress, achievements, ancestral perks, and statistics? This cannot be undone.')) return;
    if (!window.confirm('Final warning: this permanently destroys the local warren save. Continue?')) return;
    const fresh = createInitialGameState(Date.now());
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // The in-memory reset still succeeds when persistent storage is unavailable.
    }
    commitGame(fresh);
    previousAchievements.current = {};
    setModal(null);
    addToast({ title: 'Warren erased', message: 'The caves are quiet again.', icon: 'settings' });
  };

  const upgradesView = useMemo(() => UPGRADES.map((upgrade) => ({
    id: upgrade.id,
    name: upgrade.name,
    description: upgrade.description,
    priceLabel: formatNumber(upgrade.cost),
    effectLabel: getUpgradeEffectLabel(upgrade),
    purchased: Boolean(game.purchasedUpgrades[upgrade.id]),
    affordable: canPurchaseUpgrade(game, upgrade.id),
    locked: !isUpgradeUnlocked(game, upgrade.id),
    tier: upgrade.requirements.some((req) => req.type === 'buildingOwned' && req.amount >= 50) ? 'Veteran' : 'Common',
    icon: 'sparkles' as const,
  })), [game]);

  const achievementViews = useMemo(() => ACHIEVEMENTS.map((achievement) => ({
    id: achievement.id,
    name: achievement.name,
    description: achievement.description,
    unlocked: Boolean(game.unlockedAchievements[achievement.id]),
    unlockedAtLabel: game.unlockedAchievements[achievement.id]
      ? `Unlocked ${formatDateTime(game.unlockedAchievements[achievement.id])}`
      : undefined,
  })), [game.unlockedAchievements]);

  const prestigePerks = useMemo(() => PERMANENT_UPGRADES.map((perk) => {
    const rank = getPermanentRank(game, perk.id);
    const cost = getPermanentUpgradeCost(game, perk.id);
    return {
      id: perk.id,
      name: perk.name,
      description: perk.description,
      levelLabel: `${rank} / ${perk.maxRank}`,
      priceLabel: Number.isFinite(cost) ? formatInteger(cost) : '—',
      affordable: canPurchasePermanentUpgrade(game, perk.id),
      maxed: rank >= perk.maxRank,
    };
  }), [game]);

  const activeBuffs = game.buffs.filter((buff) => buff.expiresAt > now);

  const header = (
    <ResourceHeader
      stats={[
        { id: 'population', label: 'Goblins', value: formatNumber(game.goblins), icon: 'brood', accent: true },
        { id: 'cps', label: 'Per second', value: formatNumber(cps), icon: 'cps' },
        { id: 'ancestry', label: 'Ancestral', value: formatInteger(game.prestige.shards), icon: 'crown', title: 'Permanent Ancestral Cunning' },
      ]}
      onOpenAchievements={() => setModal('achievements')}
      onOpenPrestige={() => setModal('prestige')}
      onOpenSettings={() => setModal('settings')}
    />
  );

  const left = (
    <div className="left-stack">
      <SidePanel
        title="Warren Ledger"
        eyebrow="Live census"
        action={<button className="mini-action" type="button" onClick={() => setModal('achievements')}><Icon name="trophy" size={14} /> {unlockedAchievementCount}</button>}
      >
        <dl className="ledger-grid">
          <div><dt>This cycle</dt><dd>{formatNumber(game.runGoblins)}</dd></div>
          <div><dt>All-time brood</dt><dd>{formatNumber(game.lifetimeGoblins)}</dd></div>
          <div><dt>Manual spawns</dt><dd>{formatInteger(game.statistics.totalClicks)}</dd></div>
          <div><dt>Structures</dt><dd>{formatInteger(totalBuildings)}</dd></div>
          <div><dt>Base production</dt><dd>{formatNumber(baseCps)}/s</dd></div>
          <div><dt>Best production</dt><dd>{formatNumber(game.statistics.highestCps)}/s</dd></div>
        </dl>
        {activeBuffs.length > 0 && (
          <div className="buff-list">
            {activeBuffs.map((buff) => (
              <div className="buff-pill" key={buff.id}>
                <Icon name="sparkles" size={14} />
                <span>{buff.id === 'moon_frenzy' ? 'Moon Frenzy' : 'Hatching Fever'}</span>
                <strong>×{buff.multiplier}</strong>
                <small>{Math.max(1, Math.ceil((buff.expiresAt - now) / 1000))}s</small>
              </div>
            ))}
          </div>
        )}
      </SidePanel>

      <SidePanel
        title="Warren Innovations"
        eyebrow="Research"
        action={availableUpgrades > 0 ? <span className="notification-badge">{availableUpgrades}</span> : undefined}
      >
        <p className="panel-copy">Turn mushrooms, stolen tools, and questionable rituals into permanent gains for this brood cycle.</p>
        <button className="panel-primary-button" type="button" onClick={() => setModal('upgrades')}>
          <Icon name="sparkles" size={16} /> Open research <Icon name="chevron" size={14} />
        </button>
      </SidePanel>

      <SidePanel title="The Bloodline" eyebrow="Great Migration" className="prestige-panel">
        <div className="prestige-summary">
          <Icon name="crown" size={24} />
          <div><strong>{formatInteger(game.prestige.shards)} Cunning</strong><span>{game.prestige.resets} migrations completed</span></div>
        </div>
        <p className="panel-copy">Abandon a mature warren to preserve Ancestral Cunning and invest it in permanent bloodline perks.</p>
        <button className="panel-primary-button panel-primary-button--prestige" type="button" onClick={() => setModal('prestige')}>
          <Icon name="crown" size={16} /> {prestigeGain > 0 ? `Migration ready · +${formatInteger(prestigeGain)}` : 'View bloodline'}
        </button>
      </SidePanel>
    </div>
  );

  const center = (
    <SpawnPit
      totalLabel={formatNumber(game.goblins)}
      perSecondLabel={formatNumber(cps)}
      clickPowerLabel={formatNumber(clickPower)}
      statusLabel={getStatusLine(game, cps)}
      onSpawn={spawn}
      bonusEvent={game.mooncap.active ? {
        id: 'mooncap',
        label: 'Wild Mooncap',
        detail: 'Catch it before it sinks back into the moss',
        onClaim: clickMooncap,
      } : null}
    >
      {settings.effects && <FloatingNumbers items={floating} />}
    </SpawnPit>
  );

  const right = (
    <ShopPanel
      controls={
        <div className="buy-selector" role="group" aria-label="Purchase quantity">
          {([1, 10, 100, 'max'] as BuyAmount[]).map((amount) => (
            <button
              key={amount}
              type="button"
              className={buyAmount === amount ? 'is-active' : ''}
              onClick={() => setBuyAmount(amount)}
              aria-pressed={buyAmount === amount}
            >
              {amount === 'max' ? 'Max' : amount}
            </button>
          ))}
        </div>
      }
      footer="Prices rise 15% for each structure owned. Sell returns a portion of its value."
    >
      {BUILDINGS.map((building, index) => {
        const owned = game.buildings[building.id];
        const previous = index === 0 ? null : BUILDINGS[index - 1];
        const locked = index > 1 && Boolean(previous && game.buildings[previous.id] === 0 && game.lifetimeGoblins < building.baseCost * 0.25);
        const quantity = buyAmount === 'max' ? Math.max(1, getMaxAffordableBuildingCount(game, building.id)) : buyAmount;
        const cost = getBuildingBulkCost(game, building.id, quantity);
        const maxAffordable = buyAmount === 'max' ? getMaxAffordableBuildingCount(game, building.id) : quantity;
        const unitProduction = building.baseCps * getBuildingProductionMultiplier(game, building.id) * getGlobalCpsMultiplier(game);
        return (
          <ShopCard
            key={building.id}
            id={building.id}
            name={locked ? 'Uncharted Warren' : building.name}
            description={locked ? 'Expand the previous tier to discover what lies deeper.' : building.description}
            ownedLabel={formatInteger(owned)}
            priceLabel={locked ? '—' : formatNumber(cost)}
            productionLabel={locked ? '—' : formatNumber(unitProduction)}
            canAfford={!locked && maxAffordable > 0 && game.goblins >= cost}
            onBuy={buyBuilding}
            onSell={owned > 0 ? sellOneBuilding : undefined}
            locked={locked}
            artSrc={locked ? undefined : buildingArtPath(building.id)}
            buyAmountLabel={buyAmount === 'max' ? `Buy ${formatInteger(maxAffordable)}` : `Buy ${quantity}`}
            badge={owned >= 100 ? 'Horde' : owned >= 50 ? 'Veteran' : owned >= 10 ? 'Established' : undefined}
          />
        );
      })}
    </ShopPanel>
  );

  const overlay = (
    <>
      <UpgradeModal open={modal === 'upgrades'} upgrades={upgradesView} onPurchase={buyUpgrade} onClose={() => setModal(null)} currencyLabel={`${formatNumber(game.goblins)} goblins available`} />
      <AchievementModal open={modal === 'achievements'} achievements={achievementViews} onClose={() => setModal(null)} />
      <PrestigeModal
        open={modal === 'prestige'}
        currentCurrencyLabel={formatInteger(game.prestige.shards)}
        gainLabel={formatInteger(prestigeGain)}
        requirementLabel={prestigeGain > 0 ? 'Ancestral Cunning waiting in this cycle' : 'Grow the all-time brood to reveal new Cunning'}
        canPrestige={prestigeGain > 0}
        perks={prestigePerks}
        onPrestige={prestige}
        onBuyPerk={buyPermanent}
        onClose={() => setModal(null)}
      />
      <SettingsModal
        open={modal === 'settings'}
        toggles={[
          { id: 'sound', label: 'Warren sounds', description: 'Procedural click, purchase, achievement, and event sounds.', checked: settings.sound },
          { id: 'effects', label: 'Spawn effects', description: 'Floating numbers and extra visual feedback while clicking.', checked: settings.effects },
          { id: 'reducedMotion', label: 'Reduced motion', description: 'Disable decorative rotation, hovering, and pulsing animations.', checked: settings.reducedMotion },
        ]}
        onToggle={(id, checked) => setSettings((current) => ({ ...current, [id]: checked }))}
        onExportSave={exportSave}
        onImportSave={importSave}
        onHardReset={hardReset}
        onClose={() => setModal(null)}
        saveStatus={saveStatus}
        versionLabel="v1.0.0"
      />
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
    </>
  );

  return (
    <div className={`${settings.reducedMotion ? 'reduce-motion ' : ''}${settings.effects ? '' : 'effects-off'}`.trim()}>
      <GameShell header={header} left={left} center={center} right={right} overlay={overlay} />
    </div>
  );
}

export default App;
