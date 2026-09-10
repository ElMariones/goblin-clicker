import { useEffect, useRef, useState, type ReactNode } from 'react';
import { gameArt, mooncapArt } from '../utils/assets';
import { useI18n } from '../i18n';
import { Icon } from './Icon';

export interface BonusEventView {
  id: string;
  label: string;
  detail?: string;
  tone?: 'clutch' | 'frenzy' | 'blood' | 'oracle';
  fading?: boolean;
  onClaim: () => void;
}

/** Flavour line describing the brood against real-world quantities. */
export interface BroodScaleView {
  /** How many times over the brood beats its largest matched reference. */
  headline: string | null;
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

const OMEN_DEPARTURE_MS = 850;

export function SpawnPit({ totalLabel, perSecondLabel, clickPowerLabel, onSpawn, disabled = false, statusLabel, bonusEvent, activityLevel = 'dormant', className = '', contractGiver, expeditionGiver, moonDial, worldSwitch, goblinArtSrc = gameArt.goblinSpawn, scale = null, children, labels }: SpawnPitProps) {
  const { t } = useI18n();
  const [departingEvent, setDepartingEvent] = useState<BonusEventView | null>(null);
  const previousBonusEvent = useRef<BonusEventView | null>(null);
  const copy = {
    kicker: labels?.kicker ?? t('spawn.kicker'),
    population: labels?.population ?? t('spawn.population'),
    perSecond: labels?.perSecond ?? t('spawn.perSecond'),
    button: labels?.button ?? t('spawn.button'),
    each: labels?.each ?? t('spawn.each'),
    aria: labels?.aria ?? t('spawn.aria', { power: clickPowerLabel }),
  };

  useEffect(() => {
    const previous = previousBonusEvent.current;
    previousBonusEvent.current = bonusEvent ?? null;
    if (!previous || bonusEvent) return;

    setDepartingEvent(previous);
    const timer = window.setTimeout(() => setDepartingEvent(null), OMEN_DEPARTURE_MS);
    return () => window.clearTimeout(timer);
  }, [bonusEvent]);

  const visibleBonusEvent = bonusEvent ?? departingEvent;
  const departing = !bonusEvent && departingEvent !== null;
  return (
    <div className={`spawn-pit spawn-pit--${activityLevel}${bonusEvent ? ' spawn-pit--omen-active' : ''}${className ? ` ${className}` : ''}`} data-activity={activityLevel}>
      <div className="spawn-pit__heading">
        <span className="spawn-pit__kicker">{copy.kicker}</span>
        <strong>{statusLabel ?? t('status.start')}</strong>
      </div>

      <div className="spawn-pit__counter">
        <span className="spawn-pit__counter-label">{copy.population}</span>
        <span className="spawn-pit__counter-value">{totalLabel}</span>
        {scale?.headline && <span className="spawn-pit__scale" title={scale.next}>{scale.headline}</span>}
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

      {visibleBonusEvent && (
        <button
          className={`omen-event${visibleBonusEvent.tone ? ` omen-event--${visibleBonusEvent.tone}` : ''}${visibleBonusEvent.fading && !departing ? ' omen-event--fading' : ''}${departing ? ' omen-event--departing' : ''}`}
          type="button"
          onClick={departing ? undefined : visibleBonusEvent.onClaim}
          disabled={departing}
          tabIndex={departing ? -1 : undefined}
          aria-label={t('spawn.claim', { name: visibleBonusEvent.label })}
          title={visibleBonusEvent.detail ? `${visibleBonusEvent.label} — ${visibleBonusEvent.detail}` : visibleBonusEvent.label}
        >
          <span className="omen-event__aura" aria-hidden="true" />
          {visibleBonusEvent.tone
            ? <img src={mooncapArt[visibleBonusEvent.tone]} alt="" draggable={false} />
            : <span className="omen-event__fallback" aria-hidden="true"><Icon name="sparkles" /></span>}
          <span className="omen-event__spark omen-event__spark--one" aria-hidden="true" />
          <span className="omen-event__spark omen-event__spark--two" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
