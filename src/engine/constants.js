export const TILE_SIZE = 32;
export const GRAVITY = 1400;
export const PLAYER_ACCELERATION = 1000;
export const PLAYER_MAX_SPEED = 280;
export const PLAYER_FRICTION = 600;
export const PLAYER_JUMP_VELOCITY = -520;
export const PLAYER_JUMP_HOLD_FORCE = -300;
export const PLAYER_JUMP_HOLD_TIME = 0.15;
export const PLAYER_WHIP_COOLDOWN = 0.35;
export const PLAYER_WHIP_RANGE = 40;
export const PLAYER_WHIP_DAMAGE = 1;
export const PLAYER_IFRAMES = 1.2;
export const PLAYER_KNOCKBACK = 300;
export const PLAYER_MAX_HP = 16;

export const LADDER_CLIMB_SPEED = 120;

export const ENEMY_PATROL_SPEED = 80;
export const ENEMY_FLY_SPEED = 100;
export const ENEMY_FLY_AMPLITUDE = 60;
export const ENEMY_FLY_FREQUENCY = 3;

export const TILE_EMPTY = 0;
export const TILE_SOLID = 1;
export const TILE_PLATFORM = 2;
export const TILE_HAZARD = 3;
export const TILE_LADDER = 4;

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 480;

export const COLORS = {
  sky: '#0a0a2e',
  tile: '#4a4a6a',
  tileTop: '#6a6a8a',
  platform: '#3a3a5a',
  platformTop: '#5a5a7a',
  player: '#e0e0e0',
  playerHurt: '#ff4444',
  whip: '#aaaaaa',
  enemyPatrol: '#cc4444',
  enemyFly: '#8844aa',
  heartFull: '#ff2244',
  heartEmpty: '#442222',
  heartHalf: '#ff2244',
};
