import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore.js';
import { COLORS } from '../engine/constants.js';

const HEART_SIZE = 16;

export function HUD() {
  const hp = useGameStore((s) => s.hp);
  const maxHp = useGameStore((s) => s.maxHp);
  const score = useGameStore((s) => s.score);
  const hearts = useGameStore((s) => s.hearts);
  const [flash, setFlash] = useState(false);
  const prevHp = useRef(hp);

  useEffect(() => {
    if (hp < prevHp.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 300);
      prevHp.current = hp;
      return () => clearTimeout(t);
    }
    prevHp.current = hp;
  }, [hp]);

  const heartCount = maxHp / 2;
  const heartsArr = [];
  for (let i = 0; i < heartCount; i++) {
    const heartValue = Math.max(0, Math.min(2, hp - i * 2));
    heartsArr.push(heartValue);
  }

  return (
    <>
      <AnimatePresence>
        {flash && (
          <motion.div
            key="dmg-flash"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255, 0, 0, 0.3)',
              pointerEvents: 'none',
              zIndex: 15,
            }}
          />
        )}
      </AnimatePresence>
      {flash && (
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: [0, -4, 4, -2, 2, 0] }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 14,
          }}
        />
      )}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        pointerEvents: 'none',
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#fff',
        textShadow: '1px 1px 2px #000',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {heartsArr.map((val, i) => (
            <svg key={i} width={HEART_SIZE} height={HEART_SIZE} viewBox="0 0 16 16">
              {val === 0 && (
                <path d="M8 3.5c-1-2-3-2.5-4.5-1S1 6 1 8s2 4 7 6c5-2 7-4 7-6s-.5-4.5-2.5-6S9 1.5 8 3.5z"
                  fill={COLORS.heartEmpty} stroke={COLORS.heartEmpty} strokeWidth="0.5" />
              )}
              {val === 1 && (
                <>
                  <path d="M8 3.5c-1-2-3-2.5-4.5-1S1 6 1 8s2 4 7 6c5-2 7-4 7-6s-.5-4.5-2.5-6S9 1.5 8 3.5z"
                    fill={COLORS.heartEmpty} stroke={COLORS.heartEmpty} strokeWidth="0.5" />
                  <path d="M8 3.5C7 1.5 5 1 3.5 2.5S1 6 1 8s2 3 7 4V3.5z"
                    fill={COLORS.heartHalf} />
                </>
              )}
              {val === 2 && (
                <path d="M8 3.5c-1-2-3-2.5-4.5-1S1 6 1 8s2 4 7 6c5-2 7-4 7-6s-.5-4.5-2.5-6S9 1.5 8 3.5z"
                  fill={COLORS.heartFull} />
              )}
            </svg>
          ))}
        </div>
        <span>SCORE: {score}</span>
        <span>♥ {hearts}</span>
      </div>
    </>
  );
}
