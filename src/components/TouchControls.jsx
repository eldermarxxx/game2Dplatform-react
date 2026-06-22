import { useEffect, useRef } from 'react';
import { input } from '../engine/input.js';

const BTN_IDS = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  attack: 'KeyZ',
  jump: 'Space',
};

const keysDown = {};
const touched = {};

function setKey(code, down) {
  if (down && !keysDown[code]) {
    input.justPressed[code] = true;
  }
  input.keys[code] = down;
  keysDown[code] = down;
}

function handleTouch(id, code, e) {
  e.preventDefault();
  if (!touched[id]) {
    touched[id] = true;
    setKey(code, true);
  }
}

function handleTouchEnd(id, code, e) {
  e.preventDefault();
  delete touched[id];
  setKey(code, false);
}

const btnBase = {
  position: 'absolute',
  border: '2px solid rgba(255,255,255,0.3)',
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'monospace',
  fontWeight: 'bold',
  cursor: 'pointer',
  touchAction: 'none',
  WebkitTapHighlightColor: 'transparent',
};

export function TouchControls() {
  const isTouchRef = useRef(false);

  useEffect(() => {
    isTouchRef.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  if (!isTouchRef.current && window.innerWidth > 800) return null;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 25,
      pointerEvents: 'none',
    }}>
      {/* D-Pad */}
      <div style={{
        position: 'absolute',
        left: '5%',
        bottom: '18%',
        width: '38%',
        height: '55%',
        pointerEvents: 'none',
      }}>
        <button
          style={{ ...btnBase, left: '35%', top: 0, width: '30%', height: '28%', fontSize: '1.2em' }}
          onTouchStart={(e) => handleTouch('up', BTN_IDS.up, e)}
          onTouchEnd={(e) => handleTouchEnd('up', BTN_IDS.up, e)}
          onTouchCancel={(e) => handleTouchEnd('up', BTN_IDS.up, e)}
        >&#9650;</button>
        <button
          style={{ ...btnBase, left: 0, top: '36%', width: '30%', height: '28%', fontSize: '1.2em' }}
          onTouchStart={(e) => handleTouch('left', BTN_IDS.left, e)}
          onTouchEnd={(e) => handleTouchEnd('left', BTN_IDS.left, e)}
          onTouchCancel={(e) => handleTouchEnd('left', BTN_IDS.left, e)}
        >&#9664;</button>
        <button
          style={{ ...btnBase, right: 0, top: '36%', width: '30%', height: '28%', fontSize: '1.2em' }}
          onTouchStart={(e) => handleTouch('right', BTN_IDS.right, e)}
          onTouchEnd={(e) => handleTouchEnd('right', BTN_IDS.right, e)}
          onTouchCancel={(e) => handleTouchEnd('right', BTN_IDS.right, e)}
        >&#9654;</button>
        <button
          style={{ ...btnBase, left: '35%', bottom: 0, width: '30%', height: '28%', fontSize: '1.2em' }}
          onTouchStart={(e) => handleTouch('down', BTN_IDS.down, e)}
          onTouchEnd={(e) => handleTouchEnd('down', BTN_IDS.down, e)}
          onTouchCancel={(e) => handleTouchEnd('down', BTN_IDS.down, e)}
        >&#9660;</button>
        <div style={{
          position: 'absolute', left: '35%', top: '36%', width: '30%', height: '28%',
          borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
        }} />
      </div>

      {/* Action buttons */}
      <div style={{
        position: 'absolute',
        right: '5%',
        bottom: '15%',
        width: '32%',
        height: '50%',
        pointerEvents: 'none',
      }}>
        <button
          style={{ ...btnBase, right: '10%', bottom: 0, width: '50%', height: '50%', fontSize: '0.7em', background: 'rgba(255,200,50,0.15)', borderColor: 'rgba(255,200,50,0.4)' }}
          onTouchStart={(e) => handleTouch('attack', BTN_IDS.attack, e)}
          onTouchEnd={(e) => handleTouchEnd('attack', BTN_IDS.attack, e)}
          onTouchCancel={(e) => handleTouchEnd('attack', BTN_IDS.attack, e)}
        >ATK</button>
        <button
          style={{ ...btnBase, right: '55%', bottom: '38%', width: '38%', height: '36%', fontSize: '0.6em', background: 'rgba(100,200,255,0.15)', borderColor: 'rgba(100,200,255,0.4)' }}
          onTouchStart={(e) => handleTouch('jump', BTN_IDS.jump, e)}
          onTouchEnd={(e) => handleTouchEnd('jump', BTN_IDS.jump, e)}
          onTouchCancel={(e) => handleTouchEnd('jump', BTN_IDS.jump, e)}
        >JUMP</button>
      </div>
    </div>
  );
}
