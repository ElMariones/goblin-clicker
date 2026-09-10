import { ROBO_GUIDE } from '../../i18n/roboGuide';
import { useMemo, useState } from 'react';
import { Modal } from '../Modal';
import { Icon } from '../Icon';
import { useI18n } from '../../i18n';
import { getRoboCopy, type RoboCopy } from '../../i18n/robogoblins';
import type { RoboBlueprintView, RoboCircuitId, RoboFirmwareGroupView } from './types';

type CatalogFilter = 'available' | 'all' | RoboCircuitId | 'global';

export interface RoboBlueprintFirmwareModalProps {
  open: boolean;
  mode?: 'blueprints' | 'firmware';
  readyLabel: string;
  blueprints: readonly RoboBlueprintView[];
  firmwareGroups: readonly RoboFirmwareGroupView[];
  onPurchaseBlueprint: (id: string) => void;
  onChooseFirmware: (groupId: string, optionId: string) => void;
  onClose: () => void;
}

const FILTERS: readonly CatalogFilter[] = ['available', 'all', 'scrap', 'steam', 'impossible', 'global'];

function filterLabel(filter: CatalogFilter, copy: RoboCopy) {
  if (filter === 'available') return copy.available;
  if (filter === 'all') return copy.all;
  if (filter === 'global') return copy.global;
  return copy.circuitNames[filter];
}

export function RoboBlueprintFirmwareModal({ open, mode = 'blueprints', readyLabel, blueprints, firmwareGroups, onPurchaseBlueprint, onChooseFirmware, onClose }: RoboBlueprintFirmwareModalProps) {
  const { language } = useI18n();
  const copy = getRoboCopy(language);
  const guide = ROBO_GUIDE[language];
  const [filter, setFilter] = useState<CatalogFilter>('available');
  const filtered = useMemo(() => blueprints.filter((blueprint) => {
    if (filter === 'all') return true;
    if (filter === 'available') return blueprint.unlocked && !blueprint.purchased;
    if (filter === 'global') return blueprint.kind === 'global';
    return blueprint.kind === 'local' && blueprint.circuit === filter;
  }), [blueprints, filter]);
  return (
    <Modal open={open} title={mode === 'firmware' ? copy.firmware : guide.blueprints} subtitle={`${copy.ready}: ${readyLabel} RG`} icon={<Icon name="memory" />} onClose={onClose} size="lg" className="robo-modal robo-blueprint-modal">
      <p className="robo-explainer">{mode === 'firmware' ? guide.firmwareHelp : guide.blueprintHelp}</p>
      {mode === 'blueprints' ? <>
      <div className="robo-catalog-tabs" role="group" aria-label={copy.blueprintFilters}>
        {FILTERS.map((item) => <button key={item} type="button" aria-pressed={filter === item} className={filter === item ? 'is-active' : ''} onClick={() => setFilter(item)}>{filterLabel(item, copy)}</button>)}
      </div>
      {filtered.length === 0 && <p className="robo-empty-state">{guide.empty}</p>}
      <div className="robo-blueprint-grid">
        {filtered.map((blueprint) => <article key={blueprint.id} className={`robo-blueprint${blueprint.purchased ? ' is-purchased' : ''}${!blueprint.unlocked ? ' is-locked' : ''}${blueprint.canAfford ? ' is-affordable' : ''}`}>
          <div className="robo-blueprint__header"><span className="robo-blueprint__icon" aria-hidden="true"><Icon name={blueprint.kind === 'global' ? 'memory' : 'hammer'} size={18} /></span><div><small>{blueprint.kind === 'global' ? copy.global : blueprint.lineName ?? copy.local}</small><h3>{blueprint.name}</h3></div></div>
          <p>{blueprint.description}</p><strong className="robo-blueprint__effect">{blueprint.effectLabel}</strong>
          {blueprint.requirementLabel && <small className="robo-blueprint__requirement">{blueprint.requirementLabel}</small>}
          <button type="button" onClick={() => onPurchaseBlueprint(blueprint.id)} disabled={blueprint.purchased || !blueprint.unlocked || !blueprint.canAfford}>{blueprint.purchased ? copy.purchased : `${copy.choose} · ${blueprint.priceLabel} RG`}</button>
        </article>)}
      </div>
      </> : <section className="robo-firmware" aria-labelledby="robo-firmware-heading">
        <header><span>{copy.world}</span><h3 id="robo-firmware-heading">{copy.firmware}</h3></header>
        <div className="robo-firmware__groups">{firmwareGroups.map((group) => <article key={group.id} className={!group.unlocked ? 'is-locked' : ''}>
          <div className="robo-firmware__group-heading"><div><strong>{group.name}</strong><small>{group.unlockLabel}</small></div>{group.lockedChoiceLabel && <span>{group.lockedChoiceLabel}</span>}</div>
          <div className="robo-firmware__options">{group.options.map((option) => <button key={option.id} type="button" className={option.selected ? 'is-selected' : ''} onClick={() => onChooseFirmware(group.id, option.id)} disabled={!group.unlocked || option.locked || option.selected || !option.canAfford} aria-pressed={option.selected}>
            <span><strong>{option.name}</strong><small>{option.description}</small></span><b>{option.effectLabel}</b><em>{option.selected ? copy.purchased : `${copy.choose} · ${option.priceLabel} RG`}</em>
          </button>)}</div>
        </article>)}</div>
      </section>}
    </Modal>
  );
}
