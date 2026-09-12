import { ROBO_PROJECTS } from '../../game/robo/content';
import { getRoboProjectProgress } from '../../game/robo/projects';
import type { RoboProjectId, RoboState } from '../../game/robo/types';
import { useI18n } from '../../i18n';
import { ROBO_ENDGAME } from '../../i18n/roboEndgame';
import { formatRobo, getRoboCopy } from '../../i18n/robogoblins';
import { Modal } from '../Modal';
import { Icon } from '../Icon';

interface Props {
  open: boolean;
  robo: RoboState;
  formatNumber: (value: number, precision?: number) => string;
  onBuild: (id: RoboProjectId) => void;
  onClose: () => void;
}

export function RoboProjectsModal({ open, robo, formatNumber, onBuild, onClose }: Props) {
  const { language } = useI18n();
  const copy = getRoboCopy(language);
  const endgame = ROBO_ENDGAME[language];
  const stages = ROBO_PROJECTS.reduce((sum, project) => sum + (robo.kernel.projects[project.id] ?? 0), 0);
  return <Modal open={open} title={endgame.title} subtitle={`${stages}/20 · ${formatNumber(robo.readyRG)} RG · ${formatNumber(robo.kernel.cores)} ${copy.cores}`} icon={<Icon name="sparkles" />} onClose={onClose} size="lg" className="robo-modal robo-projects-modal">
    <p className="robo-explainer">{endgame.help}</p>
    <p className="robo-explainer robo-explainer--warning">{endgame.entry}</p>
    <div className="robo-project-grid">{ROBO_PROJECTS.map((project, index) => {
      const progress = getRoboProjectProgress(robo, project.id)!;
      const circuit = project.circuit === 'all' ? endgame.all : copy.circuitNames[project.circuit];
      const increment = project.circuit === 'all' ? 0.1 : 0.25;
      const entryMet = robo.kernel.recompiles >= 1 && robo.lines.paradox_nest.owned >= 1;
      return <article key={project.id} className={`robo-project${progress.canBuild ? ' is-affordable' : ''}${progress.complete ? ' is-complete' : ''}`}>
        <header><Icon name={project.circuit === 'all' ? 'sparkles' : 'hammer'} size={24} /><div><small>{formatRobo(endgame.stage, { rank: progress.rank, max: project.maxRank })}</small><h3>{endgame.projects[index]}</h3></div></header>
        <p>{endgame.descriptions[index]}</p>
        <strong>{formatRobo(endgame.effect, { circuit, current: formatNumber(1 + progress.rank * increment, 2), next: formatNumber(1 + Math.min(project.maxRank, progress.rank + 1) * increment, 2) })}</strong>
        {project.circuit !== 'all' && <p className="robo-project__fabrication">{endgame.fabrication} {endgame.deepFabrication}</p>}
        <progress aria-label={endgame.projects[index]} value={progress.rank} max={project.maxRank} />
        {!progress.complete && <ul className="robo-project__requirements">
          <li className={entryMet ? 'is-met' : ''}>{entryMet ? '✓ ' : '○ '}{endgame.entry}</li>
          <li className={progress.minOwned >= progress.requiredOwned ? 'is-met' : ''}>{progress.minOwned >= progress.requiredOwned ? '✓ ' : '○ '}{formatRobo(endgame.lines, { circuit, owned: progress.minOwned, required: progress.requiredOwned })}</li>
          <li className={robo.globalBlueprintRank >= progress.requiredBlueprintRank ? 'is-met' : ''}>{robo.globalBlueprintRank >= progress.requiredBlueprintRank ? '✓ ' : '○ '}{formatRobo(endgame.research, { rank: robo.globalBlueprintRank, required: progress.requiredBlueprintRank })}</li>
        </ul>}
        <button type="button" disabled={!progress.canBuild} onClick={() => onBuild(project.id)}>{progress.complete ? endgame.complete : `${endgame.build} · ${formatNumber(progress.cost)} RG + ${formatNumber(progress.coreCost)} ${copy.cores}`}</button>
      </article>;
    })}</div>
  </Modal>;
}
