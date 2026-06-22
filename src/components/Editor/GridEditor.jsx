import { useState, useRef, useCallback, useEffect } from 'react';

const TILE_SIZE = 32;
const TILE_EMPTY = 0;
const TILE_SOLID = 1;
const TILE_PLATFORM = 2;
const TILE_HAZARD = 3;
const TILE_LADDER = 4;
const WALL_FRAMES = [0, 1, 2, 3, 4, 5, 6, 7];

const LAYER_META = {
  structural: { label: 'Estrutural', color: '#6688aa' },
  decoration_back: { label: 'Decoração Fundo', color: '#88aa66' },
  decoration_front: { label: 'Decoração Frente', color: '#aa8866' },
  entities: { label: 'Inimigos', color: '#cc6666' },
  special: { label: 'Especiais', color: '#aa66cc' },
};

function getFrameIdForTile(tileVal, col, row, cats) {
  switch (tileVal) {
    case TILE_SOLID: return WALL_FRAMES[(col * 7 + row * 13) % WALL_FRAMES.length];
    case TILE_PLATFORM: return 1;
    case TILE_HAZARD: return 2;
    case TILE_LADDER: {
      if (!cats) return 0;
      for (const [idStr, cat] of Object.entries(cats.frameCategories)) {
        if (cat.category === 'ladder') return parseInt(idStr);
      }
      return 0;
    }
    default: return null;
  }
}

function TileCanvas({ frameId, size, tilesetImg, tilesetJson, flipX, flipY }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !tilesetImg || !tilesetJson || frameId == null) return;
    const ctx = c.getContext('2d');
    const frame = tilesetJson.frames[frameId];
    if (!frame) return;
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    const cx = size / 2, cy = size / 2;
    ctx.translate(cx, cy);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.translate(-cx, -cy);
    ctx.drawImage(tilesetImg, frame.x, frame.y, frame.w, frame.h, 0, 0, size, size);
    ctx.restore();
  }, [frameId, size, tilesetImg, tilesetJson, flipX, flipY]);
  return <canvas ref={ref} width={size} height={size} />;
}

export function GridEditor({
  tilemap, setTilemap,
  decorations, setDecorations,
  enemies, setEnemies,
  checkpoints, setCheckpoints,
  hazards, setHazards,
  layers, toggleLayer,
  selectedTile, selectedFrame,
  brushCategory,
  tilesetImg, tilesetJson, categoriesJson,
}) {
  const [zoom, setZoom] = useState(1.5);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [mousePos, setMousePos] = useState(null);
  const [showCoords, setShowCoords] = useState(true);
  const [fillMode, setFillMode] = useState(false);
  const [fillAnchor, setFillAnchor] = useState(null);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const gridRef = useRef(null);
  const isPainting = useRef(false);
  const lastPainted = useRef(null);

  const rows = tilemap?.length || 29;
  const cols = tilemap?.[0]?.length || 240;
  const cellSize = Math.max(4, Math.round(TILE_SIZE * zoom));
  const gridPixelW = cols * cellSize;
  const gridPixelH = rows * cellSize;

  const activeLayer = Object.keys(LAYER_META).find(k => layers[k]?.active);

  const getTileValue = useCallback((cat) => {
    if (cat === 'structural_wall' || cat === 'structural_wall_alt' || cat === 'decoration_structural') return TILE_SOLID;
    if (cat === 'structural_platform') return TILE_PLATFORM;
    if (cat === 'ladder') return TILE_LADDER;
    return TILE_SOLID;
  }, []);

  const handleCellClick = useCallback((col, row, button) => {
    const x = col * TILE_SIZE;
    const y = row * TILE_SIZE;

    if (activeLayer === 'structural') {
      if (!tilemap) return;
      const newMap = tilemap.map(r => [...r]);
      if (button === 0) {
        newMap[row][col] = getTileValue(brushCategory);
      } else {
        newMap[row][col] = TILE_EMPTY;
      }
      setTilemap(newMap);
    } else if (activeLayer === 'decoration_back' || activeLayer === 'decoration_front') {
      if (button === 0 && selectedTile !== null && selectedFrame) {
        const layer = activeLayer === 'decoration_front' ? 'foreground' : 'background';
        setDecorations(prev => [...prev, {
          frameId: selectedTile, x, y, layer, flipX, flipY,
        }]);
      } else if (button !== 0) {
        const layer = activeLayer === 'decoration_front' ? 'foreground' : 'background';
        setDecorations(prev => prev.filter(d => !(d.x === x && d.y === y && d.layer === layer)));
      }
    } else if (activeLayer === 'entities') {
      if (button === 0 && selectedTile !== null) {
        setEnemies(prev => [...prev, { x, y, type: 'skeleton' }]);
      } else if (button !== 0) {
        setEnemies(prev => prev.filter(e => !(e.x === x && e.y === y)));
      }
    } else if (activeLayer === 'special') {
      if (button === 0) {
        setCheckpoints(prev => [...prev, { x, y }]);
      } else if (button !== 0) {
        setCheckpoints(prev => prev.filter(cp => !(cp.x === x && cp.y === y)));
      }
    }
  }, [activeLayer, selectedTile, brushCategory, selectedFrame, tilemap, setTilemap, setDecorations, setEnemies, setCheckpoints, getTileValue, flipX, flipY]);

  const fillRectangle = useCallback((anchor, target) => {
    if (!tilemap) return;
    const minCol = Math.min(anchor.col, target.col);
    const maxCol = Math.max(anchor.col, target.col);
    const minRow = Math.min(anchor.row, target.row);
    const maxRow = Math.max(anchor.row, target.row);
    const newMap = tilemap.map(r => [...r]);
    const tileVal = getTileValue(brushCategory);
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        newMap[r][c] = tileVal;
      }
    }
    setTilemap(newMap);
    setFillAnchor(null);
    setFillMode(false);
  }, [tilemap, brushCategory, setTilemap, getTileValue]);

  const handleCellClickFill = useCallback((col, row) => {
    if (!fillAnchor) {
      setFillAnchor({ col, row });
    } else {
      fillRectangle(fillAnchor, { col, row });
    }
  }, [fillAnchor, fillRectangle]);

  const handleMouseDown = (e, col, row) => {
    if (e.button === 0) {
      if (fillMode) {
        handleCellClickFill(col, row);
        return;
      }
      isPainting.current = true;
      lastPainted.current = { col, row };
      handleCellClick(col, row, 0);
    }
  };

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const col = Math.floor((offsetX - panX) / cellSize);
    const row = Math.floor((offsetY - panY) / cellSize);
    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      setMousePos({ col, row });
    } else {
      setMousePos(null);
    }
  }, [panX, cellSize, cols, rows]);

  const handleMouseLeave = useCallback(() => {
    setMousePos(null);
  }, []);

  const handleMouseEnter = (e, col, row) => {
    setMousePos({ col, row });
    if (isPainting.current) {
      const last = lastPainted.current;
      if (!last || last.col !== col || last.row !== row) {
        handleCellClick(col, row, 0);
        lastPainted.current = { col, row };
      }
    }
  };

  const handleMouseUp = () => {
    isPainting.current = false;
    lastPainted.current = null;
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', background: '#0a0a14' }}>
      {/* Layer + tool tabs */}
      <div style={{
        display: 'flex', gap: 2, padding: '4px 8px', background: '#15152a',
        borderBottom: '1px solid #333', alignItems: 'center', flexWrap: 'wrap',
      }}>
        <span style={{ color: '#888', fontSize: 11, marginRight: 6 }}>Camadas:</span>
        {Object.entries(LAYER_META).map(([key, meta]) => {
          const l = layers[key] || {};
          return (
            <div key={key} onClick={() => toggleLayer(key)} style={{
              display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
              padding: '2px 8px', borderRadius: 3, fontSize: 11,
              background: l.active ? meta.color : '#2a2a3e',
              color: l.active ? '#fff' : '#888',
              border: `1px solid ${l.visible ? meta.color : '#444'}`,
              opacity: l.visible ? 1 : 0.5,
            }}>
              <span>{meta.label}</span>
            </div>
          );
        })}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
          <button onClick={() => setFlipX(!flipX)} style={{
            ...zoomBtnStyle, background: flipX ? '#886633' : '#2a2a3e',
          }} title="Inverter horizontalmente">↔</button>
          <button onClick={() => setFlipY(!flipY)} style={{
            ...zoomBtnStyle, background: flipY ? '#886633' : '#2a2a3e',
          }} title="Inverter verticalmente">↕</button>
          <span style={{ color: '#555' }}>|</span>
          <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} style={zoomBtnStyle}>+</button>
          <span style={{ color: '#888', fontSize: 11 }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} style={zoomBtnStyle}>-</button>
          <button onClick={() => { setPanX(0); setPanY(0); setZoom(1.5); }} style={zoomBtnStyle}>⟲</button>
          <button onClick={() => { setFillMode(!fillMode); setFillAnchor(null); }} style={{
            ...zoomBtnStyle, background: fillMode ? '#886633' : '#2a2a3e',
          }} title="Preencher retângulo">▣</button>
          <label style={{ color: '#888', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer', marginLeft: 8 }}>
            <input type="checkbox" checked={showCoords} onChange={e => setShowCoords(e.target.checked)} />
            Coord
          </label>
        </div>
      </div>

      {/* Scrollable grid */}
      <div
        ref={gridRef}
        style={{
          flex: 1, overflow: 'auto', position: 'relative', cursor: activeLayer ? 'crosshair' : 'default',
        }}
        onContextMenu={e => e.preventDefault()}
      >
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'relative',
            width: gridPixelW,
            height: gridPixelH,
            margin: 0,
            transform: `translate(${panX}px, ${panY}px)`,
            imageRendering: 'pixelated',
          }}
        >
          {/* Structural layer - render actual tile sprites */}
          {layers.structural?.visible && tilemap && tilesetImg && tilesetJson && Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((_, c) => {
              const val = tilemap[r]?.[c];
              if (!val) return null;
              const frameId = getFrameIdForTile(val, c, r, categoriesJson);
              if (frameId == null) return null;
              return (
                <div
                  key={`s-${r}-${c}`}
                  onMouseDown={e => handleMouseDown(e, c, r)}
                  onMouseEnter={e => handleMouseEnter(e, c, r)}
                  onContextMenu={e => { e.preventDefault(); handleCellClick(c, r, 2); }}
                  style={{
                    position: 'absolute',
                    left: c * cellSize,
                    top: r * cellSize,
                    width: cellSize,
                    height: cellSize,
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxSizing: 'border-box',
                    cursor: 'crosshair',
                  }}
                >
                  <TileCanvas
                    frameId={frameId}
                    size={cellSize}
                    tilesetImg={tilesetImg}
                    tilesetJson={tilesetJson}
                    flipX={false}
                    flipY={false}
                  />
                </div>
              );
            })
          )}

          {/* Decoration back layer */}
          {layers.decoration_back?.visible && tilesetImg && tilesetJson && decorations?.filter(d => d.layer === 'background').map((d, i) => (
            <div
              key={`db-${i}`}
              onContextMenu={e => { e.preventDefault(); setDecorations(prev => prev.filter(x => x !== d)); }}
              style={{
                position: 'absolute',
                left: d.x / TILE_SIZE * cellSize,
                top: d.y / TILE_SIZE * cellSize,
                width: cellSize, height: cellSize,
                cursor: 'crosshair',
              }}
            >
              <TileCanvas
                frameId={d.frameId}
                size={cellSize}
                tilesetImg={tilesetImg}
                tilesetJson={tilesetJson}
                flipX={!!d.flipX}
                flipY={!!d.flipY}
              />
            </div>
          ))}

          {/* Decoration front layer */}
          {layers.decoration_front?.visible && tilesetImg && tilesetJson && decorations?.filter(d => d.layer === 'foreground').map((d, i) => (
            <div
              key={`df-${i}`}
              onContextMenu={e => { e.preventDefault(); setDecorations(prev => prev.filter(x => x !== d)); }}
              style={{
                position: 'absolute',
                left: d.x / TILE_SIZE * cellSize,
                top: d.y / TILE_SIZE * cellSize,
                width: cellSize, height: cellSize,
                cursor: 'crosshair',
              }}
            >
              <TileCanvas
                frameId={d.frameId}
                size={cellSize}
                tilesetImg={tilesetImg}
                tilesetJson={tilesetJson}
                flipX={!!d.flipX}
                flipY={!!d.flipY}
              />
            </div>
          ))}

          {/* Structural hover cell (clickable div for empty cells) */}
          {layers.structural?.visible && mousePos && (() => {
            const { col, row } = mousePos;
            const val = tilemap?.[row]?.[col];
            if (val) return null; // already rendered above with full sprite

            let brushFrameId = null;
            if (tilesetImg && tilesetJson) {
              if (brushCategory === 'structural_wall' || brushCategory === 'structural_wall_alt' || brushCategory === 'decoration_structural') {
                brushFrameId = WALL_FRAMES[(col * 7 + row * 13) % WALL_FRAMES.length];
              } else if (brushCategory === 'structural_platform') {
                brushFrameId = 1;
              } else if (brushCategory === 'ladder') {
                if (categoriesJson) {
                  for (const [idStr, cat] of Object.entries(categoriesJson.frameCategories)) {
                    if (cat.category === 'ladder') { brushFrameId = parseInt(idStr); break; }
                  }
                }
              } else if (selectedTile != null) {
                brushFrameId = selectedTile;
              }
            }

            return (
              <div
                onMouseDown={e => handleMouseDown(e, col, row)}
                onContextMenu={e => { e.preventDefault(); handleCellClick(col, row, 2); }}
                style={{
                  position: 'absolute',
                  left: col * cellSize,
                  top: row * cellSize,
                  width: cellSize, height: cellSize,
                  border: brushFrameId != null ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.04)',
                  boxSizing: 'border-box',
                  cursor: 'crosshair',
                }}
              >
                {brushFrameId != null && tilesetImg && tilesetJson && (
                  <div style={{ opacity: 0.7 }}>
                    <TileCanvas
                      frameId={brushFrameId}
                      size={cellSize}
                      tilesetImg={tilesetImg}
                      tilesetJson={tilesetJson}
                      flipX={flipX}
                      flipY={flipY}
                    />
                  </div>
                )}
              </div>
            );
          })()}

          {/* Entities layer preview */}
          {layers.entities?.visible && Array.isArray(enemies) && enemies.map((e, i) => (
            <div key={`e-${i}`} style={{
              position: 'absolute',
              left: e.x / TILE_SIZE * cellSize,
              top: e.y / TILE_SIZE * cellSize,
              width: cellSize, height: cellSize,
              background: 'rgba(204,102,102,0.3)',
              border: '2px solid rgba(204,102,102,0.6)',
              borderRadius: '50%',
              fontSize: 8, color: '#c66', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>E</div>
          ))}

          {/* Hazards */}
          {layers.special?.visible && Array.isArray(hazards) && hazards.map((h, i) => (
            <div key={`h-${i}`} style={{
              position: 'absolute',
              left: h.x / TILE_SIZE * cellSize,
              top: h.y / TILE_SIZE * cellSize,
              width: Math.max(4, h.width / TILE_SIZE * cellSize),
              height: Math.max(4, (h.height || TILE_SIZE * 0.3) / TILE_SIZE * cellSize),
              background: 'rgba(170,102,204,0.3)',
              border: '1px solid rgba(170,102,204,0.6)',
            }} />
          ))}

          {/* Checkpoints */}
          {layers.special?.visible && Array.isArray(checkpoints) && checkpoints.map((cp, i) => (
            <div key={`cp-${i}`} style={{
              position: 'absolute',
              left: cp.x / TILE_SIZE * cellSize - 3,
              top: cp.y / TILE_SIZE * cellSize - 3,
              width: 6, height: 6, borderRadius: '50%',
              background: '#66cc66', border: '1px solid #88ff88',
            }} />
          ))}

          {/* Hover highlight */}
          {mousePos && (
            <div style={{
              position: 'absolute',
              left: mousePos.col * cellSize,
              top: mousePos.row * cellSize,
              width: cellSize, height: cellSize,
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.3)',
              pointerEvents: 'none', zIndex: 10,
            }} />
          )}

          {/* Fill anchor highlight */}
          {fillMode && fillAnchor && (
            <div style={{
              position: 'absolute',
              left: fillAnchor.col * cellSize,
              top: fillAnchor.row * cellSize,
              width: cellSize, height: cellSize,
              background: 'rgba(255,200,50,0.2)',
              border: '2px solid rgba(255,200,50,0.6)',
              pointerEvents: 'none', zIndex: 11,
            }} />
          )}

          {/* Fill rectangle preview */}
          {fillMode && fillAnchor && mousePos && (
            <div style={{
              position: 'absolute',
              left: Math.min(fillAnchor.col, mousePos.col) * cellSize,
              top: Math.min(fillAnchor.row, mousePos.row) * cellSize,
              width: (Math.abs(mousePos.col - fillAnchor.col) + 1) * cellSize,
              height: (Math.abs(mousePos.row - fillAnchor.row) + 1) * cellSize,
              background: 'rgba(255,200,50,0.08)',
              border: '1px solid rgba(255,200,50,0.3)',
              pointerEvents: 'none', zIndex: 9,
            }} />
          )}
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        padding: '3px 10px', background: '#111', borderTop: '1px solid #333',
        fontSize: 11, color: '#888', fontFamily: 'monospace',
        display: 'flex', gap: 16,
      }}>
        {mousePos ? (
          <>Col: {mousePos.col}  Row: {mousePos.row} | ({mousePos.col * TILE_SIZE}, {mousePos.row * TILE_SIZE}){tilemap?.[mousePos.row] && ` | Val: ${tilemap[mousePos.row][mousePos.col]}`}</>
        ) : <span>Passe o mouse sobre o grid</span>}
        <span style={{ color: '#666' }}>|</span>
        <span>Pincel: {brushCategory || 'nenhum'}</span>
        <span style={{ color: '#666' }}>|</span>
        <span>Camada: {LAYER_META[activeLayer]?.label || 'nenhuma'}</span>
        {(flipX || flipY) && <span style={{ color: '#ccaa44' }}>Flip: {flipX ? 'H' : ''}{flipY ? 'V' : ''}</span>}
        {fillMode && <span style={{ color: '#ccaa44' }}>Modo preencher: clique 1º canto, clique 2º canto</span>}
      </div>
    </div>
  );
}

const zoomBtnStyle = {
  background: '#2a2a3e', color: '#ccc', border: '1px solid #555',
  borderRadius: 3, cursor: 'pointer', fontSize: 14, padding: '0 6px', lineHeight: '20px',
};
