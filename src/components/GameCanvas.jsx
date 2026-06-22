import { useRef, useEffect, useState } from 'react';
import { GameLoop } from '../engine/gameLoop.js';
import { Camera } from '../engine/camera.js';
import { input } from '../engine/input.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { levels, TOTAL_LEVELS } from '../levels/index.js';
import { resolveTileCollisions, resolveFreeformCollisions, getTilesByType, aabb } from '../engine/collision.js';
import { AssetManager } from '../engine/AssetManager.js';
import { TileRenderer } from '../engine/TileRenderer.js';
import { ParticleSystem } from '../engine/ParticleSystem.js';
import { FogSystem } from '../engine/FogSystem.js';
import { useGameStore } from '../store/gameStore.js';
import {
  GRAVITY,
  TILE_SIZE,
  TILE_SOLID,
  TILE_PLATFORM,
  TILE_HAZARD,
  TILE_EMPTY,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COLORS,
} from '../engine/constants.js';
import {
  HERO_SPRITE,
  HERO_MANIFEST,
  TILESET_SPRITE,
  TILESET_MANIFEST,
  ENEMIES_SPRITE,
  ENEMIES_MANIFEST,
} from '../assets/spriteConfig.js';
import bgmUrl from '../assets/music/bgm.mp3';
import bgImageUrl from '../assets/images/background.png';

const TORCH_FRAMES = new Set([75, 76, 77, 78, 79, 126, 127]);
const GLASS_FRAMES = new Set([86, 87, 88, 89, 90, 91, 92]);

const GLASS_COLORS = {
  86: '180,160,255',
  87: '140,220,180',
  88: '255,140,180',
  89: '255,200,100',
  90: '160,180,255',
  91: '180,140,220',
  92: '140,200,160',
};

export function GameCanvas() {
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const sheetsRef = useRef(null);
  const currentLevel = useGameStore((s) => s.currentLevel);
  const setHp = useGameStore((s) => s.setHp);
  const setScore = useGameStore((s) => s.setScore);
  const setHearts = useGameStore((s) => s.setHearts);
  const setGameOver = useGameStore((s) => s.setGameOver);
  const setLevelComplete = useGameStore((s) => s.setLevelComplete);
  const setVictory = useGameStore((s) => s.setVictory);
  const setLoading = useGameStore((s) => s.setLoading);
  const [assetsReady, setAssetsReady] = useState(false);

  const getTileColor = (type) => {
    if (type === TILE_SOLID) return COLORS.tile;
    if (type === TILE_PLATFORM) return COLORS.platform;
    if (type === TILE_HAZARD) return '#aa3333';
    return null;
  };

  const decoBackground = (d) => (d.layer || 'background') === 'background';
  const decoForeground = (d) => d.layer === 'foreground';

  const bgImageRef = useRef(null);
  const levelBgRef = useRef(null);

  useEffect(() => {
    setLoading(true);

    const img = new Image();
    img.onload = () => {
      bgImageRef.current = img;
    };
    img.src = bgImageUrl;

    const mgr = new AssetManager({
      player:  { src: HERO_SPRITE,    manifest: HERO_MANIFEST },
      tileset: { src: TILESET_SPRITE, manifest: TILESET_MANIFEST },
      enemies: { src: ENEMIES_SPRITE, manifest: ENEMIES_MANIFEST },
    });
    mgr.load().then((sheets) => {
      sheetsRef.current = sheets;
      setLoading(false);
      setAssetsReady(true);
    });
    return () => setLoading(false);
  }, []);

  const bgmRef = useRef(null);

  useEffect(() => {
    if (!assetsReady || !sheetsRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const sheets = sheetsRef.current;
    const levelData = levels[currentLevel];
    if (!levelData) return;

    if (gameLoopRef.current) {
      gameLoopRef.current.stop();
      gameLoopRef.current = null;
    }

    const bgm = new Audio(bgmUrl);
    bgm.loop = true;
    bgm.volume = 0.15;
    bgm.play().catch(() => {});
    bgmRef.current = bgm;

    const player = new Player(levelData.playerSpawn.x, levelData.playerSpawn.y);
    player.spritesheet = sheets.player || null;
    player.score = useGameStore.getState().score;
    player.hearts = useGameStore.getState().hearts;

    const enemies = (levelData.enemies || []).map((cfg) => {
      const e = new Enemy(cfg);
      e.spritesheet = sheets.enemies || null;
      return e;
    });

    const tileRenderer = new TileRenderer(sheets.tileset || null, {
      [TILE_SOLID]: 0,
      [TILE_PLATFORM]: 1,
      [TILE_HAZARD]: 2,
    });

    // Load level background image for freeform mode
    levelBgRef.current = null;
    if (levelData.backgroundImage) {
      const levelImg = new Image();
      levelImg.onload = () => { levelBgRef.current = levelImg; };
      levelImg.src = levelData.backgroundImage;
    }

    const camera = new Camera(levelData.width, levelData.height);
    const loop = new GameLoop();
    gameLoopRef.current = loop;
    const particles = new ParticleSystem();
    const drops = [];

    const fogSystem = new FogSystem(CANVAS_WIDTH, CANVAS_HEIGHT, levelData.fogDensity || 0.4);

    let shakeIntensity = 0;
    let shakeDuration = 0;
    let hitFlashTimer = 0;
    let oldHp = player.hp;
    let wasOnGround = true;
    let wasJumping = false;
    let runParticleTimer = 0;
    let oldHearts = player.hearts;

    let vignetteCache = null;
    let torchTime = 0;
    const torchPhases = {};
    const sparkTimers = {};
    let glassDustTimers = {};
    let fpsFrames = 0;
    let fpsTime = 0;
    let displayFps = 60;

    function ensureVignetteCache() {
      if (vignetteCache) return;
      const c = document.createElement('canvas');
      c.width = CANVAS_WIDTH;
      c.height = CANVAS_HEIGHT;
      const vctx = c.getContext('2d');
      const grad = vctx.createRadialGradient(
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * 0.25,
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * 0.7,
      );
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.5, 'rgba(0,0,0,0.05)');
      grad.addColorStop(0.8, 'rgba(0,0,0,0.18)');
      grad.addColorStop(1, 'rgba(0,0,0,0.35)');
      vctx.fillStyle = grad;
      vctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      vignetteCache = c;
    }

    function getTorchId(dec) { return `${dec.x}_${dec.y}`; }

    function shakeCamera(intensity, duration) {
      shakeIntensity = intensity;
      shakeDuration = duration;
    }

    function triggerDeathFlow() {
      if (player.deathHandled) return;
      player.deathHandled = true;

      player.hearts--;
      oldHearts = player.hearts;
      setHearts(player.hearts);

      if (player.hearts > 0) {
        player.respawn(levelData);
      } else {
        player.state = 'dead';
        player.stateTimer = 0.5;
      }
    }

    const update = (dt) => {
      const s = useGameStore.getState();
      if (s.levelComplete || s.gameOver || s.victory) {
        input.clearJustPressed();
        return;
      }

      const collisionData = levelData.collisionBoxes || levelData.tilemap;
      const isFreeform = !!levelData.collisionBoxes;

      player.update(dt, input, GRAVITY, collisionData);
      if (isFreeform) {
        resolveFreeformCollisions(player, levelData.collisionBoxes);
      } else {
        resolveTileCollisions(player, levelData.tilemap);
      }

      if (player.hp < oldHp) {
        hitFlashTimer = 0.15;
        shakeCamera(6, 0.3);
      }
      oldHp = player.hp;

      if (!wasOnGround && player.onGround) {
        particles.emit(
          player.centerX, player.y + player.height, 6,
          { spreadX: 40, spreadY: 30, color: '#aa8866', life: 0.4, size: 2 },
        );
      }
      wasOnGround = player.onGround;

      if (player.state === 'jump' && !wasJumping && !player.onGround) {
        particles.emit(
          player.centerX, player.y + player.height, 4,
          { spreadX: 30, spreadY: 20, color: '#ccaa88', life: 0.3, size: 2 },
        );
      }
      wasJumping = player.state === 'jump';

      if (player.state === 'run' && player.onGround && Math.abs(player.vx) > 50) {
        runParticleTimer += dt;
        if (runParticleTimer > 0.08) {
          runParticleTimer = 0;
          particles.emit(
            player.facingRight ? player.x : player.x + player.width,
            player.y + player.height, 1,
            { spreadX: 5, spreadY: 10, color: '#998877', life: 0.3, size: 1.5 },
          );
        }
      }

      for (const enemy of enemies) {
        enemy.update(dt, GRAVITY, collisionData);
        if (!enemy.alive) continue;

        const whip = player.getWhipHitbox();
        if (whip && aabb(whip, enemy.getHitbox())) {
          if (enemy.takeDamage(1)) {
            player.score += enemy.scoreValue;
            particles.emit(
              enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 8,
              { spreadX: 60, spreadY: 50, color: '#ff8844', life: 0.4, size: 2 },
            );
            if (!enemy.alive) {
              particles.emit(
                enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 12,
                { spreadX: 80, spreadY: 70, color: '#ddccbb', life: 0.6, size: 3 },
              );
              shakeCamera(4, 0.2);
              if (Math.random() < 0.15) {
                drops.push({
                  x: enemy.x + enemy.width / 2 - 8,
                  y: enemy.y + enemy.height / 2 - 8,
                  width: 16, height: 16,
                  collected: false,
                  bob: Math.random() * Math.PI * 2,
                });
              }
            }
          }
        }

        if (aabb(player, enemy.getHitbox())) {
          const knockDir = player.x < enemy.x ? -1 : 1;
          player.takeDamage(enemy.contactDamage, knockDir);
        }
      }

      // --- Drops (heart pickups) ---
      for (const drop of drops) {
        if (drop.collected) continue;
        if (aabb(player, drop) && player.hp < player.maxHp) {
          drop.collected = true;
          player.hp = Math.min(player.hp + 1, player.maxHp);
          setHp(player.hp);
        }
      }

      if (levelData.checkpoints) {
        for (const cp of levelData.checkpoints) {
          const cpBox = { x: cp.x - 8, y: cp.y - 8, width: 16, height: 16 };
          if (aabb(player, cpBox)) {
            player.lastCheckpoint = cp;
          }
        }
      }

      if (player.y > levelData.height + 100 && player.state !== 'dead') {
        player.hp = 0;
        player.state = 'dead';
        player.stateTimer = 0.3;
        player.deathHandled = false;
        oldHearts = player.hearts;
        setHearts(player.hearts);
      }

      if (player.state === 'dead' && player.stateTimer <= 0 && !player.deathHandled) {
        triggerDeathFlow();
      }

      if (player.state === 'dead' && player.stateTimer <= 0 && player.deathHandled && player.hearts <= 0) {
        setGameOver(true);
        setHp(0);
      }

      if (levelData.exit) {
        const exitBox = { x: levelData.exit.x - 16, y: levelData.exit.y - 16, width: 32, height: 32 };
        if (aabb(player, exitBox) && player.state !== 'dead') {
          if (currentLevel >= TOTAL_LEVELS) {
            setVictory(true);
          } else {
            setLevelComplete(true);
          }
        }
      } else if (player.x > levelData.width && player.state !== 'dead') {
        if (currentLevel >= TOTAL_LEVELS) {
          setVictory(true);
        } else {
          setLevelComplete(true);
        }
      }

      camera.follow(player, dt);

      if (shakeDuration > 0) {
        const progress = shakeDuration / 0.3;
        camera.shakeX = (Math.random() - 0.5) * shakeIntensity * progress;
        camera.shakeY = (Math.random() - 0.5) * shakeIntensity * progress;
        shakeDuration -= dt;
        if (shakeDuration <= 0) {
          camera.shakeX = 0;
          camera.shakeY = 0;
        }
      }

      if (hitFlashTimer > 0) hitFlashTimer -= dt;

      torchTime += dt;

      const decorations = levelData.decorations || [];

      for (const dec of decorations) {
        if (!TORCH_FRAMES.has(dec.frameId)) continue;
        const tid = getTorchId(dec);
        if (torchPhases[tid] === undefined) torchPhases[tid] = Math.random() * Math.PI * 2;
        if (sparkTimers[tid] === undefined) sparkTimers[tid] = 0;

        sparkTimers[tid] += dt;
        if (sparkTimers[tid] > 0.08 + Math.random() * 0.06) {
          sparkTimers[tid] = 0;
          particles.emit(
            dec.x + TILE_SIZE / 2, dec.y + 4, 1,
            { spreadX: 8, spreadY: 4, color: '#ffaa44', life: 0.5 + Math.random() * 0.3, size: 1.2, gravity: 100 },
          );
        }
      }

      for (const dec of decorations) {
        if (!GLASS_FRAMES.has(dec.frameId)) continue;
        const gid = getTorchId(dec);
        if (glassDustTimers[gid] === undefined) glassDustTimers[gid] = 0;

        glassDustTimers[gid] += dt;
        if (glassDustTimers[gid] > 0.5) {
          glassDustTimers[gid] = 0;
          const bx = dec.x + TILE_SIZE / 2 + (Math.random() - 0.5) * 40;
          const by = dec.y + TILE_SIZE;
          particles.emit(
            bx, by, 1,
            {
              spreadX: 2, spreadY: 2,
              color: '#ffeecc',
              life: 2 + Math.random() * 2,
              size: 0.6 + Math.random() * 0.6,
              gravity: -8,
            },
          );
        }
      }

      particles.update(dt);
      fogSystem.update(dt);

      setHp(player.hp);
      setScore(player.score);

      fpsFrames++;
      fpsTime += dt;
      if (fpsTime >= 0.5) {
        displayFps = Math.round(fpsFrames / fpsTime);
        fpsFrames = 0;
        fpsTime = 0;
      }

      input.clearJustPressed();
    };

    const render = () => {
      const origCX = camera.x;
      const origCY = camera.y;
      camera.x += camera.shakeX || 0;
      camera.y += camera.shakeY || 0;
      const isFreeform = !!levelData.collisionBoxes;

      // --- Freeform mode: draw level background image (the whole scene) ---
      if (isFreeform && levelBgRef.current) {
        const img = levelBgRef.current;
        ctx.drawImage(img, Math.round(-camera.x), Math.round(-camera.y), img.width, img.height);
      } else if (isFreeform) {
        ctx.fillStyle = levelData.bgColor || COLORS.sky;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      // --- Tilemap mode rendering (parallax, decorations, tiles, god rays, torches) ---
      if (!isFreeform) {
        // --- Background image (parallax, deepest layer) ---
        if (bgImageRef.current) {
          const bgSpeed = 0.08;
          const bgOffsetX = -(camera.x * bgSpeed) % bgImageRef.current.width;
          for (let i = -1; i < 4; i++) {
            ctx.drawImage(bgImageRef.current, Math.round(bgOffsetX + i * bgImageRef.current.width), 0, bgImageRef.current.width, CANVAS_HEIGHT);
          }
        } else {
          ctx.fillStyle = levelData.bgColor || COLORS.sky;
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        // --- Parallax far layer (sky) ---
        if (tileRenderer.hasSpritesheet) {
          const skySpeed = 0.15;
          const skyOffset = -(camera.x * skySpeed) % 512;
          for (let i = -1; i < 4; i++) {
            tileRenderer.drawFrame(ctx, 8, Math.round(skyOffset + i * 120), 20);
            tileRenderer.drawFrame(ctx, 9, Math.round(skyOffset + i * 120 + 60), 20);
          }
        }

        // --- Parallax mid layer (castle silhouettes) ---
        if (tileRenderer.hasSpritesheet) {
          const midSpeed = 0.3;
          const midOffset = -(camera.x * midSpeed) % 512;
          for (let i = -1; i < 4; i++) {
            tileRenderer.drawFrame(ctx, 11, Math.round(midOffset + i * 130), CANVAS_HEIGHT - 180);
            tileRenderer.drawFrame(ctx, 14, Math.round(midOffset + i * 130 + 70), CANVAS_HEIGHT - 180);
          }
        }

        // --- Decoration background (stained glass, etc.) ---
        if (levelData.decorations && tileRenderer.hasSpritesheet) {
          for (const dec of levelData.decorations.filter(decoBackground)) {
            const sx = Math.round(dec.x - camera.x);
            const sy = Math.round(dec.y - camera.y);
            if (sx > CANVAS_WIDTH || sx + TILE_SIZE < 0) continue;
            tileRenderer.drawFrame(ctx, dec.frameId, sx, sy);
          }
        }

        // --- Tilemap ---
        if (levelData.tilemap) {
          const startCol = Math.max(0, Math.floor(camera.x / TILE_SIZE));
          const endCol = Math.min(levelData.tilemap[0].length - 1, Math.ceil((camera.x + CANVAS_WIDTH) / TILE_SIZE));
          const startRow = Math.max(0, Math.floor(camera.y / TILE_SIZE));
          const endRow = Math.min(levelData.tilemap.length - 1, Math.ceil((camera.y + CANVAS_HEIGHT) / TILE_SIZE));

          for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
              const type = levelData.tilemap[row][col];
              if (type === TILE_EMPTY || type === 4) continue;

              const x = Math.round(col * TILE_SIZE - camera.x);
              const y = Math.round(row * TILE_SIZE - camera.y);

              if (tileRenderer.hasSpritesheet) {
                tileRenderer.draw(ctx, type, x, y, col, row);
              } else {
                ctx.fillStyle = getTileColor(type);
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
              }
            }
          }
        }

        // --- God rays from stained glass ---
        if (levelData.decorations && tileRenderer.hasSpritesheet) {
          for (const dec of levelData.decorations) {
            if (!GLASS_FRAMES.has(dec.frameId)) continue;
            const gx = dec.x - camera.x + TILE_SIZE / 2;
            const gy = dec.y - camera.y + TILE_SIZE * 0.3;
            if (gx < -100 || gx > CANVAS_WIDTH + 100) continue;

            const rgb = GLASS_COLORS[dec.frameId] || '200,200,255';
            const flicker = 0.6 + 0.4 * Math.sin(torchTime * 1.2 + dec.frameId);
            const beamW = 20 + 10 * Math.sin(torchTime * 0.5 + dec.frameId + 1);
            const floorY = CANVAS_HEIGHT;
            const dx = (camera.x * 0.02 + dec.frameId * 3) % 30 - 15;

            ctx.save();
            ctx.globalAlpha = 0.035 * flicker;
            ctx.fillStyle = `rgb(${rgb})`;
            ctx.beginPath();
            ctx.moveTo(gx - 2, gy);
            ctx.lineTo(gx + 2, gy);
            ctx.lineTo(gx + beamW + dx, floorY);
            ctx.lineTo(gx - beamW + dx, floorY);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.globalAlpha = 0.02 * flicker;
            ctx.fillStyle = `rgb(${rgb})`;
            ctx.beginPath();
            ctx.moveTo(gx - 4, gy + 10);
            ctx.lineTo(gx + 4, gy + 10);
            ctx.lineTo(gx + beamW * 1.5 + dx * 0.5, floorY);
            ctx.lineTo(gx - beamW * 1.5 + dx * 0.5, floorY);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
        }

        // --- Torch glow (behind torch sprites) ---
        if (levelData.decorations && tileRenderer.hasSpritesheet) {
          for (const dec of levelData.decorations) {
            if (!TORCH_FRAMES.has(dec.frameId)) continue;
            const sx = Math.round(dec.x + TILE_SIZE / 2 - camera.x);
            const sy = Math.round(dec.y + TILE_SIZE / 2 - camera.y);
            if (sx < -100 || sx > CANVAS_WIDTH + 100) continue;
            const tid = getTorchId(dec);
            const phase = torchPhases[tid] !== undefined ? torchPhases[tid] : 0;
            const flicker = 0.7 + 0.3 * Math.sin(torchTime * 5 + phase);
            const radius = 50 + 12 * flicker;
            const alpha = 0.06 * flicker;

            ctx.save();
            ctx.globalAlpha = alpha;
            const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius);
          grad.addColorStop(0, 'rgba(255,180,80,0.5)');
          grad.addColorStop(0.3, 'rgba(255,160,60,0.2)');
          grad.addColorStop(0.6, 'rgba(200,120,40,0.08)');
          grad.addColorStop(1, 'rgba(200,120,40,0)');
          ctx.fillStyle = grad;
          ctx.fillRect(sx - radius, sy - radius, radius * 2, radius * 2);
          ctx.restore();
        }
      }
      } // end if (!isFreeform)

      // --- Decoration foreground (torches, statues) ---
      if (!isFreeform && levelData.decorations && tileRenderer.hasSpritesheet) {
        for (const dec of levelData.decorations.filter(decoForeground)) {
          const sx = Math.round(dec.x - camera.x);
          const sy = Math.round(dec.y - camera.y);
          if (sx > CANVAS_WIDTH || sx + TILE_SIZE < 0) continue;
          tileRenderer.drawFrame(ctx, dec.frameId, sx, sy);
        }
      }

      // --- Entities ---
      for (const enemy of enemies) {
        enemy.render(ctx, camera);
      }

      // --- Player hit flash ---
      ctx.save();
      if (hitFlashTimer > 0) {
        ctx.globalAlpha = hitFlashTimer * 3;
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(
          Math.round(player.x - camera.x),
          Math.round(player.y - camera.y),
          player.width,
          player.height,
        );
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
      player.render(ctx, camera);
      ctx.restore();

      // --- Particles ---
      particles.render(ctx, camera);

      // --- Drops (heart pickups) ---
      for (const drop of drops) {
        if (drop.collected) continue;
        const hx = Math.round(drop.x - camera.x);
        const hy = Math.round(drop.y - camera.y + Math.sin(torchTime * 3 + drop.bob) * 3);
        ctx.save();
        ctx.translate(hx + 8, hy + 8);
        ctx.scale(1, 1);
        ctx.fillStyle = '#ff2244';
        ctx.beginPath();
        ctx.moveTo(0, 3);
        ctx.bezierCurveTo(-4, -2, -8, 2, 0, 8);
        ctx.bezierCurveTo(8, 2, 4, -2, 0, 3);
        ctx.fill();
        ctx.fillStyle = '#ff6688';
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.bezierCurveTo(-2, 1, -5, 3, 0, 7);
        ctx.bezierCurveTo(5, 3, 2, 1, 0, 4);
        ctx.fill();
        ctx.restore();
      }

      // --- Fog (atmospheric névoa) ---
      fogSystem.ensureCaches(ctx);
      fogSystem.render(ctx);

      // --- Vignette ---
      ensureVignetteCache();
      ctx.drawImage(vignetteCache, 0, 0);

      // --- FPS counter (temp) ---
      ctx.fillStyle = 'rgba(0,255,0,0.6)';
      ctx.font = '12px monospace';
      ctx.fillText(`${displayFps} FPS`, 8, 16);

      camera.x = origCX;
      camera.y = origCY;
    };

    loop.start(update, render);

    return () => {
      loop.stop();
      gameLoopRef.current = null;
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
    };
  }, [assetsReady, currentLevel]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{
        display: 'block',
        imageRendering: 'pixelated',
      }}
    />
  );
}
