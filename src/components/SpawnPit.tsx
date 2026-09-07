import type { ReactNode } from 'react';
import { gameArt } from '../utils/assets';
import { useI18n } from '../i18n';
import { Icon } from './Icon';

export interface BonusEventView {
  id: string;
  label: string;
  detail?: string;
  tone?: 'clutch' | 'frenzy' | 'blood' | 'oracle';
  onClaim: () => void;
}

export interface SpawnPitProps {
  totalLabel: string;
  perSecondLabel: string;
  clickPowerLabel: string;
  onSpawn: () => void;
  disabled?: boolean;
  statusLabel?: string;
  bonusEvent?: BonusEventView | null;
  activityLevel?: 'dormant' | 'stirring' | 'busy' | 'overrun';
  className?: string;
  contractGiver?: ReactNode;
  moonDial?: ReactNode;
  children?: ReactNode;
}

export function SpawnPit({ totalLabel, perSecondLabel, clickPowerLabel, onSpawn, disabled = false, statusLabel, bonusEvent, activityLevel = 'dormant', className = '', contractGiver, moonDial, children }: SpawnPitProps) {
  const { t } = useI18n();
  return (
    <div className={`spawn-pit spawn-pit--${activityLevel}${bonusEvent ? ' spawn-pit--omen-active' : ''}${className ? ` ${className}` : ''}`} data-activity={activityLevel}>
      <div className="spawn-pit__heading">
        <span className="spawn-pit__kicker">{t('spawn.kicker')}</span>
        <strong>{statusLabel ?? t('status.start')}</strong>
      </div>

      <div className="spawn-pit__counter">
        <span className="spawn-pit__counter-label">{t('spawn.population')}</span>
        <span className="spawn-pit__counter-value">{totalLabel}</span>
        <span className="spawn-pit__rate">+{perSecondLabel} {t('spawn.perSecond')}</span>
      </div>

      <div className="spawn-pit__arena" data-activity={activityLevel}>
        <span className="spawn-pit__ring spawn-pit__ring--outer" aria-hidden="true" />
        <span className="spawn-pit__ring spawn-pit__ring--inner" aria-hidden="true" />
        <span className="spawn-pit__embers" aria-hidden="true" />
        <button className={`spawn-target spawn-target--${activityLevel}`} type="button" onClick={onSpawn} disabled={disabled} aria-label={t('spawn.aria', { power: clickPowerLabel })}>
          <span className="spawn-target__glow spawn-target__glow--core" aria-hidden="true" />
          <img className="spawn-target__goblin" src={gameArt.goblinSpawn} alt="" draggable={false} />
          <span className="spawn-target__cta">{t('spawn.button')}</span>
        </button>
        {children}
      </div>

      <div className="spawn-pit__click-power">
        <Icon name="click" size={17} />
        <span>{t('spawn.each')}</span>
        <strong>+{clickPowerLabel}</strong>
      </div>

      {moonDial}
      {contractGiver}

      {bonusEvent && (
        <button className={`omen-event${bonusEvent.tone ? ` omen-event--${bonusEvent.tone}` : ''}`} type="button" onClick={bonusEvent.onClaim} aria-label={t('spawn.claim', { name: bonusEvent.label })}>
          <span className="omen-event__icon"><Icon name="sparkles" /></span>
          <span><strong>{bonusEvent.label}</strong>{bonusEvent.detail && <small>{bonusEvent.detail}</small>}</span>
        </button>
      )}
    </div>
  );
}
