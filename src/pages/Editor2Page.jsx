import { useState, useRef, useCallback, useEffect } from 'react';

const COLLISION_TYPES = [
  { id: 'solid', label: 'Parede/Chão', color: '#ff4444', bg: 'rgba(255,68,68,0.25)', border: '2px solid rgba(255,68,68,0.7)' },
  { id: 'platform', label: 'Plataforma', color: '#44aaff', bg: 'rgba(68,170,255,0.25)', border: '2px solid rgba(68,170,255,0.7)' },
  { id: 'ladder', label: 'Escada', color: '#ffcc00', bg: 'rgba(255,204,0,0.25)', border: '2px solid rgba(255,204,0,0.7)' },
  { id: 'hazard', label: 'Perigo', color: '#cc44ff', bg: 'rgba(204,68,255,0.25)', border: '2px solid rgba(204,68,255,0.7)' },
];

const ENTITY_TYPES = [
  { id: 'playerSpawn', label: 'Entrada', icon: '🟢', color: '#44ff44' },
  { id: 'exit', label: 'Saída', icon: '🚪', color: '#ffcc44' },
  { id: 'enemy', label: 'Inimigo', icon: '🔴', color: '#ff4444' },
];

let nextId = 1;
function uid() { return `r${nextId++}`; }

export default function Editor2Page() {
  // Image
  const [bgImg, setBgImg] = useState(null);
  const [bgImgUrl, setBgImgUrl] = useState(null);
  const [imgSize, setImgSize] = useState(null);

  // View
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // Tool state
  const [mode, setMode] = useState('draw'); // 'draw' | 'select' | 'entity'
  const [selectedType, setSelectedType] = useState('solid');
  const [entityMode, setEntityMode] = useState('playerSpawn');

  // Data
  const [boxes, setBoxes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [entities, setEntities] = useState({ playerSpawn: null, enemies: [], exit: null });
  const [levelName, setLevelName] = useState('custom_level');

  // Drawing
  const [drawStart, setDrawStart] = useState(null);
  const [drawCurrent, setDrawCurrent] = useState(null);
  const isDrawing = useRef(false);

  // Drag/resize
  const [dragInfo, setDragInfo] = useState(null); // { type: 'move'|'resize', boxId, handle?, startMouse, startBox }
  const isDragging = useRef(false);

  // Pan
  const isPanning = useRef(false);
  const panStart = useRef(null);

  // Undo
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Layers
  const [showCollision, setShowCollision] = useState(true);
  const [showGrid, setShowGrid] = useState(false);

  // File input
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const bgFileRef = useRef(null);
  const [mousePos, setMousePos] = useState(null);
  const [hoverHandle, setHoverHandle] = useState(null);
  const [exportPreview, setExportPreview] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const selectedBox = boxes.find(b => b.id === selectedId);

  // Coordinate helpers
  const screenToImage = useCallback((clientX, clientY) => {
    if (!containerRef.current || !imgSize) return null;
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - panX) / zoom,
      y: (clientY - rect.top - panY) / zoom,
    };
  }, [zoom, panX, panY, imgSize]);

  // Push undo
  const pushUndo = useCallback(() => {
    setUndoStack(prev => {
      const state = { boxes: boxes.map(b => ({ ...b })), entities: JSON.parse(JSON.stringify(entities)) };
      const next = [...prev, state];
      if (next.length > 50) next.shift();
      return next;
    });
    setRedoStack([]);
  }, [boxes, entities]);

  // Resize handles (local coords inside transformed div)
  const getHandles = useCallback((box) => {
    if (!imgSize) return [];
    const x = box.x * zoom;
    const y = box.y * zoom;
    const w = box.width * zoom;
    const h = box.height * zoom;
    return [
      { id: 'nw', x: x - 4, y: y - 4, cursor: 'nw-resize' },
      { id: 'n', x: x + w / 2 - 4, y: y - 4, cursor: 'n-resize' },
      { id: 'ne', x: x + w - 4, y: y - 4, cursor: 'ne-resize' },
      { id: 'e', x: x + w - 4, y: y + h / 2 - 4, cursor: 'e-resize' },
      { id: 'se', x: x + w - 4, y: y + h - 4, cursor: 'se-resize' },
      { id: 's', x: x + w / 2 - 4, y: y + h - 4, cursor: 's-resize' },
      { id: 'sw', x: x - 4, y: y + h - 4, cursor: 'sw-resize' },
      { id: 'w', x: x - 4, y: y + h / 2 - 4, cursor: 'w-resize' },
    ];
  }, [zoom, imgSize]);

  const findHitHandle = useCallback((imgX, imgY, box) => {
    const hs = 8 / zoom;
    const handles = [
      { id: 'nw', x: box.x, y: box.y },
      { id: 'n', x: box.x + box.width / 2, y: box.y },
      { id: 'ne', x: box.x + box.width, y: box.y },
      { id: 'e', x: box.x + box.width, y: box.y + box.height / 2 },
      { id: 'se', x: box.x + box.width, y: box.y + box.height },
      { id: 's', x: box.x + box.width / 2, y: box.y + box.height },
      { id: 'sw', x: box.x, y: box.y + box.height },
      { id: 'w', x: box.x, y: box.y + box.height / 2 },
    ];
    for (const h of handles) {
      if (Math.abs(imgX - h.x) < hs && Math.abs(imgY - h.y) < hs) return h.id;
    }
    return null;
  }, [zoom]);

  const findHitBox = useCallback((imgX, imgY) => {
    for (let i = boxes.length - 1; i >= 0; i--) {
      const b = boxes[i];
      if (imgX >= b.x && imgX <= b.x + b.width && imgY >= b.y && imgY <= b.y + b.height) {
        return b.id;
      }
    }
    return null;
  }, [boxes]);

  // Mouse handlers
  const handleMouseDown = useCallback((e) => {
    if (e.button === 2 || e.button === 1) {
      // Right click or middle click = pan
      isPanning.current = true;
      panStart.current = { x: e.clientX - panX, y: e.clientY - panY };
      return;
    }
    if (e.button !== 0) return;
    const img = screenToImage(e.clientX, e.clientY);
    if (!img) return;

    if (mode === 'select') {
      // Check handle hit on selected box
      if (selectedBox) {
        const handle = findHitHandle(img.x, img.y, selectedBox);
        if (handle) {
          pushUndo();
          isDragging.current = true;
          setDragInfo({ type: 'resize', boxId: selectedId, handle, startMouse: img, startBox: { ...selectedBox } });
          return;
        }
      }
      // Check box hit
      const hitId = findHitBox(img.x, img.y);
      if (hitId) {
        setSelectedId(hitId);
        pushUndo();
        isDragging.current = true;
        setDragInfo({ type: 'move', boxId: hitId, startMouse: img, startBox: { ...boxes.find(b => b.id === hitId) } });
        return;
      }
      // Click on empty space in select mode = pan
      isPanning.current = true;
      panStart.current = { x: e.clientX - panX, y: e.clientY - panY };
      setSelectedId(null);
    } else if (mode === 'draw') {
      isDrawing.current = true;
      setDrawStart(img);
      setDrawCurrent(img);
    } else if (mode === 'entity') {
      pushUndo();
      if (entityMode === 'playerSpawn') {
        setEntities(prev => ({ ...prev, playerSpawn: { x: Math.round(img.x), y: Math.round(img.y) } }));
      } else if (entityMode === 'exit') {
        setEntities(prev => ({ ...prev, exit: { x: Math.round(img.x), y: Math.round(img.y) } }));
      } else if (entityMode === 'enemy') {
        setEntities(prev => ({ ...prev, enemies: [...prev.enemies, { id: uid(), type: 'skeleton', x: Math.round(img.x), y: Math.round(img.y) }] }));
      }
    }
  }, [mode, selectedBox, screenToImage, findHitHandle, findHitBox, boxes, pushUndo, entityMode, zoom, panX]);

  const handleMouseMove = useCallback((e) => {
    const img = screenToImage(e.clientX, e.clientY);
    if (img) setMousePos(img);

    if (isPanning.current) {
      setPanX(e.clientX - panStart.current.x);
      setPanY(e.clientY - panStart.current.y);
      return;
    }

    if (isDrawing.current && drawStart) {
      setDrawCurrent(img);
      return;
    }

    if (isDragging.current && dragInfo) {
      const dx = img.x - dragInfo.startMouse.x;
      const dy = img.y - dragInfo.startMouse.y;
      if (dragInfo.type === 'move') {
        setBoxes(prev => prev.map(b =>
          b.id === dragInfo.boxId ? { ...b, x: Math.round(dragInfo.startBox.x + dx), y: Math.round(dragInfo.startBox.y + dy) } : b
        ));
      } else if (dragInfo.type === 'resize') {
        const h = dragInfo.handle;
        const sb = dragInfo.startBox;
        let nx = sb.x, ny = sb.y, nw = sb.width, nh = sb.height;
        if (h.includes('w')) { nx = Math.min(sb.x + sb.width, sb.x + dx); nw = Math.abs(sb.width - dx); }
        if (h.includes('e')) { nw = Math.max(4, sb.width + dx); }
        if (h.includes('n')) { ny = Math.min(sb.y + sb.height, sb.y + dy); nh = Math.abs(sb.height - dy); }
        if (h.includes('s')) { nh = Math.max(4, sb.height + dy); }
        if (h === 'nw' || h === 'w' || h === 'sw') nx = Math.round(nx);
        if (h === 'nw' || h === 'n' || h === 'ne') ny = Math.round(ny);
        nw = Math.max(4, Math.round(nw));
        nh = Math.max(4, Math.round(nh));
        setBoxes(prev => prev.map(b =>
          b.id === dragInfo.boxId ? { ...b, x: nx, y: ny, width: nw, height: nh } : b
        ));
      }
      return;
    }

    // Hover detection
    if (mode === 'select' && selectedBox && img) {
      setHoverHandle(findHitHandle(img.x, img.y, selectedBox));
    } else {
      setHoverHandle(null);
    }
  }, [screenToImage, drawStart, dragInfo, selectedBox, mode, findHitHandle, zoom, panX]);

  const handleMouseUp = useCallback((e) => {
    if (isPanning.current) { isPanning.current = false; panStart.current = null; return; }

    if (isDrawing.current && drawStart && drawCurrent) {
      isDrawing.current = false;
      const x = Math.min(drawStart.x, drawCurrent.x);
      const y = Math.min(drawStart.y, drawCurrent.y);
      const w = Math.abs(drawCurrent.x - drawStart.x);
      const h = Math.abs(drawCurrent.y - drawStart.y);
      if (w > 4 || h > 4) {
        pushUndo();
        const box = { id: uid(), type: selectedType, x: Math.round(x), y: Math.round(y), width: Math.round(Math.max(8, w)), height: Math.round(Math.max(8, h)) };
        setBoxes(prev => [...prev, box]);
        setSelectedId(box.id);
        setMode('select');
      }
      setDrawStart(null);
      setDrawCurrent(null);
      return;
    }

    if (isDragging.current) {
      isDragging.current = false;
      setDragInfo(null);
      return;
    }
  }, [drawStart, drawCurrent, selectedType, pushUndo]);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  // Keyboard
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && mode === 'select') {
          pushUndo();
          setBoxes(prev => prev.filter(b => b.id !== selectedId));
          setSelectedId(null);
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 200 : 50;
        if (e.key === 'ArrowUp') setPanY(p => p + step);
        if (e.key === 'ArrowDown') setPanY(p => p - step);
        if (e.key === 'ArrowLeft') setPanX(p => p + step);
        if (e.key === 'ArrowRight') setPanX(p => p - step);
      }
      if (e.key === 'p') { setMode('select'); }
      if (e.key === 'o') { setMode('draw'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, mode, undoStack, redoStack, boxes, entities]);

  // Wheel zoom + pan horizontal
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      if (e.deltaX) {
        setPanX(p => p - e.deltaX);
      }
      if (e.deltaY && !e.shiftKey) {
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(z => Math.max(0.1, Math.min(10, z + delta)));
      } else if (e.deltaY) {
        setPanY(p => p - e.deltaY);
      }
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(r => [...r, { boxes: boxes.map(b => ({ ...b })), entities: JSON.parse(JSON.stringify(entities)) }]);
    setBoxes(prev.boxes);
    setEntities(prev.entities);
    setUndoStack(u => u.slice(0, -1));
  }, [undoStack, boxes, entities]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(u => [...u, { boxes: boxes.map(b => ({ ...b })), entities: JSON.parse(JSON.stringify(entities)) }]);
    setBoxes(next.boxes);
    setEntities(next.entities);
    setRedoStack(r => r.slice(0, -1));
  }, [redoStack, boxes, entities]);

  // Image upload
  const handleDrop = useCallback((files) => {
    const file = files[0];
    if (!file) return;
    if (bgImgUrl) URL.revokeObjectURL(bgImgUrl);
    bgFileRef.current = file;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      setBgImg(img);
      setBgImgUrl(url);
      setZoom(1); setPanX(0); setPanY(0);
      setBoxes([]); setEntities({ playerSpawn: null, enemies: [], exit: null });
    };
    img.src = url;
  }, [bgImgUrl]);

  const handleExport = () => {
    const enemyDefaults = { hp: 2, damage: 1, score: 100, dir: -1, range: 80, drawScale: 0.56 };
    const imgFilename = (levelName || 'dungeon') + '.png';
    const data = {
      name: levelName,
      backgroundImage: imgFilename,
      width: imgSize?.w || 0,
      height: imgSize?.h || 0,
      collisionBoxes: boxes.map(({ id, ...rest }) => rest),
      playerSpawn: entities.playerSpawn,
      exit: entities.exit,
      enemies: entities.enemies.map(({ id, x, y, ...rest }) => ({
        ...enemyDefaults, ...rest, x, y,
        type: rest.type || 'patrol',
      })),
      checkpoints: [],
    };
    const json = JSON.stringify(data, null, 2);
    setExportPreview(json);
    navigator.clipboard.writeText(json).catch(() => {});
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (levelName || 'dungeon') + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusMsg('JSON baixado! Cole a imagem em src/assets/images/');
    setTimeout(() => setStatusMsg(''), 5000);
  };

  const handleDownloadImage = () => {
    if (!bgImgUrl) return;
    const a = document.createElement('a');
    a.href = bgImgUrl;
    a.download = (levelName || 'dungeon') + '.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setStatusMsg('Imagem baixada! Salve em src/assets/images/');
    setTimeout(() => setStatusMsg(''), 5000);
  };

  // Rendering
  const displayW = imgSize ? imgSize.w * zoom : 0;
  const displayH = imgSize ? imgSize.h * zoom : 0;

  const getTypeMeta = (typeId) => COLLISION_TYPES.find(t => t.id === typeId) || COLLISION_TYPES[0];

  return (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#0d0d1a', color: '#ccc', fontFamily: 'monospace', fontSize: 13, overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
        background: '#16162e', borderBottom: '1px solid #333', flexWrap: 'wrap',
      }}>
        <span style={{ fontWeight: 'bold', color: '#ffcc44' }}>Collision Editor</span>
        <span style={{ color: '#555' }}>|</span>
        <input value={levelName} onChange={e => setLevelName(e.target.value)} style={{
          background: '#222', color: '#ccc', border: '1px solid #444', borderRadius: 3,
          padding: '2px 8px', fontSize: 12, fontFamily: 'monospace', width: 140,
        }} placeholder="level_name" />
        {imgSize && <span style={{ color: '#888', fontSize: 11 }}>{imgSize.w}x{imgSize.h}</span>}
        <div style={{ flex: 1 }} />
        <button onClick={undo} style={toolBtnS} title="Ctrl+Z">↩</button>
        <button onClick={redo} style={toolBtnS} title="Ctrl+Shift+Z">↪</button>
        <span style={{ color: '#555' }}>|</span>
        <label style={{ color: '#888', fontSize: 11, cursor: 'pointer' }}>
          <input type="checkbox" checked={showCollision} onChange={e => setShowCollision(e.target.checked)} /> Colisão
        </label>
        <label style={{ color: '#888', fontSize: 11, cursor: 'pointer' }}>
          <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} /> Grid
        </label>
        <span style={{ color: '#555' }}>|</span>
        <button onClick={handleExport} style={toolBtnS}>Exportar</button>
        {bgImgUrl && <button onClick={handleDownloadImage} style={{...toolBtnS, color: '#88ccff'}}>Baixar Imagem</button>}
        {statusMsg && <span style={{ color: '#8c8', fontSize: 11 }}>{statusMsg}</span>}
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left sidebar */}
        <div style={{
          width: 170, display: 'flex', flexDirection: 'column', gap: 2, padding: 8,
          background: '#1a1a2e', borderRight: '1px solid #333', overflowY: 'auto', flexShrink: 0,
        }}>
          {/* Modes */}
          <span style={{ color: '#888', fontSize: 11, marginBottom: 2 }}>Modo:</span>
          {[
            { id: 'draw', label: 'Desenhar' },
            { id: 'select', label: 'Selecionar' },
            { id: 'entity', label: 'Entidades' },
          ].map(m => (
            <div key={m.id} onClick={() => { setMode(m.id); if (m.id !== 'entity') setSelectedId(null); }} style={{
              cursor: 'pointer', padding: '4px 8px', borderRadius: 3, fontSize: 12,
              background: mode === m.id ? '#2a2a4e' : 'transparent',
              border: mode === m.id ? '1px solid #4466aa' : '1px solid transparent',
            }}>{m.label}</div>
          ))}

          {mode === 'draw' && (
            <>
              <div style={{ height: 1, background: '#333', margin: '6px 0' }} />
              <span style={{ color: '#888', fontSize: 11, marginBottom: 2 }}>Tipo de bloco:</span>
              {COLLISION_TYPES.map(t => (
                <div key={t.id} onClick={() => setSelectedType(t.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  padding: '4px 8px', borderRadius: 3, fontSize: 12,
                  background: selectedType === t.id ? '#2a2a4e' : 'transparent',
                  border: selectedType === t.id ? `1px solid ${t.color}` : '1px solid transparent',
                }}>
                  <div style={{ width: 12, height: 12, background: t.bg, border: t.border, borderRadius: 2, flexShrink: 0 }} />
                  {t.label}
                </div>
              ))}
            </>
          )}

          {mode === 'entity' && (
            <>
              <div style={{ height: 1, background: '#333', margin: '6px 0' }} />
              <span style={{ color: '#888', fontSize: 11, marginBottom: 2 }}>Tipo de entidade:</span>
              {ENTITY_TYPES.map(t => (
                <div key={t.id} onClick={() => setEntityMode(t.id)} style={{
                  cursor: 'pointer', padding: '4px 8px', borderRadius: 3, fontSize: 12,
                  background: entityMode === t.id ? '#2a2a4e' : 'transparent',
                  border: entityMode === t.id ? `1px solid ${t.color}` : '1px solid transparent',
                }}>
                  {t.label}
                </div>
              ))}
              {entityMode === 'enemy' && entities.enemies.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 11, color: '#888' }}>
                  Clique na imagem pra adicionar. Exclua pelo teclado com a entidade selecionada (TODO).
                </div>
              )}
            </>
          )}

          {mode === 'select' && (
            <>
              <div style={{ height: 1, background: '#333', margin: '6px 0' }} />
              <span style={{ color: '#888', fontSize: 11, marginBottom: 2 }}>
                Blocos ({boxes.length}):
              </span>
              <div style={{ fontSize: 10, maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {boxes.map((b, i) => {
                  const meta = getTypeMeta(b.type);
                  return (
                    <div key={b.id} onClick={() => setSelectedId(b.id)} style={{
                      cursor: 'pointer', padding: '3px 6px', borderRadius: 2,
                      background: selectedId === b.id ? '#2a2a4e' : 'transparent',
                      border: selectedId === b.id ? `1px solid ${meta.color}` : '1px solid transparent',
                      color: '#aaa',
                    }}>
                      <span style={{ color: meta.color }}>■</span> {i + 1}: {b.x},{b.y} {b.width}x{b.height}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Zoom */}
          <div style={{ height: 1, background: '#333', margin: '6px 0' }} />
          <span style={{ color: '#888', fontSize: 11 }}>Zoom: {Math.round(zoom * 100)}%</span>
          <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
            <button onClick={() => setZoom(z => Math.min(10, z + 0.25))} style={toolBtnS}>+</button>
            <button onClick={() => setZoom(z => Math.max(0.1, z - 0.25))} style={toolBtnS}>-</button>
            <button onClick={() => { setZoom(1); setPanX(0); setPanY(0); }} style={toolBtnS}>⟲</button>
          </div>

          {/* Help */}
          <div style={{ height: 1, background: '#333', margin: '6px 0' }} />
          <div style={{ fontSize: 10, color: '#666', lineHeight: 1.5 }}>
            Scroll vertical: zoom<br />
            Scroll horizontal: mover tela<br />
            Click direito/médio: mover tela<br />
            Select mode: click vazio = mover tela<br />
            Draw mode: arrasta pra criar bloco<br />
            Select mode: clica pra selecionar<br />
            &nbsp;&nbsp;arrasta pra mover<br />
            &nbsp;&nbsp;arrasta borda pra redimensionar<br />
            &nbsp;&nbsp;Delete: remove selecionado<br />
          </div>
        </div>

        {/* Image + overlay */}
        <div
          ref={containerRef}
          style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#0a0a14', cursor: mode === 'draw' ? 'crosshair' : mode === 'select' ? (hoverHandle ? `${hoverHandle}-resize` : 'default') : 'crosshair' }}
          onContextMenu={e => e.preventDefault()}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        >
          {!bgImg ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
              onDrop={e => { e.preventDefault(); handleDrop([...e.dataTransfer.files]); }}
              style={{
                width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px dashed #555', cursor: 'pointer', color: '#888', fontSize: 14, flexDirection: 'column', gap: 8,
              }}
            >
              <input ref={fileInputRef} type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) handleDrop([e.target.files[0]]); }} style={{ display: 'none' }} />
              Clique ou arraste a dungeon pronta
            </div>
          ) : (
            <div style={{ position: 'relative', transform: `translate(${panX}px, ${panY}px)` }}>
              {/* Image */}
              <img src={bgImgUrl} alt="dungeon" draggable={false} style={{
                width: displayW, height: displayH,
                imageRendering: 'pixelated', display: 'block',
              }} />

              {/* Reference grid */}
              {showGrid && (
                <svg style={{ position: 'absolute', left: 0, top: 0, width: displayW, height: displayH, pointerEvents: 'none' }}>
                  {Array.from({ length: Math.ceil(imgSize.w / 50) }).map((_, i) => (
                    <line key={`gv${i}`} x1={i * 50 * zoom} y1={0} x2={i * 50 * zoom} y2={displayH} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                  ))}
                  {Array.from({ length: Math.ceil(imgSize.h / 50) }).map((_, i) => (
                    <line key={`gh${i}`} x1={0} y1={i * 50 * zoom} x2={displayW} y2={i * 50 * zoom} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                  ))}
                </svg>
              )}

              {/* Collision boxes */}
              {showCollision && boxes.map(b => {
                const meta = getTypeMeta(b.type);
                const isSelected = b.id === selectedId;
                return (
                  <div key={b.id} style={{
                    position: 'absolute',
                    left: b.x * zoom, top: b.y * zoom,
                    width: b.width * zoom, height: b.height * zoom,
                    background: meta.bg,
                    border: isSelected ? `2px solid ${meta.color}` : meta.border,
                    boxSizing: 'border-box',
                    pointerEvents: 'none',
                    cursor: 'move',
                  }}>
                    {/* Type label */}
                    <span style={{
                      position: 'absolute', top: -14, left: 0,
                      fontSize: 9, color: meta.color, whiteSpace: 'nowrap',
                      background: 'rgba(0,0,0,0.6)', padding: '0 4px', borderRadius: 2,
                    }}>{meta.label}</span>
                    {/* Resize handles (selected only) */}
                    {isSelected && getHandles(b).map(h => (
                      <div key={h.id} style={{
                        position: 'absolute',
                        left: h.x, top: h.y,
                        width: 8, height: 8,
                        background: '#fff', border: '1px solid #333',
                        borderRadius: 1,
                        pointerEvents: 'none',
                      }} />
                    ))}
                  </div>
                );
              })}

              {/* Drawing preview */}
              {isDrawing.current && drawStart && drawCurrent && (
                <div style={{
                  position: 'absolute',
                  left: Math.min(drawStart.x, drawCurrent.x) * zoom,
                  top: Math.min(drawStart.y, drawCurrent.y) * zoom,
                  width: Math.abs(drawCurrent.x - drawStart.x) * zoom,
                  height: Math.abs(drawCurrent.y - drawStart.y) * zoom,
                  background: getTypeMeta(selectedType).bg,
                  border: `2px dashed ${getTypeMeta(selectedType).color}`,
                  pointerEvents: 'none', boxSizing: 'border-box',
                }} />
              )}

              {/* Player spawn */}
              {entities.playerSpawn && (
                <div style={{
                  position: 'absolute',
                  left: entities.playerSpawn.x * zoom - 8,
                  top: entities.playerSpawn.y * zoom - 8,
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'rgba(68,255,68,0.3)', border: '2px solid #44ff44',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, color: '#44ff44', pointerEvents: 'none', zIndex: 5,
                }}>P</div>
              )}

              {/* Enemies */}
              {entities.enemies.map(e => (
                <div key={e.id} style={{
                  position: 'absolute',
                  left: e.x * zoom - 8, top: e.y * zoom - 8,
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'rgba(255,68,68,0.3)', border: '2px solid #ff4444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, color: '#ff4444', pointerEvents: 'none', zIndex: 5,
                }}>E</div>
              ))}

              {/* Exit (saída) */}
              {entities.exit && (
                <div style={{
                  position: 'absolute',
                  left: entities.exit.x * zoom - 10,
                  top: entities.exit.y * zoom - 10,
                  width: 20, height: 20, borderRadius: 3,
                  background: 'rgba(255,204,68,0.25)', border: '2px solid #ffcc44',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: '#ffcc44', pointerEvents: 'none', zIndex: 5,
                }}>S</div>
              )}

              {/* Coord overlay */}
              {mousePos && (
                <div style={{
                  position: 'absolute', left: mousePos.x * zoom, top: mousePos.y * zoom,
                  width: 1, height: 1, pointerEvents: 'none', zIndex: 20,
                }} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        padding: '3px 10px', background: '#111', borderTop: '1px solid #333',
        fontSize: 11, color: '#888', fontFamily: 'monospace', display: 'flex', gap: 16,
      }}>
        {mousePos ? (
          <>Pos: ({Math.round(mousePos.x)}, {Math.round(mousePos.y)}) | Boxes: {boxes.length}</>
        ) : <span>{imgSize ? 'Passe o mouse sobre a dungeon' : 'Carregue uma dungeon'}</span>}
        <span style={{ color: '#666' }}>|</span>
        <span>Modo: {mode === 'draw' ? 'Desenhar' : mode === 'select' ? 'Selecionar' : 'Entidades'}</span>
        {selectedBox && <span> | Selecionado: {selectedBox.type} ({selectedBox.x},{selectedBox.y}) {selectedBox.width}x{selectedBox.height}</span>}
      </div>

      {/* Export modal */}
      {exportPreview && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setExportPreview('')}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '80vw', maxWidth: 900, height: '70vh', background: '#1a1a2e',
            border: '1px solid #555', borderRadius: 8, display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#ffcc44', fontWeight: 'bold' }}>Preview JSON</span>
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

const toolBtnS = {
  background: '#2a2a4e', color: '#ccc', border: '1px solid #555',
  borderRadius: 3, cursor: 'pointer', padding: '3px 8px', fontSize: 12,
  fontFamily: 'monospace',
};
