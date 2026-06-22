import dungeonBg from '../assets/images/dungeon2.jpg';

export const level2 = {
  name: 'custom_level',
  backgroundImage: dungeonBg,
  width: 1280,
  height: 720,
  collisionBoxes: [
    { type: 'solid', x: -1, y: 663, width: 1284, height: 51 },
  ],
  playerSpawn: { x: 30, y: 628 },
  exit: { x: 1254, y: 615 },
  enemies: [
    { type: 'patrol', x: 1008, y: 634, hp: 2, damage: 1, score: 100, dir: -1, range: 80, drawScale: 0.56 },
    { type: 'patrol', x: 711, y: 637, hp: 2, damage: 1, score: 100, dir: -1, range: 80, drawScale: 0.56 },
    { type: 'patrol', x: 481, y: 632, hp: 2, damage: 1, score: 100, dir: -1, range: 80, drawScale: 0.56 },
  ],
};
