import type { MooncapFamily } from '../game';
import { mooncapArt } from '../utils/assets';
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
    actions: string;
    tuning: string;
    full: string;
    ready: string;
    family: Record<MooncapFamily, string>;
    familyDetail: Record<MooncapFamily, string>;
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
      size="md"
      className={`moon-dial-modal${isFull ? ' moon-dial-modal--full' : ''}`}
    >
      <div className="moon-dial-panel">
        <div className="moon-dial-panel__reservoir" aria-label={`${labels.charge}: ${filled}/${maxCharge}`}>
          <div className="moon-dial-panel__lunar-core" aria-hidden="true">
            <span className="moon-dial-panel__orbit-ring" />
            <span className="moon-dial-panel__moon"><Icon name="moon" size={48} /></span>
          </div>
          <div className="moon-dial-panel__charge-readout">
            <span>{labels.charge}</span>
            <strong>{filled}<small>/{maxCharge}</small></strong>
            <div className="moon-dial-panel__charges" aria-hidden="true">
              {Array.from({ length: maxCharge }, (_, index) => <i key={index} className={index < filled ? 'is-filled' : ''} />)}
            </div>
          </div>
          <span className={`moon-dial-panel__state${isFull ? ' is-full' : ''}`}>
            <Icon name={isFull ? 'sparkles' : 'moon'} size={15} />
            {isFull ? labels.full : labels.ready}
          </span>
        </div>

        <div className="moon-dial-panel__section-heading"><span>{labels.actions}</span><i /></div>
        <div className="moon-dial-panel__actions">
          <button className="moon-action moon-action--hasten" type="button" onClick={onHasten} disabled={!canHasten || filled < 3}>
            <span className="moon-action__icon"><Icon name="hourglass" size={20} /></span>
            <span className="moon-action__copy"><strong>{labels.hasten}</strong><small>−3 {labels.charge}</small></span>
          </button>
          <button className="moon-action moon-action--extend" type="button" onClick={onExtend} disabled={!canExtend || filled < 2}>
            <span className="moon-action__icon"><Icon name="sparkles" size={20} /></span>
            <span className="moon-action__copy"><strong>{labels.extend}</strong><small>−2 {labels.charge}</small></span>
          </button>
        </div>

        <div className="moon-dial-panel__bias">
          <div className="moon-dial-panel__section-heading"><span>{labels.tuning}</span><i /><small>{labels.bias}</small></div>
          <div className="moon-dial-panel__families" role="group" aria-label={labels.bias}>
            {FAMILIES.map((family) => (
              <button key={family} type="button" className={`moon-family moon-family--${family}${bias === family ? ' is-active' : ''}`} disabled={filled < 2 || bias === family} onClick={() => onBias(family)} aria-pressed={bias === family}>
                <span className="moon-family__art" aria-hidden="true"><img src={mooncapArt[family]} alt="" draggable={false} /></span>
                <span className="moon-family__copy"><strong>{labels.family[family]}</strong><small>{labels.familyDetail[family]}</small></span>
                <span className="moon-family__cost">−2</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
