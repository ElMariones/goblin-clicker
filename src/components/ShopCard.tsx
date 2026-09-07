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
  /** Localized current mastery tier, for example "Established" or "Veteran". */
  levelLabel: string;
  /** Ready-to-render active multiplier, for example "×1.25". */
  multiplierLabel: string;
  /** Ready-to-render contribution this expansion currently adds to the all-warren mastery network. */
  networkLabel?: string;
  /** Progress through the current tier toward the next milestone, from 0 to 1. Values are clamped for display. */
  progress: number;
  /** Ready-to-render milestone progress, for example "24 / 50" or "250 / 250". */
  progressLabel: string;
  /** Omit when the expansion has reached its final mastery tier. */
  nextLevelLabel?: string;
  /** Ready-to-render multiplier unlocked at the next tier, for example "×1.5". */
  nextMultiplierLabel?: string;
  labels?: Partial<{
    heading: string;
    bonus: string;
    network: string;
    next: string;
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
  const rawMasteryProgress = masteryDetails?.progress ?? 0;
  const masteryProgress = hasNextMastery && Number.isFinite(rawMasteryProgress) ? Math.max(0, Math.min(1, rawMasteryProgress)) : masteryDetails ? 1 : 0;
  const masteryPercent = Math.round(masteryProgress * 100);
  return (
    <article
      className={`shop-card${locked ? ' shop-card--locked' : ''}${canAfford ? ' shop-card--affordable' : ''}${details ? ' shop-card--has-details' : ''}${masteryDetails ? ' shop-card--has-mastery' : ''}`}
    >
      <div className="shop-card__art" aria-hidden="true">{artSrc ? <img src={artSrc} alt="" /> : <Icon name={locked ? 'lock' : 'brood'} size={28} />}</div>
      <div className="shop-card__body">
        <div className="shop-card__topline"><h3>{name}</h3><span className="shop-card__owned" aria-label={t('shop.owned', { count: ownedLabel })}>{ownedLabel}</span></div>
        <p>{description}</p>
        <div className="shop-card__meta"><span><Icon name="cps" size={14} /> {productionLabel}/s</span>{badge && <span className="shop-card__badge">{badge}</span>}</div>
        {masteryDetails && (
          <div className={`shop-card__mastery${hasNextMastery ? '' : ' shop-card__mastery--maxed'}`}>
            <div className="shop-card__mastery-head">
              <span className="shop-card__mastery-rank">
                <Icon name="trophy" size={12} />
                <span className="shop-card__mastery-heading">{masteryLabels?.heading ?? 'Mastery'}</span>
                <strong>{masteryDetails.levelLabel}</strong>
              </span>
              <span className="shop-card__mastery-bonus">
                <small>{masteryLabels?.bonus ?? 'Production'}</small>
                <strong>{masteryDetails.multiplierLabel}</strong>
              </span>
            </div>
            <div
              className="shop-card__mastery-meter"
              role="progressbar"
              aria-label={`${masteryLabels?.heading ?? 'Mastery'}: ${masteryDetails.levelLabel}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={masteryPercent}
              aria-valuetext={masteryDetails.progressLabel}
            >
              <span className="shop-card__mastery-fill" style={{ width: `${masteryPercent}%` }} />
            </div>
            {masteryDetails.networkLabel && (
              <div className="shop-card__mastery-network">
                <span>{masteryLabels?.network ?? 'All warrens'}</span>
                <strong>{masteryDetails.networkLabel}</strong>
              </div>
            )}
            <div className="shop-card__mastery-foot">
              <span>{masteryDetails.progressLabel}</span>
              {hasNextMastery ? (
                <span className="shop-card__mastery-next">
                  <small>{masteryLabels?.next ?? 'Next'}</small>
                  <strong>{masteryDetails.nextLevelLabel}</strong>
                  {masteryDetails.nextMultiplierLabel && <em>{masteryDetails.nextMultiplierLabel}</em>}
                </span>
              ) : (
                <strong className="shop-card__mastery-complete">{masteryLabels?.maxed ?? 'Mastered'}</strong>
              )}
            </div>
          </div>
        )}
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
        <button type="button" className="shop-card__buy" onClick={(event) => { onBuy(id); if (event.detail > 0) event.currentTarget.blur(); }} disabled={locked || !canAfford} aria-describedby={details ? detailId : undefined} aria-label={t('shop.buyAria', { action: buyLabel, name, price: priceLabel })}>
          <span>{buyLabel}</span><strong><Icon name="coin" size={14} /> {priceLabel}</strong>
        </button>
        {onSell && !locked && <button type="button" className="shop-card__sell" onClick={(event) => { onSell(id); if (event.detail > 0) event.currentTarget.blur(); }} aria-describedby={details ? detailId : undefined} aria-label={t('shop.sellAria', { name })}>{t('shop.sell')}</button>}
      </div>
    </article>
  );
}
