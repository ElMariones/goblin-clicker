import type { CSSProperties } from 'react';
import { Modal } from '../Modal';
import { Icon } from '../Icon';
import { useI18n } from '../../i18n';
import { formatRobo, getRoboCopy } from '../../i18n/robogoblins';
import type { RoboAchievementView, RoboAppearanceView } from './types';

export interface RoboCollectionModalProps {
  open: boolean;
  coresLabel: string;
  appearances: readonly RoboAppearanceView[];
  achievements: readonly RoboAchievementView[];
  onPurchaseAppearance: (id: string) => void;
  onEquipAppearance: (id: string) => void;
  onClose: () => void;
}

export function RoboCollectionModal({ open, coresLabel, appearances, achievements, onPurchaseAppearance, onEquipAppearance, onClose }: RoboCollectionModalProps) {
  const { language } = useI18n();
  const copy = getRoboCopy(language);
  const unlockedAchievements = achievements.filter((achievement) => achievement.unlocked).length;
  const equipped = appearances.find((appearance) => appearance.equipped) ?? appearances[0];
  return (
    <Modal open={open} title={copy.foundryCollection} subtitle={formatRobo(copy.achievementCount, { done: unlockedAchievements, total: achievements.length })} icon={<Icon name="trophy" />} onClose={onClose} size="lg" className="robo-modal robo-collection-modal cosmetics-modal">
      <section className="cosmetics-hero robo-cosmetics-hero">
        <div className="cosmetics-hero__preview" aria-hidden="true">{equipped && <img key={equipped.id} src={equipped.imageSrc} alt="" draggable={false} />}</div>
        <div className="cosmetics-hero__copy"><span>{copy.world}</span><strong>{equipped?.name ?? copy.appearances}</strong><small>{equipped?.description ?? copy.appearances}</small></div>
        <div className="cosmetics-hero__currency" aria-label={`${copy.kernelCores}: ${coresLabel}`}><Icon name="memory" size={18} /><span>{copy.kernelCores}</span><strong>{coresLabel}</strong></div>
      </section>
      <div className="modal-section-heading cosmetics-heading"><div><span>{copy.world}</span><h3 id="robo-appearances-heading">{copy.appearances}</h3></div><small>{formatRobo(copy.achievementCount, { done: appearances.filter((appearance) => appearance.owned).length, total: appearances.length })}</small></div>
      <section className="robo-appearances" aria-labelledby="robo-appearances-heading"><div className="cosmetics-grid robo-cosmetics-grid">{appearances.map((appearance, index) => {
        const state = appearance.equipped ? 'equipped' : appearance.owned ? 'owned' : appearance.affordable ? 'affordable' : 'locked';
        return <article key={appearance.id} className={`cosmetic-card cosmetic-card--${state}`} style={{ '--cosmetic-delay': `${Math.min(index, 10) * 24}ms` } as CSSProperties}>
          <div className="cosmetic-card__art"><span className="cosmetic-card__scan" aria-hidden="true" /><img src={appearance.imageSrc} alt="" draggable={false} />{appearance.equipped && <span className="cosmetic-card__equipped-badge"><Icon name="sparkles" size={12} /> {copy.equipped}</span>}</div>
          <div className="cosmetic-card__body"><div className="cosmetic-card__title-row"><h4>{appearance.name}</h4>{appearance.isDefault ? <span className="cosmetic-card__tag">{copy.appearanceDefault}</span> : appearance.owned ? <span className="cosmetic-card__tag">{copy.appearanceOwned}</span> : null}</div><p>{appearance.description}</p></div>
          {appearance.owned ? <button className={`cosmetic-card__action${appearance.equipped ? ' is-equipped' : ''}`} type="button" onClick={() => onEquipAppearance(appearance.id)} disabled={appearance.equipped && appearance.isDefault}>{appearance.equipped ? copy.equipped : copy.equip}</button> : <button className="cosmetic-card__action cosmetic-card__action--buy" type="button" onClick={() => onPurchaseAppearance(appearance.id)} disabled={!appearance.affordable}><Icon name="memory" size={14} /><span>{copy.appearanceBuy}</span><strong>{appearance.priceLabel}</strong></button>}
        </article>;
      })}</div></section>
      <section className="robo-achievements" aria-labelledby="robo-achievements-heading"><header><span>{copy.foundry}</span><h3 id="robo-achievements-heading">{copy.achievements}</h3></header><div>{achievements.map((achievement) => <article key={achievement.id} className={achievement.unlocked ? 'is-unlocked' : ''}><span aria-hidden="true"><Icon name={achievement.unlocked ? 'trophy' : 'lock'} size={18} /></span><div><h4>{achievement.name}</h4><p>{achievement.description}</p>{achievement.unlockedAtLabel && <small>{achievement.unlockedAtLabel}</small>}</div></article>)}</div></section>
    </Modal>
  );
}
