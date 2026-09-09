import type { ReactNode } from 'react';
import { gameArt, mooncapArt } from '../utils/assets';
import { useI18n } from '../i18n';
import { Icon } from './Icon';

export interface BonusEventView {
  id: string;
  label: string;
  detail?: string;
  tone?: 'clutch' | 'frenzy' | 'blood' | 'oracle';
  onClaim: () => void;
}

/** Flavour line describing the brood against real-world quantities. */
export interface BroodScaleView {
  /** How many times over the brood beats its largest matched reference. */
  headline: string | null;
  /** Goblin-voice remark for the band the brood has reached. */
  remark: string | null;
  /** The reference still to overtake, or the end-of-ladder message. */
  next: string;
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
  expeditionGiver?: ReactNode;
  moonDial?: ReactNode;
  worldSwitch?: ReactNode;
  goblinArtSrc?: string;
  scale?: BroodScaleView | null;
  children?: ReactNode;
  labels?: Partial<{
    kicker: string;
    population: string;
    perSecond: string;
    button: string;
    each: string;
    aria: string;
  }>;
}

export function SpawnPit({ totalLabel, perSecondLabel, clickPowerLabel, onSpawn, disabled = false, statusLabel, bonusEvent, activityLevel = 'dormant', className = '', contractGiver, expeditionGiver, moonDial, worldSwitch, goblinArtSrc = gameArt.goblinSpawn, scale = null, children, labels }: SpawnPitProps) {
  const { t } = useI18n();
  const copy = {
    kicker: labels?.kicker ?? t('spawn.kicker'),
    population: labels?.population ?? t('spawn.population'),
    perSecond: labels?.perSecond ?? t('spawn.perSecond'),
    button: labels?.button ?? t('spawn.button'),
    each: labels?.each ?? t('spawn.each'),
    aria: labels?.aria ?? t('spawn.aria', { power: clickPowerLabel }),
  };
  return (
    <div className={`spawn-pit spawn-pit--${activityLevel}${bonusEvent ? ' spawn-pit--omen-active' : ''}${className ? ` ${className}` : ''}`} data-activity={activityLevel}>
      <div className="spawn-pit__heading" title={scale?.next}>
        <span className="spawn-pit__kicker">{copy.kicker}</span>
        <strong>{scale?.headline ?? statusLabel ?? t('status.start')}</strong>
        {scale?.remark && <em className="spawn-pit__remark">{scale.remark}</em>}
      </div>

      <div className="spawn-pit__counter">
        <span className="spawn-pit__counter-label">{copy.population}</span>
        <span className="spawn-pit__counter-value">{totalLabel}</span>
        <span className="spawn-pit__rate">+{perSecondLabel} {copy.perSecond}</span>
      </div>

      <div className="spawn-pit__arena" data-activity={activityLevel}>
        <span className="spawn-pit__ring spawn-pit__ring--outer" aria-hidden="true" />
        <span className="spawn-pit__ring spawn-pit__ring--inner" aria-hidden="true" />
        <span className="spawn-pit__embers" aria-hidden="true" />
        <button className={`spawn-target spawn-target--${activityLevel}`} type="button" onClick={onSpawn} disabled={disabled} aria-label={copy.aria}>
          <span className="spawn-target__glow spawn-target__glow--core" aria-hidden="true" />
          <img key={goblinArtSrc} className="spawn-target__goblin" src={goblinArtSrc} alt="" draggable={false} />
          <span className="spawn-target__cta">{copy.button}</span>
        </button>
        {children}
      </div>

      <div className="spawn-pit__click-power">
        <Icon name="click" size={17} />
        <span>{copy.each}</span>
        <strong>+{clickPowerLabel}</strong>
      </div>

      {moonDial}
      {worldSwitch}
      {expeditionGiver}
      {contractGiver}

      {bonusEvent && (
        <button
          className={`omen-event${bonusEvent.tone ? ` omen-event--${bonusEvent.tone}` : ''}`}
          type="button"
          onClick={bonusEvent.onClaim}
          aria-label={t('spawn.claim', { name: bonusEvent.label })}
          title={bonusEvent.detail ? `${bonusEvent.label} — ${bonusEvent.detail}` : bonusEvent.label}
        >
          <span className="omen-event__aura" aria-hidden="true" />
          {bonusEvent.tone
            ? <img src={mooncapArt[bonusEvent.tone]} alt="" draggable={false} />
            : <span className="omen-event__fallback" aria-hidden="true"><Icon name="sparkles" /></span>}
          <span className="omen-event__spark omen-event__spark--one" aria-hidden="true" />
          <span className="omen-event__spark omen-event__spark--two" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
