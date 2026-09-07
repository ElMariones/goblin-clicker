import { useI18n } from '../i18n';
import { Icon } from './Icon';

export interface ShopCardProductionDetails {
  /** Ready-to-render values. Include units/suffixes here (for example "12.5/s" or "38.2%"). */
  perUnit: string;
  ownedTotal: string;
  shareOfTotal: string;
  lifetimeProduced: string;
  labels?: Partial<{
    heading: string;
    perUnit: string;
    ownedTotal: string;
    shareOfTotal: string;
    lifetimeProduced: string;
  }>;
}

export interface ShopCardMasteryDetails {
  /** Stable mastery id used for the compact owned-count visual treatment. */
  tierId: 'unranked' | 'established' | 'thriving' | 'veteran' | 'renowned' | 'elite' | 'legendary' | 'ancestral' | 'mythic';
  /** Localized current mastery tier, for example "Established" or "Veteran". */
  levelLabel: string;
  /** Ready-to-render active multiplier, for example "×1.25". */
  multiplierLabel: string;
  /** Ready-to-render contribution this expansion currently adds to the all-warren mastery network. */
  networkLabel?: string;
  /** Ready-to-render milestone progress, for example "24 / 50" or "250 / 250". */
  progressLabel: string;
  /** Omit when the expansion has reached its final mastery tier. */
  nextLevelLabel?: string;
  labels?: Partial<{
    heading: string;
    network: string;
    maxed: string;
  }>;
}

export interface ShopCardProps {
  id: string; name: string; description: string; ownedLabel: string; priceLabel: string; productionLabel: string;
  canAfford: boolean; onBuy: (id: string) => void; onSell?: (id: string) => void; locked?: boolean; badge?: string; artSrc?: string; buyAmountLabel?: string;
  productionDetails?: ShopCardProductionDetails;
  mastery?: ShopCardMasteryDetails;
}

export function ShopCard({ id, name, description, ownedLabel, priceLabel, productionLabel, canAfford, onBuy, onSell, locked = false, badge, artSrc, buyAmountLabel, productionDetails, mastery }: ShopCardProps) {
  const { t } = useI18n();
  const buyLabel = buyAmountLabel ?? t('shop.buy', { count: 1 });
  const detailId = `shop-production-${id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const details = !locked ? productionDetails : undefined;
  const masteryDetails = !locked ? mastery : undefined;
  const labels = details?.labels;
  const masteryLabels = masteryDetails?.labels;
  const hasNextMastery = Boolean(masteryDetails?.nextLevelLabel);
  const hasHoverDetails = Boolean(details || masteryDetails);
  const masteryTierClass = masteryDetails ? ` shop-card__owned--${masteryDetails.tierId}` : '';
  return (
    <article
      className={`shop-card${locked ? ' shop-card--locked' : ''}${canAfford ? ' shop-card--affordable' : ''}${hasHoverDetails ? ' shop-card--has-details' : ''}`}
    >
      <div className="shop-card__art" aria-hidden="true">{artSrc ? <img src={artSrc} alt="" /> : <Icon name={locked ? 'lock' : 'brood'} size={28} />}</div>
      <div className="shop-card__body">
        <div className="shop-card__topline"><h3>{name}</h3><span className={`shop-card__owned${masteryTierClass}`} aria-label={t('shop.owned', { count: ownedLabel })}>{ownedLabel}</span></div>
        <p>{description}</p>
        <div className="shop-card__meta"><span><Icon name="cps" size={14} /> {productionLabel}/s</span>{badge && <span className="shop-card__badge">{badge}</span>}</div>
      </div>
      {hasHoverDetails && (
        <div className="shop-card__details" id={detailId} role="tooltip">
          <div className="shop-card__details-header">
            <span className="shop-card__details-title">
              <strong>{name}</strong>
              <small>{labels?.heading ?? masteryLabels?.heading ?? 'Expansion details'}</small>
            </span>
            <strong className="shop-card__details-count">×{ownedLabel}</strong>
          </div>
          {details && (
            <dl className="shop-card__details-grid">
              <div><dt>{labels?.perUnit ?? 'Each'}</dt><dd>{details.perUnit}</dd></div>
              <div><dt>{labels?.ownedTotal ?? 'Owned total'}</dt><dd>{details.ownedTotal}</dd></div>
              <div><dt>{labels?.shareOfTotal ?? 'Share of CPS'}</dt><dd>{details.shareOfTotal}</dd></div>
              <div><dt>{labels?.lifetimeProduced ?? 'Lifetime output'}</dt><dd>{details.lifetimeProduced}</dd></div>
            </dl>
          )}
          {masteryDetails && (
            <div className="shop-card__details-mastery">
              <div className="shop-card__details-mastery-line">
                <span><Icon name="trophy" size={11} /><strong>{masteryDetails.levelLabel}</strong></span>
                <strong>{masteryDetails.multiplierLabel}</strong>
              </div>
              <div className="shop-card__details-mastery-foot">
                <span>{hasNextMastery ? `${masteryDetails.progressLabel} → ${masteryDetails.nextLevelLabel}` : (masteryLabels?.maxed ?? 'Mastered')}</span>
                {masteryDetails.networkLabel && <span>{masteryLabels?.network ?? 'All warrens'} <strong>{masteryDetails.networkLabel}</strong></span>}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="shop-card__actions">
        <button type="button" className="shop-card__buy" onClick={(event) => { onBuy(id); if (event.detail > 0) event.currentTarget.blur(); }} disabled={locked || !canAfford} aria-describedby={hasHoverDetails ? detailId : undefined} aria-label={t('shop.buyAria', { action: buyLabel, name, price: priceLabel })}>
          <span>{buyLabel}</span><strong><Icon name="coin" size={14} /> {priceLabel}</strong>
        </button>
        {onSell && !locked && <button type="button" className="shop-card__sell" onClick={(event) => { onSell(id); if (event.detail > 0) event.currentTarget.blur(); }} aria-describedby={hasHoverDetails ? detailId : undefined} aria-label={t('shop.sellAria', { name })}>{t('shop.sell')}</button>}
      </div>
    </article>
  );
}
