import {
  TILE_SOLID, TILE_PLATFORM, TILE_HAZARD, TILE_LADDER, TILE_SIZE,
} from '../engine/constants.js';

const _ = 0;
const W = TILE_SOLID;
const P = TILE_PLATFORM;
const S = TILE_HAZARD;
const L = TILE_LADDER;

const COLS = 260;
const ROWS = 29;

function makeTilemap() {
  const map = Array.from({ length: ROWS }, () => Array(COLS).fill(_));

  for (let r = 26; r < 29; r++) {
    for (let c = 0; c < COLS; c++) {
      map[r][c] = W;
    }
  }

  const pillars = [4, 20, 40, 60, 85, 110, 135, 160, 185, 210, 235, 255];
  for (const c of pillars) {
    for (let r = 23; r < 26; r++) {
      map[r][c] = W;
    }
  }

  const platforms = [
    [10, 20, 3],  [25, 15, 4],  [35, 19, 3], [48, 13, 4],  [58, 18, 3],
    [68, 14, 5],  [80, 19, 3],  [90, 12, 4], [100, 17, 3], [110, 14, 4],
    [120, 19, 3], [130, 12, 4], [142, 17, 3], [152, 14, 5], [165, 19, 3],
    [175, 13, 4], [185, 18, 3], [195, 14, 4], [205, 19, 3], [215, 12, 4],
    [225, 17, 3], [235, 14, 4], [245, 18, 3],
  ];
  for (const [col, row, len] of platforms) {
    for (let c = col; c < col + len && c < COLS; c++) {
      map[row][c] = P;
    }
  }

  for (let r = 11; r < 22; r++) {
    map[r][55] = L;
  }
  for (let r = 11; r < 22; r++) {
    map[r][130] = L;
  }
  for (let r = 14; r < 22; r++) {
    map[r][200] = L;
  }

  for (let c = 56; c < 130; c++) {
    for (let r = 13; r < 16; r++) {
      map[r][c] = W;
    }
  }

  for (let c = 70; c < 120; c += 8) {
    if (c < COLS) {
      map[10][c] = W;
      map[10][c + 1] = W;
    }
  }

  return map;
}

const tilemap = makeTilemap();

export const level2 = {
  name: 'Salão dos Ossos',
  tilemap,
  width: COLS * TILE_SIZE,
  height: ROWS * TILE_SIZE,
  playerSpawn: { x: 3 * TILE_SIZE, y: 24 * TILE_SIZE },
  background: 'cathedral',
  bgColor: '#0e0a20',
  fogDensity: 0.5,

  enemies: [
    { type: 'patrol', x: 12 * TILE_SIZE, y: 24 * TILE_SIZE, hp: 2, damage: 1, score: 100, dir: -1, range: 55, drawScale: 0.56 },
    { type: 'patrol', x: 28 * TILE_SIZE, y: 24 * TILE_SIZE, hp: 2, damage: 1, score: 100, dir: 1, range: 60, drawScale: 0.56 },
    { type: 'patrol', x: 45 * TILE_SIZE, y: 24 * TILE_SIZE, hp: 3, damage: 1, score: 150, dir: -1, range: 50, drawScale: 0.56 },
    { type: 'patrol', x: 75 * TILE_SIZE, y: 12 * TILE_SIZE, hp: 2, damage: 1, score: 100, dir: 1, range: 50, drawScale: 0.56 },
    { type: 'patrol', x: 95 * TILE_SIZE, y: 12 * TILE_SIZE, hp: 3, damage: 1, score: 150, dir: -1, range: 60, drawScale: 0.56 },
    { type: 'patrol', x: 115 * TILE_SIZE, y: 12 * TILE_SIZE, hp: 2, damage: 1, score: 100, dir: 1, range: 55, drawScale: 0.56 },
    { type: 'patrol', x: 148 * TILE_SIZE, y: 24 * TILE_SIZE, hp: 2, damage: 1, score: 100, dir: -1, range: 60, drawScale: 0.56 },
    { type: 'patrol', x: 170 * TILE_SIZE, y: 24 * TILE_SIZE, hp: 3, damage: 1, score: 150, dir: 1, range: 65, drawScale: 0.56 },
    { type: 'patrol', x: 195 * TILE_SIZE, y: 24 * TILE_SIZE, hp: 2, damage: 1, score: 100, dir: -1, range: 50, drawScale: 0.56 },
    { type: 'patrol', x: 220 * TILE_SIZE, y: 24 * TILE_SIZE, hp: 3, damage: 1, score: 150, dir: 1, range: 60, drawScale: 0.56 },
    { type: 'patrol', x: 245 * TILE_SIZE, y: 24 * TILE_SIZE, hp: 2, damage: 1, score: 100, dir: -1, range: 50, drawScale: 0.56 },

    { type: 'fly', x: 18 * TILE_SIZE, y: 8 * TILE_SIZE, hp: 1, damage: 1, score: 150, drawScale: 0.35 },
    { type: 'fly', x: 38 * TILE_SIZE, y: 12 * TILE_SIZE, hp: 1, damage: 1, score: 150, drawScale: 0.35 },
    { type: 'fly', x: 65 * TILE_SIZE, y: 6 * TILE_SIZE, hp: 1, damage: 1, score: 150, drawScale: 0.35 },
    { type: 'fly', x: 88 * TILE_SIZE, y: 10 * TILE_SIZE, hp: 1, damage: 1, score: 150, drawScale: 0.35 },
    { type: 'fly', x: 105 * TILE_SIZE, y: 7 * TILE_SIZE, hp: 1, damage: 1, score: 150, drawScale: 0.35 },
    { type: 'fly', x: 140 * TILE_SIZE, y: 9 * TILE_SIZE, hp: 1, damage: 1, score: 150, drawScale: 0.35 },
    { type: 'fly', x: 165 * TILE_SIZE, y: 11 * TILE_SIZE, hp: 1, damage: 1, score: 150, drawScale: 0.35 },
    { type: 'fly', x: 190 * TILE_SIZE, y: 8 * TILE_SIZE, hp: 1, damage: 1, score: 150, drawScale: 0.35 },
  ],

  decorations: [
    { frameId: 21, x: 128, y: 736, layer: 'foreground' },
    { frameId: 22, x: 640, y: 736, layer: 'foreground' },
    { frameId: 21, x: 1280, y: 736, layer: 'foreground' },
    { frameId: 22, x: 1920, y: 736, layer: 'foreground' },
    { frameId: 21, x: 2720, y: 736, layer: 'foreground' },
    { frameId: 22, x: 3520, y: 736, layer: 'foreground' },
    { frameId: 21, x: 4320, y: 736, layer: 'foreground' },
    { frameId: 22, x: 5120, y: 736, layer: 'foreground' },
    { frameId: 21, x: 5920, y: 736, layer: 'foreground' },
    { frameId: 22, x: 6720, y: 736, layer: 'foreground' },
    { frameId: 21, x: 7520, y: 736, layer: 'foreground' },
    { frameId: 22, x: 8160, y: 736, layer: 'foreground' },
    { frameId: 75, x: 128, y: 768, layer: 'foreground' },
    { frameId: 76, x: 640, y: 768, layer: 'foreground' },
    { frameId: 77, x: 1280, y: 768, layer: 'foreground' },
    { frameId: 78, x: 1920, y: 768, layer: 'foreground' },
    { frameId: 79, x: 2720, y: 768, layer: 'foreground' },
    { frameId: 75, x: 3520, y: 768, layer: 'foreground' },
    { frameId: 76, x: 4320, y: 768, layer: 'foreground' },
    { frameId: 77, x: 5120, y: 768, layer: 'foreground' },
    { frameId: 78, x: 5920, y: 768, layer: 'foreground' },
    { frameId: 79, x: 6720, y: 768, layer: 'foreground' },
    { frameId: 75, x: 7520, y: 768, layer: 'foreground' },
    { frameId: 76, x: 8160, y: 768, layer: 'foreground' },
    { frameId: 86, x: 1792, y: 448, layer: 'background' },
    { frameId: 88, x: 1824, y: 448, layer: 'background' },
    { frameId: 90, x: 1856, y: 448, layer: 'background' },
    { frameId: 87, x: 1888, y: 448, layer: 'background' },
    { frameId: 91, x: 1952, y: 448, layer: 'background' },
    { frameId: 89, x: 1984, y: 448, layer: 'background' },
    { frameId: 92, x: 2016, y: 448, layer: 'background' },
    { frameId: 60, x: 2048, y: 448, layer: 'foreground' },
    { frameId: 62, x: 2080, y: 448, layer: 'foreground' },
    { frameId: 61, x: 2112, y: 448, layer: 'foreground' },
    { frameId: 63, x: 2144, y: 448, layer: 'foreground' },
    { frameId: 60, x: 2176, y: 448, layer: 'foreground' },
    { frameId: 62, x: 2208, y: 448, layer: 'foreground' },
    { frameId: 61, x: 2240, y: 448, layer: 'foreground' },
    { frameId: 63, x: 2272, y: 448, layer: 'foreground' },
    { frameId: 60, x: 2304, y: 448, layer: 'foreground' },
    { frameId: 62, x: 2336, y: 448, layer: 'foreground' },
    { frameId: 56, x: 1280, y: 736, layer: 'foreground' },
    { frameId: 57, x: 3520, y: 736, layer: 'foreground' },
    { frameId: 56, x: 5920, y: 736, layer: 'foreground' },
    { frameId: 80, x: 2880, y: 384, layer: 'foreground' },
    { frameId: 82, x: 2976, y: 384, layer: 'foreground' },
    { frameId: 81, x: 4192, y: 384, layer: 'foreground' },
    { frameId: 80, x: 4256, y: 384, layer: 'foreground' },
    { frameId: 82, x: 6880, y: 384, layer: 'foreground' },
    { frameId: 71, x: 320, y: 672, layer: 'foreground' },
    { frameId: 72, x: 352, y: 672, layer: 'foreground' },
    { frameId: 74, x: 384, y: 672, layer: 'foreground' },
    { frameId: 71, x: 800, y: 512, layer: 'foreground' },
    { frameId: 72, x: 832, y: 512, layer: 'foreground' },
    { frameId: 117, x: 0, y: 800, layer: 'foreground' },
    { frameId: 120, x: 32, y: 800, layer: 'foreground' },
    { frameId: 117, x: 64, y: 800, layer: 'foreground' },
    { frameId: 120, x: 96, y: 800, layer: 'foreground' },
    { frameId: 117, x: 160, y: 800, layer: 'foreground' },
    { frameId: 120, x: 192, y: 800, layer: 'foreground' },
    { frameId: 116, x: 1792, y: 384, layer: 'foreground' },
    { frameId: 118, x: 1824, y: 384, layer: 'foreground' },
    { frameId: 119, x: 1856, y: 384, layer: 'foreground' },
    { frameId: 115, x: 1856, y: 544, layer: 'foreground' },
    { frameId: 102, x: 2048, y: 448, layer: 'background' },
    { frameId: 104, x: 2080, y: 448, layer: 'background' },
    { frameId: 107, x: 2112, y: 448, layer: 'background' },
    { frameId: 109, x: 2144, y: 448, layer: 'background' },
  ],

  checkpoints: [
    { x: 30 * TILE_SIZE, y: 24 * TILE_SIZE },
    { x: 75 * TILE_SIZE, y: 12 * TILE_SIZE },
    { x: 150 * TILE_SIZE, y: 24 * TILE_SIZE },
    { x: 215 * TILE_SIZE, y: 24 * TILE_SIZE },
  ],

  hazards: [
    { x: 35 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 36 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 82 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 83 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 145 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 146 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 147 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 180 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 181 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 240 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 241 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
  ],
};
