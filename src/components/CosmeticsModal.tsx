import type { CSSProperties } from 'react';
import { useI18n } from '../i18n';
import { Icon } from './Icon';
import { Modal } from './Modal';

export interface CosmeticView {
  id: string;
  name: string;
  description: string;
  imageSrc: string;
  priceLabel?: string;
  owned: boolean;
  equipped: boolean;
  affordable: boolean;
  isDefault?: boolean;
}

export interface CosmeticsModalProps {
  open: boolean;
  currencyLabel: string;
  cosmetics: CosmeticView[];
  onPurchase: (id: string) => void;
  onEquip: (id: string | null) => void;
  onClose: () => void;
}

export function CosmeticsModal({ open, currencyLabel, cosmetics, onPurchase, onEquip, onClose }: CosmeticsModalProps) {
  const { t } = useI18n();
  const equipped = cosmetics.find((cosmetic) => cosmetic.equipped) ?? cosmetics[0];

  return (
    <Modal open={open} onClose={onClose} title={t('cosmetics.title')} subtitle={t('cosmetics.subtitle')} icon={<Icon name="shop" />} size="lg" className="cosmetics-modal">
      <section className="cosmetics-hero">
        <div className="cosmetics-hero__preview" aria-hidden="true">
          {equipped && <img key={equipped.id} src={equipped.imageSrc} alt="" draggable={false} />}
        </div>
        <div className="cosmetics-hero__copy">
          <span>{t('cosmetics.currentLook')}</span>
          <strong>{equipped?.name ?? t('cosmetics.defaultName')}</strong>
          <small>{t('cosmetics.permanentHint')}</small>
        </div>
        <div className="cosmetics-hero__currency" aria-label={t('cosmetics.currencyAria', { amount: currencyLabel })}>
          <Icon name="crown" size={18} />
          <span>{t('cosmetics.cunning')}</span>
          <strong>{currencyLabel}</strong>
        </div>
      </section>

      <div className="modal-section-heading cosmetics-heading">
        <div><span>{t('cosmetics.wardrobe')}</span><h3>{t('cosmetics.collection')}</h3></div>
        <small>{t('cosmetics.ownedHint')}</small>
      </div>

      <div className="cosmetics-grid" role="list">
        {cosmetics.map((cosmetic, index) => {
          const state = cosmetic.equipped ? 'equipped' : cosmetic.owned ? 'owned' : cosmetic.affordable ? 'affordable' : 'locked';
          return (
            <article className={`cosmetic-card cosmetic-card--${state}`} key={cosmetic.id} role="listitem" style={{ '--cosmetic-delay': `${Math.min(index, 10) * 24}ms` } as CSSProperties}>
              <div className="cosmetic-card__art">
                <span className="cosmetic-card__scan" aria-hidden="true" />
                <img src={cosmetic.imageSrc} alt="" draggable={false} />
                {cosmetic.equipped && <span className="cosmetic-card__equipped-badge"><Icon name="sparkles" size={12} /> {t('cosmetics.equipped')}</span>}
              </div>
              <div className="cosmetic-card__body">
                <div className="cosmetic-card__title-row">
                  <h4>{cosmetic.name}</h4>
                  {cosmetic.isDefault ? <span className="cosmetic-card__tag">{t('cosmetics.defaultTag')}</span> : cosmetic.owned ? <span className="cosmetic-card__tag">{t('cosmetics.owned')}</span> : null}
                </div>
                <p>{cosmetic.description}</p>
              </div>
              {cosmetic.owned ? (
                <button className={`cosmetic-card__action${cosmetic.equipped ? ' is-equipped' : ''}`} type="button" onClick={() => onEquip(cosmetic.equipped && !cosmetic.isDefault ? null : cosmetic.isDefault ? null : cosmetic.id)} disabled={cosmetic.equipped && cosmetic.isDefault} aria-pressed={cosmetic.equipped}>
                  <Icon name={cosmetic.equipped ? 'sparkles' : 'brood'} size={14} />
                  {cosmetic.equipped ? cosmetic.isDefault ? t('cosmetics.equipped') : t('cosmetics.unequip') : t('cosmetics.equip')}
                </button>
              ) : (
                <button className="cosmetic-card__action cosmetic-card__action--buy" type="button" onClick={() => onPurchase(cosmetic.id)} disabled={!cosmetic.affordable}>
                  <Icon name="crown" size={14} />
                  <span>{t('cosmetics.buy')}</span>
                  <strong>{cosmetic.priceLabel}</strong>
                </button>
              )}
            </article>
          );
        })}
      </div>
    </Modal>
  );
}
