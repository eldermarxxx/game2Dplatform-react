import {
  ENEMY_PATROL_SPEED,
  ENEMY_FLY_SPEED,
  ENEMY_FLY_AMPLITUDE,
  ENEMY_FLY_FREQUENCY,
  COLORS,
} from '../engine/constants.js';
import { resolveTileCollisions, resolveFreeformCollisions } from '../engine/collision.js';

export const EnemyTypes = {
  PATROL: 'patrol',
  FLY: 'fly',
};

export class Enemy {
  constructor(config) {
    this.x = config.x;
    this.y = config.y;
    this.width = 28;
    this.height = 32;
    this.vx = 0;
    this.vy = 0;
    this.type = config.type || EnemyTypes.PATROL;
    this.hp = config.hp || 2;
    this.maxHp = config.hp || 2;
    this.contactDamage = config.damage || 1;
    this.scoreValue = config.score || 100;
    this.onGround = false;
    this.alive = true;
    this.patrolDir = config.dir || -1;
    this.startX = config.x;
    this.startY = config.y;
    this.walkRange = config.range || 80;
    this.drawScale = config.drawScale || 1;

    this.animConfig = {
      walk: { count: 4, fps: 8 },
      fly:  { count: 3, fps: 6 },
      death: { count: 1, fps: 4 },
    };
    this.spritesheet = null;
    this.spriteFrame = 0;
    this.spriteTimer = 0;
    this.state = this.type === EnemyTypes.FLY ? 'fly' : 'walk';
    this.stateTimer = 0;
    this.hurtTimer = 0;
    this.deadTimer = 0;
    this._time = 0;
  }

  takeDamage(amount) {
    if (!this.alive) return false;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.state = 'dead';
      this.deadTimer = 0.4;
    } else {
      this.state = 'hurt';
      this.hurtTimer = 0.2;
    }
    return true;
  }

  _spriteState(state) {
    if (state === 'dead') return 'death';
    if (state === 'hurt') return null;
    return state;
  }

  update(dt, gravity, tilemapOrBoxes) {
    this._time += dt;

    if (!this.alive) {
      this.deadTimer -= dt;
      return;
    }

    const isFreeform = Array.isArray(tilemapOrBoxes);
    const resolveCol = isFreeform
      ? (e) => resolveFreeformCollisions(e, tilemapOrBoxes)
      : (e) => resolveTileCollisions(e, tilemapOrBoxes);

    if (this.state === 'hurt') {
      this.hurtTimer -= dt;
      if (this.hurtTimer <= 0) {
        this.state = this.type === EnemyTypes.FLY ? 'fly' : 'walk';
      }
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.type === EnemyTypes.PATROL) {
        resolveCol(this);
      }
      return;
    }

    if (this.type === EnemyTypes.PATROL) {
      this.vx = ENEMY_PATROL_SPEED * this.patrolDir;
      this.vy += gravity * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      resolveCol(this);

      if (Math.abs(this.x - this.startX) > this.walkRange) {
        this.patrolDir *= -1;
      }
    } else if (this.type === EnemyTypes.FLY) {
      this.vy = Math.sin(this._time * ENEMY_FLY_FREQUENCY) * ENEMY_FLY_AMPLITUDE * 0.5;
      this.vx = -ENEMY_FLY_SPEED * 0.3;
      this.x += this.vx * dt;
      this.y = this.startY + Math.sin(this._time * ENEMY_FLY_FREQUENCY) * ENEMY_FLY_AMPLITUDE;
    }

    this.spriteTimer += dt;
    const anim = this.animConfig[this.state] || this.animConfig.walk;
    if (anim && anim.count > 1) {
      const frameDuration = 1 / anim.fps;
      if (this.spriteTimer >= frameDuration) {
        this.spriteTimer = 0;
        this.spriteFrame = (this.spriteFrame + 1) % anim.count;
      }
    } else if (anim) {
      this.spriteFrame = 0;
    }
  }

  render(ctx, camera) {
    if (!this.alive && this.deadTimer <= 0) return;

    const screenX = Math.round(this.x - camera.x);
    const screenY = Math.round(this.y - camera.y);

    ctx.save();

    if (this.spritesheet) {
      const spriteState = this._spriteState(this.state);
      if (spriteState) {
        const frames = this.spritesheet.getStateFrames(spriteState);
        if (frames && frames.length > 0) {
          const clampedFrame = Math.min(this.spriteFrame, frames.length - 1);
          this.spritesheet.draw(
            ctx,
            spriteState,
            clampedFrame,
            this.x + this.width / 2 - camera.x,
            this.y + this.height - camera.y,
            this.vx < 0,
            this.drawScale
          );
        }
      }
    }

    if (!this.spritesheet) {
      const color = this.state === 'hurt' ? '#fff'
        : this.type === EnemyTypes.FLY ? COLORS.enemyFly : COLORS.enemyPatrol;
      ctx.fillStyle = color;
      ctx.fillRect(screenX, screenY, this.width, this.height);
    }

    if (this.spritesheet && this.hurtTimer > 0) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#fff';
      ctx.fillRect(screenX, screenY, this.width, this.height);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  getHitbox() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}
