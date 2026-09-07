import type { ReactNode } from 'react';
import { publicAsset } from '../utils/assets';
import { useI18n } from '../i18n';
import { Icon } from './Icon';

export interface BonusEventView {
  id: string;
  label: string;
  detail?: string;
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
  children?: ReactNode;
}

export function SpawnPit({ totalLabel, perSecondLabel, clickPowerLabel, onSpawn, disabled = false, statusLabel, bonusEvent, children }: SpawnPitProps) {
  const { t } = useI18n();
  return (
    <div className="spawn-pit">
      <div className="spawn-pit__heading">
        <span className="spawn-pit__kicker">{t('spawn.kicker')}</span>
        <strong>{statusLabel ?? t('status.start')}</strong>
      </div>

      <div className="spawn-pit__counter">
        <span className="spawn-pit__counter-label">{t('spawn.population')}</span>
        <span className="spawn-pit__counter-value">{totalLabel}</span>
        <span className="spawn-pit__rate">+{perSecondLabel} {t('spawn.perSecond')}</span>
      </div>

      <div className="spawn-pit__arena">
        <span className="spawn-pit__ring spawn-pit__ring--outer" aria-hidden="true" />
        <span className="spawn-pit__ring spawn-pit__ring--inner" aria-hidden="true" />
        <span className="spawn-pit__embers" aria-hidden="true" />
        <button className="spawn-target" type="button" onClick={onSpawn} disabled={disabled} aria-label={t('spawn.aria', { power: clickPowerLabel })}>
          <span className="spawn-target__glow" aria-hidden="true" />
          <img src={publicAsset('assets/goblin-spawn.svg')} alt="" draggable={false} />
          <span className="spawn-target__cta">{t('spawn.button')}</span>
        </button>
        {children}
      </div>

      <div className="spawn-pit__click-power">
        <Icon name="click" size={17} />
        <span>{t('spawn.each')}</span>
        <strong>+{clickPowerLabel}</strong>
      </div>

      {bonusEvent && (
        <button className="omen-event" type="button" onClick={bonusEvent.onClaim} aria-label={t('spawn.claim', { name: bonusEvent.label })}>
          <span className="omen-event__icon"><Icon name="sparkles" /></span>
          <span><strong>{bonusEvent.label}</strong>{bonusEvent.detail && <small>{bonusEvent.detail}</small>}</span>
        </button>
      )}
    </div>
  );
}
