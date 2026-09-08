import { Modal } from '../Modal';
import { Icon } from '../Icon';
import { useI18n } from '../../i18n';
import { formatRobo, getRoboCopy } from '../../i18n/robogoblins';
import type { RoboAchievementView, RoboAppearanceView } from './types';

export interface RoboCollectionModalProps {
  open: boolean;
  appearances: readonly RoboAppearanceView[];
  achievements: readonly RoboAchievementView[];
  onEquipAppearance: (id: string) => void;
  onClose: () => void;
}

export function RoboCollectionModal({ open, appearances, achievements, onEquipAppearance, onClose }: RoboCollectionModalProps) {
  const { language } = useI18n();
  const copy = getRoboCopy(language);
  const unlockedAchievements = achievements.filter((achievement) => achievement.unlocked).length;
  return (
    <Modal open={open} title={copy.foundryCollection} subtitle={formatRobo(copy.achievementCount, { done: unlockedAchievements, total: achievements.length })} icon={<Icon name="trophy" />} onClose={onClose} size="lg" className="robo-modal robo-collection-modal">
      <section className="robo-appearances" aria-labelledby="robo-appearances-heading"><header><span>{copy.world}</span><h3 id="robo-appearances-heading">{copy.appearances}</h3></header><div>{appearances.map((appearance) => <article key={appearance.id} className={`${appearance.equipped ? 'is-equipped' : ''}${!appearance.unlocked ? ' is-locked' : ''}`}>
        <div className="robo-appearance__art"><img src={appearance.imageSrc} alt="" draggable={false} /><span aria-hidden="true" /></div><h4>{appearance.name}</h4><p>{appearance.description}</p>{!appearance.unlocked && appearance.unlockLabel && <small>{appearance.unlockLabel}</small>}<button type="button" onClick={() => onEquipAppearance(appearance.id)} disabled={!appearance.unlocked || appearance.equipped}>{appearance.equipped ? copy.equipped : appearance.unlocked ? copy.equip : copy.locked}</button>
      </article>)}</div></section>
      <section className="robo-achievements" aria-labelledby="robo-achievements-heading"><header><span>{copy.foundry}</span><h3 id="robo-achievements-heading">{copy.achievements}</h3></header><div>{achievements.map((achievement) => <article key={achievement.id} className={achievement.unlocked ? 'is-unlocked' : ''}><span aria-hidden="true"><Icon name={achievement.unlocked ? 'trophy' : 'lock'} size={18} /></span><div><h4>{achievement.name}</h4><p>{achievement.description}</p>{achievement.unlockedAtLabel && <small>{achievement.unlockedAtLabel}</small>}</div></article>)}</div></section>
    </Modal>
  );
}
