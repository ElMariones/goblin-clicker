import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type WheelEvent } from 'react';
import { useI18n } from '../i18n';
import { Icon } from './Icon';
import type { UpgradeView } from './UpgradeModal';

interface ResearchTreeProps {
  upgrades: UpgradeView[];
  onPurchase: (id: string) => void;
}

type Point = { x: number; y: number };
type Motif = 'claw' | 'scroll' | 'egg' | 'mushroom' | 'burrow' | 'bog' | 'gear' | 'moon' | 'spear' | 'spore' | 'forge' | 'gate' | 'wyrm' | 'rift';

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1680;
const NODE_WIDTH = 190;
const NODE_HEIGHT = 86;
const ROOT: Point = { x: 92, y: 638 };
const HUBS = {
  manual: { x: 328, y: 161 },
  global: { x: 328, y: 329 },
  structures: { x: 328, y: 812 },
} satisfies Record<string, Point>;

const manualBranch = ['sharpened_nails', 'midwife_whistles', 'riotous_birthing'];
const globalBranch = ['green_thumb', 'warren_accounting', 'grand_clutch_plan'];
const structureBranches = [
  ['matron_stew', 'matron_union'],
  ['richer_compost', 'singing_fungus'],
  ['double_bunks', 'triple_bunks'],
  ['warmer_mud', 'royal_sludge'],
  ['borrowed_bellows', 'unsafe_pressure'],
  ['louder_rattles', 'forbidden_chorus'],
  ['mandatory_cuddles', 'drill_sergeant_midwives'],
  ['silver_spores', 'full_moon_farming'],
  ['forge_runes', 'molten_cradles'],
  ['hinge_grease', 'many_doors'],
  ['warm_scale_blankets', 'borrowed_dragonfire'],
  ['wider_impossibility', 'burrow_beyond'],
] as const;

const motifByBranch: Motif[] = ['egg', 'mushroom', 'burrow', 'bog', 'gear', 'moon', 'spear', 'spore', 'forge', 'gate', 'wyrm', 'rift'];

function motifForUpgrade(id: string): Motif {
  if (manualBranch.includes(id)) return 'claw';
  if (globalBranch.includes(id)) return 'scroll';
  const branchIndex = structureBranches.findIndex((branch) => branch.some((upgradeId) => upgradeId === id));
  return branchIndex >= 0 ? motifByBranch[branchIndex] : 'scroll';
}

function ResearchGlyph({ motif }: { motif: Motif }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.65, strokeLinecap: 'square' as const, strokeLinejoin: 'miter' as const };
  return (
    <svg className="research-glyph" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      {motif === 'claw' && <g {...common}><path d="M7 24 11 9m1 15 4-18m1 18 5-15m-15 15c5 3 12 3 18-1"/><path d="m9 8 3-3m5 0 2-3m4 7 3-2"/></g>}
      {motif === 'scroll' && <g {...common}><path d="M9 6h15v19H9zM6 9h3v13H6z"/><path d="M13 11h7m-7 4h7m-7 4h5"/><path d="m22 23 3 3"/></g>}
      {motif === 'egg' && <g {...common}><path d="M16 4c5 0 9 8 9 14 0 5-4 9-9 9s-9-4-9-9c0-6 4-14 9-14Z"/><path d="m12 14 4 3 4-5m-8 9 3 2"/></g>}
      {motif === 'mushroom' && <g {...common}><path d="M5 16c0-7 5-11 11-11s11 4 11 11H5Z"/><path d="M12 16v10h8V16M9 11h2m8-2h2m2 4h2"/></g>}
      {motif === 'burrow' && <g {...common}><path d="M4 26c1-10 5-17 12-20 7 3 11 10 12 20H4Z"/><path d="M11 26v-7c0-4 2-6 5-6s5 2 5 6v7M7 21h3m12 0h3"/></g>}
      {motif === 'bog' && <g {...common}><path d="M16 4c4 6 8 10 8 15a8 8 0 1 1-16 0c0-5 4-9 8-15Z"/><path d="M12 20c1 2 3 3 6 3m-9 4h14"/></g>}
      {motif === 'gear' && <g {...common}><path d="m13 4 1-2h4l1 2 3 1 2-1 3 3-1 2 1 3 2 1v4l-2 1-1 3 1 2-3 3-2-1-3 1-1 2h-4l-1-2-3-1-2 1-3-3 1-2-1-3-2-1v-4l2-1 1-3-1-2 3-3 2 1 3-1Z"/><circle cx="16" cy="15" r="4"/></g>}
      {motif === 'moon' && <g {...common}><path d="M22 5c-7 1-10 9-6 15 2 3 6 5 10 4-3 4-9 6-14 3A12 12 0 0 1 8 10c3-4 8-6 14-5Z"/><path d="m21 10 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z"/></g>}
      {motif === 'spear' && <g {...common}><path d="m6 27 18-18m-4-3 7-2-2 7-5-5ZM8 21l3 3m2-8 3 3"/><path d="M6 18v9h9"/></g>}
      {motif === 'spore' && <g {...common}><circle cx="16" cy="16" r="4"/><circle cx="8" cy="10" r="3"/><circle cx="23" cy="8" r="2"/><circle cx="24" cy="21" r="3"/><circle cx="9" cy="24" r="2"/><path d="m11 12 2 2m6-2 2-2m-2 8 2 1m-8 0-2 3"/></g>}
      {motif === 'forge' && <g {...common}><path d="M7 14h18l-3 6H10l-3-6Zm6 6v6h6v-6"/><path d="M13 12c-3-3 0-5 2-8 0 4 5 4 4 8m4-5 4 4"/></g>}
      {motif === 'gate' && <g {...common}><path d="M7 27V13c0-6 4-9 9-9s9 3 9 9v14H7Z"/><path d="M12 27V14c0-3 2-5 4-5s4 2 4 5v13M4 27h24"/></g>}
      {motif === 'wyrm' && <g {...common}><path d="M7 23c2-10 8-16 18-17-2 3-2 6 0 9-5-2-8 1-8 5 0 3-2 6-6 7"/><path d="m12 11 4 2-3 3-4-2m11-6 2 2"/></g>}
      {motif === 'rift' && <g {...common}><path d="M16 3 11 11l4 3-5 6 6 9 5-9-4-4 5-7-6-6Z"/><path d="M7 7 4 10l3 3m18 6 3 3-3 3"/></g>}
    </svg>
  );
}

function pathBetween(from: Point, to: Point) {
  const x1 = from.x;
  const y1 = from.y;
  const x2 = to.x;
  const y2 = to.y;
  const bend = Math.max(28, Math.abs(x2 - x1) * 0.42);
  return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
}

export function ResearchTree({ upgrades, onPurchase }: ResearchTreeProps) {
  const { t } = useI18n();
  const [offset, setOffset] = useState<Point>({ x: 26, y: -100 });
  const dragRef = useRef<{ pointerId: number; x: number; y: number; originX: number; originY: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const upgradeMap = useMemo(() => new Map(upgrades.map((upgrade) => [upgrade.id, upgrade])), [upgrades]);
  const positions = useMemo(() => {
    const result = new Map<string, Point>();
    manualBranch.forEach((id, index) => result.set(id, { x: 420 + index * 214, y: 118 }));
    globalBranch.forEach((id, index) => result.set(id, { x: 420 + index * 214, y: 286 }));
    structureBranches.forEach((branch, index) => {
      const y = 438 + index * 98;
      branch.forEach((id, tier) => result.set(id, { x: 520 + tier * 238, y }));
    });
    return result;
  }, []);

  const links = useMemo(() => {
    const result: Array<{ from: Point; to: Point; active: boolean }> = [
      { from: ROOT, to: HUBS.manual, active: true },
      { from: ROOT, to: HUBS.global, active: true },
      { from: ROOT, to: HUBS.structures, active: true },
    ];
    const addBranch = (ids: readonly string[], hub: Point) => {
      const existing = ids.filter((id) => positions.has(id));
      if (!existing.length) return;
      const first = positions.get(existing[0])!;
      result.push({ from: hub, to: { x: first.x, y: first.y + NODE_HEIGHT / 2 }, active: Boolean(upgradeMap.get(existing[0])?.purchased) });
      for (let index = 0; index < existing.length - 1; index += 1) {
        const current = upgradeMap.get(existing[index]);
        const next = upgradeMap.get(existing[index + 1]);
        const from = positions.get(existing[index])!;
        const to = positions.get(existing[index + 1])!;
        result.push({ from: { x: from.x + NODE_WIDTH, y: from.y + NODE_HEIGHT / 2 }, to: { x: to.x, y: to.y + NODE_HEIGHT / 2 }, active: Boolean(current?.purchased && (next?.purchased || !next?.locked)) });
      }
    };
    addBranch(manualBranch, HUBS.manual);
    addBranch(globalBranch, HUBS.global);
    structureBranches.forEach((branch) => addBranch(branch, HUBS.structures));
    return result;
  }, [positions, upgradeMap]);

  const resetView = () => setOffset({ x: 26, y: -100 });
  const centerView = () => setOffset({ x: -170, y: -460 });

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, originX: offset.x, originY: offset.y };
    setDragging(true);
  };
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setOffset({ x: drag.originX + event.clientX - drag.x, y: drag.originY + event.clientY - drag.y });
  };
  const stopDragging = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    setOffset((current) => ({ x: current.x - event.deltaX, y: current.y - event.deltaY }));
  };
  const handleKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    const amount = event.shiftKey ? 92 : 36;
    if (event.key === 'Home') { event.preventDefault(); resetView(); return; }
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    setOffset((current) => ({
      x: current.x + (event.key === 'ArrowRight' ? -amount : event.key === 'ArrowLeft' ? amount : 0),
      y: current.y + (event.key === 'ArrowDown' ? -amount : event.key === 'ArrowUp' ? amount : 0),
    }));
  };

  return (
    <section className="research-tree" aria-label={t('upgrade.title')}>
      <div className="research-tree__toolbar">
        <span className="research-tree__hint" aria-hidden="true"><span className="research-tree__drag-mark">✥</span> {t('research.treeHint')}</span>
        <div className="research-tree__toolbar-actions">
          <button type="button" className="research-tree__tool" onClick={centerView} aria-label={t('research.centerTree')} title={t('research.centerTree')}>◎</button>
          <button type="button" className="research-tree__tool" onClick={resetView} aria-label={t('research.resetView')} title={t('research.resetView')}>↺</button>
        </div>
      </div>
      <div
        className={`research-tree__viewport${dragging ? ' research-tree__viewport--dragging' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onWheel={handleWheel}
        onKeyDown={handleKeyboard}
        tabIndex={0}
        role="region"
        aria-label={t('research.treeRegion')}
      >
        <div className="research-tree__grid" aria-hidden="true" />
        <div className="research-tree__surface" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}>
          <svg className="research-tree__links" width={CANVAS_WIDTH} height={CANVAS_HEIGHT} viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`} aria-hidden="true">
            {links.map((link, index) => <path key={index} className={link.active ? 'research-link research-link--active' : 'research-link'} d={pathBetween(link.from, link.to)} />)}
          </svg>

          <div className="research-root" style={{ left: ROOT.x - 36, top: ROOT.y - 36 }} aria-hidden="true"><span><Icon name="sparkles" size={27} /></span><i /></div>
          <div className="research-hub research-hub--manual" style={{ left: HUBS.manual.x - 18, top: HUBS.manual.y - 18 }} aria-hidden="true"><ResearchGlyph motif="claw" /></div>
          <div className="research-hub research-hub--global" style={{ left: HUBS.global.x - 18, top: HUBS.global.y - 18 }} aria-hidden="true"><ResearchGlyph motif="scroll" /></div>
          <div className="research-hub research-hub--structures" style={{ left: HUBS.structures.x - 18, top: HUBS.structures.y - 18 }} aria-hidden="true"><ResearchGlyph motif="burrow" /></div>

          {upgrades.map((upgrade) => {
            const position = positions.get(upgrade.id);
            if (!position) return null;
            const unavailable = upgrade.purchased || upgrade.locked || !upgrade.affordable;
            return (
              <article
                key={upgrade.id}
                className={`research-node${upgrade.purchased ? ' research-node--purchased' : ''}${upgrade.locked ? ' research-node--locked' : ''}${!upgrade.locked && upgrade.affordable && !upgrade.purchased ? ' research-node--ready' : ''}`}
                style={{ left: position.x, top: position.y }}
              >
                <button
                  type="button"
                  className="research-node__button"
                  onClick={() => { if (!unavailable) onPurchase(upgrade.id); }}
                  aria-disabled={unavailable}
                  aria-label={`${upgrade.name}. ${upgrade.effectLabel}. ${upgrade.purchased ? t('upgrade.researched') : upgrade.locked ? t('upgrade.unknown') : upgrade.priceLabel}`}
                >
                  <span className="research-node__icon" aria-hidden="true">
                    <ResearchGlyph motif={motifForUpgrade(upgrade.id)} />
                    {upgrade.locked && <Icon name="lock" size={10} className="research-node__lock" />}
                  </span>
                  <span className="research-node__copy">
                    <strong>{upgrade.locked ? '???' : upgrade.name}</strong>
                    <span>{upgrade.locked ? t('upgrade.unknown') : upgrade.effectLabel}</span>
                  </span>
                  <span className="research-node__meta">
                    <small>{upgrade.tier}</small>
                    <b>{upgrade.purchased ? '✓' : upgrade.locked ? '—' : <><Icon name="coin" size={11} /> {upgrade.priceLabel}</>}</b>
                  </span>
                </button>
                <span className="research-node__signal" aria-hidden="true" />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
