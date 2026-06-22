import { useState, useMemo } from 'react';
import tilesetSrc from '../../assets/sprites/tileset.png';

const FRAME_CATEGORY_ORDER = [
  { key: 'structural_wall', label: 'Paredes' },
  { key: 'structural_wall_alt', label: 'Paredes (alternativas)' },
  { key: 'structural_platform', label: 'Plataformas' },
  { key: 'decoration_structural', label: 'Decoração Estrutural' },
  { key: 'decoration_background', label: 'Decoração Fundo' },
  { key: 'decoration_foreground', label: 'Decoração Frente' },
  { key: 'interactive_placeholder', label: 'Portas/Grades' },
  { key: 'ladder', label: 'Escadas' },
  { key: 'decoration_parallax_far', label: 'Parallax (somente fundo)' },
];

const EXCLUDED = new Set(['empty', 'unknown']);

export function TilePalette({ tilesetJson, categoriesJson, selectedTile, onSelectTile }) {
  const [activeTab, setActiveTab] = useState(0);

  const groups = useMemo(() => {
    const cats = categoriesJson?.frameCategories || {};
    const frames = tilesetJson?.frames || [];
    const grouped = {};

    for (const [idStr, cat] of Object.entries(cats)) {
      if (EXCLUDED.has(cat.category)) continue;
      const id = parseInt(idStr);
      const frame = frames[id];
      if (!frame) continue;
      if (!grouped[cat.category]) grouped[cat.category] = [];
      grouped[cat.category].push({ id, frame, ...cat });
    }
    return grouped;
  }, [tilesetJson, categoriesJson]);

  const visibleGroups = FRAME_CATEGORY_ORDER.filter(g => groups[g.key]?.length > 0);
  const activeGroup = visibleGroups[activeTab];
  const tiles = activeGroup ? (groups[activeGroup.key] || []) : [];

  return (
    <div style={{
      width: 220, height: '100%', display: 'flex', flexDirection: 'column',
      background: '#1a1a2e', borderRight: '1px solid #333', overflow: 'hidden',
    }}>
      <div style={{ padding: '8px 10px', fontWeight: 'bold', color: '#ccc', fontSize: 13, borderBottom: '1px solid #333' }}>
        Paleta de Tiles
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, padding: '4px 6px', borderBottom: '1px solid #333', overflowX: 'auto' }}>
        {visibleGroups.map((g, i) => (
          <button key={g.key} onClick={() => setActiveTab(i)} style={{
            fontSize: 10, padding: '3px 7px', cursor: 'pointer',
            background: i === activeTab ? '#4466aa' : '#2a2a3e',
            color: '#ccc', border: '1px solid #555', borderRadius: 3, whiteSpace: 'nowrap',
          }}>
            {g.label} ({groups[g.key].length})
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 6, display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', gap: 3 }}>
        {tiles.map(t => (
          <div key={t.id} onClick={() => onSelectTile(t.id)} style={{
            width: 50, height: 50, cursor: 'pointer', position: 'relative',
            background: '#111', borderRadius: 3, overflow: 'hidden', flexShrink: 0,
            border: selectedTile === t.id ? '2px solid #ffcc44' : '2px solid transparent',
            outline: selectedTile === t.id ? '2px solid #ffcc44' : 'none',
          }}>
            <img
              src={tilesetSrc}
              alt={`Tile ${t.id}`}
              style={{
                position: 'absolute',
                left: -t.frame.x,
                top: -t.frame.y,
                width: 1536,
                height: 1024,
                imageRendering: 'pixelated',
                maxWidth: 'none',
              }}
            />
            <div style={{
              position: 'absolute', bottom: 0, right: 1,
              fontSize: 8, color: 'rgba(255,255,255,0.5)',
              background: 'rgba(0,0,0,0.5)', padding: '0 2px', borderRadius: 2,
            }}>
              {t.id}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
