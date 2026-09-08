import { Icon } from '../Icon';
import { useI18n } from '../../i18n';
import { getRoboCopy } from '../../i18n/robogoblins';
import type { RoboAssemblyLineView, RoboBuyAmount } from './types';

export interface RoboAssemblyShopProps {
  lines: readonly RoboAssemblyLineView[];
  buyAmount: RoboBuyAmount;
  onBuyAmountChange: (amount: RoboBuyAmount) => void;
  onBuy: (id: string) => void;
  onBuyNextMilestone: (id: string) => void;
  title?: string;
  footer?: string;
}

const BUY_AMOUNTS: readonly RoboBuyAmount[] = [1, 10, 100, 'max'];

function clampPercent(value: number) { return Math.max(0, Math.min(100, (Number.isFinite(value) ? value : 0) * 100)); }

export function RoboAssemblyShop({ lines, buyAmount, onBuyAmountChange, onBuy, onBuyNextMilestone, title, footer }: RoboAssemblyShopProps) {
  const { language } = useI18n();
  const copy = getRoboCopy(language);
  return (
    <section className="robo-shop" aria-labelledby="robo-shop-heading" data-testid="robo-assembly-shop">
      <header className="robo-shop__header">
        <div><span>{copy.world}</span><h2 id="robo-shop-heading">{title ?? copy.assemblyLines}</h2></div>
        <div className="robo-buy-selector" role="group" aria-label={copy.purchaseQuantity}>
          {BUY_AMOUNTS.map((amount) => <button key={amount} type="button" onClick={() => onBuyAmountChange(amount)} className={buyAmount === amount ? 'is-active' : ''} aria-pressed={buyAmount === amount}>{amount === 'max' ? copy.max : amount}</button>)}
        </div>
      </header>
      <div className="robo-shop__list">
        {lines.map((line) => {
          const progress = clampPercent(line.batchProgress);
          return (
            <article key={line.id} className={`robo-line-card robo-line-card--${line.circuit}${line.locked ? ' is-locked' : ''}${line.canAfford ? ' is-affordable' : ''}`} data-testid={`robo-line-${line.id}`}>
              <div className="robo-line-card__art" aria-hidden="true">
                {line.artSrc ? <img src={line.artSrc} alt="" draggable={false} /> : <Icon name="lock" size={24} />}
                <span className="robo-line-card__socket" />
              </div>
              <div className="robo-line-card__body">
                <div className="robo-line-card__topline"><h3>{line.name}</h3><strong className="robo-line-card__owned">{line.ownedLabel}</strong></div>
                <p>{line.locked ? line.lockLabel ?? copy.locked : line.description}</p>
                {!line.locked && <>
                  <div className="robo-line-card__telemetry"><span><Icon name="cps" size={12} /> {line.averageRateLabel}/s</span>{line.masteryLabel && <span className="robo-line-card__mastery">{line.masteryLabel}{line.masteryFactorLabel ? ` · ${line.masteryFactorLabel}` : ''}</span>}</div>
                  <div className="robo-batch" aria-label={`${line.nextBatchLabel}. ${line.pendingLabel}`}>
                    <div className="robo-batch__labels"><span>{line.nextBatchLabel}</span><small>{line.pendingLabel}</small></div>
                    <div className="robo-batch__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>
                  </div>
                </>}
              </div>
              <div className="robo-line-card__actions">
                <button type="button" className="robo-line-card__buy" onClick={() => onBuy(line.id)} disabled={Boolean(line.locked) || !line.canAfford}>
                  <span>{line.buyQuantityLabel}</span><strong>{line.priceLabel} RG</strong>
                </button>
                {line.nextMilestoneLabel && !line.locked && <button type="button" className="robo-line-card__milestone" onClick={() => onBuyNextMilestone(line.id)} disabled={!line.canBuyNextMilestone}>
                  <span>{copy.nextMilestone}</span><strong>{line.nextMilestoneLabel}</strong>{line.nextMilestoneCostLabel && <small>{line.nextMilestoneCostLabel} RG</small>}
                </button>}
              </div>
            </article>
          );
        })}
      </div>
      <footer className="robo-shop__footer">{footer ?? copy.noSelling}</footer>
    </section>
  );
}
