import { useState } from 'react';
import type { ContractKind } from '../game';
import { Icon } from './Icon';
import { Modal } from './Modal';

export interface ContractView {
  id: string;
  kind: ContractKind;
  kindLabel: string;
  title: string;
  dialogue: string;
  objective: string;
  progressLabel: string;
  progressRatio: number;
  rewardLabel: string;
  complete: boolean;
}

export interface ContractModalProps {
  open: boolean;
  giverImage: string;
  contracts: ContractView[];
  completedLabel: string;
  oracleLabel?: string;
  rewardNotice?: string | null;
  rewardFxKey?: number;
  onClaim: (kind: ContractKind) => void;
  onClose: () => void;
  labels: {
    title: string;
    subtitle: string;
    progress: string;
    reward: string;
    claim: string;
    working: string;
    complete: string;
  };
}

export function ContractModal({ open, giverImage, contracts, completedLabel, oracleLabel, rewardNotice, rewardFxKey = 0, onClaim, onClose, labels }: ContractModalProps) {
  const initialKind = contracts.find((contract) => contract.complete)?.kind ?? contracts[0]?.kind ?? 'quick';
  const [selectedKind, setSelectedKind] = useState<ContractKind>(initialKind);

  const selected = contracts.find(({ kind }) => kind === selectedKind) ?? contracts[0];
  if (!selected) return null;

  return (
    <Modal
      open={open}
      title={labels.title}
      subtitle={labels.subtitle}
      icon={<Icon name="clutch" />}
      onClose={onClose}
      size="lg"
      className="contract-modal"
    >
      <div className="contract-terminal">
        <aside className="contract-giver-portrait" aria-hidden="true">
          <span className="contract-giver-portrait__scan" />
          <img src={giverImage} alt="" draggable={false} />
          <span className="contract-giver-portrait__badge">DIRECTORATE</span>
        </aside>

        <section className="contract-order" key={`${selected.id}-${rewardFxKey}`}>
          <div className="contract-order__topline">
            <span>{selected.kindLabel}</span>
            <strong>{selected.complete ? labels.complete : labels.working}</strong>
          </div>
          <h3>{selected.title}</h3>
          <p className="contract-order__dialogue">{selected.dialogue}</p>
          <div className="contract-order__objective">
            <span>{labels.progress}</span>
            <strong>{selected.objective}</strong>
            <div className="contract-progress" aria-label={selected.progressLabel}>
              <span style={{ width: `${Math.round(selected.progressRatio * 100)}%` }} />
            </div>
            <small>{selected.progressLabel}</small>
          </div>
          <div className="contract-order__reward">
            <span><Icon name="brood" size={16} /> {labels.reward}</span>
            <strong>{selected.rewardLabel}</strong>
          </div>
          {oracleLabel && <div className="contract-oracle-boost"><Icon name="totem" size={15} /> {oracleLabel}</div>}
          <button className="contract-claim-button" type="button" disabled={!selected.complete} onClick={() => onClaim(selected.kind)}>
            <Icon name="clutch" size={17} />
            {labels.claim}
          </button>
          {rewardNotice && <div className="contract-reward-stamp" role="status" key={`${rewardNotice}-${rewardFxKey}`}>{rewardNotice}</div>}
        </section>
      </div>

      <nav className="contract-tabs" aria-label={labels.title}>
        {contracts.map((contract) => (
          <button
            key={contract.kind}
            type="button"
            className={`${selected.kind === contract.kind ? 'is-active ' : ''}${contract.complete ? 'is-complete' : ''}`.trim()}
            onClick={() => setSelectedKind(contract.kind)}
            aria-pressed={selected.kind === contract.kind}
          >
            <span>{contract.kindLabel}</span>
            <strong>{contract.title}</strong>
            <div className="contract-tab-progress"><i style={{ width: `${Math.round(contract.progressRatio * 100)}%` }} /></div>
          </button>
        ))}
      </nav>

      <div className="contract-footer-stat"><Icon name="trophy" size={14} /> {completedLabel}</div>
    </Modal>
  );
}
