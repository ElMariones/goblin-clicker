import { BUILDING_BY_ID } from '../game/content';
import { WARREN_PROJECTS, getWarrenProjectProgress } from '../game/projects';
import type { GameState, WarrenProjectId } from '../game/types';
import { localizedName, useI18n } from '../i18n';
import { WARREN_PROGRESSION, formatWarren } from '../i18n/warrenProgression';
import { buildingArtAsset } from '../utils/assets';
import { Icon } from './Icon';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  state: GameState;
  formatNumber: (value: number, precision?: number) => string;
  onBuild: (id: WarrenProjectId) => void;
  onClose: () => void;
}

export function WarrenProjectsModal({ open, state, formatNumber, onBuild, onClose }: Props) {
  const { language, t } = useI18n();
  const copy = WARREN_PROGRESSION[language];
  const stages = WARREN_PROJECTS.reduce((sum, project) => sum + (state.prestige.projects[project.id] ?? 0), 0);
  const total = WARREN_PROJECTS.reduce((sum, project) => sum + project.maxRank, 0);
  return <Modal open={open} title={copy.title} subtitle={copy.hint} icon={<Icon name="hammer" />} onClose={onClose} size="lg" className="warren-projects-modal"
    footer={<span className="modal-summary">{stages} / {total} · {formatNumber(state.goblins)} {t('common.goblins')} · {formatNumber(state.prestige.shards)} {t('bloodline.cunning')}</span>}>
    <p className="warren-projects-help">{copy.help}</p>
    <div className="warren-project-grid">{WARREN_PROJECTS.map((project, index) => {
      const progress = getWarrenProjectProgress(state, project.id)!;
      const increment = project.district === 'all' ? 0.1 : 0.25;
      return <article key={project.id} className={`warren-project warren-project--${project.district}${progress.canBuild ? ' is-affordable' : ''}${progress.complete ? ' is-complete' : ''}`}>
        <header><img src={buildingArtAsset(project.art)} alt="" /><div><small>{copy.districts[index]}</small><h3>{copy.projects[index]}</h3><span>{formatWarren(copy.stage, { rank: progress.rank, max: project.maxRank })}</span></div></header>
        <div className="warren-project__stages" aria-label={formatWarren(copy.stage, { rank: progress.rank, max: project.maxRank })}>{Array.from({ length: project.maxRank }, (_, rank) => <span key={rank} className={rank < progress.rank ? 'is-built' : ''} aria-hidden="true"><Icon name={rank < progress.rank ? 'sparkles' : 'hammer'} size={16} /></span>)}</div>
        <strong className="warren-project__effect">{formatWarren(copy.effect, { current: formatNumber(1 + progress.rank * increment, 2), next: formatNumber(1 + Math.min(project.maxRank, progress.rank + 1) * increment, 2) })}</strong>
        <p className="warren-project__members">{progress.buildingIds.map((id) => localizedName(language, 'building', id, BUILDING_BY_ID[id].name)).join(' · ')}</p>
        {!progress.complete && <ul className="warren-project__requirements">
          <li className={progress.entryMet ? 'is-met' : ''}>{progress.entryMet ? '✓ ' : '○ '}{copy.entry}</li>
          <li className={progress.minOwned >= progress.requiredOwned ? 'is-met' : ''}>{progress.minOwned >= progress.requiredOwned ? '✓ ' : '○ '}{formatWarren(copy.owned, { owned: formatNumber(progress.minOwned), required: formatNumber(progress.requiredOwned) })}</li>
          <li className={progress.innovations >= progress.requiredInnovations ? 'is-met' : ''}>{progress.innovations >= progress.requiredInnovations ? '✓ ' : '○ '}{formatWarren(copy.research, { owned: progress.innovations, required: progress.requiredInnovations })}</li>
        </ul>}
        <button type="button" disabled={!progress.canBuild} onClick={() => onBuild(project.id)} aria-label={`${copy.build}: ${copy.projects[index]}. ${formatNumber(progress.cost)} ${t('common.goblins')} + ${formatNumber(progress.cunningCost)} ${t('bloodline.cunning')}`}>
          <span>{progress.complete ? copy.complete : copy.build}<Icon name={progress.complete ? 'sparkles' : 'hammer'} size={14} /></span>
          {!progress.complete && <small>{formatNumber(progress.cost)} {t('common.goblins')} + {formatNumber(progress.cunningCost)} {t('bloodline.cunning')}</small>}
        </button>
      </article>;
    })}</div>
  </Modal>;
}
