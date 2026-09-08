import { useI18n } from '../../i18n';
import { getRoboCopy } from '../../i18n/robogoblins';
import type { RoboCircuitView } from './types';

export interface RoboCircuitsPanelProps {
  circuits: readonly RoboCircuitView[];
  onBuyBottleneck: (id: RoboCircuitView['id']) => void;
  title?: string;
  subtitle?: string;
  onOpenBlueprints?: () => void;
  onOpenKernel?: () => void;
}

export function RoboCircuitsPanel({ circuits, onBuyBottleneck, title, subtitle, onOpenBlueprints, onOpenKernel }: RoboCircuitsPanelProps) {
  const { language } = useI18n();
  const copy = getRoboCopy(language);
  return (
    <section className="robo-circuits-panel" aria-labelledby="robo-circuits-heading" data-testid="robo-circuits-panel">
      <header><div><span>{copy.foundry}</span><h2 id="robo-circuits-heading">{title ?? copy.circuits}</h2><p>{subtitle ?? copy.circuitsSubtitle}</p></div></header>
      <div className="robo-circuit-list">
        {circuits.map((circuit) => (
          <article key={circuit.id} className={`robo-circuit robo-circuit--${circuit.id}`}>
            <div className="robo-circuit__header"><div><strong>{circuit.name}</strong><span>{circuit.tierLabel}</span></div><b>{circuit.bonusLabel}</b></div>
            <div className="robo-circuit__wire" aria-hidden="true"><i /><i /><i /></div>
            <div className="robo-circuit__members" role="list" aria-label={`${circuit.name}: ${circuit.tierProgressLabel}`}>
              {circuit.members.map((member) => <div key={member.id} className={member.ready ? 'is-ready' : ''} role="listitem"><i aria-hidden="true" /><span>{member.name}</span><strong>{member.ownedLabel}</strong></div>)}
            </div>
            <div className="robo-circuit__footer">
              <span>{circuit.bottleneckLabel ?? circuit.tierProgressLabel}</span>
              {circuit.bottleneckCostLabel && <button type="button" onClick={() => onBuyBottleneck(circuit.id)} disabled={!circuit.canBuyBottleneck}><strong>{circuit.bottleneckCostLabel} RG</strong></button>}
            </div>
          </article>
        ))}
      </div>
      {(onOpenBlueprints || onOpenKernel) && <div className="robo-panel-actions">
        {onOpenBlueprints && <button type="button" onClick={onOpenBlueprints}>{copy.blueprints}</button>}
        {onOpenKernel && <button type="button" className="is-kernel" onClick={onOpenKernel}>{copy.kernel}</button>}
      </div>}
    </section>
  );
}
