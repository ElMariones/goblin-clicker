import type { ReactNode } from 'react';
import { Icon } from '../Icon';
import { ROBO_COPY } from '../../i18n/robogoblins';

export interface RoboAssemblyStageProps {
  readyLabel: string;
  averagePerSecondLabel: string;
  inAssemblyLabel: string;
  clickPowerLabel: string;
  robotImageSrc: string;
  robotAppearanceName: string;
  charge: number;
  maxCharge: number;
  overclockActive: boolean;
  overclockStatusLabel: string;
  canOverclock: boolean;
  onAssemble: () => void;
  onOverclock: () => void;
  kicker?: string;
  statusLabel?: string;
  worldSwitch?: ReactNode;
  effectsLayer?: ReactNode;
}

function clamp01(value: number) { return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)); }

export function RoboAssemblyStage({
  readyLabel, averagePerSecondLabel, inAssemblyLabel, clickPowerLabel, robotImageSrc, robotAppearanceName,
  charge, maxCharge, overclockActive, overclockStatusLabel, canOverclock, onAssemble, onOverclock,
  kicker = ROBO_COPY.foundry, statusLabel = ROBO_COPY.world, worldSwitch, effectsLayer,
}: RoboAssemblyStageProps) {
  const safeMaxCharge = Math.max(1, maxCharge);
  const safeCharge = Math.max(0, Math.min(safeMaxCharge, charge));
  const chargePercent = clamp01(safeCharge / safeMaxCharge) * 100;
  return (
    <section className={`robo-assembly-stage${overclockActive ? ' is-overclocked' : ''}`} aria-labelledby="robo-stage-heading" data-testid="robo-assembly-stage">
      <span className="robo-assembly-stage__plate-seam" aria-hidden="true" />
      <header className="robo-assembly-stage__heading">
        <span>{kicker}</span>
        <h1 id="robo-stage-heading">{statusLabel}</h1>
      </header>
      <div className="robo-assembly-stage__wallet">
        <span>{ROBO_COPY.ready}</span>
        <strong>{readyLabel}</strong>
        <small>+{averagePerSecondLabel}/s · {ROBO_COPY.inAssembly}: {inAssemblyLabel}</small>
      </div>

      <div className="robo-cradle" aria-label={`${ROBO_COPY.assemble} · +${clickPowerLabel} RoboGoblins`}>
        <span className="robo-cradle__gantry robo-cradle__gantry--left" aria-hidden="true" />
        <span className="robo-cradle__gantry robo-cradle__gantry--right" aria-hidden="true" />
        <span className="robo-cradle__wire robo-cradle__wire--one" aria-hidden="true" />
        <span className="robo-cradle__wire robo-cradle__wire--two" aria-hidden="true" />
        <button className="robo-cradle__button" type="button" onClick={onAssemble} data-testid="robo-assemble">
          <span className="robo-cradle__jig" aria-hidden="true" />
          <span className="robo-cradle__heart" aria-hidden="true" />
          <img src={robotImageSrc} alt="" draggable={false} />
          <span className="robo-cradle__cta">{ROBO_COPY.assemble} <strong>+{clickPowerLabel}</strong></span>
        </button>
        <span className="robo-cradle__appearance" aria-hidden="true">{robotAppearanceName}</span>
        {effectsLayer}
      </div>

      <div className="robo-charge-panel">
        <div className="robo-charge-panel__meter">
          <div className="robo-charge-panel__labels"><span>{ROBO_COPY.charge}</span><strong>{Math.floor(safeCharge)}/{safeMaxCharge}</strong></div>
          <div className="robo-progress" role="progressbar" aria-label={ROBO_COPY.charge} aria-valuemin={0} aria-valuemax={safeMaxCharge} aria-valuenow={safeCharge}>
            <span style={{ width: `${chargePercent}%` }} />
          </div>
        </div>
        <button className="robo-overclock" type="button" onClick={onOverclock} disabled={!canOverclock || overclockActive} aria-pressed={overclockActive}>
          <span className="robo-overclock__icon" aria-hidden="true"><Icon name="sparkles" size={18} /></span>
          <span><strong>{ROBO_COPY.overclock}</strong><small>{overclockStatusLabel || ROBO_COPY.overclockDetail}</small></span>
        </button>
      </div>
      <div className="robo-click-readout"><Icon name="click" size={16} /><span>{ROBO_COPY.eachPress}</span><strong>+{clickPowerLabel} RG</strong></div>
      {worldSwitch}
    </section>
  );
}

