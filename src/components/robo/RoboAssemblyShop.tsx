import { ShopCard } from '../ShopCard';
import { ROBO_GUIDE } from '../../i18n/roboGuide';
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
  const guide = ROBO_GUIDE[language];
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
            <ShopCard
              key={line.id} id={`robo-${line.id}`} name={line.name}
              description={line.locked ? line.lockLabel ?? copy.locked : line.description}
              ownedLabel={line.ownedLabel} priceLabel={`${line.priceLabel} RG`}
              productionLabel={line.averageRateLabel} canAfford={line.canAfford} locked={line.locked}
              artSrc={line.artSrc} buyAmountLabel={line.buyQuantityLabel}
              onBuy={() => onBuy(line.id)} focusableDetails detailsClassName="shop-card__details--robo"
              productionDetails={{
                perUnit: line.perRobotLabel ?? '—', ownedTotal: `${line.averageRateLabel}/s`,
                shareOfTotal: line.shareLabel ?? '—', lifetimeProduced: `${line.lifetimeLabel ?? '0'} RG`,
                labels: { heading: guide.details, perUnit: guide.perRobot, ownedTotal: copy.averageShort, shareOfTotal: guide.share, lifetimeProduced: guide.lifetime },
              }}
              mastery={{
                tierId: line.masteryFactorLabel === '×1' ? 'unranked' : 'established',
                levelLabel: line.masteryLabel ?? copy.unbolted, multiplierLabel: line.masteryFactorLabel ?? '×1',
                progressLabel: line.ownedLabel, nextLevelLabel: line.nextMilestoneCostLabel ? line.nextMilestoneLabel : undefined,
                networkLabel: copy.circuitNames[line.circuit], labels: { network: copy.circuits, maxed: copy.masteryComplete },
              }}
              detailsNote={`${guide.cycle}: ${line.cycleLabel}. ${line.nextBatchLabel}. ${line.pendingLabel}. ${guide.batchHelp}`}
              productionProgress={!line.locked && <div className="robo-batch__track" role="progressbar" aria-label={`${line.name}: ${line.nextBatchLabel}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>}
              secondaryAction={line.nextMilestoneCostLabel && !line.locked ? {
                label: copy.nextMilestone,
                title: `${line.nextMilestoneLabel} · ${line.nextMilestoneCostLabel} RG`,
                disabled: !line.canBuyNextMilestone,
                onActivate: () => onBuyNextMilestone(line.id),
              } : undefined}
            />
          );
        })}
      </div>
      <footer className="robo-shop__footer">{footer ?? copy.noSelling}</footer>
    </section>
  );
}
