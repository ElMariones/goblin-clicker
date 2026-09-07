import { Icon, type IconName } from './Icon';
import { publicAsset } from '../utils/assets';

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
}

export function ResourceHeader({
  title = 'Brood & Burrow',
  subtitle = 'Goblin Reproduction Directorate',
  stats,
  onOpenAchievements,
  onOpenPrestige,
  onOpenSettings,
}: ResourceHeaderProps) {
  return (
    <div className="resource-header">
      <div className="resource-header__brand">
        <img src={publicAsset('assets/goblin-broodmark.svg')} alt="" className="resource-header__mark" />
        <div>
          <div className="resource-header__eyebrow">{subtitle}</div>
          <h1 className="resource-header__title">{title}</h1>
        </div>
      </div>

      <dl className="resource-header__stats" aria-label="Brood resources">
        {stats.map((stat) => (
          <div
            className={`resource-stat${stat.accent ? ' resource-stat--accent' : ''}`}
            key={stat.id}
            title={stat.title}
          >
            <dt>
              <Icon name={stat.icon ?? 'brood'} size={16} />
              {stat.label}
            </dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>

      <nav className="resource-header__actions" aria-label="Game menus">
        {onOpenAchievements && (
          <button className="icon-button" type="button" onClick={onOpenAchievements} aria-label="Achievements" title="Achievements">
            <Icon name="trophy" />
          </button>
        )}
        {onOpenPrestige && (
          <button className="icon-button icon-button--prestige" type="button" onClick={onOpenPrestige} aria-label="Prestige" title="Prestige">
            <Icon name="crown" />
          </button>
        )}
        {onOpenSettings && (
          <button className="icon-button" type="button" onClick={onOpenSettings} aria-label="Settings" title="Settings">
            <Icon name="settings" />
          </button>
        )}
      </nav>
    </div>
  );
}
