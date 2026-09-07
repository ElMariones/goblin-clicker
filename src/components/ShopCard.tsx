import { Icon } from './Icon';

export interface ShopCardProps {
  id: string;
  name: string;
  description: string;
  ownedLabel: string;
  priceLabel: string;
  productionLabel: string;
  canAfford: boolean;
  onBuy: (id: string) => void;
  onSell?: (id: string) => void;
  locked?: boolean;
  badge?: string;
  artSrc?: string;
  buyAmountLabel?: string;
}

export function ShopCard({
  id,
  name,
  description,
  ownedLabel,
  priceLabel,
  productionLabel,
  canAfford,
  onBuy,
  onSell,
  locked = false,
  badge,
  artSrc,
  buyAmountLabel = 'Buy',
}: ShopCardProps) {
  return (
    <article className={`shop-card${locked ? ' shop-card--locked' : ''}${canAfford ? ' shop-card--affordable' : ''}`}>
      <div className="shop-card__art" aria-hidden="true">
        {artSrc ? <img src={artSrc} alt="" /> : <Icon name={locked ? 'lock' : 'brood'} size={28} />}
      </div>
      <div className="shop-card__body">
        <div className="shop-card__topline">
          <h3>{name}</h3>
          <span className="shop-card__owned" aria-label={`${ownedLabel} owned`}>{ownedLabel}</span>
        </div>
        <p>{description}</p>
        <div className="shop-card__meta">
          <span><Icon name="cps" size={14} /> {productionLabel}/s</span>
          {badge && <span className="shop-card__badge">{badge}</span>}
        </div>
      </div>
      <div className="shop-card__actions">
        <button
          type="button"
          className="shop-card__buy"
          onClick={() => onBuy(id)}
          disabled={locked || !canAfford}
          aria-label={`${buyAmountLabel} ${name} for ${priceLabel}`}
        >
          <span>{buyAmountLabel}</span>
          <strong><Icon name="coin" size={14} /> {priceLabel}</strong>
        </button>
        {onSell && !locked && (
          <button type="button" className="shop-card__sell" onClick={() => onSell(id)} aria-label={`Sell ${name}`}>
            Sell
          </button>
        )}
      </div>
    </article>
  );
}
