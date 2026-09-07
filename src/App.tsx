import { ExpeditionEntry, ExpeditionMap } from './components/ExpeditionMap';
import { startExpedition, cancelExpedition, claimExpedition, creditGoblins, getClaimableExpeditionReward, getExpeditionReservation } from './game';
import { EXPEDITION_COPY } from './i18n/expeditions';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AchievementModal,
  ContractModal,
  CRTWarp,
  FloatingNumbers,
  GameShell,
  Icon,
  MoonDial,
  MoonDialModal,
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
  type IconName,
  type ToastView,
} from './components';
import {
  ACHIEVEMENTS, BUILDINGS, BUILDING_BY_ID, CONTRACT_KINDS, MAX_LUNAR_CHARGE, PERMANENT_UPGRADES, UPGRADES, applyOfflineProgress, canPurchasePermanentUpgrade, canPurchaseUpgrade, claimContract, claimMooncap,
  createInitialGameState, deserializeGame, exportGameSave, getBaseCps, getBuildingBulkCost, getBuildingCps, getBuildingUnitCps, getClickPower, getCps,
  getContractProgress, getContractRewardAmount, getExpansionMasteryLevel, getExpansionMasteryProductionMultiplier, getMaxAffordableBuildingCount, getNextExpansionMasteryLevel, getReachedExpansionMasteryLevels,
  getPermanentRank, getPermanentUpgradeCost, getPrestigeShardGain, getUpgradeChoiceBlocker, hatchGoblin, isUpgradeBlockedByChoice, isUpgradeUnlocked, performPrestigeReset,
  importGameSave, isContractComplete, purchaseBuilding, purchasePermanentUpgrade, purchaseUpgrade, sellBuilding, serializeGame, spendLunarCharge, tickGame,
  type BuildingId, type ContractKind, type GameState, type MooncapFamily, type PermanentUpgradeId, type UpgradeExclusiveGroup,
} from './game';
import { playSound } from './audio';
import { BackgroundMusicPlayer } from './music';
import {
  I18nProvider, detectPreferredLanguage, formatCompact, getLanguageMeta, isLanguageCode, localizedName, localizedPerkDescription, translate,
  type LanguageCode, type TranslationKey,
} from './i18n';
import { buildingArtAsset, gameArt } from './utils/assets';
import { formatDateTime, formatDuration, formatInteger, formatNumber } from './utils/format';
import './App.css';

const SAVE_KEY = 'goblin-clicker.save';
const LEGACY_SAVE_KEYS = ['goblin-clicker.save.v3', 'goblin-clicker.save.v2', 'goblin-clicker.save.v1'] as const;
const SETTINGS_KEY = 'goblin-clicker.settings.v2';
type ModalName = 'upgrades' | 'achievements' | 'prestige' | 'settings' | 'contracts' | 'moonDial' | 'expeditions' | null;
type BuyAmount = 1 | 10 | 100 | 'max';

type WarningCode = 'storageUnavailable' | 'unreadable' | null;
interface UiSettings { sound: boolean; effects: boolean; reducedMotion: boolean; musicVolume: number; musicMuted: boolean; language: LanguageCode }
type ResetEffect = 'prestige-vacuum' | null;

const PERK_ICONS: Record<PermanentUpgradeId, IconName> = {
  ancestral_fertility: 'bloodline',
  stronger_spawn: 'muscle',
  scavenger_memory: 'memory',
  lucky_totem: 'totem',
  deep_warrens: 'burrow',
  starter_clutch: 'clutch',
  founders_legacy: 'hammer',
  ancestral_momentum: 'bloodline',
  tireless_lineage: 'hourglass',
  moonlit_blood: 'totem',
  heirloom_matrons: 'clutch',
};

function loadSettings(): UiSettings {
  const fallbackLanguage = detectPreferredLanguage();
  try {
    const legacy = JSON.parse(localStorage.getItem('goblin-clicker.settings.v1') ?? '{}') as Record<string, unknown>;
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Record<string, unknown>;
    const source = { ...legacy, ...parsed };
    const musicVolume = typeof source.musicVolume === 'number' ? Math.max(0, Math.min(1, source.musicVolume)) : 0.32;
    return {
      sound: typeof source.sound === 'boolean' ? source.sound : true,
      effects: typeof source.effects === 'boolean' ? source.effects : true,
      reducedMotion: typeof source.reducedMotion === 'boolean' ? source.reducedMotion : (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false),
      musicVolume,
      musicMuted: typeof source.musicMuted === 'boolean' ? source.musicMuted : musicVolume === 0,
      language: isLanguageCode(source.language) ? source.language : fallbackLanguage,
    };
  } catch {
    return { sound: true, effects: true, reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false, musicVolume: 0.32, musicMuted: false, language: fallbackLanguage };
  }
}

function loadInitialState(): { state: GameState; offline: number; warning: WarningCode } {
  const now = Date.now();
  let raw: string | null;
  try {
    raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      for (const legacyKey of LEGACY_SAVE_KEYS) {
        raw = localStorage.getItem(legacyKey);
        if (raw) break;
      }
    }
  }
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
  const [contractRewardNotice, setContractRewardNotice] = useState<string | null>(null);
  const [contractRewardFxKey, setContractRewardFxKey] = useState(0);
  const [resetEffect, setResetEffect] = useState<ResetEffect>(null);
  const toastSequence = useRef(0);
  const floatSequence = useRef(0);
  const resetTimers = useRef<number[]>([]);
  const resetInProgress = useRef(false);
  const resetOverlayRef = useRef<HTMLDivElement>(null);
  const contractNoticeTimer = useRef<number | null>(null);
  const gameRef = useRef(game);
  const previousAchievements = useRef(game.unlockedAchievements);
  const bootToastShown = useRef(false);
  const musicPlayerRef = useRef<BackgroundMusicPlayer | null>(null);

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
    if (contractNoticeTimer.current !== null) window.clearTimeout(contractNoticeTimer.current);
  }, []);
  useEffect(() => {
    if (resetEffect) resetOverlayRef.current?.focus();
  }, [resetEffect]);
  useEffect(() => {
    const player = new BackgroundMusicPlayer();
    musicPlayerRef.current = player;
    player.mount();
    return () => {
      player.destroy();
      musicPlayerRef.current = null;
    };
  }, []);
  useEffect(() => {
    musicPlayerRef.current?.setVolume(settings.musicVolume);
    musicPlayerRef.current?.setMuted(settings.musicMuted || settings.musicVolume <= 0);
  }, [settings.musicMuted, settings.musicVolume]);
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

  const toggleMusic = useCallback(() => {
    setSettings((current) => current.musicVolume <= 0
      ? { ...current, musicVolume: 0.32, musicMuted: false }
      : { ...current, musicMuted: !current.musicMuted });
  }, []);
  const changeMusicVolume = useCallback((volume: number) => {
    const next = Math.max(0, Math.min(1, Number.isFinite(volume) ? volume : 0));
    setSettings((current) => ({ ...current, musicVolume: next, musicMuted: next === 0 }));
  }, []);

  const now = game.lastUpdateAt;
  const cps = getCps(game, now);
  const baseCps = getBaseCps(game);
  const clickPower = getClickPower(game, now);
  const claimableExpeditionReward = getClaimableExpeditionReward(game);
  const prestigeGain = getPrestigeShardGain(claimableExpeditionReward > 0 ? creditGoblins(game, claimableExpeditionReward) : game);
  const totalBuildings = BUILDINGS.reduce((sum, building) => sum + game.buildings[building.id], 0);
  const spawnActivity = totalBuildings >= 75 ? 'overrun' : totalBuildings >= 25 ? 'busy' : totalBuildings >= 5 ? 'stirring' : 'dormant';
  const availableUpgrades = UPGRADES.filter((upgrade) => !game.purchasedUpgrades[upgrade.id] && !isUpgradeBlockedByChoice(game, upgrade.id) && isUpgradeUnlocked(game, upgrade.id)).length;
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
    const title = result.reward.type === 'goblins'
      ? t('mooncap.clutchcap')
      : result.reward.type === 'oracle'
        ? t('mooncap.oraclecap')
        : result.reward.family === 'frenzy' ? t('mooncap.frenzycap') : t('mooncap.bloodcap');
    const message = result.reward.type === 'goblins'
      ? t('mooncap.clutchMessage', { amount: fmtNumber(result.reward.amount) })
      : result.reward.type === 'oracle'
        ? t('mooncap.oracleMessage', { multiplier: result.reward.contractMultiplier })
        : result.reward.family === 'frenzy'
          ? t('mooncap.cpsMessage', { multiplier: result.reward.buff.multiplier, duration: fmtDuration(result.reward.buff.expiresAt - result.reward.buff.startedAt) })
          : t('mooncap.clickMessage', { multiplier: result.reward.buff.multiplier, duration: fmtDuration(result.reward.buff.expiresAt - result.reward.buff.startedAt) });
    addToast({ title, message, icon: 'sparkles', tone: 'success' });
    if (result.eclipseTriggered) {
      const eclipse = result.state.buffs.find((buff) => buff.id === 'eclipse');
      if (eclipse) addToast({ title: t('mooncap.eclipseTitle'), message: t('mooncap.eclipseMessage', { duration: fmtDuration(eclipse.expiresAt - eclipse.startedAt) }), icon: 'sparkles', tone: 'prestige' });
    }
  };

  const collectContract = (kind: ContractKind) => {
    const result = claimContract(gameRef.current, kind, Date.now());
    commitGame(result.state);
    if (!result.success) return;
    playSound('achievement', settings.sound);
    const notice = t('contract.rewardNotice', { amount: fmtNumber(result.reward) });
    setContractRewardNotice(notice);
    setContractRewardFxKey((value) => value + 1);
    if (contractNoticeTimer.current !== null) window.clearTimeout(contractNoticeTimer.current);
    contractNoticeTimer.current = window.setTimeout(() => setContractRewardNotice(null), 2_600);
    addToast({ title: t('contract.complete'), message: notice, icon: 'clutch', tone: 'success' });
  };

  const operateMoonDial = (action: Parameters<typeof spendLunarCharge>[1], successMessage: string) => {
    const result = spendLunarCharge(gameRef.current, action, Date.now());
    if (!result.success) return;
    commitGame(result.state);
    playSound('mooncap', settings.sound);
    addToast({ title: t('moonDial.title'), message: successMessage, icon: 'totem', tone: 'success' });
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
    const fresh = createInitialGameState(Date.now()); try { localStorage.removeItem(SAVE_KEY); for (const key of LEGACY_SAVE_KEYS) localStorage.removeItem(key); } catch { /* in-memory reset still succeeds */ }
    commitGame(fresh); previousAchievements.current = {}; setModal(null); addToast({ title: t('settings.resetTitle'), message: t('settings.resetMessage'), icon: 'settings' });
  };

  const upgradeEffectLabel = useCallback((upgrade: (typeof UPGRADES)[number]) => upgrade.effects.map((effect) => {
    switch (effect.type) {
      case 'clickMultiplier': return t('upgrade.effectClick', { multiplier: effect.multiplier });
      case 'globalCpsMultiplier': return t('upgrade.effectAll', { multiplier: effect.multiplier });
      case 'buildingMultiplier': return t('upgrade.effectBuilding', { name: localizedName(language, 'building', effect.buildingId, BUILDING_BY_ID[effect.buildingId].name), multiplier: effect.multiplier });
      case 'clickCpsFraction': return t('upgrade.effectCps', { percent: Math.round(effect.fraction * 100) });
      case 'buildingCostMultiplier': return t('upgrade.effectBuildingCost', { name: localizedName(language, 'building', effect.buildingId, BUILDING_BY_ID[effect.buildingId].name), multiplier: effect.multiplier });
      case 'globalBuildingCostMultiplier': return t('upgrade.effectAllBuildingCost', { multiplier: effect.multiplier });
      case 'masteryLevelMultiplier': return t('upgrade.effectMasteryTier', { name: localizedName(language, 'building', effect.buildingId, BUILDING_BY_ID[effect.buildingId].name), multiplier: effect.multiplier });
      case 'masteryNetworkMultiplier': return t('upgrade.effectMasteryNetwork', { multiplier: effect.multiplier });
      case 'offlineEfficiencyBonus': return t('upgrade.effectOfflineBonus', { percent: Math.round(effect.bonus * 100) });
      case 'mooncapRewardMultiplier': return t('upgrade.effectMooncapReward', { multiplier: effect.multiplier });
      case 'mooncapDurationMultiplier': return t('upgrade.effectMooncapDuration', { multiplier: effect.multiplier });
    }
  }).join(' · '), [language, t]);

  const upgradeTierLabel = useCallback((upgrade: (typeof UPGRADES)[number]) => {
    if ('exclusiveGroup' in upgrade && upgrade.exclusiveGroup) return t('upgrade.doctrine');
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

  const doctrineGroupLabel = useCallback((group: UpgradeExclusiveGroup) => t(`research.doctrine.${group}` as TranslationKey), [t]);

  const upgradesView = useMemo(() => UPGRADES.map((upgrade) => {
    const exclusiveGroup = 'exclusiveGroup' in upgrade ? upgrade.exclusiveGroup : undefined;
    const sibling = exclusiveGroup
      ? UPGRADES.find((candidate) => candidate.id !== upgrade.id && 'exclusiveGroup' in candidate && candidate.exclusiveGroup === exclusiveGroup)
      : undefined;
    const blockerId = getUpgradeChoiceBlocker(game, upgrade.id);
    const blocker = blockerId ? UPGRADES.find((candidate) => candidate.id === blockerId) : undefined;
    return {
      id: upgrade.id,
      name: localizedName(language, 'upgrade', upgrade.id, upgrade.name),
      description: language === 'en' ? upgrade.description : t('upgrade.genericDescription'),
      priceLabel: fmtNumber(upgrade.cost),
      effectLabel: upgradeEffectLabel(upgrade),
      purchased: Boolean(game.purchasedUpgrades[upgrade.id]),
      affordable: canPurchaseUpgrade(game, upgrade.id),
      locked: !isUpgradeUnlocked(game, upgrade.id),
      choiceLocked: Boolean(blockerId),
      specialization: Boolean(exclusiveGroup),
      exclusiveGroupLabel: exclusiveGroup ? doctrineGroupLabel(exclusiveGroup) : undefined,
      siblingName: sibling ? localizedName(language, 'upgrade', sibling.id, sibling.name) : undefined,
      choiceBlockerName: blocker ? localizedName(language, 'upgrade', blocker.id, blocker.name) : undefined,
      tradeoffLabel: language === 'en' && 'tradeoff' in upgrade ? upgrade.tradeoff : undefined,
      tier: upgradeTierLabel(upgrade),
      icon: 'sparkles' as const,
    };
  }), [doctrineGroupLabel, fmtNumber, game, language, t, upgradeEffectLabel, upgradeTierLabel]);

  const achievementViews = useMemo(() => ACHIEVEMENTS.map((achievement) => ({
    id: achievement.id, name: localizedName(language, 'achievement', achievement.id, achievement.name), description: achievementDescription(achievement),
    unlocked: Boolean(game.unlockedAchievements[achievement.id]), unlockedAtLabel: game.unlockedAchievements[achievement.id] ? t('achievement.unlockedAt', { date: fmtDate(game.unlockedAchievements[achievement.id]) }) : undefined,
  })), [achievementDescription, fmtDate, game.unlockedAchievements, language, t]);

  const prestigePerks = useMemo(() => PERMANENT_UPGRADES.map((perk) => {
    const rank = getPermanentRank(game, perk.id); const cost = getPermanentUpgradeCost(game, perk.id);
    let effectLabel: string;
    switch (perk.id) {
      case 'ancestral_fertility': effectLabel = t('prestige.effectGlobalCps', { percent: fmtInteger(rank * 5) }); break;
      case 'stronger_spawn': effectLabel = t('prestige.effectSpawnPower', { percent: fmtInteger(rank * 10) }); break;
      case 'scavenger_memory': effectLabel = t('prestige.effectExpansionCost', { percent: fmtInteger(rank) }); break;
      case 'lucky_totem': effectLabel = t('prestige.effectMooncapDelay', { percent: fmtInteger(Math.round((1 - 1 / (1 + rank * 0.1)) * 100)) }); break;
      case 'deep_warrens': effectLabel = t('prestige.effectOfflineCap', { hours: fmtInteger(8 + rank * 2) }); break;
      case 'starter_clutch': effectLabel = t('prestige.effectStartingGoblins', { amount: fmtInteger(rank * 50) }); break;
      case 'founders_legacy': effectLabel = t('prestige.effectMasteryNetwork', { percent: fmtInteger(rank * 20) }); break;
      case 'ancestral_momentum': effectLabel = t('prestige.effectMigrationCps', { percent: fmtInteger(Math.min(25, game.prestige.resets) * rank) }); break;
      case 'tireless_lineage': effectLabel = t('prestige.effectOfflineEfficiency', { percent: fmtInteger(Math.min(100, 75 + rank * 5)) }); break;
      case 'moonlit_blood': effectLabel = t('prestige.effectMooncapPower', { percent: fmtInteger(rank * 10) }); break;
      case 'heirloom_matrons': effectLabel = t('prestige.effectStartingMatrons', { amount: fmtInteger(rank) }); break;
    }
    return {
      id: perk.id,
      name: localizedName(language, 'perk', perk.id, perk.name),
      description: localizedPerkDescription(language, perk.id, perk.description),
      levelLabel: `${fmtInteger(rank)} / ${fmtInteger(perk.maxRank)}`,
      priceLabel: Number.isFinite(cost) ? fmtInteger(cost) : '—',
      affordable: canPurchasePermanentUpgrade(game, perk.id),
      maxed: rank >= perk.maxRank,
      rank,
      maxRank: perk.maxRank,
      icon: PERK_ICONS[perk.id],
      effectLabel,
    };
  }), [fmtInteger, game, language, t]);

  const activeBuffs = game.buffs.filter((buff) => buff.expiresAt > now);
  const sevenfoldActive = activeBuffs.some((buff) => buff.id === 'moon_frenzy' && buff.target === 'cps');
  const contractViews = CONTRACT_KINDS.map((kind) => {
    const contract = game.contracts.active[kind];
    if (!contract) return null;
    const objective = contract.objective;
    let copy: { title: string; dialogue: string; objective: string };
    switch (objective.type) {
      case 'manualBorn':
        copy = { title: t('contract.mission.manualTitle'), dialogue: t('contract.mission.manualDialogue'), objective: t('contract.mission.manualObjective', { amount: fmtNumber(objective.amount) }) };
        break;
      case 'buildingOwned': {
        const name = localizedName(language, 'building', objective.buildingId, BUILDING_BY_ID[objective.buildingId].name);
        copy = { title: t('contract.mission.buildingTitle', { name }), dialogue: t('contract.mission.buildingDialogue'), objective: t('contract.mission.buildingObjective', { amount: fmtNumber(objective.target), name }) };
        break;
      }
      case 'runGoblins':
        copy = { title: t('contract.mission.runTitle'), dialogue: t('contract.mission.runDialogue'), objective: t('contract.mission.runObjective', { amount: fmtNumber(objective.target) }) };
        break;
      case 'mooncapCatches':
        copy = { title: t('contract.mission.mooncapTitle'), dialogue: t('contract.mission.mooncapDialogue'), objective: t('contract.mission.mooncapObjective', { amount: fmtNumber(objective.amount) }) };
        break;
      case 'masteryCount':
        copy = { title: t('contract.mission.masteryTitle'), dialogue: t('contract.mission.masteryDialogue'), objective: t('contract.mission.masteryObjective', { amount: fmtNumber(objective.target) }) };
        break;
    }
    const progress = getContractProgress(game, contract);
    return {
      id: contract.id,
      kind,
      kindLabel: t(kind === 'quick' ? 'contract.quick' : kind === 'quartermaster' ? 'contract.quartermaster' : 'contract.directive'),
      title: copy.title,
      dialogue: copy.dialogue,
      objective: copy.objective,
      progressLabel: `${fmtNumber(progress.current)} / ${fmtNumber(progress.target)}`,
      progressRatio: progress.ratio,
      rewardLabel: `+${fmtNumber(getContractRewardAmount(game, contract))} ${t('common.goblins')}`,
      complete: isContractComplete(game, contract),
    };
  }).filter((contract): contract is NonNullable<typeof contract> => contract !== null);
  const readyContracts = contractViews.filter(({ complete }) => complete).length;
  const mooncapFamily = game.mooncap.family;
  const mooncapCopy = mooncapFamily ? {
    clutch: { label: t('mooncap.clutchcap'), detail: t('mooncap.clutchcapDetail') },
    frenzy: { label: t('mooncap.frenzycap'), detail: t('mooncap.frenzycapDetail') },
    blood: { label: t('mooncap.bloodcap'), detail: t('mooncap.bloodcapDetail') },
    oracle: { label: t('mooncap.oraclecap'), detail: t('mooncap.oraclecapDetail') },
  }[mooncapFamily] : null;
  const familyLabels: Record<MooncapFamily, string> = {
    clutch: t('mooncap.clutchcap'), frenzy: t('mooncap.frenzycap'), blood: t('mooncap.bloodcap'), oracle: t('mooncap.oraclecap'),
  };
  const canExtendMoon = activeBuffs.some((buff) => buff.id === 'moon_frenzy' || buff.id === 'hatching_fever' || buff.id === 'eclipse');
  const musicMuted = settings.musicMuted || settings.musicVolume <= 0;
  const expeditionReservation = getExpeditionReservation(game, now);
  const header = <ResourceHeader stats={[
    { id: 'population', label: t('header.goblins'), value: fmtNumber(game.goblins), icon: 'brood', accent: true },
    { id: 'cps', label: t('header.perSecond'), value: fmtNumber(cps), icon: 'cps' },
    { id: 'ancestry', label: t('header.ancestral'), value: fmtInteger(game.prestige.shards), icon: 'crown', title: t('header.ancestralTitle') },
  ]} onOpenAchievements={() => setModal('achievements')} onOpenPrestige={() => setModal('prestige')} musicMuted={musicMuted} onToggleMusic={toggleMusic} onSkipMusic={() => musicPlayerRef.current?.skip()} onOpenSettings={() => setModal('settings')} />;

  const left = <div className="left-stack">
    <SidePanel title={t('ledger.title')} eyebrow={t('ledger.eyebrow')} action={<button className="mini-action" type="button" onClick={() => setModal('achievements')}><Icon name="trophy" size={14} /> {fmtInteger(unlockedAchievementCount)}</button>}>
      <dl className="ledger-grid">
        <div><dt>{t('ledger.thisCycle')}</dt><dd>{fmtNumber(game.runGoblins)}</dd></div><div><dt>{t('ledger.allTime')}</dt><dd>{fmtNumber(game.lifetimeGoblins)}</dd></div>
        <div><dt>{t('ledger.manual')}</dt><dd>{fmtNumber(game.statistics.manuallyBorn)}</dd></div><div><dt>{t('ledger.structures')}</dt><dd>{fmtInteger(totalBuildings)}</dd></div>
        <div><dt>{t('ledger.baseProduction')}</dt><dd>{fmtNumber(baseCps)}/s</dd></div><div><dt>{t('ledger.bestProduction')}</dt><dd>{fmtNumber(game.statistics.highestCps)}/s</dd></div>
      </dl>
      {expeditionReservation > 0 && <p className="panel-copy">{EXPEDITION_COPY[language].reserve}: −{fmtNumber(cps * expeditionReservation / (1 - expeditionReservation))}/s ({fmtInteger(expeditionReservation * 100)}%)</p>}
      {activeBuffs.length > 0 && <div className="buff-list">{activeBuffs.map((buff) => <div className={`buff-pill${buff.id === 'moon_frenzy' ? ' buff-pill--sevenfold' : buff.id === 'eclipse' ? ' buff-pill--eclipse' : ''}`} key={buff.id}><Icon name="sparkles" size={14} /><span>{buff.id === 'moon_frenzy' ? t('buff.moonFrenzy') : buff.id === 'hatching_fever' ? t('buff.hatchingFever') : t('buff.eclipse')}</span><strong>×{fmtInteger(buff.multiplier)}</strong><small>{fmtDuration(buff.expiresAt - now)}</small></div>)}</div>}
    </SidePanel>
    <ExpeditionEntry state={game} onOpen={() => setModal('expeditions')} />
    <SidePanel title={t('research.title')} eyebrow={t('research.eyebrow')} action={availableUpgrades > 0 ? <span className="notification-badge">{fmtInteger(availableUpgrades)}</span> : undefined}>
      <p className="panel-copy">{t('research.copy')}</p><button className="panel-primary-button" type="button" onClick={() => setModal('upgrades')}><Icon name="sparkles" size={16} /> {t('research.open')} <Icon name="chevron" size={14} /></button>
    </SidePanel>
    <SidePanel title={t('bloodline.title')} eyebrow={t('bloodline.eyebrow')} className="prestige-panel">
      <div className="prestige-summary"><Icon name="crown" size={24} /><div><strong>{fmtInteger(game.prestige.shards)} {t('bloodline.cunning')}</strong><span>{t('bloodline.migrations', { count: fmtInteger(game.prestige.resets) })}</span></div></div>
      <p className="panel-copy">{t('bloodline.copy')}</p><button className="panel-primary-button panel-primary-button--prestige" type="button" onClick={() => setModal('prestige')}><Icon name="crown" size={16} /> {prestigeGain > 0 ? t('bloodline.ready', { gain: fmtInteger(prestigeGain) }) : t('bloodline.view')}</button>
    </SidePanel>
  </div>;

  const center = <SpawnPit totalLabel={fmtNumber(game.goblins)} perSecondLabel={fmtNumber(cps)} clickPowerLabel={fmtNumber(clickPower)} statusLabel={statusLine} onSpawn={spawn} activityLevel={spawnActivity} className={sevenfoldActive ? 'spawn-pit--sevenfold' : ''} bonusEvent={game.mooncap.active && mooncapCopy ? { id: 'mooncap', label: mooncapCopy.label, detail: mooncapCopy.detail, tone: mooncapFamily ?? undefined, onClaim: clickMooncap } : null} contractGiver={
    <button className={`contract-giver${readyContracts > 0 ? ' contract-giver--ready' : ''}`} type="button" onClick={() => setModal('contracts')} aria-label={t('contract.openAria')}>
      <span className="contract-giver__signal" aria-hidden="true" />
      <img src={gameArt.missionGiver} alt="" draggable={false} />
      <span className="contract-giver__copy"><strong>{t('contract.giver')}</strong><small>{readyContracts > 0 ? t('contract.ready', { count: readyContracts }) : t('contract.giverDetail')}</small></span>
    </button>
  } moonDial={
    <MoonDial
      charge={game.mooncap.lunarCharge}
      maxCharge={MAX_LUNAR_CHARGE}
      onOpen={() => setModal('moonDial')}
      labels={{ title: t('moonDial.title'), charge: t('moonDial.charge') }}
    />
  }>
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
      const masteryLevel = getExpansionMasteryLevel(game, building.id);
      const nextMasteryLevel = getNextExpansionMasteryLevel(game, building.id);
      const masteryMultiplier = getExpansionMasteryProductionMultiplier(game, building.id);
      const masteryNetworkContribution = getReachedExpansionMasteryLevels(game, building.id)
        .reduce((sum, level) => sum + level.networkCpsBonus, 0)
        * (1 + getPermanentRank(game, 'founders_legacy') * 0.2);
      const masteryFloor = masteryLevel?.threshold ?? 0;
      const masteryTranslationKey = masteryLevel ? `shop.mastery.${masteryLevel.id}` as TranslationKey : 'shop.mastery.unranked';
      const nextMasteryTranslationKey = nextMasteryLevel ? `shop.mastery.${nextMasteryLevel.id}` as TranslationKey : undefined;
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
      }} mastery={locked ? undefined : {
        tierId: masteryLevel?.id ?? 'unranked',
        levelLabel: t(masteryTranslationKey),
        multiplierLabel: `×${formatNumber(masteryMultiplier, 2, getLanguageMeta(language).locale)}`,
        networkLabel: `+${formatNumber(masteryNetworkContribution * 100, 2, getLanguageMeta(language).locale)}%`,
        progressLabel: nextMasteryLevel ? `${fmtInteger(owned)} / ${fmtInteger(nextMasteryLevel.threshold)}` : `${fmtInteger(owned)} / ${fmtInteger(masteryFloor)}`,
        nextLevelLabel: nextMasteryTranslationKey ? t(nextMasteryTranslationKey) : undefined,
        labels: {
          heading: t('shop.mastery.heading'),
          network: t('shop.mastery.network'),
          maxed: t('shop.mastery.maxed'),
        },
      }} canAfford={!locked && maxAffordable > 0 && game.goblins >= cost} onBuy={buyBuilding} onSell={owned > 0 ? sellOneBuilding : undefined} locked={locked} artSrc={locked ? undefined : buildingArtPath(building.id)} buyAmountLabel={buyAmount === 'max' ? (maxAffordable > 0 ? t('shop.buy', { count: fmtInteger(maxAffordable) }) : t('shop.buyMax')) : t('shop.buy', { count: fmtInteger(quantity) })} />;
    })}
  </ShopPanel>;

  const overlay = <>
    <UpgradeModal open={modal === 'upgrades'} upgrades={upgradesView} onPurchase={buyUpgrade} onClose={() => setModal(null)} currencyLabel={t('upgrade.available', { amount: fmtNumber(game.goblins) })} />
    <AchievementModal open={modal === 'achievements'} achievements={achievementViews} onClose={() => setModal(null)} />
    <ContractModal
      open={modal === 'contracts'}
      giverImage={gameArt.missionGiver}
      contracts={contractViews}
      completedLabel={t('contract.completed', { count: fmtInteger(game.contracts.completed) })}
      oracleLabel={game.contracts.oracleBoost > 0 ? t('contract.oracleBoost', { multiplier: 1 + game.contracts.oracleBoost * 0.5 }) : undefined}
      rewardNotice={contractRewardNotice}
      rewardFxKey={contractRewardFxKey}
      onClaim={collectContract}
      onClose={() => setModal(null)}
      labels={{ title: t('contract.title'), subtitle: t('contract.subtitle'), progress: t('contract.progress'), reward: t('contract.reward'), claim: t('contract.claim'), working: t('contract.working'), complete: t('contract.complete') }}
    />
    <ExpeditionMap open={modal === 'expeditions'} state={game} onClose={() => setModal(null)}
      onLaunch={(plan) => { if (resetInProgress.current) return; commitGame(startExpedition(gameRef.current, plan, Date.now())); playSound('buy', settings.sound); }}
      onCancel={() => { if (resetInProgress.current) return; commitGame(cancelExpedition(gameRef.current, Date.now())); }}
      onClaim={() => { if (resetInProgress.current) return; const result = claimExpedition(gameRef.current, Date.now()); commitGame(result.state); if (result.reward > 0) { playSound('achievement', settings.sound); addToast({ title: EXPEDITION_COPY[language].returned, message: `+${fmtNumber(result.reward)}`, icon: 'clutch', tone: 'success' }); } }}
    />
    <MoonDialModal
      open={modal === 'moonDial'}
      charge={game.mooncap.lunarCharge}
      maxCharge={MAX_LUNAR_CHARGE}
      bias={game.mooncap.nextFamilyBias}
      canHasten={!game.mooncap.active && game.mooncap.nextSpawnAt > now + 8_000}
      canExtend={canExtendMoon}
      onHasten={() => operateMoonDial({ type: 'hasten' }, t('moonDial.hastenMessage'))}
      onExtend={() => operateMoonDial({ type: 'extend' }, t('moonDial.extendMessage'))}
      onBias={(family) => operateMoonDial({ type: 'bias', family }, t('moonDial.biasMessage', { family: familyLabels[family] }))}
      onClose={() => setModal(null)}
      labels={{ title: t('moonDial.title'), charge: t('moonDial.charge'), hasten: t('moonDial.hasten'), extend: t('moonDial.extend'), bias: t('moonDial.bias'), family: familyLabels }}
    />
    <PrestigeModal open={modal === 'prestige'} currentCurrencyLabel={fmtInteger(game.prestige.shards)} gainLabel={fmtInteger(prestigeGain)} requirementLabel={prestigeGain > 0 ? t('prestige.requirementReady') : t('prestige.requirementLocked')} canPrestige={prestigeGain > 0} perks={prestigePerks} onPrestige={prestige} onBuyPerk={buyPermanent} onClose={() => setModal(null)} />
    <SettingsModal open={modal === 'settings'} language={language} onLanguageChange={(next) => setSettings((current) => ({ ...current, language: next }))} musicVolume={settings.musicVolume} musicMuted={musicMuted} onMusicVolumeChange={changeMusicVolume} toggles={[
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
