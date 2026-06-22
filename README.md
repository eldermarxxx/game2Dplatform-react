# Paladino — 2D Platform Game

A 2D side-scrolling platformer built with React and Canvas. Features tile-based levels with procedural parallax rendering and a freeform collision editor for custom dungeon layouts.

## How It Works

### Game Engine
- **Canvas-based rendering** with requestAnimationFrame game loop
- **Two collision modes**: tilemap (2D grid) or collisionBoxes (freeform AABB list) — auto-detected per level
- **Tile renderer** with spritesheet support, procedural wall tile variation, and tile categories (solid, platform, hazard, ladder)
- **Entity system**: player with whip attack, enemy AI (patrol/fly), particle effects, fog system, camera shake
- **Level progression** via exit zones — player reaches the exit to advance to the next level

### Editors

#### `/editor` — Tile Grid Editor
- Div-based tile grid with layer system (background, solid, ladder, decoration)
- Tile palette with spritesheet thumbnails, category tabs
- Paint, erase, fill, flip X/Y, undo/redo
- Decorations layer with sprite frame selection

#### `/editor2` — Freeform Collision Editor
- Load a pre-drawn dungeon background image
- Draw, select, move, resize collision rectangles (solid, platform, ladder, hazard)
- Entity markers: player spawn (entrada), exit (saída), enemies
- Zoom/pan with mouse wheel, arrow keys, right-click drag
- Export to JSON + download background image for use in new levels

### Level Format
```js
{
  name: 'Level Name',
  backgroundImage: dungeonImg,  // imported image
  width: 1536,
  height: 1024,
  collisionBoxes: [{ x, y, width, height, type }],
  playerSpawn: { x, y },
  exit: { x, y },
  enemies: [{ type, x, y, hp, damage, ... }],
  bgColor: '#0a0a2e',
  fogDensity: 0.3,
}
```

### Tech Stack
- **React 19** with Vite
- **Canvas 2D API** for game rendering
- **React state** (zustand) for game HUD
- **Oxc** for JS transformation

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` to play. Navigate to `/editor` or `/editor2` for level editing.

---

Created by **Elder Marx** — game developer building a Castlevania-inspired platformer with custom tooling.
