import { gameArt } from '../utils/assets';
import { useI18n } from '../i18n';
import { Icon, type IconName } from './Icon';

export interface ResourceStat {
  id: string;
  label: string;
  value: string;
  icon?: IconName;
  accent?: boolean;
  title?: string;
}

export interface ResourceHeaderProps {
  title?: string;
  subtitle?: string;
  stats: ResourceStat[];
  onOpenAchievements?: () => void;
  onOpenPrestige?: () => void;
  onOpenSettings?: () => void;
  musicMuted?: boolean;
  onToggleMusic?: () => void;
  onSkipMusic?: () => void;
}

export function ResourceHeader({ title, subtitle, stats, onOpenAchievements, onOpenPrestige, onOpenSettings, musicMuted, onToggleMusic, onSkipMusic }: ResourceHeaderProps) {
  const { t } = useI18n();
  return (
    <div className="resource-header">
      <div className="resource-header__brand">
        <img src={gameArt.brandLogo} alt="" className="resource-header__logo" draggable={false} />
        <div className="resource-header__brand-copy">
          <div className="resource-header__eyebrow">{subtitle ?? t('brand.subtitle')}</div>
          <h1 className="sr-only">{title ?? 'Brood & Burrow'}</h1>
        </div>
      </div>

      <dl className="resource-header__stats" aria-label={t('aria.resources')}>
        {stats.map((stat) => (
          <div className={`resource-stat${stat.accent ? ' resource-stat--accent' : ''}`} key={stat.id} title={stat.title}>
            <dt><Icon name={stat.icon ?? 'brood'} size={16} />{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>

      <nav className="resource-header__actions" aria-label={t('aria.menus')}>
        {onOpenAchievements && <button className="icon-button" type="button" onClick={onOpenAchievements} aria-label={t('aria.achievements')} title={t('aria.achievements')}><Icon name="trophy" /></button>}
        {onOpenPrestige && <button className="icon-button icon-button--prestige" type="button" onClick={onOpenPrestige} aria-label={t('aria.prestige')} title={t('aria.prestige')}><Icon name="crown" /></button>}
        {onToggleMusic && <button className={`icon-button icon-button--music${musicMuted ? ' is-muted' : ''}`} type="button" onClick={onToggleMusic} aria-label={musicMuted ? t('music.unmute') : t('music.mute')} title={musicMuted ? t('music.unmute') : t('music.mute')} aria-pressed={musicMuted}><Icon name={musicMuted ? 'mute' : 'sound'} /></button>}
        {onSkipMusic && <button className="icon-button icon-button--music" type="button" onClick={onSkipMusic} aria-label={t('music.skip')} title={t('music.skip')}><Icon name="skip" /></button>}
        {onOpenSettings && <button className="icon-button" type="button" onClick={onOpenSettings} aria-label={t('aria.settings')} title={t('aria.settings')}><Icon name="settings" /></button>}
      </nav>
    </div>
  );
}
