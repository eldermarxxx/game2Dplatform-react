import {
  PLAYER_ACCELERATION,
  PLAYER_MAX_SPEED,
  PLAYER_FRICTION,
  PLAYER_JUMP_VELOCITY,
  PLAYER_JUMP_HOLD_FORCE,
  PLAYER_JUMP_HOLD_TIME,
  PLAYER_WHIP_COOLDOWN,
  PLAYER_WHIP_RANGE,
  PLAYER_IFRAMES,
  PLAYER_KNOCKBACK,
  PLAYER_MAX_HP,
  LADDER_CLIMB_SPEED,
  TILE_SIZE,
  TILE_LADDER,
  COLORS,
} from '../engine/constants.js';
import { getTilesByType, getFreeformTilesByType } from '../engine/collision.js';
import snd1 from '../assets/audio/dilera1.mp3';
import snd2 from '../assets/audio/dilera2.mp3';
import snd3 from '../assets/audio/dilera3.mp3';
import snd4 from '../assets/audio/dilera4.mp3';
import snd5 from '../assets/audio/dilera5.mp3';
import snd6 from '../assets/audio/dilera6.mp3';
import snd7 from '../assets/audio/dilera7.mp3';
import snd8 from '../assets/audio/dilera8.mp3';

const attackSounds = [snd1, snd2, snd3, snd4, snd5, snd6, snd7, snd8];

export const PLAYER_SCALE = 0.42;

export const PlayerStates = {
  IDLE: 'idle',
  RUN: 'run',
  JUMP: 'jump',
  ATTACK: 'attack',
  HURT: 'hurt',
  DEAD: 'dead',
};

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 28;
    this.height = 40;
    this.vx = 0;
    this.vy = 0;
    this.state = PlayerStates.IDLE;
    this.facingRight = true;
    this.onGround = false;
    this.hp = PLAYER_MAX_HP;
    this.maxHp = PLAYER_MAX_HP;
    this.score = 0;
    this.hearts = 5;

    this.whipCooldown = 0;
    this.whipActive = false;
    this.whipTimer = 0;

    this.iFrames = 0;
    this.stateTimer = 0;
    this.jumpHoldTimer = 0;
    this.jumpHeld = false;
    this.jumps = 0;

    this.attackDuration = 0.2;
    this.hurtDuration = 0.3;
    this.deadDuration = 0.5;

    this.onLadder = false;
    this.lastCheckpoint = null;

    this.animConfig = {
      idle:   { count: 6, fps: 8 },
      run:    { count: 6, fps: 12, pingPong: true },
      jump:   { count: 6, fps: 10 },
      attack: { count: 5, fps: 14 },
      hurt:   { count: 1, fps: 1 },
    };
    this.spritesheet = null;
    this.spriteFrame = 0;
    this.spriteDir = 1;
    this.spriteTimer = 0;
  }

  get centerX() { return this.x + this.width / 2; }
  get centerY() { return this.y + this.height / 2; }

  handleInput(input, dt, tilemapOrBoxes) {
    if (this.state === PlayerStates.HURT || this.state === PlayerStates.DEAD) return;

    const isFreeform = Array.isArray(tilemapOrBoxes);
    const getLadders = isFreeform
      ? (e) => getFreeformTilesByType(e, tilemapOrBoxes, 'ladder')
      : (e) => getTilesByType(e, tilemapOrBoxes, TILE_LADDER);

    // --- Ladder ---
    if (tilemapOrBoxes) {
      const ladderTiles = getLadders(this);
      const grabPressed = input.isDown('ArrowUp') || input.isDown('ArrowDown')
        || input.isDown('KeyW') || input.isDown('KeyS');

      if (!this.onLadder && ladderTiles.length > 0 && grabPressed) {
        this.onLadder = true;
        this.vy = 0;
      }

      if (this.onLadder) {
        const stillOn = getLadders(this);
        if (stillOn.length === 0) {
          this.onLadder = false;
        } else {
          if (input.wasPressed('Space')) {
            this.onLadder = false;
            this.vy = PLAYER_JUMP_VELOCITY * 0.6;
            this.onGround = false;
            this.state = PlayerStates.JUMP;
            this.jumps = 1;
            return;
          }

          let moveX = 0;
          if (input.isDown('ArrowLeft') || input.isDown('KeyA')) moveX = -1;
          if (input.isDown('ArrowRight') || input.isDown('KeyD')) moveX = 1;
          if (moveX !== 0) {
            this.onLadder = false;
            this.facingRight = moveX > 0;
            this.vx = moveX * PLAYER_MAX_SPEED * 0.5;
            return;
          }

          if (input.isDown('ArrowUp') || input.isDown('KeyW')) {
            this.vy = -LADDER_CLIMB_SPEED;
          } else if (input.isDown('ArrowDown') || input.isDown('KeyS')) {
            this.vy = LADDER_CLIMB_SPEED;
          } else {
            this.vy = 0;
          }

          const midIdx = Math.floor(stillOn.length / 2);
          const ladder = stillOn[midIdx];
          const targetX = ladder.col !== undefined
            ? ladder.col * TILE_SIZE + (TILE_SIZE - this.width) / 2
            : ladder.x + (ladder.width - this.width) / 2;
          this.x += (targetX - this.x) * 0.3;

          this.onGround = true;
          return;
        }
      }
    }

    // --- Regular ground movement ---
    if (this.onGround) {
      this.jumps = 0;
    }

    let moveX = 0;
    if (input.isDown('ArrowLeft') || input.isDown('KeyA')) moveX = -1;
    if (input.isDown('ArrowRight') || input.isDown('KeyD')) moveX = 1;

    if (moveX !== 0) {
      this.facingRight = moveX > 0;
      const accel = PLAYER_ACCELERATION * moveX;
      this.vx += accel * dt;
      if (Math.abs(this.vx) > PLAYER_MAX_SPEED) {
        this.vx = Math.sign(this.vx) * PLAYER_MAX_SPEED;
      }
      if (this.onGround) {
        if (this.state !== PlayerStates.RUN) {
          this.state = PlayerStates.RUN;
          this.spriteFrame = 0;
          this.spriteDir = 1;
          this.spriteTimer = 0;
        }
      }
    } else {
      if (Math.abs(this.vx) < PLAYER_FRICTION * dt) {
        this.vx = 0;
      } else {
        this.vx -= Math.sign(this.vx) * PLAYER_FRICTION * dt;
      }
      if (this.onGround && this.state !== PlayerStates.ATTACK) {
        this.state = PlayerStates.IDLE;
        this.spriteFrame = 0;
        this.spriteDir = 1;
        this.spriteTimer = 0;
      }
    }

    if (input.wasPressed('Space') || input.wasPressed('ArrowUp') || input.wasPressed('KeyW')) {
      if (this.onGround) {
        this.vy = PLAYER_JUMP_VELOCITY;
        this.onGround = false;
        this.state = PlayerStates.JUMP;
        this.jumpHoldTimer = 0;
        this.jumpHeld = true;
        this.jumps = 1;
        this.spriteFrame = 0;
        this.spriteDir = 1;
        this.spriteTimer = 0;
      } else if (this.jumps < 2) {
        this.vy = PLAYER_JUMP_VELOCITY;
        this.state = PlayerStates.JUMP;
        this.jumpHoldTimer = 0;
        this.jumpHeld = true;
        this.spriteFrame = 0;
        this.spriteDir = 1;
        this.spriteTimer = 0;
        this.jumps++;
      }
    }

    if (this.jumpHeld && this.vy < 0 &&
        (input.isDown('Space') || input.isDown('ArrowUp') || input.isDown('KeyW'))) {
      this.jumpHoldTimer += dt;
      if (this.jumpHoldTimer < PLAYER_JUMP_HOLD_TIME) {
        this.vy += PLAYER_JUMP_HOLD_FORCE * dt;
      }
    }

    if (!input.isDown('Space') && !input.isDown('ArrowUp') && !input.isDown('KeyW')) {
      this.jumpHeld = false;
    }

    if (input.wasPressed('KeyZ') || input.wasPressed('KeyJ')) {
      if (this.whipCooldown <= 0) {
        this.attack();
      }
    }
  }

  attack() {
    this.state = PlayerStates.ATTACK;
    this.whipCooldown = PLAYER_WHIP_COOLDOWN;
    this.whipActive = true;
    this.whipTimer = this.attackDuration;
    this.stateTimer = this.attackDuration;
    this.spriteFrame = 0;
    this.spriteDir = 1;
    this.spriteTimer = 0;

    const snd = new Audio(attackSounds[Math.floor(Math.random() * attackSounds.length)]);
    snd.volume = 0.8;
    snd.play().catch(() => {});
  }

  takeDamage(amount, knockbackDir) {
    if (this.iFrames > 0 || this.state === PlayerStates.DEAD) return false;

    this.hp -= amount;
    this.iFrames = PLAYER_IFRAMES;
    this.state = PlayerStates.HURT;
    this.stateTimer = this.hurtDuration;
    this.vy = -200;
    this.vx = knockbackDir * PLAYER_KNOCKBACK;

    if (this.hp <= 0) {
      this.hp = 0;
      this.state = PlayerStates.DEAD;
      this.stateTimer = this.deadDuration;
    }

    return true;
  }

  getWhipHitbox() {
    if (!this.whipActive) return null;
    const whipWidth = PLAYER_WHIP_RANGE + 20;
    const whipHeight = 16;
    return {
      x: this.facingRight ? this.x + this.width : this.x - whipWidth,
      y: this.y + 8,
      width: whipWidth,
      height: whipHeight,
    };
  }

  update(dt, input, gravity, tilemap) {
    if (this.state === PlayerStates.HURT) {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.state = PlayerStates.IDLE;
        this.spriteFrame = 0;
        this.spriteDir = 1;
        this.spriteTimer = 0;
      }
    }

    if (this.state === PlayerStates.ATTACK) {
      this.stateTimer -= dt;
      this.whipTimer -= dt;
      if (this.whipTimer <= 0) {
        this.whipActive = false;
      }
      if (this.stateTimer <= 0) {
        this.state = this.onGround ? PlayerStates.IDLE : PlayerStates.JUMP;
        this.spriteFrame = 0;
        this.spriteDir = 1;
        this.spriteTimer = 0;
      }
    }

    if (this.state !== PlayerStates.HURT && this.state !== PlayerStates.DEAD) {
      this.handleInput(input, dt, tilemap);
    }

    if (this.state !== PlayerStates.DEAD && !this.onLadder) {
      this.vy += gravity * dt;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.whipCooldown > 0) this.whipCooldown -= dt;
    if (this.iFrames > 0) this.iFrames -= dt;

    this.spriteTimer += dt;
    const anim = this.animConfig[this.state];
    if (anim && anim.count > 1) {
      const frameDuration = 1 / anim.fps;
      if (this.spriteTimer >= frameDuration) {
        this.spriteTimer = 0;
        if (anim.pingPong) {
          this.spriteFrame += this.spriteDir;
          if (this.spriteFrame >= anim.count || this.spriteFrame < 0) {
            this.spriteDir *= -1;
            this.spriteFrame += this.spriteDir * 2;
          }
        } else {
          this.spriteFrame = (this.spriteFrame + 1) % anim.count;
        }
      }
    } else if (anim) {
      this.spriteFrame = 0;
    }
  }

  respawn(levelData) {
    this.hp = this.maxHp;
    this.state = PlayerStates.IDLE;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.onLadder = false;
    this.whipActive = false;
    this.iFrames = PLAYER_IFRAMES;
    this.stateTimer = 0;
    this.whipCooldown = 0;

    if (this.lastCheckpoint) {
      this.x = this.lastCheckpoint.x;
      this.y = this.lastCheckpoint.y;
    } else {
      this.x = levelData.playerSpawn.x;
      this.y = levelData.playerSpawn.y;
    }
  }

  render(ctx, camera) {
    const screenX = Math.round(this.x - camera.x);
    const screenY = Math.round(this.y - camera.y);

    if (this.iFrames > 0 && Math.floor(this.iFrames * 10) % 2 === 0) return;

    ctx.save();

    if (this.spritesheet) {
      const stateName = this.state === 'hurt' || this.state === 'dead' ? 'idle' : this.state;
      const frames = this.spritesheet.getStateFrames(stateName);
      if (frames && frames.length > 0) {
        const clampedFrame = Math.min(this.spriteFrame, frames.length - 1);
        this.spritesheet.draw(
          ctx,
          stateName,
          clampedFrame,
          this.centerX - camera.x,
          this.y + this.height - camera.y,
          !this.facingRight,
          PLAYER_SCALE
        );
      }
    } else {
      let color = COLORS.player;
      if (this.state === PlayerStates.DEAD) color = '#666';
      else if (this.state === PlayerStates.HURT) color = COLORS.playerHurt;
      ctx.fillStyle = color;
      ctx.fillRect(screenX, screenY, this.width, this.height);
    }

    ctx.fillStyle = '#888';
    ctx.fillRect(screenX + 4, screenY - 4, this.width - 8, 3);

    const hpRatio = this.hp / this.maxHp;
    ctx.fillStyle = '#ff2244';
    ctx.fillRect(screenX + 4, screenY - 4, (this.width - 8) * hpRatio, 3);

    if (this.whipActive) {
      const whip = this.getWhipHitbox();
      if (whip) {
        ctx.fillStyle = COLORS.whip;
        ctx.fillRect(
          Math.round(whip.x - camera.x),
          Math.round(whip.y - camera.y),
          whip.width,
          whip.height
        );
      }
    }

    ctx.restore();
  }
}
