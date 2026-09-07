import { useI18n } from '../i18n';
import { Icon } from './Icon';
import { Modal } from './Modal';

export interface PrestigePerkView { id: string; name: string; description: string; levelLabel: string; priceLabel: string; affordable: boolean; maxed?: boolean }
export interface PrestigeModalProps { open: boolean; currentCurrencyLabel: string; gainLabel: string; requirementLabel?: string; canPrestige: boolean; perks: PrestigePerkView[]; onPrestige: () => void; onBuyPerk: (id: string) => void; onClose: () => void }

export function PrestigeModal({ open, currentCurrencyLabel, gainLabel, requirementLabel, canPrestige, perks, onPrestige, onBuyPerk, onClose }: PrestigeModalProps) {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={t('prestige.title')} subtitle={t('prestige.subtitle')} icon={<Icon name="crown" />} size="lg">
      <section className="prestige-hero">
        <div className="prestige-hero__sigil"><Icon name="crown" size={34} /></div>
        <div className="prestige-hero__copy"><span>{t('prestige.cunning')}</span><strong>{currentCurrencyLabel}</strong><small>{t('prestige.permanentCurrency')}</small></div>
        <div className="prestige-hero__gain"><span>{t('prestige.resetNow')}</span><strong>+{gainLabel}</strong>{requirementLabel && <small>{requirementLabel}</small>}</div>
        <button className="prestige-button" type="button" disabled={!canPrestige} onClick={onPrestige}><Icon name="crown" size={18} /> {t('prestige.begin')}</button>
      </section>
      <div className="prestige-warning"><strong>{t('prestige.whatResets')}</strong><span>{t('prestige.resetInfo')}</span></div>
      <section className="prestige-perks" aria-labelledby="prestige-perks-title">
        <div className="modal-section-heading"><div><span>{t('prestige.bloodline')}</span><h3 id="prestige-perks-title">{t('prestige.perks')}</h3></div><Icon name="sparkles" /></div>
        <div className="prestige-perk-grid">
          {perks.map((perk) => <article className="prestige-perk" key={perk.id}><div><span className="tier-badge">{perk.levelLabel}</span><h4>{perk.name}</h4><p>{perk.description}</p></div><button type="button" onClick={() => onBuyPerk(perk.id)} disabled={perk.maxed || !perk.affordable}>{perk.maxed ? t('prestige.maxed') : <><Icon name="crown" size={14} /> {perk.priceLabel}</>}</button></article>)}
        </div>
      </section>
    </Modal>
  );
}
