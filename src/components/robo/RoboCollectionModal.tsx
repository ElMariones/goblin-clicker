import { Modal } from '../Modal';
import { Icon } from '../Icon';
import { ROBO_COPY } from '../../i18n/robogoblins';
import type { RoboAchievementView, RoboAppearanceView } from './types';

export interface RoboCollectionModalProps {
  open: boolean;
  appearances: readonly RoboAppearanceView[];
  achievements: readonly RoboAchievementView[];
  onEquipAppearance: (id: string) => void;
  onClose: () => void;
}

export function RoboCollectionModal({ open, appearances, achievements, onEquipAppearance, onClose }: RoboCollectionModalProps) {
  const unlockedAchievements = achievements.filter((achievement) => achievement.unlocked).length;
  return (
    <Modal open={open} title="Foundry collection" subtitle={`${unlockedAchievements}/${achievements.length} achievements`} icon={<Icon name="trophy" />} onClose={onClose} size="lg" className="robo-modal robo-collection-modal">
      <section className="robo-appearances" aria-labelledby="robo-appearances-heading"><header><span>{ROBO_COPY.world}</span><h3 id="robo-appearances-heading">{ROBO_COPY.appearances}</h3></header><div>{appearances.map((appearance) => <article key={appearance.id} className={`${appearance.equipped ? 'is-equipped' : ''}${!appearance.unlocked ? ' is-locked' : ''}`}>
        <div className="robo-appearance__art"><img src={appearance.imageSrc} alt="" draggable={false} /><span aria-hidden="true" /></div><h4>{appearance.name}</h4><p>{appearance.description}</p>{!appearance.unlocked && appearance.unlockLabel && <small>{appearance.unlockLabel}</small>}<button type="button" onClick={() => onEquipAppearance(appearance.id)} disabled={!appearance.unlocked || appearance.equipped}>{appearance.equipped ? ROBO_COPY.equipped : appearance.unlocked ? ROBO_COPY.equip : ROBO_COPY.locked}</button>
      </article>)}</div></section>
      <section className="robo-achievements" aria-labelledby="robo-achievements-heading"><header><span>{ROBO_COPY.foundry}</span><h3 id="robo-achievements-heading">{ROBO_COPY.achievements}</h3></header><div>{achievements.map((achievement) => <article key={achievement.id} className={achievement.unlocked ? 'is-unlocked' : ''}><span aria-hidden="true"><Icon name={achievement.unlocked ? 'trophy' : 'lock'} size={18} /></span><div><h4>{achievement.name}</h4><p>{achievement.description}</p>{achievement.unlockedAtLabel && <small>{achievement.unlockedAtLabel}</small>}</div></article>)}</div></section>
    </Modal>
  );
}

