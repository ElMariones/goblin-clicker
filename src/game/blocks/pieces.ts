/**
 * The Goblin Blocks piece library.
 *
 * Classic Mode has no manual rotation, so every rotated variant is its own
 * entry. That keeps input trivial on touch and makes the random draw itself
 * meaningful: an awkward orientation is a real constraint rather than one
 * button press away from being universally useful.
 *
 * Cells are `[dx, dy]` offsets from the piece's top-left anchor. `weight` is the
 * static draw weight before the generator applies board-aware scaling.
 */

export type BlocksDifficulty = 'easy' | 'medium' | 'hard';

export type BlockPieceId =
  | 'dot'
  | 'h2' | 'v2' | 'h3' | 'v3' | 'h4' | 'v4' | 'h5' | 'v5'
  | 'square2' | 'square3'
  | 'corner_tl' | 'corner_tr' | 'corner_br' | 'corner_bl'
  | 'l_n' | 'l_e' | 'l_s' | 'l_w'
  | 'j_n' | 'j_e' | 'j_s' | 'j_w'
  | 't_n' | 't_e' | 't_s' | 't_w'
  | 's_h' | 's_v' | 'z_h' | 'z_v';

export interface BlockPieceDefinition {
  id: BlockPieceId;
  cells: readonly (readonly [number, number])[];
  width: number;
  height: number;
  weight: number;
  difficulty: BlocksDifficulty;
}

function line(id: BlockPieceId, length: number, vertical: boolean, weight: number, difficulty: BlocksDifficulty): BlockPieceDefinition {
  const cells = Array.from({ length }, (_, index) => (vertical ? [0, index] : [index, 0]) as readonly [number, number]);
  return { id, cells, width: vertical ? 1 : length, height: vertical ? length : 1, weight, difficulty };
}

function rect(id: BlockPieceId, size: number, weight: number, difficulty: BlocksDifficulty): BlockPieceDefinition {
  const cells: (readonly [number, number])[] = [];
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) cells.push([x, y]);
  return { id, cells, width: size, height: size, weight, difficulty };
}

function shape(
  id: BlockPieceId,
  rows: readonly string[],
  weight: number,
  difficulty: BlocksDifficulty,
): BlockPieceDefinition {
  const cells: (readonly [number, number])[] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) if (row[x] === 'X') cells.push([x, y]);
  });
  return { id, cells, width: Math.max(...rows.map((row) => row.length)), height: rows.length, weight, difficulty };
}

export const BLOCK_PIECES: readonly BlockPieceDefinition[] = [
  { id: 'dot', cells: [[0, 0]], width: 1, height: 1, weight: 6, difficulty: 'easy' },

  line('h2', 2, false, 10, 'easy'),
  line('v2', 2, true, 10, 'easy'),
  line('h3', 3, false, 9, 'easy'),
  line('v3', 3, true, 9, 'easy'),
  line('h4', 4, false, 6, 'medium'),
  line('v4', 4, true, 6, 'medium'),
  line('h5', 5, false, 3, 'hard'),
  line('v5', 5, true, 3, 'hard'),

  rect('square2', 2, 8, 'medium'),
  // The run-killer. It needs a preserved nine-cell pocket, which is exactly the
  // discipline good play rewards, so it stays rare rather than absent.
  rect('square3', 3, 2.5, 'hard'),

  shape('corner_tl', ['XX', 'X.'], 7, 'easy'),
  shape('corner_tr', ['XX', '.X'], 7, 'easy'),
  shape('corner_br', ['.X', 'XX'], 7, 'easy'),
  shape('corner_bl', ['X.', 'XX'], 7, 'easy'),

  shape('l_n', ['X.', 'X.', 'XX'], 4, 'medium'),
  shape('l_e', ['XXX', 'X..'], 4, 'medium'),
  shape('l_s', ['XX', '.X', '.X'], 4, 'medium'),
  shape('l_w', ['..X', 'XXX'], 4, 'medium'),

  shape('j_n', ['.X', '.X', 'XX'], 4, 'medium'),
  shape('j_e', ['X..', 'XXX'], 4, 'medium'),
  shape('j_s', ['XX', 'X.', 'X.'], 4, 'medium'),
  shape('j_w', ['XXX', '..X'], 4, 'medium'),

  shape('t_n', ['XXX', '.X.'], 4, 'medium'),
  shape('t_e', ['X.', 'XX', 'X.'], 4, 'medium'),
  shape('t_s', ['.X.', 'XXX'], 4, 'medium'),
  shape('t_w', ['.X', 'XX', '.X'], 4, 'medium'),

  shape('s_h', ['.XX', 'XX.'], 2.5, 'hard'),
  shape('s_v', ['X.', 'XX', '.X'], 2.5, 'hard'),
  shape('z_h', ['XX.', '.XX'], 2.5, 'hard'),
  shape('z_v', ['.X', 'XX', 'X.'], 2.5, 'hard'),
] as const;

export const BLOCK_PIECE_BY_ID: Record<BlockPieceId, BlockPieceDefinition> =
  Object.fromEntries(BLOCK_PIECES.map((piece) => [piece.id, piece])) as Record<BlockPieceId, BlockPieceDefinition>;

export const BLOCK_PIECE_IDS: readonly BlockPieceId[] = BLOCK_PIECES.map((piece) => piece.id);

export function isBlockPieceId(value: unknown): value is BlockPieceId {
  return typeof value === 'string' && Object.hasOwn(BLOCK_PIECE_BY_ID, value);
}
