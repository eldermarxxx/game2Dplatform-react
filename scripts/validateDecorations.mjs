import { level1 } from '../src/levels/level1.js';
import { level2 } from '../src/levels/level2.js';
import { level3 } from '../src/levels/level3.js';
import { validateAllDecorations } from '../src/engine/decorationPlacement.js';

const levels = [level1, level2, level3];
const failures = validateAllDecorations(levels);

if (failures.length === 0) {
  console.log('TODAS as decorações passaram na validação.');
  process.exit(0);
}

console.log(`=== ${failures.length} decorações FALHARAM a validação ===\n`);

for (const f of failures) {
  console.log(`Level ${f.level} — "${f.name}"`);
  console.log(`  FrameId: ${f.frameId}, Pos: (${f.x}, ${f.y}) -> tile (${f.col}, ${f.row}), layer: ${f.layer}`);
  for (const err of f.errors) {
    console.log(`  ❌ ${err}`);
  }
  console.log();
}

process.exit(1);
