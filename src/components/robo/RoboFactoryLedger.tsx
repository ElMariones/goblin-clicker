import { Icon } from '../Icon';
import { ROBO_COPY } from '../../i18n/robogoblins';

export interface RoboLedgerStatView { id: string; label: string; value: string; accent?: 'blue' | 'copper' | 'lilac' }
export interface RoboFactoryLedgerProps {
  stats: readonly RoboLedgerStatView[];
  warrenRateLabel?: string;
  nextGoalLabel?: string;
  achievementCountLabel?: string;
  onOpenAchievements?: () => void;
  onOpenAppearances?: () => void;
}

export function RoboFactoryLedger({ stats, warrenRateLabel, nextGoalLabel, achievementCountLabel, onOpenAchievements, onOpenAppearances }: RoboFactoryLedgerProps) {
  return (
    <section className="robo-ledger" aria-labelledby="robo-ledger-heading">
      <header><div><span>{ROBO_COPY.foundry}</span><h2 id="robo-ledger-heading">Factory ledger</h2></div>{onOpenAchievements && <button type="button" onClick={onOpenAchievements} aria-label={ROBO_COPY.achievements}><Icon name="trophy" size={14} />{achievementCountLabel && <strong>{achievementCountLabel}</strong>}</button>}</header>
      <dl>{stats.map((stat) => <div key={stat.id} className={stat.accent ? `is-${stat.accent}` : ''}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}</dl>
      {nextGoalLabel && <div className="robo-ledger__goal"><span>Next objective</span><strong>{nextGoalLabel}</strong></div>}
      {warrenRateLabel && <p className="robo-ledger__warren"><Icon name="burrow" size={14} />Your Warren is still producing <strong>{warrenRateLabel}</strong>.</p>}
      {onOpenAppearances && <button className="robo-ledger__appearance" type="button" onClick={onOpenAppearances}><Icon name="shop" size={15} />{ROBO_COPY.appearances}</button>}
    </section>
  );
}

