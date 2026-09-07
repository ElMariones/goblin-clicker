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

export interface ShopCardProps {
  id: string; name: string; description: string; ownedLabel: string; priceLabel: string; productionLabel: string;
  canAfford: boolean; onBuy: (id: string) => void; onSell?: (id: string) => void; locked?: boolean; badge?: string; artSrc?: string; buyAmountLabel?: string;
  productionDetails?: ShopCardProductionDetails;
}

export function ShopCard({ id, name, description, ownedLabel, priceLabel, productionLabel, canAfford, onBuy, onSell, locked = false, badge, artSrc, buyAmountLabel, productionDetails }: ShopCardProps) {
  const { t } = useI18n();
  const buyLabel = buyAmountLabel ?? t('shop.buy', { count: 1 });
  const detailId = `shop-production-${id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const details = !locked ? productionDetails : undefined;
  const labels = details?.labels;
  return (
    <article
      className={`shop-card${locked ? ' shop-card--locked' : ''}${canAfford ? ' shop-card--affordable' : ''}${details ? ' shop-card--has-details' : ''}`}
      tabIndex={details ? 0 : undefined}
      aria-describedby={details ? detailId : undefined}
    >
      <div className="shop-card__art" aria-hidden="true">{artSrc ? <img src={artSrc} alt="" /> : <Icon name={locked ? 'lock' : 'brood'} size={28} />}</div>
      <div className="shop-card__body">
        <div className="shop-card__topline"><h3>{name}</h3><span className="shop-card__owned" aria-label={t('shop.owned', { count: ownedLabel })}>{ownedLabel}</span></div>
        <p>{description}</p>
        <div className="shop-card__meta"><span><Icon name="cps" size={14} /> {productionLabel}/s</span>{badge && <span className="shop-card__badge">{badge}</span>}</div>
      </div>
      {details && (
        <div className="shop-card__details" id={detailId} role="tooltip">
          <div className="shop-card__details-header">
            <span className="shop-card__details-title">
              <strong>{name}</strong>
              <small>{labels?.heading ?? 'Production telemetry'}</small>
            </span>
            <strong className="shop-card__details-count">×{ownedLabel}</strong>
          </div>
          <dl className="shop-card__details-grid">
            <div><dt>{labels?.perUnit ?? 'Each'}</dt><dd>{details.perUnit}</dd></div>
            <div><dt>{labels?.ownedTotal ?? 'Owned total'}</dt><dd>{details.ownedTotal}</dd></div>
            <div><dt>{labels?.shareOfTotal ?? 'Share of CPS'}</dt><dd>{details.shareOfTotal}</dd></div>
            <div><dt>{labels?.lifetimeProduced ?? 'Lifetime output'}</dt><dd>{details.lifetimeProduced}</dd></div>
          </dl>
        </div>
      )}
      <div className="shop-card__actions">
        <button type="button" className="shop-card__buy" onClick={() => onBuy(id)} disabled={locked || !canAfford} aria-describedby={details ? detailId : undefined} aria-label={t('shop.buyAria', { action: buyLabel, name, price: priceLabel })}>
          <span>{buyLabel}</span><strong><Icon name="coin" size={14} /> {priceLabel}</strong>
        </button>
        {onSell && !locked && <button type="button" className="shop-card__sell" onClick={() => onSell(id)} aria-describedby={details ? detailId : undefined} aria-label={t('shop.sellAria', { name })}>{t('shop.sell')}</button>}
      </div>
    </article>
  );
}
