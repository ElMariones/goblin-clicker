import { useMemo, useState } from 'react';
import { Modal } from '../Modal';
import { Icon } from '../Icon';
import { ROBO_COPY } from '../../i18n/robogoblins';
import type { RoboBlueprintView, RoboCircuitId, RoboFirmwareGroupView } from './types';

type CatalogFilter = 'available' | 'all' | RoboCircuitId | 'global';

export interface RoboBlueprintFirmwareModalProps {
  open: boolean;
  readyLabel: string;
  blueprints: readonly RoboBlueprintView[];
  firmwareGroups: readonly RoboFirmwareGroupView[];
  onPurchaseBlueprint: (id: string) => void;
  onChooseFirmware: (groupId: string, optionId: string) => void;
  onClose: () => void;
}

const FILTERS: readonly CatalogFilter[] = ['available', 'all', 'scrap', 'steam', 'impossible', 'global'];

function filterLabel(filter: CatalogFilter) {
  if (filter === 'available') return ROBO_COPY.available;
  if (filter === 'all') return ROBO_COPY.all;
  if (filter === 'global') return ROBO_COPY.global;
  return filter[0].toUpperCase() + filter.slice(1);
}

export function RoboBlueprintFirmwareModal({ open, readyLabel, blueprints, firmwareGroups, onPurchaseBlueprint, onChooseFirmware, onClose }: RoboBlueprintFirmwareModalProps) {
  const [filter, setFilter] = useState<CatalogFilter>('available');
  const filtered = useMemo(() => blueprints.filter((blueprint) => {
    if (filter === 'all') return true;
    if (filter === 'available') return blueprint.unlocked && !blueprint.purchased;
    if (filter === 'global') return blueprint.kind === 'global';
    return blueprint.kind === 'local' && blueprint.circuit === filter;
  }), [blueprints, filter]);
  return (
    <Modal open={open} title={ROBO_COPY.blueprints} subtitle={`${ROBO_COPY.ready}: ${readyLabel} RG`} icon={<Icon name="memory" />} onClose={onClose} size="lg" className="robo-modal robo-blueprint-modal">
      <div className="robo-catalog-tabs" role="tablist" aria-label="Blueprint filters">
        {FILTERS.map((item) => <button key={item} role="tab" type="button" aria-selected={filter === item} className={filter === item ? 'is-active' : ''} onClick={() => setFilter(item)}>{filterLabel(item)}</button>)}
      </div>
      <div className="robo-blueprint-grid">
        {filtered.map((blueprint) => <article key={blueprint.id} className={`robo-blueprint${blueprint.purchased ? ' is-purchased' : ''}${!blueprint.unlocked ? ' is-locked' : ''}${blueprint.canAfford ? ' is-affordable' : ''}`}>
          <div className="robo-blueprint__header"><span className="robo-blueprint__icon" aria-hidden="true"><Icon name={blueprint.kind === 'global' ? 'memory' : 'hammer'} size={18} /></span><div><small>{blueprint.kind === 'global' ? ROBO_COPY.global : blueprint.lineName ?? ROBO_COPY.local}</small><h3>{blueprint.name}</h3></div></div>
          <p>{blueprint.description}</p><strong className="robo-blueprint__effect">{blueprint.effectLabel}</strong>
          {blueprint.requirementLabel && <small className="robo-blueprint__requirement">{blueprint.requirementLabel}</small>}
          <button type="button" onClick={() => onPurchaseBlueprint(blueprint.id)} disabled={blueprint.purchased || !blueprint.unlocked || !blueprint.canAfford}>{blueprint.purchased ? ROBO_COPY.purchased : `${blueprint.priceLabel} RG`}</button>
        </article>)}
      </div>
      <section className="robo-firmware" aria-labelledby="robo-firmware-heading">
        <header><span>{ROBO_COPY.world}</span><h3 id="robo-firmware-heading">{ROBO_COPY.firmware}</h3></header>
        <div className="robo-firmware__groups">{firmwareGroups.map((group) => <article key={group.id} className={!group.unlocked ? 'is-locked' : ''}>
          <div className="robo-firmware__group-heading"><div><strong>{group.name}</strong><small>{group.unlockLabel}</small></div>{group.lockedChoiceLabel && <span>{group.lockedChoiceLabel}</span>}</div>
          <div className="robo-firmware__options">{group.options.map((option) => <button key={option.id} type="button" className={option.selected ? 'is-selected' : ''} onClick={() => onChooseFirmware(group.id, option.id)} disabled={!group.unlocked || option.locked || option.selected || !option.canAfford} aria-pressed={option.selected}>
            <span><strong>{option.name}</strong><small>{option.description}</small></span><b>{option.effectLabel}</b><em>{option.selected ? ROBO_COPY.purchased : `${option.priceLabel} RG`}</em>
          </button>)}</div>
        </article>)}</div>
      </section>
    </Modal>
  );
}

