import { useState, useEffect, useCallback, useMemo } from 'react';
import { TilePalette } from '../components/Editor/TilePalette.jsx';
import { GridEditor } from '../components/Editor/GridEditor.jsx';
import tilesetSrc from '../assets/sprites/tileset.png';

const COLS = 240;
const ROWS = 29;
const TILE_SIZE = 32;

const DEFAULT_TILEMAP = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

export default function EditorPage() {
  const [tilesetJson, setTilesetJson] = useState(null);
  const [categoriesJson, setCategoriesJson] = useState(null);
  const [tilesetImg, setTilesetImg] = useState(null);
  const [selectedTile, setSelectedTile] = useState(null);
  const [tilemap, setTilemap] = useState(() => DEFAULT_TILEMAP.map(r => [...r]));
  const [decorations, setDecorations] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [hazards, setHazards] = useState([]);
  const [levelName, setLevelName] = useState('custom_level');
  const [layers, setLayers] = useState({
    structural: { visible: true, active: true },
    decoration_back: { visible: true, active: false },
    decoration_front: { visible: true, active: false },
    entities: { visible: true, active: false },
    special: { visible: true, active: false },
  });
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [exportPreview, setExportPreview] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  // Load tileset data
  useEffect(() => {
    const img = new Image();
    img.onload = () => setTilesetImg(img);
    img.src = tilesetSrc;

    Promise.all([
      fetch('/src/assets/sprites/tileset.json').then(r => r.json()),
      fetch('/src/assets/sprites/tilesetCategories.json').then(r => r.json()),
    ]).then(([tileset, cats]) => {
      setTilesetJson(tileset);
      setCategoriesJson(cats);
    }).catch(() => {
      setStatusMsg('Erro ao carregar tileset');
    });
  }, []);

  const selectedFrame = useMemo(() => {
    if (!tilesetJson || selectedTile === null) return null;
    return tilesetJson.frames[selectedTile] || null;
  }, [tilesetJson, selectedTile]);

  const brushCategory = useMemo(() => {
    if (!categoriesJson || selectedTile === null) return null;
    const cat = categoriesJson.frameCategories[String(selectedTile)];
    return cat?.category || null;
  }, [categoriesJson, selectedTile]);

  const pushUndo = useCallback((oldMap) => {
    setUndoStack(prev => {
      const next = [...prev, oldMap.map(r => [...r])];
      if (next.length > 50) next.shift();
      return next;
    });
    setRedoStack([]);
  }, []);

  const handleSetTilemap = useCallback((newMap) => {
    setTilemap(prev => {
      pushUndo(prev);
      return newMap;
    });
  }, [pushUndo]);

  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      const cur = tilemap.map(r => [...r]);
      const prevMap = prev[prev.length - 1];
      setTilemap(prevMap);
      setRedoStack(r => [...r, cur]);
      return prev.slice(0, -1);
    });
  }, [tilemap]);

  const redo = useCallback(() => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      const cur = tilemap.map(r => [...r]);
      const nextMap = prev[prev.length - 1];
      setTilemap(nextMap);
      setUndoStack(u => [...u, cur]);
      return prev.slice(0, -1);
    });
  }, [tilemap]);

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) redo();
      else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) undo();
      else if (e.key >= '1' && e.key <= '5') {
        const keys = Object.keys(layers);
        const idx = parseInt(e.key) - 1;
        if (idx < keys.length) toggleLayer(keys[idx]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, layers]);

  const toggleLayer = useCallback((key) => {
    setLayers(prev => {
      const updated = {};
      for (const k of Object.keys(prev)) {
        updated[k] = { ...prev[k], active: k === key };
      }
      return updated;
    });
  }, []);

  const generateExport = useCallback(() => {
    const cols = tilemap[0]?.length || COLS;
    const rows = tilemap.length || ROWS;
    const code = `import { TILE_SOLID, TILE_PLATFORM, TILE_HAZARD, TILE_LADDER, TILE_SIZE } from '../engine/constants.js';

const _ = 0;
const W = TILE_SOLID;
const P = TILE_PLATFORM;
const S = TILE_HAZARD;
const L = TILE_LADDER;

const COLS = ${cols};
const ROWS = ${rows};

function makeTilemap() {
  const map = Array.from({ length: ROWS }, () => Array(COLS).fill(_));
  function fill(col, row, len, val) {
    for (let c = col; c < col + len && c < COLS; c++) map[row][c] = val;
  }
  function vfill(col, row, len, val) {
    for (let r = row; r < row + len && r < ROWS; r++) map[r][col] = val;
  }

${tilemap.map((row, r) => {
  // Find runs of same value for compact output
  const parts = [];
  let start = 0;
  while (start < cols) {
    let end = start;
    while (end < cols && row[end] === row[start]) end++;
    if (row[start] !== 0) {
      if (end - start === 1) {
        parts.push(`    map[${r}][${start}] = ${row[start]};`);
      } else {
        parts.push(`    fill(${start}, ${r}, ${end - start}, ${row[start]});`);
      }
    }
    start = end;
  }
  return parts.join('\\n');
}).join('\\n\\n')}

  return map;
}

const tilemap = makeTilemap();

const decorations = [
${decorations.map(d => `  { frameId: ${d.frameId}, x: ${d.x}, y: ${d.y}, layer: '${d.layer}' },`).join('\\n')}
];

const enemies = [
${enemies.map(e => `  { x: ${e.x}, y: ${e.y}, type: '${e.type || 'skeleton'}' },`).join('\\n')}
];

const checkpoints = [
${checkpoints.map(cp => `  { x: ${cp.x}, y: ${cp.y} },`).join('\\n')}
];

const hazards = [
${hazards.map(h => `  { x: ${h.x}, y: ${h.y}, width: ${h.width || TILE_SIZE}, height: ${h.height || TILE_SIZE * 0.3} },`).join('\\n')}
];

export const ${levelName} = {
  name: '${levelName}',
  width: COLS * TILE_SIZE,
  height: ROWS * TILE_SIZE,
  background: 'dungeon',
  bgColor: '#0a0a14',
  tilemap,
  decorations,
  enemies,
  checkpoints,
  hazards,
  fogDensity: 0.4,
};
`;
    return code;
  }, [tilemap, decorations, enemies, checkpoints, hazards, levelName]);

  const handleExport = () => {
    const code = generateExport();
    setExportPreview(code);
    navigator.clipboard.writeText(code).then(() => {
      setStatusMsg('Código copiado para a área de transferência!');
      setTimeout(() => setStatusMsg(''), 3000);
    }).catch(() => {
      setStatusMsg('Erro ao copiar. Selecione o preview manualmente.');
    });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.js,.json,.txt';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        // Try to extract tilemap from the file text
        // Simple regex-based extraction
        const mapMatch = text.match(/const\s+tilemap\s*=\s*makeTilemap\s*\(\s*\)\s*;|const\s+tilemap\s*=\s*\[/);
        if (!mapMatch) throw new Error('Formato não reconhecido');

        // Extract decorations
        const decoMatch = text.match(/const\s+decorations\s*=\s*\[([\s\S]*?)\];/);
        if (decoMatch) {
          const items = decoMatch[1].match(/\{[^}]+\}/g) || [];
          setDecorations(items.map(s => {
            const f = s.match(/frameId:\s*(\d+)/);
            const x = s.match(/x:\s*(\d+)/);
            const y = s.match(/y:\s*(\d+)/);
            const l = s.match(/layer:\s*'(\w+)'/);
            return { frameId: f ? parseInt(f[1]) : 0, x: x ? parseInt(x[1]) : 0, y: y ? parseInt(y[1]) : 0, layer: l ? l[1] : 'foreground' };
          }));
        }

        // Extract enemies
        const enemyMatch = text.match(/const\s+enemies\s*=\s*\[([\s\S]*?)\];/);
        if (enemyMatch) {
          const items = enemyMatch[1].match(/\{[^}]+\}/g) || [];
          setEnemies(items.map(s => {
            const x = s.match(/x:\s*(\d+)/);
            const y = s.match(/y:\s*(\d+)/);
            const t = s.match(/type:\s*'(\w+)'/);
            return { x: x ? parseInt(x[1]) : 0, y: y ? parseInt(y[1]) : 0, type: t ? t[1] : 'skeleton' };
          }));
        }

        // Extract checkpoints
        const cpMatch = text.match(/const\s+checkpoints\s*=\s*\[([\s\S]*?)\];/);
        if (cpMatch) {
          const items = cpMatch[1].match(/\{[^}]+\}/g) || [];
          setCheckpoints(items.map(s => {
            const x = s.match(/x:\s*(\d+)/);
            const y = s.match(/y:\s*(\d+)/);
            return { x: x ? parseInt(x[1]) : 0, y: y ? parseInt(y[1]) : 0 };
          }));
        }

        // Extract hazards
        const hazMatch = text.match(/const\s+hazards\s*=\s*\[([\s\S]*?)\];/);
        if (hazMatch) {
          const items = hazMatch[1].match(/\{[^}]+\}/g) || [];
          setHazards(items.map(s => {
            const x = s.match(/x:\s*(\d+)/);
            const y = s.match(/y:\s*(\d+)/);
            const w = s.match(/width:\s*([\d.]+)/);
            const h = s.match(/height:\s*([\d.]+)/);
            return { x: x ? parseInt(x[1]) : 0, y: y ? parseInt(y[1]) : 0, width: w ? parseFloat(w[1]) : TILE_SIZE, height: h ? parseFloat(h[1]) : TILE_SIZE * 0.3 };
          }));
        }

        // Try to extract name
        const nameMatch = text.match(/name:\s*'(\w+)'/);
        if (nameMatch) setLevelName(nameMatch[1]);

        setStatusMsg('Level carregado! (tilemap requer rebuild manual)');
        setTimeout(() => setStatusMsg(''), 4000);
      } catch (err) {
        setStatusMsg(`Erro ao importar: ${err.message}`);
      }
    };
    input.click();
  };

  return (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#0d0d1a', color: '#ccc', fontFamily: 'monospace', fontSize: 13, overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px',
        background: '#16162e', borderBottom: '1px solid #333',
      }}>
        <span style={{ fontWeight: 'bold', color: '#ffcc44' }}>Level Editor</span>
        <span style={{ color: '#555' }}>|</span>
        <input value={levelName} onChange={e => setLevelName(e.target.value)} style={{
          background: '#222', color: '#ccc', border: '1px solid #444', borderRadius: 3,
          padding: '2px 8px', fontSize: 12, fontFamily: 'monospace',
        }} placeholder="level_name" />
        <div style={{ flex: 1 }} />
        <button onClick={handleExport} style={toolBtnStyle}>Exportar</button>
        <button onClick={handleImport} style={toolBtnStyle}>Importar</button>
        <button onClick={undo} style={toolBtnStyle} title="Ctrl+Z">↩</button>
        <button onClick={redo} style={toolBtnStyle} title="Ctrl+Shift+Z">↪</button>
        {statusMsg && <span style={{ color: '#8c8', fontSize: 11 }}>{statusMsg}</span>}
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <TilePalette
          tilesetJson={tilesetJson}
          categoriesJson={categoriesJson}
          selectedTile={selectedTile}
          onSelectTile={setSelectedTile}
        />
        <GridEditor
          tilemap={tilemap}
          setTilemap={handleSetTilemap}
          decorations={decorations}
          setDecorations={setDecorations}
          enemies={enemies}
          setEnemies={setEnemies}
          checkpoints={checkpoints}
          setCheckpoints={setCheckpoints}
          hazards={hazards}
          setHazards={setHazards}
          layers={layers}
          toggleLayer={toggleLayer}
          selectedTile={selectedTile}
          selectedFrame={selectedFrame}
          brushCategory={brushCategory}
          tilesetImg={tilesetImg}
          tilesetJson={tilesetJson}
          categoriesJson={categoriesJson}
        />
      </div>

      {/* Export preview modal */}
      {exportPreview && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setExportPreview('')}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '80vw', maxWidth: 900, height: '70vh', background: '#1a1a2e',
            border: '1px solid #555', borderRadius: 8, display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#ffcc44', fontWeight: 'bold' }}>Preview do Level — Código copiado!</span>
              <button onClick={() => setExportPreview('')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <pre style={{ flex: 1, overflow: 'auto', padding: 12, margin: 0, color: '#8c8', fontSize: 11, lineHeight: 1.4 }}>
              {exportPreview}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

const toolBtnStyle = {
  background: '#2a2a4e', color: '#ccc', border: '1px solid #555',
  borderRadius: 3, cursor: 'pointer', padding: '3px 10px', fontSize: 12,
  fontFamily: 'monospace',
};
