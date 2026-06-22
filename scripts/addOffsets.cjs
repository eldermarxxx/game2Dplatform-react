const fs = require('fs');
const path = require('path');

const manifests = [
  { path: 'src/assets/sprites/heroi.json',    heroHeight: 92 },
  { path: 'src/assets/sprites/enemies.json',  heroHeight: 92 },
];

for (const { path: p } of manifests) {
  const filePath = path.resolve(p);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  for (const row of data.rows) {
    const ref = row.frames[0];
    if (!ref) continue;

    for (const f of row.frames) {
      const offsetX = (ref.anchorX - ref.x) - (f.anchorX - f.x);
      const offsetY = (ref.anchorY - ref.y) - (f.anchorY - f.y);
      f.anchorOffsetX = offsetX;
      f.anchorOffsetY = offsetY;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Updated: ${p}`);
}
