import { useState, type ReactNode, type CSSProperties } from 'react';
import { ROBO_GUIDE } from '../../i18n/roboGuide';
import { Icon } from '../Icon';
import { useI18n } from '../../i18n';
import { formatRobo, getRoboCopy } from '../../i18n/robogoblins';

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
  kicker, statusLabel, worldSwitch, effectsLayer,
}: RoboAssemblyStageProps) {
  const { language } = useI18n();
  const copy = getRoboCopy(language);
  const guide = ROBO_GUIDE[language];
  const [pulse, setPulse] = useState(0);
  const assemble = () => { setPulse((value) => value + 1); onAssemble(); };
  const safeMaxCharge = Math.max(1, maxCharge);
  const safeCharge = Math.max(0, Math.min(safeMaxCharge, charge));
  const chargePercent = clamp01(safeCharge / safeMaxCharge) * 100;
  return (
    <section className={`robo-assembly-stage${overclockActive ? ' is-overclocked' : ''}`} aria-labelledby="robo-stage-heading" data-testid="robo-assembly-stage">
      <span className="robo-assembly-stage__plate-seam" aria-hidden="true" />
      <header className="robo-assembly-stage__heading">
        <span>{kicker ?? copy.foundry}</span>
        <h1 id="robo-stage-heading">{statusLabel ?? copy.world}</h1>
      </header>
      <div className="robo-assembly-stage__wallet">
        <span>{copy.ready}</span>
        <strong>{readyLabel}</strong>
        <small>+{averagePerSecondLabel}/s · {copy.inAssembly}: {inAssemblyLabel}</small>
      </div>

      <div className="robo-cradle" aria-label={formatRobo(copy.assembleAria, { amount: clickPowerLabel })}>
        <span className="robo-cradle__gantry robo-cradle__gantry--left" aria-hidden="true" />
        <span className="robo-cradle__gantry robo-cradle__gantry--right" aria-hidden="true" />
        <span className="robo-cradle__wire robo-cradle__wire--one" aria-hidden="true" />
        <span className="robo-cradle__wire robo-cradle__wire--two" aria-hidden="true" />
        <button className="robo-cradle__button" type="button" onClick={assemble} aria-label={formatRobo(copy.assembleAria, { amount: clickPowerLabel })} data-testid="robo-assemble">
          <span className="robo-cradle__jig" aria-hidden="true" />
          <span className="robo-cradle__heart" aria-hidden="true" />
          <img src={robotImageSrc} alt="" draggable={false} />
          <span className="robo-cradle__cta">{copy.assemble} <strong>+{clickPowerLabel}</strong></span>
        </button>
        {pulse > 0 && <span key={pulse} className="robo-assembly-burst" aria-hidden="true" onAnimationEnd={(event) => { if (event.target === event.currentTarget) setPulse(0); }}>
          {Array.from({ length: 8 }, (_, index) => <i key={index} style={{ '--spark-angle': `${index * 45}deg` } as CSSProperties} />)}
        </span>}
        <span className="robo-cradle__steam" aria-hidden="true"><i /><i /><i /></span>
        <span className="robo-cradle__appearance" aria-hidden="true">{robotAppearanceName}</span>
        {effectsLayer}
      </div>

      <div className="robo-charge-panel" title={guide.chargeHelp}>
        <div className="robo-charge-panel__meter">
          <div className="robo-charge-panel__labels"><span>{copy.charge}</span><strong>{Math.floor(safeCharge)}/{safeMaxCharge}</strong></div>
          <div className="robo-progress" role="progressbar" aria-label={copy.charge} aria-valuemin={0} aria-valuemax={safeMaxCharge} aria-valuenow={safeCharge}>
            <span style={{ width: `${chargePercent}%` }} />
          </div>
        </div>
        <button className="robo-overclock" type="button" onClick={onOverclock} disabled={!canOverclock || overclockActive} aria-pressed={overclockActive}>
          <span className="robo-overclock__icon" aria-hidden="true"><Icon name="sparkles" size={18} /></span>
          <span><strong>{copy.overclock}</strong><small>{overclockStatusLabel || copy.overclockDetail}</small></span>
        </button>
      </div>
      <p className="robo-stage-help">{guide.batchHelp}</p>
      <div className="robo-click-readout"><Icon name="click" size={16} /><span>{copy.eachPress}</span><strong>+{clickPowerLabel} RG</strong></div>
      {worldSwitch}
    </section>
  );
}
