import { TILE_SIZE, TILE_EMPTY, TILE_LADDER } from './constants.js';

export function aabb(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

export function getOverlap(a, b) {
  const overlapLeft = (a.x + a.width) - b.x;
  const overlapRight = (b.x + b.width) - a.x;
  const overlapTop = (a.y + a.height) - b.y;
  const overlapBottom = (b.y + b.height) - a.y;

  return {
    left: overlapLeft,
    right: overlapRight,
    top: overlapTop,
    bottom: overlapBottom,
  };
}

export function resolveTileCollisions(entity, tilemap) {
  entity.onGround = false;

  const tiles = getOverlappingTiles(entity, tilemap);
  for (const tile of tiles) {
    if (tile.type === TILE_EMPTY) continue;

    const overlap = getOverlap(entity, tile);

    const minOverlap = Math.min(overlap.left, overlap.right, overlap.top, overlap.bottom);

    if (minOverlap === overlap.top && entity.vy >= 0) {
      entity.y = tile.y - entity.height;
      entity.vy = 0;
      entity.onGround = true;
    } else if (minOverlap === overlap.bottom && entity.vy < 0) {
      entity.y = tile.y + TILE_SIZE;
      entity.vy = 0;
    } else if (minOverlap === overlap.left) {
      entity.x = tile.x - entity.width;
      entity.vx = 0;
    } else if (minOverlap === overlap.right) {
      entity.x = tile.x + TILE_SIZE;
      entity.vx = 0;
    }
  }
}

export function getTilesByType(entity, tilemap, type) {
  const tiles = [];
  const leftTile = Math.floor(entity.x / TILE_SIZE);
  const rightTile = Math.floor((entity.x + entity.width - 0.01) / TILE_SIZE);
  const topTile = Math.floor(entity.y / TILE_SIZE);
  const bottomTile = Math.floor((entity.y + entity.height + 0.01) / TILE_SIZE);

  for (let row = topTile; row <= bottomTile; row++) {
    for (let col = leftTile; col <= rightTile; col++) {
      if (row < 0 || row >= tilemap.length || col < 0 || col >= tilemap[0].length) continue;
      if (tilemap[row][col] === type) {
        tiles.push({
          type,
          x: col * TILE_SIZE,
          y: row * TILE_SIZE,
          width: TILE_SIZE,
          height: TILE_SIZE,
          col,
          row,
        });
      }
    }
  }
  return tiles;
}

export function resolveFreeformCollisions(entity, boxes) {
  entity.onGround = false;
  for (const box of boxes) {
    if (!aabb(entity, box)) continue;
    if (box.type === 'ladder') continue;
    const overlap = getOverlap(entity, box);
    const minOverlap = Math.min(overlap.left, overlap.right, overlap.top, overlap.bottom);

    if (box.type === 'platform') {
      if (minOverlap === overlap.top && entity.vy >= 0) {
        entity.y = box.y - entity.height;
        entity.vy = 0;
        entity.onGround = true;
      }
      continue;
    }

    if (minOverlap === overlap.top && entity.vy >= 0) {
      entity.y = box.y - entity.height;
      entity.vy = 0;
      entity.onGround = true;
    } else if (minOverlap === overlap.bottom && entity.vy < 0) {
      entity.y = box.y + box.height;
      entity.vy = 0;
    } else if (minOverlap === overlap.left) {
      entity.x = box.x - entity.width;
      entity.vx = 0;
    } else if (minOverlap === overlap.right) {
      entity.x = box.x + box.width;
      entity.vx = 0;
    }
  }
}

export function getFreeformTilesByType(entity, boxes, type) {
  return boxes.filter(b => b.type === type && aabb(entity, b));
}

function getOverlappingTiles(entity, tilemap) {
  const tiles = [];
  const leftTile = Math.floor(entity.x / TILE_SIZE);
  const rightTile = Math.floor((entity.x + entity.width - 0.01) / TILE_SIZE);
  const topTile = Math.floor(entity.y / TILE_SIZE);
  const bottomTile = Math.floor((entity.y + entity.height + 0.01) / TILE_SIZE);

  for (let row = topTile; row <= bottomTile; row++) {
    for (let col = leftTile; col <= rightTile; col++) {
      if (row < 0 || row >= tilemap.length || col < 0 || col >= tilemap[0].length) continue;
      const type = tilemap[row][col];
      if (type === TILE_EMPTY || type === TILE_LADDER) continue;

      tiles.push({
        type,
        x: col * TILE_SIZE,
        y: row * TILE_SIZE,
        width: TILE_SIZE,
        height: TILE_SIZE,
      });
    }
  }

  return tiles;
}
