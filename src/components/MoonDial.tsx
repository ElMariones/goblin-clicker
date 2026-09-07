import type { MooncapFamily } from '../game';
import { Icon } from './Icon';
import { Modal } from './Modal';

export interface MoonDialProps {
  charge: number;
  maxCharge: number;
  onOpen: () => void;
  labels: {
    title: string;
    charge: string;
  };
}

export interface MoonDialModalProps {
  open: boolean;
  charge: number;
  maxCharge: number;
  bias: MooncapFamily | null;
  canHasten: boolean;
  canExtend: boolean;
  onHasten: () => void;
  onExtend: () => void;
  onBias: (family: MooncapFamily) => void;
  onClose: () => void;
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

export function MoonDial({ charge, maxCharge, onOpen, labels }: MoonDialProps) {
  const filled = Math.max(0, Math.min(maxCharge, Math.floor(charge)));
  const isFull = filled >= maxCharge;
  return (
    <button
      className={`moon-dial${isFull ? ' moon-dial--full' : ''}`}
      type="button"
      onClick={onOpen}
      aria-label={`${labels.title} · ${labels.charge} ${filled}/${maxCharge}`}
    >
      <span className="moon-dial__orbit" aria-hidden="true">
        {Array.from({ length: maxCharge }, (_, index) => <i key={index} className={index < filled ? 'is-filled' : ''} />)}
      </span>
      <span className="moon-dial__moon" aria-hidden="true"><Icon name="moon" size={34} /></span>
    </button>
  );
}

export function MoonDialModal({ open, charge, maxCharge, bias, canHasten, canExtend, onHasten, onExtend, onBias, onClose, labels }: MoonDialModalProps) {
  const filled = Math.max(0, Math.min(maxCharge, Math.floor(charge)));
  const isFull = filled >= maxCharge;
  return (
    <Modal
      open={open}
      title={labels.title}
      subtitle={`${labels.charge}: ${filled}/${maxCharge}`}
      icon={<Icon name="moon" />}
      onClose={onClose}
      size="sm"
      className={`moon-dial-modal${isFull ? ' moon-dial-modal--full' : ''}`}
    >
      <div className="moon-dial-panel">
        <div className="moon-dial-panel__reservoir" aria-label={`${labels.charge}: ${filled}/${maxCharge}`}>
          <span className="moon-dial-panel__moon" aria-hidden="true"><Icon name="moon" size={46} /></span>
          <div className="moon-dial-panel__charges" aria-hidden="true">
            {Array.from({ length: maxCharge }, (_, index) => <i key={index} className={index < filled ? 'is-filled' : ''} />)}
          </div>
          <strong>{filled}/{maxCharge}</strong>
        </div>

        <div className="moon-dial-panel__actions">
          <button type="button" onClick={onHasten} disabled={!canHasten || filled < 3}>
            <Icon name="hourglass" size={18} /><span>{labels.hasten}</span><small>−3</small>
          </button>
          <button type="button" onClick={onExtend} disabled={!canExtend || filled < 2}>
            <Icon name="sparkles" size={18} /><span>{labels.extend}</span><small>−2</small>
          </button>
        </div>

        <div className="moon-dial-panel__bias">
          <span>{labels.bias}</span>
          <div role="group" aria-label={labels.bias}>
            {FAMILIES.map((family) => (
              <button key={family} type="button" className={bias === family ? 'is-active' : ''} disabled={filled < 2 || bias === family} onClick={() => onBias(family)} aria-pressed={bias === family}>
                <span>{labels.family[family]}</span><small>−2</small>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
