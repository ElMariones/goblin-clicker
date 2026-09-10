import { Icon } from '../Icon';
import type { RoboWorldSwitchView } from './types';

export interface RoboWorldSwitchProps extends RoboWorldSwitchView {
  direction?: 'to-robo' | 'to-warren';
}

export function RoboWorldSwitch({ label, detail, locked = false, badge, onActivate, direction = 'to-robo' }: RoboWorldSwitchProps) {
  return (
    <button
      className={`robo-world-switch robo-world-switch--${direction}${locked ? ' is-locked' : ''}`}
      type="button"
      onClick={onActivate}
      aria-label={detail ? `${label}. ${detail}` : label}
      title={detail ? `${label}. ${detail}` : label}
      data-testid="robo-world-switch"
    >
      <span className="robo-world-switch__orbit" aria-hidden="true"><i /><i /><i /><i /></span>
      <span className="robo-world-switch__core" aria-hidden="true">
        <img src={`${import.meta.env.BASE_URL}assets/${direction === 'to-robo' ? 'robogoblin-emblem.svg' : 'goblin-world-emblem.svg'}`} alt="" draggable={false} />
        {locked && <span className="robo-world-switch__lock"><Icon name="lock" size={13} /></span>}
      </span>
      <span className="robo-world-switch__copy"><strong>{label}</strong>{detail && <small>{detail}</small>}</span>
      {badge && <span className="robo-world-switch__badge">{badge}</span>}
    </button>
  );
}

