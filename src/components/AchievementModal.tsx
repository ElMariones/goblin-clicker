import { Icon } from './Icon';
import { Modal } from './Modal';

export interface AchievementView {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAtLabel?: string;
  hidden?: boolean;
}

export interface AchievementModalProps {
  open: boolean;
  achievements: AchievementView[];
  onClose: () => void;
}

export function AchievementModal({ open, achievements, onClose }: AchievementModalProps) {
  const unlocked = achievements.filter((achievement) => achievement.unlocked).length;
  const completion = achievements.length === 0 ? 0 : Math.round((unlocked / achievements.length) * 100);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Hoard of Deeds"
      subtitle="Milestones whispered about in every tunnel."
      icon={<Icon name="trophy" />}
      size="lg"
      footer={
        <div className="achievement-progress" aria-label={`${completion}% achievement completion`}>
          <span>{unlocked} / {achievements.length} unlocked</span>
          <div className="achievement-progress__track"><span style={{ width: `${completion}%` }} /></div>
          <strong>{completion}%</strong>
        </div>
      }
    >
      <div className="achievement-grid">
        {achievements.map((achievement) => {
          const secret = achievement.hidden && !achievement.unlocked;
          return (
            <article key={achievement.id} className={`achievement-tile${achievement.unlocked ? ' achievement-tile--unlocked' : ''}`}>
              <div className="achievement-tile__medal">
                <Icon name={achievement.unlocked ? 'trophy' : 'lock'} size={24} />
              </div>
              <div>
                <h3>{secret ? '???' : achievement.name}</h3>
                <p>{secret ? 'A secret deed remains buried.' : achievement.description}</p>
                {achievement.unlockedAtLabel && achievement.unlocked && <small>{achievement.unlockedAtLabel}</small>}
              </div>
            </article>
          );
        })}
      </div>
    </Modal>
  );
}
