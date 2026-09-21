import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BLOCKS_CHARGE_CAP,
  BLOCKS_CHARGE_COSTS,
  BLOCK_PIECE_BY_ID,
  BOARD_SIZE,
  cellColumn,
  cellIndex,
  cellRow,
  getBlocksRewardGoblins,
  isBlocksRunFinished,
  placementIndices,
  type BlocksChargeId,
  type BlocksLoot,
  type GameState,
} from '../game';
import { getLanguageMeta, useI18n } from '../i18n';
import { BLOCKS_COPY, formatBlocks } from '../i18n/blocks';
import { blocksArt, blocksTileArt, blocksTileTransform } from '../utils/blocksAssets';
import { formatInteger, formatNumber, formatPercent } from '../utils/format';
import { Icon } from './Icon';
import { Modal } from './Modal';
import '../styles/blocks.css';

/** What a committed action actually did, so feedback never has to guess. */
export interface BlocksFeedback {
  clearedLines: number;
  combo: number;
  boardCleared: boolean;
  runEnded: boolean;
}

export interface BlocksWarehouseProps {
  open: boolean;
  state: GameState;
  effects: boolean;
  reducedMotion: boolean;
  onClose: () => void;
  onStart: () => void;
  onPlace: (slot: number, anchorIndex: number) => BlocksFeedback | null;
  onShuffle: () => void;
  onHammer: (cellIndex: number) => void;
  onCollect: () => void;
  onBuyCharge: (charge: BlocksChargeId) => void;
  onTutorialSeen: () => void;
}

/** Entry point beside the Contract Giver and Expedition Entry. */
export function BlocksEntry({ state, onOpen }: { state: GameState; onOpen: () => void }) {
  const { language } = useI18n();
  const copy = BLOCKS_COPY[language];
  const unlocked = state.blocks.unlocked;
  const finished = isBlocksRunFinished(state);
  const running = state.blocks.run !== null && !finished;
  const detail = !unlocked ? copy.locked : finished ? copy.entryFinished : running ? copy.entryRunning : copy.entryIdle;
  return (
    <button
      type="button"
      className={`blocks-giver${finished ? ' blocks-giver--ready' : running ? ' blocks-giver--active' : ''}`}
      onClick={onOpen}
      disabled={!unlocked}
      aria-label={`${copy.giverAria}. ${detail}`}
    >
      <span className="blocks-giver__signal" aria-hidden="true" />
      <img src={blocksArt.giver} alt="" draggable={false} />
      <span className="blocks-giver__copy"><strong>{copy.title}</strong><small>{detail}</small></span>
    </button>
  );
}

function comboFlourish(copy: (typeof BLOCKS_COPY)['en'], combo: number): string | null {
  if (combo >= 10) return copy.combo10;
  if (combo >= 8) return copy.combo8;
  if (combo >= 5) return copy.combo5;
  if (combo >= 3) return copy.combo3;
  if (combo >= 2) return copy.combo2;
  return null;
}

export function BlocksWarehouse({
  open, state, effects, reducedMotion,
  onClose, onStart, onPlace, onShuffle, onHammer, onCollect, onBuyCharge, onTutorialSeen,
}: BlocksWarehouseProps) {
  const { language } = useI18n();
  const copy = BLOCKS_COPY[language];
  const locale = getLanguageMeta(language).locale;

  const [selected, setSelected] = useState<number | null>(null);
  const [anchor, setAnchor] = useState<number | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number; size: number } | null>(null);
  const [hammerArmed, setHammerArmed] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [flourish, setFlourish] = useState<{ key: number; text: string } | null>(null);
  const [clearKey, setClearKey] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const flourishTimer = useRef<number | null>(null);

  const run = state.blocks.run;
  const finished = run !== null && run.endedAt !== null && run.result !== null;
  const active = run !== null && run.endedAt === null;

  useEffect(() => () => { if (flourishTimer.current) window.clearTimeout(flourishTimer.current); }, []);

  /**
   * Announce and celebrate from what the engine reports it actually did, so a
   * placement it rejected can never produce feedback for a move that never landed.
   */
  const applyFeedback = useCallback((feedback: BlocksFeedback | null) => {
    if (!feedback) return;
    const parts: string[] = [copy.announcePlaced];
    if (feedback.clearedLines > 0) parts.push(formatBlocks(copy.announceCleared, { count: feedback.clearedLines }));
    if (feedback.boardCleared) parts.push(copy.announceBoardClear);
    if (feedback.combo >= 2) parts.push(formatBlocks(copy.announceCombo, { count: feedback.combo }));
    if (feedback.runEnded) parts.push(copy.announceOver);
    setAnnouncement(parts.join(' '));

    if (feedback.clearedLines <= 0) return;
    setClearKey((key) => key + 1);
    const text = feedback.boardCleared ? copy.announceBoardClear : comboFlourish(copy, feedback.combo);
    if (!text || !effects) return;
    setFlourish({ key: Date.now(), text });
    if (flourishTimer.current) window.clearTimeout(flourishTimer.current);
    flourishTimer.current = window.setTimeout(() => setFlourish(null), 1_100);
  }, [copy, effects]);

  const resetInput = useCallback(() => {
    setSelected(null);
    setAnchor(null);
    setGhost(null);
    setHammerArmed(false);
  }, []);

  /** Board cell under a client point, or null when the pointer is off the grid. */
  const cellAt = useCallback((clientX: number, clientY: number, lift = 0) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const size = rect.width / BOARD_SIZE;
    const x = Math.floor((clientX - rect.left) / size);
    const y = Math.floor((clientY - lift - rect.top) / size);
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return null;
    return cellIndex(x, y);
  }, []);

  const anchorFor = useCallback((slot: number, clientX: number, clientY: number, lift: number) => {
    const piece = run?.tray[slot];
    const rect = boardRef.current?.getBoundingClientRect();
    if (!piece || !rect || rect.width === 0) return null;
    const definition = BLOCK_PIECE_BY_ID[piece.pieceId];
    const size = rect.width / BOARD_SIZE;
    // The player grabs a piece near its middle, so offset the anchor by half the
    // piece rather than dropping its top-left corner under the pointer.
    const x = Math.round((clientX - rect.left) / size - 0.5 - (definition.width - 1) / 2);
    const y = Math.round((clientY - lift - rect.top) / size - 0.5 - (definition.height - 1) / 2);
    const clampedX = Math.max(0, Math.min(BOARD_SIZE - definition.width, x));
    const clampedY = Math.max(0, Math.min(BOARD_SIZE - definition.height, y));
    if (x < -1 || y < -1 || x > BOARD_SIZE || y > BOARD_SIZE) return null;
    return cellIndex(clampedX, clampedY);
  }, [run]);

  /** Captured with the drag so the ghost never has to read a ref during render. */
  const cellSize = useCallback(() => (boardRef.current?.getBoundingClientRect().width ?? 0) / BOARD_SIZE, []);

  const startDrag = (slot: number) => (event: React.PointerEvent) => {
    if (!active || hammerArmed) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const size = cellSize();
    // On touch the finger covers the drop target, so the piece rides a cell above it.
    const lift = event.pointerType === 'touch' ? size : 0;
    setSelected(slot);
    setGhost({ x: event.clientX, y: event.clientY - lift, size });
    setAnchor(anchorFor(slot, event.clientX, event.clientY, lift));
  };

  const moveDrag = (slot: number) => (event: React.PointerEvent) => {
    if (selected !== slot || !ghost) return;
    const size = cellSize();
    const lift = event.pointerType === 'touch' ? size : 0;
    setGhost({ x: event.clientX, y: event.clientY - lift, size });
    setAnchor(anchorFor(slot, event.clientX, event.clientY, lift));
  };

  const endDrag = (slot: number) => (event: React.PointerEvent) => {
    if (selected !== slot) return;
    const lift = event.pointerType === 'touch' ? cellSize() : 0;
    const target = anchorFor(slot, event.clientX, event.clientY, lift);
    const onBoard = cellAt(event.clientX, event.clientY, lift) !== null;
    setGhost(null);
    if (onBoard && target !== null && run && placementIndices(run.board, run.tray[slot]!.pieceId, target)) {
      applyFeedback(onPlace(slot, target));
      setSelected(null);
      setAnchor(null);
      return;
    }
    // A released piece that could not land stays selected, so keyboard and
    // click-to-place still work without re-picking it up.
    setAnchor(null);
  };

  const onBoardPointerDown = (event: React.PointerEvent) => {
    const index = cellAt(event.clientX, event.clientY);
    if (index === null) return;
    if (hammerArmed) {
      if (run?.board[index]) { onHammer(index); setHammerArmed(false); }
      return;
    }
    if (selected === null || !run) return;
    const piece = run.tray[selected];
    if (!piece) return;
    const target = anchorFor(selected, event.clientX, event.clientY, 0);
    if (target !== null && placementIndices(run.board, piece.pieceId, target)) {
      applyFeedback(onPlace(selected, target));
      setSelected(null);
      setAnchor(null);
    }
  };

  const onBoardKeyDown = (event: React.KeyboardEvent) => {
    if (!active || !run) return;
    if (event.key >= '1' && event.key <= '3') {
      const slot = Number(event.key) - 1;
      if (run.tray[slot]) { setSelected(slot); setAnchor((current) => current ?? 0); }
      event.preventDefault();
      return;
    }
    if (event.key === 'Escape' && selected !== null) { setSelected(null); event.preventDefault(); return; }
    const deltas: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -BOARD_SIZE, ArrowDown: BOARD_SIZE };
    if (event.key in deltas) {
      setAnchor((current) => {
        const base = current ?? 0;
        const next = base + deltas[event.key];
        if (next < 0 || next >= BOARD_SIZE * BOARD_SIZE) return base;
        // Keep horizontal steps inside the row they started on.
        if (Math.abs(deltas[event.key]) === 1 && cellRow(next) !== cellRow(base)) return base;
        return next;
      });
      event.preventDefault();
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && selected !== null && anchor !== null) {
      if (placementIndices(run.board, run.tray[selected]!.pieceId, anchor)) {
        applyFeedback(onPlace(selected, anchor));
        // Clear the selection exactly as the pointer path does. Without this a
        // completed set deals a new piece into a slot that still reads as
        // selected, and the next Enter would place it unchosen.
        setSelected(null);
      }
      event.preventDefault();
    }
  };

  // Every hook above runs unconditionally; bail out before deriving the board so
  // a closed warehouse costs nothing on the game's 10 Hz render loop.
  if (!open) return null;

  const blocks = state.blocks;
  const preview = selected !== null && anchor !== null && run
    ? placementIndices(run.board, run.tray[selected]?.pieceId ?? 'dot', anchor)
    : null;
  const previewSet = new Set(preview ?? []);
  const invalid = selected !== null && anchor !== null && preview === null;

  // Rows and columns this placement would complete, so the board can hint at a
  // multi-line opportunity without solving anything for the player.
  const completing = new Set<string>();
  if (preview && run) {
    const filled = new Set(preview);
    for (let y = 0; y < BOARD_SIZE; y += 1) {
      let full = true;
      for (let x = 0; x < BOARD_SIZE; x += 1) {
        const index = cellIndex(x, y);
        if (run.board[index] === null && !filled.has(index)) { full = false; break; }
      }
      if (full) completing.add(`r${y}`);
    }
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      let full = true;
      for (let y = 0; y < BOARD_SIZE; y += 1) {
        const index = cellIndex(x, y);
        if (run.board[index] === null && !filled.has(index)) { full = false; break; }
      }
      if (full) completing.add(`c${x}`);
    }
  }

  const lootName = (loot: BlocksLoot) => copy[`loot_${loot}` as const];
  const n = (value: number) => formatNumber(value, 2, locale);
  const int = (value: number) => formatInteger(value, locale);

  const renderPiece = (slot: number) => {
    const piece = run?.tray[slot];
    if (!piece) return <div key={slot} className="blocks-tray__slot blocks-tray__slot--empty" aria-hidden="true" />;
    const definition = BLOCK_PIECE_BY_ID[piece.pieceId];
    const occupied = new Set(definition.cells.map(([dx, dy]) => dy * definition.width + dx));
    return (
      <div
        key={slot}
        className={`blocks-tray__slot${selected === slot ? ' is-selected' : ''}${ghost && selected === slot ? ' is-dragging' : ''}`}
        role="button"
        tabIndex={0}
        aria-pressed={selected === slot}
        aria-label={formatBlocks(copy.traySlot, { index: slot + 1, piece: lootName(piece.loot), cells: definition.cells.length })}
        onPointerDown={startDrag(slot)}
        onPointerMove={moveDrag(slot)}
        onPointerUp={endDrag(slot)}
        onPointerCancel={() => { setGhost(null); setAnchor(null); }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') { setSelected(slot); setAnchor((current) => current ?? 0); event.preventDefault(); }
        }}
      >
        <div
          className="blocks-piece"
          style={{
            // A shared cell size across all three slots, so a 1x1 reads as small
            // and a 3x3 reads as the board-hog it is.
            gridTemplateColumns: `repeat(${definition.width}, var(--blocks-tray-cell))`,
            gridTemplateRows: `repeat(${definition.height}, var(--blocks-tray-cell))`,
          }}
        >
          {Array.from({ length: definition.width * definition.height }, (_, index) => (
            occupied.has(index)
              ? <img key={index} src={blocksTileArt(piece.loot)} alt="" draggable={false} style={{ transform: blocksTileTransform(piece.variant) }} />
              : <span key={index} />
          ))}
        </div>
      </div>
    );
  };

  const chargeButton = (charge: BlocksChargeId, icon: 'sparkles' | 'hammer') => {
    const held = blocks.charges[charge];
    const cost = BLOCKS_CHARGE_COSTS[charge];
    const armed = charge === 'hammer' && hammerArmed;
    return (
      <div className={`blocks-charge${armed ? ' is-armed' : ''}`}>
        <button
          type="button"
          className="blocks-charge__use"
          disabled={!active || held <= 0}
          title={charge === 'shuffle' ? copy.shuffleHint : copy.hammerHint}
          onClick={() => {
            if (charge === 'shuffle') { onShuffle(); return; }
            setHammerArmed((value) => !value);
          }}
        >
          <Icon name={icon} size={15} />
          <span>{armed ? copy.hammerCancel : charge === 'shuffle' ? copy.shuffle : copy.hammer}</span>
          <small>{formatBlocks(copy.charge, { count: held })}</small>
        </button>
        <button
          type="button"
          className="blocks-charge__buy"
          disabled={blocks.tokens < cost || held >= BLOCKS_CHARGE_CAP}
          onClick={() => onBuyCharge(charge)}
        >
          {held >= BLOCKS_CHARGE_CAP ? copy.chargeFull : formatBlocks(copy.buyCharge, { cost })}
        </button>
      </div>
    );
  };

  const result = run?.result ?? null;
  // Evaluated live, exactly as collection will, so the panel never promises a
  // figure the engine would not pay.
  const rewardGoblins = result ? getBlocksRewardGoblins(state, result.rewardSeconds, result.dailyFactor) : 0;

  return (
    <Modal
      open={open}
      title={copy.title}
      subtitle={copy.subtitle}
      icon={<Icon name="shop" />}
      onClose={() => { resetInput(); onClose(); }}
      size="lg"
      className={`blocks-modal${reducedMotion ? ' blocks-modal--still' : ''}`}
    >
      <div className="blocks-layout">
        <header className="blocks-hud">
          <div className="blocks-hud__score">
            <span>{copy.score}</span>
            <strong>{int(run?.score ?? 0)}</strong>
          </div>
          <div className="blocks-hud__stats">
            <div><span>{copy.best}</span><strong>{int(blocks.stats.bestScore)}</strong></div>
            <div><span>{copy.combo}</span><strong>×{int(Math.max(1, run?.combo ?? 0))}</strong></div>
            <div><span>{copy.set}</span><strong>{int(run?.setNumber ?? 0)}</strong></div>
            <div className="blocks-hud__tokens"><span>{copy.tokens}</span><strong>{int(blocks.tokens)}</strong></div>
          </div>
        </header>

        <div className="blocks-stage">
          <div
            ref={boardRef}
            className={`blocks-board${invalid ? ' blocks-board--invalid' : ''}${hammerArmed ? ' blocks-board--hammer' : ''}`}
            style={{ '--blocks-floor-image': `url(${blocksArt.floor})` } as React.CSSProperties}
            role="grid"
            aria-label={copy.board}
            tabIndex={0}
            onPointerDown={onBoardPointerDown}
            onKeyDown={onBoardKeyDown}
            data-clear={clearKey}
          >
            {(run?.board ?? Array.from({ length: BOARD_SIZE * BOARD_SIZE }, () => null)).map((cell, index) => {
              const row = cellRow(index);
              const column = cellColumn(index);
              const highlight = completing.has(`r${row}`) || completing.has(`c${column}`);
              const classes = [
                'blocks-cell',
                cell ? 'is-filled' : 'is-empty',
                previewSet.has(index) ? 'is-preview' : '',
                highlight ? 'is-completing' : '',
                anchor === index && selected !== null ? 'is-cursor' : '',
              ].filter(Boolean).join(' ');
              return (
                <div
                  key={index}
                  className={classes}
                  role="gridcell"
                  aria-label={cell
                    ? formatBlocks(copy.cellFull, { row: row + 1, column: column + 1, loot: lootName(cell.loot) })
                    : formatBlocks(copy.cellEmpty, { row: row + 1, column: column + 1 })}
                >
                  {cell && <img src={blocksTileArt(cell.loot)} alt="" draggable={false} style={{ transform: blocksTileTransform(cell.variant) }} />}
                </div>
              );
            })}
            {flourish && <span key={flourish.key} className="blocks-flourish">{flourish.text}</span>}
          </div>

          {!run && (
            <div className="blocks-overlay">
              <p>{copy.subtitle}</p>
              <button type="button" className="blocks-primary" onClick={onStart}>{copy.start}</button>
            </div>
          )}

          {finished && result && (
            <div className="blocks-overlay blocks-overlay--result">
              <h3>{copy.overTitle}</h3>
              <p>{copy.overBody}</p>
              <dl className="blocks-result">
                <div><dt>{copy.finalScore}</dt><dd>{int(result.score)}</dd></div>
                <div><dt>{copy.lines}</dt><dd>{int(run.linesCleared)}</dd></div>
                <div><dt>{copy.combo}</dt><dd>×{int(Math.max(1, run.bestCombo))}</dd></div>
                <div><dt>{copy.placed}</dt><dd>{int(run.blocksPlaced)}</dd></div>
              </dl>
              {result.score >= blocks.stats.bestScore && <p className="blocks-best">{copy.newBest}</p>}
              <div className="blocks-payout">
                <strong>{copy.reward}</strong>
                <span>{formatBlocks(copy.rewardProduction, { amount: n(rewardGoblins), seconds: result.rewardSeconds })}</span>
                <span>{formatBlocks(copy.rewardTokens, { count: result.tokens })}</span>
                <small>{formatBlocks(copy.taper, {
                  count: blocks.daily.runsFinished,
                  percent: formatPercent(result.dailyFactor, locale),
                })}</small>
              </div>
              <div className="blocks-overlay__actions">
                <button type="button" className="blocks-primary" onClick={onCollect}>{copy.collect}</button>
                <button type="button" className="blocks-secondary" onClick={onStart}>{copy.playAgain}</button>
              </div>
              <p className="blocks-note">{copy.taperNote}</p>
            </div>
          )}

          {!blocks.tutorialSeen && run !== null && !finished && (
            <div className="blocks-overlay blocks-overlay--tutorial">
              <h3>{copy.tutorialTitle}</h3>
              <ol>
                <li>{copy.tutorial1}</li><li>{copy.tutorial2}</li><li>{copy.tutorial3}</li>
                <li>{copy.tutorial4}</li><li>{copy.tutorial5}</li>
              </ol>
              <button type="button" className="blocks-primary" onClick={onTutorialSeen}>{copy.tutorialDone}</button>
            </div>
          )}
        </div>

        <div className="blocks-tray" role="group" aria-label={copy.tray}>
          {[0, 1, 2].map(renderPiece)}
        </div>

        <footer className="blocks-footer">
          <div className="blocks-charges">
            {chargeButton('shuffle', 'sparkles')}
            {chargeButton('hammer', 'hammer')}
          </div>
          <dl className="blocks-tally">
            <div><dt>{copy.lines}</dt><dd>{int(blocks.stats.totalLines)}</dd></div>
            <div><dt>{copy.runs}</dt><dd>{int(blocks.stats.runs)}</dd></div>
            <div><dt>{copy.boardClears}</dt><dd>{int(blocks.stats.boardClears)}</dd></div>
            <div><dt>{copy.perfectSets}</dt><dd>{int(blocks.stats.perfectSets)}</dd></div>
          </dl>
          <p className="blocks-note blocks-note--keys">{copy.keyboardHint} {copy.tokensNote}</p>
        </footer>
      </div>

      <p className="blocks-live" role="status" aria-live="polite">{announcement}</p>

      {/*
        * Portalled to the body on purpose. The app shell carries `zoom:
        * uiScale`, and a fixed-position child of a zoomed subtree has its
        * `left`/`top` multiplied by that zoom — so a pointer coordinate placed
        * the dragged piece further and further right the higher the UI scale.
        * Outside the shell, viewport coordinates mean what they say.
        */}
      {ghost && selected !== null && run?.tray[selected] && createPortal(
        <GhostPiece piece={run.tray[selected]!} ghost={ghost} valid={preview !== null} still={reducedMotion} />,
        document.body,
      )}
    </Modal>
  );
}

function GhostPiece({ piece, ghost, valid, still }: {
  piece: NonNullable<NonNullable<GameState['blocks']['run']>['tray'][number]>;
  ghost: { x: number; y: number; size: number };
  valid: boolean;
  /** Carried as a prop because the portal puts this outside `.blocks-modal`. */
  still: boolean;
}) {
  const definition = BLOCK_PIECE_BY_ID[piece.pieceId];
  const size = ghost.size;
  const occupied = new Set(definition.cells.map(([dx, dy]) => dy * definition.width + dx));
  return (
    <div
      className={`blocks-ghost${valid ? '' : ' blocks-ghost--invalid'}${still ? ' blocks-ghost--still' : ''}`}
      style={{
        left: ghost.x,
        top: ghost.y,
        width: definition.width * size,
        height: definition.height * size,
        gridTemplateColumns: `repeat(${definition.width}, 1fr)`,
        gridTemplateRows: `repeat(${definition.height}, 1fr)`,
      }}
      aria-hidden="true"
    >
      {Array.from({ length: definition.width * definition.height }, (_, index) => (
        occupied.has(index)
          ? <img key={index} src={blocksTileArt(piece.loot)} alt="" draggable={false} style={{ transform: blocksTileTransform(piece.variant) }} />
          : <span key={index} />
      ))}
    </div>
  );
}
