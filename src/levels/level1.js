import dungeonBg from '../assets/images/dungeon1.jpg';

export const level1 = {
  name: 'custom_level',
  backgroundImage: dungeonBg,
  width: 1280,
  height: 720,
  collisionBoxes: [
    { type: 'solid', x: 1, y: 663, width: 1283, height: 53 },
  ],
  playerSpawn: { x: 36, y: 630 },
  exit: { x: 1254, y: 626 },
  enemies: [
    { type: 'patrol', x: 419, y: 631, hp: 2, damage: 1, score: 100, dir: -1, range: 80, drawScale: 0.56 },
    { type: 'patrol', x: 674, y: 630, hp: 2, damage: 1, score: 100, dir: -1, range: 80, drawScale: 0.56 },
    { type: 'patrol', x: 911, y: 629, hp: 2, damage: 1, score: 100, dir: -1, range: 80, drawScale: 0.56 },
  ],
};
