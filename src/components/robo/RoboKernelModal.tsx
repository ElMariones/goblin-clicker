import { useState } from 'react';
import { Modal } from '../Modal';
import { Icon } from '../Icon';
import { ROBO_COPY } from '../../i18n/robogoblins';
import type { RoboKernelPerkView, RoboRecompilePreviewView } from './types';

export interface RoboKernelModalProps {
  open: boolean;
  coresLabel: string;
  totalEarnedLabel: string;
  claimableCoresLabel: string;
  canRecompile: boolean;
  nextCoreLabel?: string;
  preview: RoboRecompilePreviewView;
  perks: readonly RoboKernelPerkView[];
  onBuyPerk: (id: string) => void;
  onRecompile: () => void;
  onClose: () => void;
}

export function RoboKernelModal({ open, coresLabel, totalEarnedLabel, claimableCoresLabel, canRecompile, nextCoreLabel, preview, perks, onBuyPerk, onRecompile, onClose }: RoboKernelModalProps) {
  const [confirming, setConfirming] = useState(false);
  const close = () => { setConfirming(false); onClose(); };
  const confirm = () => { onRecompile(); setConfirming(false); };
  return (
    <Modal open={open} title={ROBO_COPY.kernel} subtitle={`${coresLabel} ${ROBO_COPY.kernelCores} · ${totalEarnedLabel} earned`} icon={<Icon name="memory" />} onClose={close} size="lg" className={`robo-modal robo-kernel-modal${confirming ? ' is-confirming' : ''}`}>
      {confirming ? <div className="robo-recompile-confirm" data-testid="robo-recompile-confirm">
        <span className="robo-recompile-confirm__disc" aria-hidden="true"><Icon name="memory" size={34} /></span>
        <span className="robo-recompile-confirm__eyebrow">Memory transfer</span>
        <h3>Recompile this foundry?</h3>
        <p>{ROBO_COPY.recompileWarning}</p>
        <div className="robo-recompile-confirm__gain"><strong>+{preview.gainLabel}</strong><span>{ROBO_COPY.kernelCores}</span></div>
        <div className="robo-recompile-confirm__scope"><div><strong>Resets</strong>{preview.resetItems.map((item) => <span key={item}>{item}</span>)}</div><div><strong>Preserves</strong>{preview.preservedItems.map((item) => <span key={item}>{item}</span>)}</div></div>
        <div className="robo-recompile-confirm__actions"><button type="button" onClick={() => setConfirming(false)}>{ROBO_COPY.cancel}</button><button type="button" className="is-confirm" onClick={confirm}>{ROBO_COPY.confirm} · +{preview.gainLabel}</button></div>
      </div> : <>
        <section className="robo-kernel-hero">
          <div><span>Current Kernel</span><strong>{coresLabel}</strong><small>{ROBO_COPY.kernelCores}</small></div><i aria-hidden="true" />
          <div><span>Recompile gain</span><strong>+{claimableCoresLabel}</strong><small>{preview.currentMultiplierLabel} → {preview.nextMultiplierLabel}</small></div>
          <button type="button" onClick={() => setConfirming(true)} disabled={!canRecompile}>{canRecompile ? `${ROBO_COPY.recompile} · +${claimableCoresLabel}` : nextCoreLabel ?? ROBO_COPY.recompile}</button>
        </section>
        <div className="robo-kernel-grid">{perks.map((perk) => {
          const maxed = perk.rank >= perk.maxRank;
          return <article key={perk.id} className={`robo-kernel-perk${perk.affordable ? ' is-affordable' : ''}${maxed ? ' is-maxed' : ''}`}>
            <div className="robo-kernel-perk__header"><span aria-hidden="true">{perk.icon ?? <Icon name="memory" size={19} />}</span><div><small>Rank {perk.rank} / {perk.maxRank}</small><h3>{perk.name}</h3></div></div>
            <p>{perk.description}</p><strong>{perk.effectLabel}</strong>
            <div className="robo-kernel-perk__pips" aria-label={`Rank ${perk.rank} of ${perk.maxRank}`}>{Array.from({ length: perk.maxRank }, (_, index) => <i key={index} className={index < perk.rank ? 'is-filled' : ''} />)}</div>
            <button type="button" onClick={() => onBuyPerk(perk.id)} disabled={maxed || !perk.affordable}>{maxed ? ROBO_COPY.maxed : `${perk.costLabel} cores`}</button>
          </article>;
        })}</div>
      </>}
    </Modal>
  );
}
