import { useId, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { Icon } from './Icon';
import { Modal } from './Modal';

export interface PrestigePerkView { id: string; name: string; description: string; levelLabel: string; priceLabel: string; affordable: boolean; maxed?: boolean }
export interface PrestigeModalProps { open: boolean; currentCurrencyLabel: string; gainLabel: string; requirementLabel?: string; canPrestige: boolean; perks: PrestigePerkView[]; onPrestige: () => void; onBuyPerk: (id: string) => void; onClose: () => void }

export function PrestigeModal({ open, currentCurrencyLabel, gainLabel, requirementLabel, canPrestige, perks, onPrestige, onBuyPerk, onClose }: PrestigeModalProps) {
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const confirmTitleId = useId();
  const confirmDescriptionId = useId();
  const beginButtonRef = useRef<HTMLButtonElement>(null);

  const confirmPrestige = () => {
    setConfirming(false);
    onPrestige();
  };

  const closeModal = () => {
    setConfirming(false);
    onClose();
  };

  const cancelConfirmation = () => {
    setConfirming(false);
    window.setTimeout(() => beginButtonRef.current?.focus(), 0);
  };

  return (
    <Modal open={open} onClose={closeModal} title={t('prestige.title')} subtitle={t('prestige.subtitle')} icon={<Icon name="crown" />} size="lg" className={`prestige-modal${confirming ? ' prestige-modal--confirming' : ''}`}>
      {confirming ? (
        <section className="prestige-confirm" role="group" aria-labelledby={confirmTitleId} aria-describedby={confirmDescriptionId} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancelConfirmation(); } }}>
          <span className="prestige-confirm__scan" aria-hidden="true" />
          <div className="prestige-confirm__sigil" aria-hidden="true"><Icon name="crown" size={38} /></div>
          <span className="prestige-confirm__eyebrow">{t('prestige.confirmEyebrow')}</span>
          <h3 id={confirmTitleId}>{t('prestige.confirmTitle')}</h3>
          <p id={confirmDescriptionId}>{t('prestige.confirm', { gain: gainLabel })}</p>
          <div className="prestige-confirm__gain" aria-label={t('prestige.confirmGainAria', { gain: gainLabel })}>
            <span>+{gainLabel}</span>
            <small>{t('prestige.cunning')}</small>
          </div>
          <div className="prestige-confirm__actions">
            <button className="secondary-button prestige-confirm__cancel" type="button" autoFocus onClick={cancelConfirmation}>{t('prestige.cancel')}</button>
            <button className="prestige-confirm__accept" type="button" onClick={confirmPrestige}><Icon name="crown" size={17} /> {t('prestige.confirmAccept')}</button>
          </div>
        </section>
      ) : (
        <>
          <section className="prestige-hero">
            <div className="prestige-hero__sigil"><Icon name="crown" size={34} /></div>
            <div className="prestige-hero__copy"><span>{t('prestige.cunning')}</span><strong>{currentCurrencyLabel}</strong><small>{t('prestige.permanentCurrency')}</small></div>
            <div className="prestige-hero__gain"><span>{t('prestige.resetNow')}</span><strong>+{gainLabel}</strong>{requirementLabel && <small>{requirementLabel}</small>}</div>
            <button ref={beginButtonRef} className="prestige-button" type="button" disabled={!canPrestige} onClick={() => setConfirming(true)}><Icon name="crown" size={18} /> {t('prestige.begin')}</button>
          </section>
          <div className="prestige-warning"><strong>{t('prestige.whatResets')}</strong><span>{t('prestige.resetInfo')}</span></div>
          <section className="prestige-perks" aria-labelledby="prestige-perks-title">
            <div className="modal-section-heading"><div><span>{t('prestige.bloodline')}</span><h3 id="prestige-perks-title">{t('prestige.perks')}</h3></div><Icon name="sparkles" /></div>
            <div className="prestige-perk-grid">
              {perks.map((perk) => <article className="prestige-perk" key={perk.id}><div><span className="tier-badge">{perk.levelLabel}</span><h4>{perk.name}</h4><p>{perk.description}</p></div><button type="button" onClick={() => onBuyPerk(perk.id)} disabled={perk.maxed || !perk.affordable}>{perk.maxed ? t('prestige.maxed') : <><Icon name="crown" size={14} /> {perk.priceLabel}</>}</button></article>)}
            </div>
          </section>
        </>
      )}
    </Modal>
  );
}
