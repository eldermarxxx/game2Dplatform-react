import {
  TILE_SOLID, TILE_PLATFORM, TILE_HAZARD, TILE_LADDER, TILE_SIZE,
} from '../engine/constants.js';

const _ = 0;
const W = TILE_SOLID;
const P = TILE_PLATFORM;
const S = TILE_HAZARD;
const L = TILE_LADDER;

const COLS = 220;
const ROWS = 29;

function makeTilemap() {
  const map = Array.from({ length: ROWS }, () => Array(COLS).fill(_));

  for (let r = 26; r < 29; r++) {
    for (let c = 0; c < COLS; c++) {
      map[r][c] = W;
    }
  }

  const pillars = [4, 22, 45, 70, 95, 120, 145, 170, 195, 215];
  for (const c of pillars) {
    for (let r = 23; r < 26; r++) {
      map[r][c] = W;
    }
  }

  const platforms_1 = [
    [10, 19, 3], [20, 14, 4], [30, 18, 3], [40, 12, 4], [50, 17, 3], [60, 14, 4],
  ];
  for (const [col, row, len] of platforms_1) {
    for (let c = col; c < col + len && c < COLS; c++) {
      map[row][c] = P;
    }
  }
  for (let r = 14; r < 23; r++) {
    map[r][35] = L;
  }
  for (let c = 36; c < 70; c++) {
    for (let r = 13; r < 16; r++) {
      map[r][c] = W;
    }
  }
  for (let r = 8; r < 14; r++) {
    map[r][50] = L;
  }
  for (let c = 51; c < 70; c++) {
    for (let r = 7; r < 9; r++) {
      map[r][c] = W;
    }
  }
  map[7][65] = _; map[7][66] = _;
  map[8][65] = _; map[8][66] = _;

  const platforms_2 = [
    [72, 20, 3], [80, 15, 4], [88, 19, 3], [95, 13, 4],
    [102, 18, 3], [110, 14, 4], [118, 19, 3], [125, 12, 4], [135, 17, 3],
  ];
  for (const [col, row, len] of platforms_2) {
    for (let c = col; c < col + len && c < COLS; c++) {
      map[row][c] = P;
    }
  }
  for (let r = 14; r < 23; r++) {
    map[r][90] = L;
  }
  for (let c = 91; c < 120; c++) {
    for (let r = 13; r < 16; r++) {
      map[r][c] = W;
    }
  }
  for (let r = 13; r < 16; r++) {
    for (let c = 105; c < 108; c++) {
      map[r][c] = _;
    }
  }

  const platforms_3 = [
    [148, 19, 3], [155, 14, 4], [162, 18, 3], [170, 12, 4],
    [178, 17, 3], [185, 14, 4], [192, 19, 3], [200, 13, 4], [208, 18, 3],
  ];
  for (const [col, row, len] of platforms_3) {
    for (let c = col; c < col + len && c < COLS; c++) {
      map[row][c] = P;
    }
  }
  for (let r = 13; r < 23; r++) {
    map[r][160] = L;
  }
  for (let r = 10; r < 20; r++) {
    map[r][195] = L;
  }

  for (let r = 26; r < 29; r++) {
    for (let c = 74; c < 77; c++) { map[r][c] = _; }
    for (let c = 138; c < 141; c++) { map[r][c] = _; }
  }

  return map;
}

const tilemap = makeTilemap();

export const level3 = {
  name: 'Torre do Necromante',
  tilemap,
  width: COLS * TILE_SIZE,
  height: ROWS * TILE_SIZE,
  playerSpawn: { x: 3 * TILE_SIZE, y: 24 * TILE_SIZE },
  background: 'tower',
  bgColor: '#12081e',
  fogDensity: 0.8,

  enemies: [
    { type: 'patrol', x: 10 * TILE_SIZE, y: 24 * TILE_SIZE, hp: 3, damage: 1, score: 150, dir: -1, range: 50, drawScale: 0.56 },
    { type: 'patrol', x: 25 * TILE_SIZE, y: 24 * TILE_SIZE, hp: 2, damage: 1, score: 100, dir: 1, range: 55, drawScale: 0.56 },
    { type: 'patrol', x: 42 * TILE_SIZE, y: 12 * TILE_SIZE, hp: 3, damage: 1, score: 150, dir: -1, range: 50, drawScale: 0.56 },
    { type: 'patrol', x: 58 * TILE_SIZE, y: 6 * TILE_SIZE, hp: 3, damage: 1, score: 200, dir: 1, range: 40, drawScale: 0.56 },
    { type: 'patrol', x: 78 * TILE_SIZE, y: 24 * TILE_SIZE, hp: 2, damage: 1, score: 100, dir: -1, range: 60, drawScale: 0.56 },
    { type: 'patrol', x: 98 * TILE_SIZE, y: 24 * TILE_SIZE, hp: 3, damage: 1, score: 150, dir: 1, range: 55, drawScale: 0.56 },
    { type: 'patrol', x: 112 * TILE_SIZE, y: 12 * TILE_SIZE, hp: 3, damage: 1, score: 150, dir: -1, range: 50, drawScale: 0.56 },
    { type: 'patrol', x: 135 * TILE_SIZE, y: 24 * TILE_SIZE, hp: 2, damage: 1, score: 100, dir: 1, range: 60, drawScale: 0.56 },
    { type: 'patrol', x: 155 * TILE_SIZE, y: 24 * TILE_SIZE, hp: 3, damage: 1, score: 150, dir: -1, range: 55, drawScale: 0.56 },
    { type: 'patrol', x: 175 * TILE_SIZE, y: 12 * TILE_SIZE, hp: 3, damage: 1, score: 150, dir: 1, range: 50, drawScale: 0.56 },
    { type: 'patrol', x: 200 * TILE_SIZE, y: 24 * TILE_SIZE, hp: 4, damage: 2, score: 300, dir: -1, range: 60, drawScale: 0.56 },
    { type: 'patrol', x: 212 * TILE_SIZE, y: 24 * TILE_SIZE, hp: 3, damage: 1, score: 150, dir: 1, range: 40, drawScale: 0.56 },

    { type: 'fly', x: 15 * TILE_SIZE, y: 10 * TILE_SIZE, hp: 1, damage: 1, score: 150, drawScale: 0.35 },
    { type: 'fly', x: 32 * TILE_SIZE, y: 7 * TILE_SIZE, hp: 1, damage: 1, score: 150, drawScale: 0.35 },
    { type: 'fly', x: 48 * TILE_SIZE, y: 5 * TILE_SIZE, hp: 1, damage: 1, score: 150, drawScale: 0.35 },
    { type: 'fly', x: 75 * TILE_SIZE, y: 12 * TILE_SIZE, hp: 1, damage: 1, score: 150, drawScale: 0.35 },
    { type: 'fly', x: 92 * TILE_SIZE, y: 8 * TILE_SIZE, hp: 1, damage: 1, score: 150, drawScale: 0.35 },
    { type: 'fly', x: 115 * TILE_SIZE, y: 6 * TILE_SIZE, hp: 1, damage: 1, score: 150, drawScale: 0.35 },
    { type: 'fly', x: 145 * TILE_SIZE, y: 10 * TILE_SIZE, hp: 1, damage: 1, score: 150, drawScale: 0.35 },
    { type: 'fly', x: 185 * TILE_SIZE, y: 8 * TILE_SIZE, hp: 1, damage: 1, score: 150, drawScale: 0.35 },
  ],

  decorations: [
    { frameId: 23, x: 128, y: 736, layer: 'foreground' },
    { frameId: 24, x: 704, y: 736, layer: 'foreground' },
    { frameId: 23, x: 1440, y: 736, layer: 'foreground' },
    { frameId: 24, x: 2240, y: 736, layer: 'foreground' },
    { frameId: 23, x: 3040, y: 736, layer: 'foreground' },
    { frameId: 24, x: 3840, y: 736, layer: 'foreground' },
    { frameId: 23, x: 4640, y: 736, layer: 'foreground' },
    { frameId: 24, x: 5440, y: 736, layer: 'foreground' },
    { frameId: 23, x: 6240, y: 736, layer: 'foreground' },
    { frameId: 24, x: 6880, y: 736, layer: 'foreground' },
    { frameId: 75, x: 128, y: 768, layer: 'foreground' },
    { frameId: 76, x: 704, y: 768, layer: 'foreground' },
    { frameId: 77, x: 1440, y: 768, layer: 'foreground' },
    { frameId: 78, x: 2240, y: 768, layer: 'foreground' },
    { frameId: 75, x: 3040, y: 768, layer: 'foreground' },
    { frameId: 76, x: 3840, y: 768, layer: 'foreground' },
    { frameId: 77, x: 4640, y: 768, layer: 'foreground' },
    { frameId: 78, x: 5440, y: 768, layer: 'foreground' },
    { frameId: 75, x: 6240, y: 768, layer: 'foreground' },
    { frameId: 76, x: 6880, y: 768, layer: 'foreground' },
    { frameId: 86, x: 1152, y: 448, layer: 'background' },
    { frameId: 88, x: 1184, y: 448, layer: 'background' },
    { frameId: 90, x: 1216, y: 448, layer: 'background' },
    { frameId: 87, x: 1248, y: 448, layer: 'background' },
    { frameId: 91, x: 1280, y: 448, layer: 'background' },
    { frameId: 89, x: 1312, y: 448, layer: 'background' },
    { frameId: 92, x: 1344, y: 448, layer: 'background' },
    { frameId: 86, x: 1376, y: 448, layer: 'background' },
    { frameId: 88, x: 1408, y: 448, layer: 'background' },
    { frameId: 90, x: 1472, y: 448, layer: 'background' },
    { frameId: 87, x: 1504, y: 448, layer: 'background' },
    { frameId: 62, x: 1536, y: 448, layer: 'foreground' },
    { frameId: 60, x: 1568, y: 448, layer: 'foreground' },
    { frameId: 63, x: 1600, y: 480, layer: 'foreground' },
    { frameId: 61, x: 1632, y: 448, layer: 'foreground' },
    { frameId: 60, x: 1664, y: 448, layer: 'foreground' },
    { frameId: 62, x: 1696, y: 448, layer: 'foreground' },
    { frameId: 63, x: 1728, y: 448, layer: 'foreground' },
    { frameId: 61, x: 1760, y: 448, layer: 'foreground' },
    { frameId: 54, x: 704, y: 736, layer: 'foreground' },
    { frameId: 55, x: 1440, y: 736, layer: 'foreground' },
    { frameId: 56, x: 2240, y: 736, layer: 'foreground' },
    { frameId: 57, x: 4640, y: 736, layer: 'foreground' },
    { frameId: 80, x: 1280, y: 384, layer: 'foreground' },
    { frameId: 81, x: 1376, y: 384, layer: 'foreground' },
    { frameId: 82, x: 4000, y: 384, layer: 'foreground' },
    { frameId: 71, x: 320, y: 640, layer: 'foreground' },
    { frameId: 72, x: 352, y: 640, layer: 'foreground' },
    { frameId: 74, x: 384, y: 640, layer: 'foreground' },
    { frameId: 73, x: 640, y: 480, layer: 'foreground' },
    { frameId: 71, x: 672, y: 480, layer: 'foreground' },
    { frameId: 72, x: 736, y: 480, layer: 'foreground' },
    { frameId: 117, x: 0, y: 800, layer: 'foreground' },
    { frameId: 120, x: 32, y: 800, layer: 'foreground' },
    { frameId: 117, x: 64, y: 800, layer: 'foreground' },
    { frameId: 120, x: 96, y: 800, layer: 'foreground' },
    { frameId: 117, x: 160, y: 800, layer: 'foreground' },
    { frameId: 116, x: 320, y: 576, layer: 'foreground' },
    { frameId: 119, x: 352, y: 576, layer: 'foreground' },
    { frameId: 115, x: 384, y: 576, layer: 'foreground' },
    { frameId: 118, x: 640, y: 416, layer: 'foreground' },
    { frameId: 116, x: 672, y: 416, layer: 'foreground' },
    { frameId: 102, x: 1536, y: 448, layer: 'background' },
    { frameId: 105, x: 1568, y: 448, layer: 'background' },
    { frameId: 108, x: 1600, y: 480, layer: 'background' },
    { frameId: 103, x: 1632, y: 256, layer: 'background' },
    { frameId: 106, x: 1632, y: 448, layer: 'background' },
    { frameId: 110, x: 1664, y: 256, layer: 'background' },
    { frameId: 104, x: 1664, y: 448, layer: 'background' },
    { frameId: 107, x: 1696, y: 256, layer: 'background' },
    { frameId: 125, x: 1536, y: 448, layer: 'foreground' },
    { frameId: 125, x: 1568, y: 448, layer: 'foreground' },
    { frameId: 125, x: 1600, y: 480, layer: 'foreground' },
    { frameId: 125, x: 1632, y: 448, layer: 'foreground' },
    { frameId: 125, x: 1664, y: 448, layer: 'foreground' },
    { frameId: 125, x: 1696, y: 448, layer: 'foreground' },
    { frameId: 126, x: 1536, y: 448, layer: 'foreground' },
    { frameId: 127, x: 1568, y: 448, layer: 'foreground' },
  ],

  checkpoints: [
    { x: 20 * TILE_SIZE, y: 24 * TILE_SIZE },
    { x: 55 * TILE_SIZE, y: 12 * TILE_SIZE },
    { x: 100 * TILE_SIZE, y: 24 * TILE_SIZE },
    { x: 165 * TILE_SIZE, y: 24 * TILE_SIZE },
  ],

  hazards: [
    { x: 28 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 29 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 40 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 65 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 66 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 85 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 86 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 105 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 128 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 129 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 150 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 151 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 152 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 190 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 191 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
    { x: 210 * TILE_SIZE, y: 25 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 0.3 },
  ],
};
