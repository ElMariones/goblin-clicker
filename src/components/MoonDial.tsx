import type { MooncapFamily } from '../game';
import { Icon } from './Icon';

export interface MoonDialProps {
  charge: number;
  maxCharge: number;
  bias: MooncapFamily | null;
  canHasten: boolean;
  canExtend: boolean;
  onHasten: () => void;
  onExtend: () => void;
  onBias: (family: MooncapFamily) => void;
  labels: {
    title: string;
    charge: string;
    hasten: string;
    extend: string;
    bias: string;
    family: Record<MooncapFamily, string>;
  };
}

const FAMILIES: readonly MooncapFamily[] = ['clutch', 'frenzy', 'blood', 'oracle'];

export function MoonDial({ charge, maxCharge, bias, canHasten, canExtend, onHasten, onExtend, onBias, labels }: MoonDialProps) {
  const filled = Math.max(0, Math.min(maxCharge, Math.floor(charge)));
  return (
    <section className="moon-dial" aria-label={labels.title}>
      <div className="moon-dial__header">
        <span><Icon name="totem" size={14} /> {labels.title}</span>
        <strong>{labels.charge}: {filled}/{maxCharge}</strong>
      </div>
      <div className="moon-dial__charge" aria-hidden="true">
        {Array.from({ length: maxCharge }, (_, index) => <i key={index} className={index < filled ? 'is-filled' : ''} />)}
      </div>
      <div className="moon-dial__actions">
        <button type="button" onClick={onHasten} disabled={!canHasten || filled < 3}><Icon name="hourglass" size={13} /> {labels.hasten}<small>−3</small></button>
        <button type="button" onClick={onExtend} disabled={!canExtend || filled < 2}><Icon name="sparkles" size={13} /> {labels.extend}<small>−2</small></button>
      </div>
      <div className="moon-dial__bias">
        <span>{labels.bias}</span>
        <div role="group" aria-label={labels.bias}>
          {FAMILIES.map((family) => (
            <button key={family} type="button" className={bias === family ? 'is-active' : ''} disabled={filled < 2 || bias === family} onClick={() => onBias(family)} aria-pressed={bias === family}>
              {labels.family[family]} <small>−2</small>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
