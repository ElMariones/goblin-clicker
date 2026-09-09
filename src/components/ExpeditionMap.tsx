import { useRef, useState } from 'react';
import { BUILDING_BY_ID, EXPEDITION_BANDS, EXPEDITION_CREWS, EXPEDITION_DESTINATIONS, getBaseCps, getCps, getExpeditionQuote, getExpeditionReservation, isExpeditionUnlocked, type ExpeditionBand, type ExpeditionCrew, type ExpeditionDestination, type ExpeditionPlan, type GameState } from '../game';
import { useI18n, getLanguageMeta, localizedName } from '../i18n';
import { EXPEDITION_COPY } from '../i18n/expeditions';
import { formatDuration, formatNumber, formatPercent } from '../utils/format';
import mapArt from '../images/surface-expeditions.webp';
import expeditionGiverArt from '../images/expedition.png';
import { Icon, type IconName } from './Icon';
import { Modal } from './Modal';
import '../styles/expeditions.css';

const destinations = Object.keys(EXPEDITION_DESTINATIONS) as ExpeditionDestination[];
const icons: Record<ExpeditionDestination, IconName> = { mine: 'pickaxe', ruins: 'moon', cellar: 'coin' };

export function ExpeditionEntry({ state, onOpen }: { state: GameState; onOpen: () => void }) {
  const { language } = useI18n();
  const c = EXPEDITION_COPY[language];
  const locale = getLanguageMeta(language).locale;
  const unlocked = isExpeditionUnlocked(state) || !!state.expeditions.active;
  const ready = state.expeditions.active && state.lastUpdateAt >= state.expeditions.active.endsAt;
  const remaining = state.expeditions.active && !ready ? formatDuration(state.expeditions.active.endsAt - state.lastUpdateAt, locale) : null;
  const detail = !unlocked ? c.locked : ready ? c.ready : remaining ? `${remaining} · ${c.traveling}` : c.open;
  return <button type="button" className={`expedition-giver${ready ? ' expedition-giver--ready' : state.expeditions.active ? ' expedition-giver--active' : ''}`}
    onClick={onOpen} disabled={!unlocked} aria-label={`${c.open}. ${detail}`}>
    <span className="expedition-giver__signal" aria-hidden="true" />
    <span className="expedition-giver__copy"><strong>{c.title}</strong><small>{detail}</small></span>
    <img src={expeditionGiverArt} alt="" draggable={false} />
  </button>;
}

interface Props {
  open: boolean;
  state: GameState;
  onClose: () => void;
  onLaunch: (plan: ExpeditionPlan) => void;
  onCancel: () => void;
  onClaim: () => void;
}

export function ExpeditionMap({ open, state, onClose, onLaunch, onCancel, onClaim }: Props) {
  const { language } = useI18n();
  const c = EXPEDITION_COPY[language];
  const locale = getLanguageMeta(language).locale;
  const n = (value: number) => formatNumber(value, 2, locale);
  const pct = (value: number) => formatPercent(value, locale);
  const duration = (ms: number) => formatDuration(ms, locale);
  const [destination, setDestination] = useState<ExpeditionDestination>('mine');
  const [crew, setCrew] = useState<ExpeditionCrew>('scouts');
  const [band, setBand] = useState<ExpeditionBand>('short');
  const [complication, setComplication] = useState(false);
  const [hovered, setHovered] = useState<ExpeditionDestination | null>(null);
  const [notice, setNotice] = useState<'departed' | 'returned' | 'recalled' | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Every hook above runs unconditionally; bail out before the planner is
  // derived so a closed map costs nothing on the game's 10 Hz render loop.
  if (!open) return null;

  const mission = state.expeditions.active;
  const selected = mission?.destination ?? destination;
  const plan = { destination, crew, band, complication };
  const quote = getExpeditionQuote(state, plan);
  const ready = !!mission && state.lastUpdateAt >= mission.endsAt;
  const progress = mission ? Math.min(1, Math.max(0, (state.lastUpdateAt - mission.startedAt) / (mission.endsAt - mission.startedAt))) : 0;
  const target = EXPEDITION_DESTINATIONS[selected];
  const control = target.x < 50 ? { x: 35, y: 65 } : { x: 65, y: 80 };
  const trailX = (1 - progress) ** 2 * 46 + 2 * (1 - progress) * progress * control.x + progress ** 2 * target.x;
  const trailY = (1 - progress) ** 2 * 84 + 2 * (1 - progress) * progress * control.y + progress ** 2 * target.y;
  const desc = (id: ExpeditionDestination) => c[`${id}Desc`];
  const fit = (id: ExpeditionDestination) => EXPEDITION_DESTINATIONS[id].buildings
    .map(buildingId => localizedName(language, 'building', buildingId, BUILDING_BY_ID[buildingId].name))
    .join(' + ');
  const visibleNotice = notice === 'departed' && ready ? null : notice;
  const close = () => { setNotice(null); setHovered(null); onClose(); };
  return <Modal open={open} title={c.title} subtitle={c.subtitle} icon={<Icon name="burrow" />} onClose={close} size="lg" className="expedition-modal">
    <div className="expedition-layout">
      <div className="expedition-atlas">
        <div className={`expedition-map${mission ? ' expedition-map--traveling' : ''}${ready ? ' expedition-map--ready' : ''}`} role="group" aria-label={c.map}>
          <img src={mapArt} alt="" draggable={false} />
          <svg className="expedition-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d={`M 46 84 Q ${target.x < 50 ? '35 65' : '65 80'} ${target.x} ${target.y}`} />
            {mission && <circle r="1.1" cx={trailX} cy={trailY} />}
          </svg>
          {destinations.map(id => {
            const point = EXPEDITION_DESTINATIONS[id];
            return <button key={id} type="button" className={`expedition-pin expedition-pin--${id}${selected === id ? ' expedition-pin--selected' : ''}`}
              style={{ left: `${point.x}%`, top: `${point.y}%` }} aria-pressed={selected === id} aria-label={`${c[id]}. ${desc(id)}`}
              aria-disabled={mission && selected !== id ? true : undefined}
              aria-describedby={hovered === id ? `expedition-tip-${id}` : undefined}
              onMouseEnter={() => setHovered(id)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(id)} onBlur={() => setHovered(null)}
              onClick={() => { if (!mission) setDestination(id); setHovered(id); }}>
              <span className="expedition-pin__seal"><Icon name={icons[id]} size={22} />{state.expeditions.artifacts[id] && <i aria-hidden="true">✓</i>}</span>
              <span className="expedition-pin__name">{c[id]}</span>
            </button>;
          })}
          {hovered && <div id={`expedition-tip-${hovered}`} role="tooltip" className="expedition-tooltip"><strong>{c[hovered]}</strong><span>{desc(hovered)}</span><small>{fit(hovered)}</small></div>}
          <span className="expedition-map__caption" aria-hidden="true">{mission ? ready ? c.ready : c.traveling : c.hint}</span>
        </div>
        <p className="expedition-hint">{c.hint}</p>

      </div>
      <section className="expedition-planner" aria-label={c[selected]}>
        <div className="expedition-planner__heading"><Icon name={icons[selected]} size={26} /><div><h3 ref={headingRef} tabIndex={-1}>{c[selected]}</h3><p>{fit(selected)}</p></div></div>
        <p className="expedition-description">{desc(selected)}</p>
        <div role="status" aria-live="polite" className="expedition-notice">{visibleNotice && c[visibleNotice]}</div>
        {mission ? <div className={`expedition-report${ready ? ' expedition-report--ready' : ''}`}>
          <h4 role="status">{ready ? c.ready : c.traveling}</h4>
          <p>{c[mission.crew]} · {c[mission.band]}{mission.complication ? ` · ${c.complication}` : ''}</p>
          <progress value={progress} max={1} aria-label={c.duration} />
          <strong className="expedition-countdown">{ready ? c.ready : duration(mission.endsAt - state.lastUpdateAt)}</strong>
          <dl className="expedition-numbers">
            <div><dt>{c.reserve}</dt><dd>{pct(getExpeditionReservation(state))}</dd></div>
            <div><dt>{c.net}</dt><dd>{n(getCps(state))}/s</dd></div>
            <div><dt>{c.reserved}</dt><dd>{n(mission.reserved)}</dd></div>
            <div><dt>{c.reward}</dt><dd>{n(mission.reserved * mission.rewardMultiplier)}</dd></div>
          </dl>
          {ready ? <><p>{c.readyNote}</p><button className="expedition-launch" type="button" onClick={() => { onClaim(); setNotice('returned'); headingRef.current?.focus(); }}><Icon name="clutch" />{c.collect}</button></>
            : <><button type="button" className="expedition-recall" onClick={() => { onCancel(); setNotice('recalled'); headingRef.current?.focus(); }}>{c.cancel}</button><p>{c.cancelNote}</p></>}
          <p className="expedition-fineprint">{c.migration}</p>
        </div> : <>
          <fieldset className="expedition-choices"><legend>{c.crew}</legend>{(Object.keys(EXPEDITION_CREWS) as ExpeditionCrew[]).map(id => <label key={id} className={crew === id ? 'is-selected' : ''}><input type="radio" name="expedition-crew" value={id} checked={crew === id} onChange={() => setCrew(id)} /><span><strong>{c[id]}</strong><small>{c[`${id}Desc`]}</small></span></label>)}</fieldset>
          <label className="expedition-band">{c.band}<select value={band} onChange={e => setBand(e.target.value as ExpeditionBand)}>{(Object.keys(EXPEDITION_BANDS) as ExpeditionBand[]).map(id => <option key={id} value={id}>{c[id]}</option>)}</select></label>
          <label className="expedition-complication"><input type="checkbox" checked={complication} onChange={e => setComplication(e.target.checked)} /><span><strong>{c.complication}</strong><small>{c.complicationDesc}</small></span></label>
          <dl className="expedition-numbers">
            <div><dt>{c.affinity}</dt><dd>{pct(quote.affinity)}</dd></div><div><dt>{c.mastery}</dt><dd>{pct(quote.masteryReduction)}</dd></div>
            <div><dt>{c.duration}</dt><dd>{duration(quote.durationMs)}</dd></div><div><dt>{c.reserve}</dt><dd>{pct(quote.reservation)} · {n(getBaseCps(state) * quote.reservation)}/s</dd></div>
            <div><dt>{c.haul}</dt><dd>{n(quote.estimatedReward)}</dd></div><div className="expedition-profit"><dt>{c.profit}</dt><dd>+{n(quote.estimatedProfit)}</dd></div>
          </dl>
          <p className="expedition-fineprint">{c.estimate}</p>
          <button className="expedition-launch" type="button" disabled={!isExpeditionUnlocked(state) || getBaseCps(state) <= 0} onClick={() => { onLaunch(plan); setNotice('departed'); headingRef.current?.focus(); }}><Icon name="burrow" />{c.launch}</button>
          <p className="expedition-fineprint">{c.migration}</p>
        </>}
      </section>
        <div className="expedition-collection"><h3>{c.collection} <span>{Object.keys(state.expeditions.artifacts).length}/3</span></h3>
          <div className="expedition-curios">{destinations.map(id => <div key={id} className={state.expeditions.artifacts[id] ? 'is-found' : ''}><Icon name={state.expeditions.artifacts[id] ? icons[id] : 'lock'} size={20} /><div><strong>{c[id]}</strong><p>{state.expeditions.artifacts[id] ? c[`${id}Artifact`] : c.unknown}</p></div></div>)}</div>
          <p>{c.collectionNote}</p><small>{c.completed}: {n(state.expeditions.completed)}</small>
        </div>
    </div>
  </Modal>;
}
