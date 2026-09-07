import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AchievementModal,
  CRTWarp,
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
  WarrenBuildingField,
  type FloatingNumberView,
  type ToastView,
} from './components';
import {
  ACHIEVEMENTS, BUILDINGS, BUILDING_BY_ID, PERMANENT_UPGRADES, UPGRADES, applyOfflineProgress, canPurchasePermanentUpgrade, canPurchaseUpgrade, claimMooncap,
  createInitialGameState, deserializeGame, exportGameSave, getBaseCps, getBuildingBulkCost, getBuildingCps, getBuildingUnitCps, getClickPower, getCps,
  getMaxAffordableBuildingCount, getPermanentRank, getPermanentUpgradeCost, getPrestigeShardGain, hatchGoblin, isUpgradeUnlocked, performPrestigeReset,
  importGameSave, purchaseBuilding, purchasePermanentUpgrade, purchaseUpgrade, sellBuilding, serializeGame, tickGame,
  type BuildingId, type GameState, type PermanentUpgradeId,
} from './game';
import { playSound } from './audio';
import {
  I18nProvider, detectPreferredLanguage, formatCompact, getLanguageMeta, isLanguageCode, localizedName, localizedPerkDescription, translate,
  type LanguageCode, type TranslationKey,
} from './i18n';
import { buildingArtAsset } from './utils/assets';
import { formatDateTime, formatDuration, formatInteger, formatNumber } from './utils/format';
import './App.css';

const SAVE_KEY = 'goblin-clicker.save.v3';
const SETTINGS_KEY = 'goblin-clicker.settings.v2';
type ModalName = 'upgrades' | 'achievements' | 'prestige' | 'settings' | null;
type BuyAmount = 1 | 10 | 100 | 'max';

type WarningCode = 'storageUnavailable' | 'unreadable' | null;
interface UiSettings { sound: boolean; effects: boolean; reducedMotion: boolean; language: LanguageCode }
type ResetEffect = 'prestige-vacuum' | null;

function loadSettings(): UiSettings {
  const fallbackLanguage = detectPreferredLanguage();
  try {
    const legacy = JSON.parse(localStorage.getItem('goblin-clicker.settings.v1') ?? '{}') as Record<string, unknown>;
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Record<string, unknown>;
    const source = { ...legacy, ...parsed };
    return {
      sound: typeof source.sound === 'boolean' ? source.sound : true,
      effects: typeof source.effects === 'boolean' ? source.effects : true,
      reducedMotion: typeof source.reducedMotion === 'boolean' ? source.reducedMotion : (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false),
      language: isLanguageCode(source.language) ? source.language : fallbackLanguage,
    };
  } catch {
    return { sound: true, effects: true, reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false, language: fallbackLanguage };
  }
}

function loadInitialState(): { state: GameState; offline: number; warning: WarningCode } {
  const now = Date.now();
  let raw: string | null;
  try { raw = localStorage.getItem(SAVE_KEY); }
  catch { return { state: createInitialGameState(now), offline: 0, warning: 'storageUnavailable' }; }
  if (!raw) return { state: createInitialGameState(now), offline: 0, warning: null };
  try {
    const loaded = deserializeGame(raw, now);
    const offline = applyOfflineProgress(loaded.state, now);
    return { state: offline.state, offline: offline.progress.goblinsProduced, warning: null };
  } catch (error) {
    console.error('Unable to load save:', error);
    return { state: createInitialGameState(now), offline: 0, warning: 'unreadable' };
  }
}

function buildingArtPath(id: BuildingId): string { return buildingArtAsset(id); }

function App() {
  const [boot] = useState(loadInitialState);
  const [game, setGame] = useState<GameState>(() => boot.state);
  const [modal, setModal] = useState<ModalName>(null);
  const [buyAmount, setBuyAmount] = useState<BuyAmount>(1);
  const [settings, setSettings] = useState<UiSettings>(loadSettings);
  const [toasts, setToasts] = useState<ToastView[]>([]);
  const [floating, setFloating] = useState<FloatingNumberView[]>([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [resetEffect, setResetEffect] = useState<ResetEffect>(null);
  const toastSequence = useRef(0);
  const floatSequence = useRef(0);
  const resetTimers = useRef<number[]>([]);
  const resetInProgress = useRef(false);
  const resetOverlayRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef(game);
  const previousAchievements = useRef(game.unlockedAchievements);
  const bootToastShown = useRef(false);

  const language = settings.language;
  const locale = getLanguageMeta(language).locale;
  const t = useCallback((key: TranslationKey, values?: Record<string, string | number>) => translate(language, key, values), [language]);
  const fmtNumber = useCallback((value: number, precision = 2) => formatNumber(value, precision, locale), [locale]);
  const fmtInteger = useCallback((value: number) => formatInteger(value, locale), [locale]);
  const fmtDuration = useCallback((value: number) => formatDuration(value, locale), [locale]);
  const fmtDate = useCallback((value: number) => formatDateTime(value, locale), [locale]);

  useEffect(() => {
    if (!resetInProgress.current) gameRef.current = game;
  }, [game]);
  const commitGame = useCallback((next: GameState) => { gameRef.current = next; setGame(next); }, []);
  useEffect(() => () => {
    resetTimers.current.forEach((timer) => window.clearTimeout(timer));
    resetTimers.current = [];
    resetInProgress.current = false;
  }, []);
  useEffect(() => {
    if (resetEffect) resetOverlayRef.current?.focus();
  }, [resetEffect]);
  const addToast = useCallback((toast: Omit<ToastView, 'id'>) => {
    const id = `toast-${Date.now()}-${toastSequence.current++}`;
    setToasts((current) => [...current.slice(-3), { ...toast, id }]);
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 4_800);
  }, []);

  useEffect(() => {
    const meta = getLanguageMeta(language);
    document.documentElement.lang = meta.locale;
    document.documentElement.dir = meta.dir;
    document.title = t('app.title');
  }, [language, t]);

  useEffect(() => {
    if (bootToastShown.current) return;
    bootToastShown.current = true;
    if (boot.offline > 0.5) addToast({ title: t('offline.title'), message: t('offline.message', { amount: fmtNumber(boot.offline) }), icon: 'cps', tone: 'success' });
    if (boot.warning) addToast({ title: t('save.notice'), message: t(boot.warning === 'storageUnavailable' ? 'save.storageUnavailable' : 'save.unreadable'), icon: 'settings' });
  }, [addToast, boot.offline, boot.warning, fmtNumber, t]);

  const achievementDescription = useCallback((achievement: (typeof ACHIEVEMENTS)[number]) => {
    if (language === 'en') return achievement.description;
    const condition = achievement.condition;
    const amount = formatCompact(language, condition.amount);
    switch (condition.type) {
      case 'lifetimeGoblins': return t('achievement.lifetime', { amount });
      case 'totalClicks': return t('achievement.clicks', { amount });
      case 'buildingOwned': return t('achievement.building', { amount, name: localizedName(language, 'building', condition.buildingId, BUILDING_BY_ID[condition.buildingId].name) });
      case 'cps': return t('achievement.cps', { amount });
      case 'goldenEventsClicked': return t('achievement.mooncaps', { amount });
      case 'prestigeResets': return t('achievement.migrations', { amount });
      case 'allBuildingsOwned': return t('achievement.allBuildings', { amount });
    }
  }, [language, t]);

  useEffect(() => {
    const old = previousAchievements.current;
    const newlyUnlocked = ACHIEVEMENTS.filter(({ id }) => game.unlockedAchievements[id] && !old[id]);
    previousAchievements.current = game.unlockedAchievements;
    if (newlyUnlocked.length > 0) {
      const newest = newlyUnlocked[newlyUnlocked.length - 1];
      const name = localizedName(language, 'achievement', newest.id, newest.name);
      playSound('achievement', settings.sound);
      addToast({ title: t('achievement.toastTitle', { name }), message: achievementDescription(newest), icon: 'trophy', tone: 'success' });
    }
  }, [achievementDescription, addToast, game.unlockedAchievements, language, settings.sound, t]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (resetInProgress.current) return;
      commitGame(tickGame(gameRef.current, Date.now()));
    }, 100);
    return () => window.clearInterval(timer);
  }, [commitGame]);

  const saveNow = useCallback((key: 'settings.saved' | 'settings.autosaved' = 'settings.saved') => {
    try {
      localStorage.setItem(SAVE_KEY, serializeGame(gameRef.current, Date.now()));
      setSaveStatus(`${t(key)} ${new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus(t('settings.saveFailed'));
    }
  }, [locale, t]);

  useEffect(() => {
    const timer = window.setInterval(() => saveNow('settings.autosaved'), 15_000);
    const onVisibility = () => { if (document.visibilityState === 'hidden') saveNow('settings.saved'); };
    const onBeforeUnload = () => saveNow('settings.saved');
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('beforeunload', onBeforeUnload); };
  }, [saveNow]);

  useEffect(() => {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
    catch { /* storage may reject writes in hardened/private modes */ }
  }, [settings]);

  const now = game.lastUpdateAt;
  const cps = getCps(game, now);
  const baseCps = getBaseCps(game);
  const clickPower = getClickPower(game, now);
  const prestigeGain = getPrestigeShardGain(game);
  const totalBuildings = BUILDINGS.reduce((sum, building) => sum + game.buildings[building.id], 0);
  const spawnActivity = totalBuildings >= 75 ? 'overrun' : totalBuildings >= 25 ? 'busy' : totalBuildings >= 5 ? 'stirring' : 'dormant';
  const availableUpgrades = UPGRADES.filter((upgrade) => !game.purchasedUpgrades[upgrade.id] && isUpgradeUnlocked(game, upgrade.id)).length;
  const unlockedAchievementCount = Object.keys(game.unlockedAchievements).length;

  const statusLine = useMemo(() => {
    if (game.prestige.resets >= 10) return t('status.ancient');
    if (game.prestige.resets > 0) return t('status.returned');
    if (cps >= 1_000_000) return t('status.million');
    if (cps >= 10_000) return t('status.tenThousand');
    if (cps >= 100) return t('status.hundred');
    if (cps >= 1) return t('status.one');
    if (game.statistics.totalClicks >= 25) return t('status.clicks');
    return t('status.start');
  }, [cps, game.prestige.resets, game.statistics.totalClicks, t]);

  const spawn = () => {
    const result = hatchGoblin(gameRef.current, Date.now()); commitGame(result.state); playSound('spawn', settings.sound);
    if (settings.effects) {
      const sequence = floatSequence.current++;
      const id = `float-${sequence}`;
      const angle = sequence * 2.399963229728653;
      const radius = 4.5 + (sequence % 4) * 1.35;
      setFloating((items) => [...items.slice(-8), {
        id,
        text: `+${fmtNumber(result.amount)}`,
        x: 50 + Math.cos(angle) * radius,
        y: 49 + Math.sin(angle) * radius * 0.72,
      }]);
      window.setTimeout(() => setFloating((items) => items.filter((item) => item.id !== id)), 1_000);
    }
  };

  const resolveBuyQuantity = (state: GameState, id: BuildingId) => buyAmount === 'max' ? getMaxAffordableBuildingCount(state, id) : buyAmount;
  const buyBuilding = (rawId: string) => {
    const id = rawId as BuildingId; const current = gameRef.current; const quantity = resolveBuyQuantity(current, id); if (quantity <= 0) return;
    const result = purchaseBuilding(current, id, quantity, Date.now()); commitGame(result.state); if (result.success) playSound('buy', settings.sound);
  };
  const sellOneBuilding = (rawId: string) => { const result = sellBuilding(gameRef.current, rawId as BuildingId, 1, Date.now()); commitGame(result.state); if (result.success) playSound('buy', settings.sound); };
  const buyUpgrade = (id: string) => {
    const result = purchaseUpgrade(gameRef.current, id as (typeof UPGRADES)[number]['id'], Date.now()); commitGame(result.state);
    if (result.success) { playSound('upgrade', settings.sound); const definition = UPGRADES.find((upgrade) => upgrade.id === id); if (definition) addToast({ title: localizedName(language, 'upgrade', id, definition.name), message: t('upgrade.purchased'), icon: 'sparkles', tone: 'success' }); }
  };
  const buyPermanent = (id: string) => { const result = purchasePermanentUpgrade(gameRef.current, id as PermanentUpgradeId, Date.now()); commitGame(result.state); if (result.success) playSound('upgrade', settings.sound); };

  const prestige = () => {
    if (prestigeGain <= 0 || resetInProgress.current) return;
    const resetAt = Date.now();
    const result = performPrestigeReset(gameRef.current, resetAt); if (!result.success) return;
    const announceReset = () => {
      playSound('prestige', settings.sound);
      addToast({ title: t('prestige.toastTitle'), message: t('prestige.toastMessage', { gain: fmtInteger(result.amount) }), icon: 'crown', tone: 'prestige' });
    };
    const finishResetImmediately = () => {
      commitGame(result.state);
      announceReset();
    };

    setModal(null);
    resetTimers.current.forEach((timer) => window.clearTimeout(timer));
    resetTimers.current = [];

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (!settings.effects || settings.reducedMotion || prefersReducedMotion) {
      finishResetImmediately();
      return;
    }

    // Make the reset authoritative immediately, while keeping the old React
    // frame visible just long enough for the vacuum transition to consume it.
    resetInProgress.current = true;
    gameRef.current = result.state;
    try { localStorage.setItem(SAVE_KEY, serializeGame(result.state, resetAt)); } catch { /* in-memory reset remains authoritative */ }
    setResetEffect('prestige-vacuum');
    resetTimers.current.push(window.setTimeout(() => {
      setGame(gameRef.current);
      announceReset();
    }, 650));
    resetTimers.current.push(window.setTimeout(() => {
      const caughtUp = tickGame(gameRef.current, Date.now());
      resetInProgress.current = false;
      commitGame(caughtUp);
      setResetEffect(null);
    }, 1_420));
  };

  const clickMooncap = () => {
    const result = claimMooncap(gameRef.current, Date.now()); commitGame(result.state); if (!result.reward) return; playSound('mooncap', settings.sound);
    const title = result.reward.type === 'goblins' ? t('mooncap.clutch') : result.reward.buff.target === 'cps' ? t('buff.moonFrenzy') : t('buff.hatchingFever');
    const message = result.reward.type === 'goblins'
      ? t('mooncap.clutchMessage', { amount: fmtNumber(result.reward.amount) })
      : result.reward.buff.target === 'cps'
        ? t('mooncap.cpsMessage', { multiplier: result.reward.buff.multiplier, duration: fmtDuration(result.reward.buff.expiresAt - result.reward.buff.startedAt) })
        : t('mooncap.clickMessage', { multiplier: result.reward.buff.multiplier, duration: fmtDuration(result.reward.buff.expiresAt - result.reward.buff.startedAt) });
    addToast({ title, message, icon: 'sparkles', tone: 'success' });
  };

  const exportSave = () => {
    const exportedAt = Date.now();
    const snapshot = tickGame(gameRef.current, exportedAt);
    commitGame(snapshot);
    try {
      const blob = new Blob([exportGameSave(snapshot, exportedAt)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `goblin-clicker-save-${new Date(exportedAt).toISOString().slice(0, 10)}.json`;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      // Some browsers do not begin reading a blob URL synchronously. Revoking it
      // on the same tick can cancel an otherwise valid download.
      window.setTimeout(() => { URL.revokeObjectURL(url); anchor.remove(); }, 1_000);
      try { localStorage.setItem(SAVE_KEY, serializeGame(snapshot, exportedAt)); } catch { /* export itself still succeeded */ }
      addToast({ title: t('settings.exportTitle'), message: t('settings.exportMessage'), icon: 'settings', tone: 'success' });
    } catch (error) {
      console.error('Export failed:', error);
      addToast({ title: t('settings.saveFailed'), message: t('settings.saveFailed'), icon: 'settings' });
    }
  };

  const importSave = async (file: File) => {
    try {
      const importedAt = Date.now();
      const imported = importGameSave(await file.text(), importedAt);
      const withOffline = applyOfflineProgress(imported.state, importedAt);
      commitGame(withOffline.state);
      previousAchievements.current = withOffline.state.unlockedAchievements;
      let persisted = true;
      try { localStorage.setItem(SAVE_KEY, serializeGame(withOffline.state, importedAt)); }
      catch (error) { persisted = false; console.error('Imported save could not be persisted:', error); }
      setSaveStatus(persisted
        ? `${t('settings.imported')} ${new Date(importedAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`
        : t('settings.saveFailed'));
      setModal(null);
      addToast({ title: t('settings.importTitle'), message: t('settings.importMessage'), icon: 'settings', tone: 'success' });
      if (!persisted) addToast({ title: t('save.notice'), message: t('save.storageUnavailable'), icon: 'settings' });
    } catch (error) {
      console.error('Import failed:', error);
      addToast({ title: t('settings.importFailedTitle'), message: error instanceof Error && language === 'en' ? error.message : t('settings.importFailedMessage'), icon: 'settings' });
    }
  };

  const hardReset = () => {
    if (!window.confirm(t('settings.resetConfirm1')) || !window.confirm(t('settings.resetConfirm2'))) return;
    const fresh = createInitialGameState(Date.now()); try { localStorage.removeItem(SAVE_KEY); } catch { /* in-memory reset still succeeds */ }
    commitGame(fresh); previousAchievements.current = {}; setModal(null); addToast({ title: t('settings.resetTitle'), message: t('settings.resetMessage'), icon: 'settings' });
  };

  const upgradeEffectLabel = useCallback((upgrade: (typeof UPGRADES)[number]) => upgrade.effects.map((effect) => {
    switch (effect.type) {
      case 'clickMultiplier': return t('upgrade.effectClick', { multiplier: effect.multiplier });
      case 'globalCpsMultiplier': return t('upgrade.effectAll', { multiplier: effect.multiplier });
      case 'buildingMultiplier': return t('upgrade.effectBuilding', { name: localizedName(language, 'building', effect.buildingId, BUILDING_BY_ID[effect.buildingId].name), multiplier: effect.multiplier });
      case 'clickCpsFraction': return t('upgrade.effectCps', { percent: Math.round(effect.fraction * 100) });
    }
  }).join(' · '), [language, t]);

  const upgradeTierLabel = useCallback((upgrade: (typeof UPGRADES)[number]) => {
    if (upgrade.requirements.some((req) => req.type === 'prestigeResets' || req.type === 'prestigeShardsEarned')) return t('upgrade.forbidden');
    if (upgrade.requirements.some((req) =>
      (req.type === 'buildingOwned' && req.amount >= 100)
      || (req.type === 'lifetimeGoblins' && req.amount >= 1_000_000_000_000)
      || (req.type === 'totalClicks' && req.amount >= 2_500)
    )) return t('upgrade.advanced');
    if (upgrade.requirements.some((req) =>
      (req.type === 'buildingOwned' && req.amount >= 50)
      || (req.type === 'lifetimeGoblins' && req.amount >= 1_000_000)
      || (req.type === 'totalClicks' && req.amount >= 250)
    )) return t('upgrade.veteran');
    return t('upgrade.common');
  }, [t]);

  const upgradesView = useMemo(() => UPGRADES.map((upgrade) => ({
    id: upgrade.id, name: localizedName(language, 'upgrade', upgrade.id, upgrade.name), description: language === 'en' ? upgrade.description : t('upgrade.genericDescription'),
    priceLabel: fmtNumber(upgrade.cost), effectLabel: upgradeEffectLabel(upgrade), purchased: Boolean(game.purchasedUpgrades[upgrade.id]), affordable: canPurchaseUpgrade(game, upgrade.id),
    locked: !isUpgradeUnlocked(game, upgrade.id), tier: upgradeTierLabel(upgrade), icon: 'sparkles' as const,
  })), [fmtNumber, game, language, t, upgradeEffectLabel, upgradeTierLabel]);

  const achievementViews = useMemo(() => ACHIEVEMENTS.map((achievement) => ({
    id: achievement.id, name: localizedName(language, 'achievement', achievement.id, achievement.name), description: achievementDescription(achievement),
    unlocked: Boolean(game.unlockedAchievements[achievement.id]), unlockedAtLabel: game.unlockedAchievements[achievement.id] ? t('achievement.unlockedAt', { date: fmtDate(game.unlockedAchievements[achievement.id]) }) : undefined,
  })), [achievementDescription, fmtDate, game.unlockedAchievements, language, t]);

  const prestigePerks = useMemo(() => PERMANENT_UPGRADES.map((perk) => {
    const rank = getPermanentRank(game, perk.id); const cost = getPermanentUpgradeCost(game, perk.id);
    return { id: perk.id, name: localizedName(language, 'perk', perk.id, perk.name), description: localizedPerkDescription(language, perk.id, perk.description), levelLabel: `${fmtInteger(rank)} / ${fmtInteger(perk.maxRank)}`, priceLabel: Number.isFinite(cost) ? fmtInteger(cost) : '—', affordable: canPurchasePermanentUpgrade(game, perk.id), maxed: rank >= perk.maxRank };
  }), [fmtInteger, game, language]);

  const activeBuffs = game.buffs.filter((buff) => buff.expiresAt > now);
  const sevenfoldActive = activeBuffs.some((buff) => buff.id === 'moon_frenzy' && buff.target === 'cps');
  const header = <ResourceHeader stats={[
    { id: 'population', label: t('header.goblins'), value: fmtNumber(game.goblins), icon: 'brood', accent: true },
    { id: 'cps', label: t('header.perSecond'), value: fmtNumber(cps), icon: 'cps' },
    { id: 'ancestry', label: t('header.ancestral'), value: fmtInteger(game.prestige.shards), icon: 'crown', title: t('header.ancestralTitle') },
  ]} onOpenAchievements={() => setModal('achievements')} onOpenPrestige={() => setModal('prestige')} onOpenSettings={() => setModal('settings')} />;

  const left = <div className="left-stack">
    <SidePanel title={t('ledger.title')} eyebrow={t('ledger.eyebrow')} action={<button className="mini-action" type="button" onClick={() => setModal('achievements')}><Icon name="trophy" size={14} /> {fmtInteger(unlockedAchievementCount)}</button>}>
      <dl className="ledger-grid">
        <div><dt>{t('ledger.thisCycle')}</dt><dd>{fmtNumber(game.runGoblins)}</dd></div><div><dt>{t('ledger.allTime')}</dt><dd>{fmtNumber(game.lifetimeGoblins)}</dd></div>
        <div><dt>{t('ledger.manual')}</dt><dd>{fmtNumber(game.statistics.manuallyBorn)}</dd></div><div><dt>{t('ledger.structures')}</dt><dd>{fmtInteger(totalBuildings)}</dd></div>
        <div><dt>{t('ledger.baseProduction')}</dt><dd>{fmtNumber(baseCps)}/s</dd></div><div><dt>{t('ledger.bestProduction')}</dt><dd>{fmtNumber(game.statistics.highestCps)}/s</dd></div>
      </dl>
      {activeBuffs.length > 0 && <div className="buff-list">{activeBuffs.map((buff) => <div className={`buff-pill${buff.id === 'moon_frenzy' ? ' buff-pill--sevenfold' : ''}`} key={buff.id}><Icon name="sparkles" size={14} /><span>{buff.id === 'moon_frenzy' ? t('buff.moonFrenzy') : t('buff.hatchingFever')}</span><strong>×{fmtInteger(buff.multiplier)}</strong><small>{fmtDuration(buff.expiresAt - now)}</small></div>)}</div>}
    </SidePanel>
    <SidePanel title={t('research.title')} eyebrow={t('research.eyebrow')} action={availableUpgrades > 0 ? <span className="notification-badge">{fmtInteger(availableUpgrades)}</span> : undefined}>
      <p className="panel-copy">{t('research.copy')}</p><button className="panel-primary-button" type="button" onClick={() => setModal('upgrades')}><Icon name="sparkles" size={16} /> {t('research.open')} <Icon name="chevron" size={14} /></button>
    </SidePanel>
    <SidePanel title={t('bloodline.title')} eyebrow={t('bloodline.eyebrow')} className="prestige-panel">
      <div className="prestige-summary"><Icon name="crown" size={24} /><div><strong>{fmtInteger(game.prestige.shards)} {t('bloodline.cunning')}</strong><span>{t('bloodline.migrations', { count: fmtInteger(game.prestige.resets) })}</span></div></div>
      <p className="panel-copy">{t('bloodline.copy')}</p><button className="panel-primary-button panel-primary-button--prestige" type="button" onClick={() => setModal('prestige')}><Icon name="crown" size={16} /> {prestigeGain > 0 ? t('bloodline.ready', { gain: fmtInteger(prestigeGain) }) : t('bloodline.view')}</button>
    </SidePanel>
  </div>;

  const center = <SpawnPit totalLabel={fmtNumber(game.goblins)} perSecondLabel={fmtNumber(cps)} clickPowerLabel={fmtNumber(clickPower)} statusLabel={statusLine} onSpawn={spawn} activityLevel={spawnActivity} className={sevenfoldActive ? 'spawn-pit--sevenfold' : ''} bonusEvent={game.mooncap.active ? { id: 'mooncap', label: t('mooncap.wild'), detail: t('mooncap.detail'), onClaim: clickMooncap } : null}>
    <WarrenBuildingField buildings={BUILDINGS.map((building) => ({
      id: building.id,
      name: localizedName(language, 'building', building.id, building.name),
      owned: game.buildings[building.id],
      artSrc: buildingArtPath(building.id),
    }))} />
    {settings.effects && <FloatingNumbers items={floating} />}
  </SpawnPit>;

  const right = <ShopPanel controls={<div className="buy-selector" role="group" aria-label={t('shop.purchaseQuantity')}>{([1, 10, 100, 'max'] as BuyAmount[]).map((amount) => <button key={amount} type="button" className={buyAmount === amount ? 'is-active' : ''} onClick={() => setBuyAmount(amount)} aria-pressed={buyAmount === amount}>{amount === 'max' ? t('shop.max') : fmtInteger(amount)}</button>)}</div>} footer={t('shop.footer')}>
    {BUILDINGS.map((building, index) => {
      const owned = game.buildings[building.id]; const previous = index === 0 ? null : BUILDINGS[index - 1];
      const locked = index > 1 && Boolean(previous && game.buildings[previous.id] === 0 && game.lifetimeGoblins < building.baseCost * 0.25);
      const maxAffordable = buyAmount === 'max' ? getMaxAffordableBuildingCount(game, building.id) : buyAmount; const quantity = buyAmount === 'max' ? Math.max(1, maxAffordable) : buyAmount;
      const cost = getBuildingBulkCost(game, building.id, quantity);
      const unitProduction = getBuildingUnitCps(game, building.id, now);
      const totalProduction = getBuildingCps(game, building.id, now);
      const productionShare = cps > 0 ? (totalProduction / cps) * 100 : 0;
      const name = localizedName(language, 'building', building.id, building.name);
      return <ShopCard key={building.id} id={building.id} name={locked ? t('shop.lockedName') : name} description={locked ? t('shop.lockedDescription') : language === 'en' ? building.description : t('content.buildingDescription')} ownedLabel={fmtInteger(owned)} priceLabel={locked ? '—' : fmtNumber(cost)} productionLabel={locked ? '—' : fmtNumber(unitProduction)} productionDetails={locked ? undefined : {
        perUnit: `${fmtNumber(unitProduction)}/s`,
        ownedTotal: `${fmtNumber(totalProduction)}/s`,
        shareOfTotal: `${fmtNumber(productionShare)}%`,
        lifetimeProduced: fmtNumber(game.statistics.lifetimeProducedByBuilding[building.id]),
        labels: {
          heading: t('shop.telemetryHeading'),
          perUnit: t('shop.telemetryEach'),
          ownedTotal: t('shop.telemetryOwned'),
          shareOfTotal: t('shop.telemetryShare'),
          lifetimeProduced: t('shop.telemetryLifetime'),
        },
      }} canAfford={!locked && maxAffordable > 0 && game.goblins >= cost} onBuy={buyBuilding} onSell={owned > 0 ? sellOneBuilding : undefined} locked={locked} artSrc={locked ? undefined : buildingArtPath(building.id)} buyAmountLabel={buyAmount === 'max' ? (maxAffordable > 0 ? t('shop.buy', { count: fmtInteger(maxAffordable) }) : t('shop.buyMax')) : t('shop.buy', { count: fmtInteger(quantity) })} badge={owned >= 100 ? t('shop.badgeHorde') : owned >= 50 ? t('shop.badgeVeteran') : owned >= 10 ? t('shop.badgeEstablished') : undefined} />;
    })}
  </ShopPanel>;

  const overlay = <>
    <UpgradeModal open={modal === 'upgrades'} upgrades={upgradesView} onPurchase={buyUpgrade} onClose={() => setModal(null)} currencyLabel={t('upgrade.available', { amount: fmtNumber(game.goblins) })} />
    <AchievementModal open={modal === 'achievements'} achievements={achievementViews} onClose={() => setModal(null)} />
    <PrestigeModal open={modal === 'prestige'} currentCurrencyLabel={fmtInteger(game.prestige.shards)} gainLabel={fmtInteger(prestigeGain)} requirementLabel={prestigeGain > 0 ? t('prestige.requirementReady') : t('prestige.requirementLocked')} canPrestige={prestigeGain > 0} perks={prestigePerks} onPrestige={prestige} onBuyPerk={buyPermanent} onClose={() => setModal(null)} />
    <SettingsModal open={modal === 'settings'} language={language} onLanguageChange={(next) => setSettings((current) => ({ ...current, language: next }))} toggles={[
      { id: 'sound', label: t('settings.sound'), description: t('settings.soundDescription'), checked: settings.sound },
      { id: 'effects', label: t('settings.effects'), description: t('settings.effectsDescription'), checked: settings.effects },
      { id: 'reducedMotion', label: t('settings.reducedMotion'), description: t('settings.reducedMotionDescription'), checked: settings.reducedMotion },
    ]} onToggle={(id, checked) => setSettings((current) => ({ ...current, [id]: checked }))} onExportSave={exportSave} onImportSave={importSave} onHardReset={hardReset} onClose={() => setModal(null)} saveStatus={saveStatus || t('settings.autosaveReady')} versionLabel="v1.2.0" />
    {resetEffect === 'prestige-vacuum' && <div ref={resetOverlayRef} className="prestige-vacuum-fx" role="status" aria-label={t('prestige.confirmAccept')} tabIndex={-1} onKeyDown={(event) => { event.preventDefault(); event.stopPropagation(); }}><span className="prestige-vacuum-fx__ring prestige-vacuum-fx__ring--outer" aria-hidden="true" /><span className="prestige-vacuum-fx__ring prestige-vacuum-fx__ring--inner" aria-hidden="true" /><span className="prestige-vacuum-fx__core" aria-hidden="true"><Icon name="crown" size={30} /></span></div>}
    <ToastStack toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
  </>;

  return <I18nProvider language={language}>
    <div className={`${settings.reducedMotion ? 'reduce-motion ' : ''}${settings.effects ? '' : 'effects-off'}`.trim()}>
      <GameShell
        className={`${resetEffect === 'prestige-vacuum' ? 'game-frame--prestige-reset ' : ''}${sevenfoldActive ? 'game-frame--sevenfold' : ''}`.trim()}
        header={header}
        left={left}
        center={center}
        right={right}
        background={<CRTWarp
          color="#82b84c"
          backgroundColor="#060906"
          speed={0.18}
          curvature={0.34}
          scanlineStrength={0.42}
          waveAmplitude={0.2}
          waveFrequency={1.8}
          bloom={0.8}
          noise={0.045}
          vignette={0.8}
          brightness={0.68}
          pixelation={4}
          rgbShift={0.004}
          mouseReact={false}
          dpr={1}
          fps={settings.reducedMotion || !settings.effects ? 1 : 24}
          paused={settings.reducedMotion || !settings.effects}
        />}
        overlay={overlay}
      />
    </div>
  </I18nProvider>;
}

export default App;
