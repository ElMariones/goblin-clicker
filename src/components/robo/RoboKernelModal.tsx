import { useEffect, useRef, useState } from 'react';
import { Modal } from '../Modal';
import { Icon } from '../Icon';
import { useI18n } from '../../i18n';
import { formatRobo, getRoboCopy } from '../../i18n/robogoblins';
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
  const { language } = useI18n();
  const copy = getRoboCopy(language);
  const [confirming, setConfirming] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (confirming) cancelRef.current?.focus(); }, [confirming]);
  const close = () => { setConfirming(false); onClose(); };
  const confirm = () => { onRecompile(); setConfirming(false); };
  return (
    <Modal open={open} title={copy.kernel} subtitle={`${coresLabel} ${copy.kernelCores} · ${totalEarnedLabel} ${copy.earned}`} icon={<Icon name="memory" />} onClose={close} size="lg" className={`robo-modal robo-kernel-modal${confirming ? ' is-confirming' : ''}`}>
      {confirming ? <div className="robo-recompile-confirm" data-testid="robo-recompile-confirm" onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setConfirming(false); } }}>
        <span className="robo-recompile-confirm__disc" aria-hidden="true"><Icon name="memory" size={34} /></span>
        <span className="robo-recompile-confirm__eyebrow">{copy.memoryTransfer}</span>
        <h3>{copy.recompileQuestion}</h3>
        <p>{copy.recompileWarning}</p>
        <div className="robo-recompile-confirm__gain"><strong>+{preview.gainLabel}</strong><span>{copy.kernelCores}</span></div>
        <div className="robo-recompile-confirm__scope"><div><strong>{copy.resets}</strong>{preview.resetItems.map((item) => <span key={item}>{item}</span>)}</div><div><strong>{copy.preserves}</strong>{preview.preservedItems.map((item) => <span key={item}>{item}</span>)}</div></div>
        <div className="robo-recompile-confirm__actions"><button ref={cancelRef} type="button" onClick={() => setConfirming(false)}>{copy.cancel}</button><button type="button" className="is-confirm" onClick={confirm}>{copy.confirm} · +{preview.gainLabel}</button></div>
      </div> : <>
        <section className="robo-kernel-hero">
          <div><span>{copy.currentKernel}</span><strong>{coresLabel}</strong><small>{copy.kernelCores}</small></div><i aria-hidden="true" />
          <div><span>{copy.recompileGain}</span><strong>+{claimableCoresLabel}</strong><small>{preview.currentMultiplierLabel} → {preview.nextMultiplierLabel}</small></div>
          <button type="button" onClick={() => setConfirming(true)} disabled={!canRecompile}>{canRecompile ? `${copy.recompile} · +${claimableCoresLabel}` : nextCoreLabel ?? copy.recompile}</button>
        </section>
        <div className="robo-kernel-grid">{perks.map((perk) => {
          const maxed = perk.rank >= perk.maxRank;
          return <article key={perk.id} className={`robo-kernel-perk${perk.affordable ? ' is-affordable' : ''}${maxed ? ' is-maxed' : ''}`}>
            <div className="robo-kernel-perk__header"><span aria-hidden="true">{perk.icon ?? <Icon name="memory" size={19} />}</span><div><small>{formatRobo(copy.rank, { rank: perk.rank, max: perk.maxRank })}</small><h3>{perk.name}</h3></div></div>
            <p>{perk.description}</p><strong>{perk.effectLabel}</strong>
            <div className="robo-kernel-perk__pips" aria-label={formatRobo(copy.rankAria, { rank: perk.rank, max: perk.maxRank })}>{Array.from({ length: perk.maxRank }, (_, index) => <i key={index} className={index < perk.rank ? 'is-filled' : ''} />)}</div>
            <button type="button" onClick={() => onBuyPerk(perk.id)} disabled={maxed || !perk.affordable}>{maxed ? copy.maxed : `${perk.costLabel} ${copy.cores}`}</button>
          </article>;
        })}</div>
      </>}
    </Modal>
  );
}
