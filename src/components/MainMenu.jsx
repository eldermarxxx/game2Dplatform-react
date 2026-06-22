import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../engine/constants.js';
import { TOTAL_LEVELS } from '../levels/index.js';
import menuBgmUrl from '../assets/music/Castelo de Sangue 2.mp3';
import menuBgUrl from '../assets/images/menu.png';

const btnStyle = {
  padding: '14px 40px',
  fontSize: '18px',
  fontFamily: 'monospace',
  background: '#222',
  color: '#fff',
  border: '2px solid #aaa',
  cursor: 'pointer',
  letterSpacing: '2px',
};

const containerStyle = {
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'monospace',
};

export function MainMenu() {
  const setScreen = useGameStore((s) => s.setScreen);
  const bgmRef = useRef(null);

  useEffect(() => {
    const bgm = new Audio(menuBgmUrl);
    bgm.loop = true;
    bgm.volume = 0.15;
    bgmRef.current = bgm;
    return () => {
      bgm.pause();
      bgm.src = '';
      bgmRef.current = null;
    };
  }, []);

  const handleClick = () => {
    const bgm = bgmRef.current;
    if (bgm && bgm.paused) {
      bgm.play().catch(() => {});
    }
    setScreen('game');
  };

  return (
    <div style={{
      ...containerStyle,
      background: `url(${menuBgUrl}) no-repeat center center / cover`,
      imageRendering: 'pixelated',
      gap: '24px',
    }}>
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          fontFamily: 'monospace',
          fontSize: '36px',
          color: '#ffd700',
          textShadow: '2px 2px 4px #000',
          letterSpacing: '4px',
          margin: 0,
        }}
      >
        PALADINO
      </motion.h1>
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        onClick={handleClick}
        style={btnStyle}
        whileHover={{ scale: 1.05, borderColor: '#ffd700' }}
        whileTap={{ scale: 0.95 }}
      >
        START NEW GAME
      </motion.button>
    </div>
  );
}

export function GameOver() {
  const setScreen = useGameStore((s) => s.setScreen);
  const reset = useGameStore((s) => s.reset);
  const score = useGameStore((s) => s.score);

  return (
    <div style={{
      ...containerStyle,
      background: '#000',
      color: '#ff4444',
      gap: '16px',
    }}>
      <motion.h1
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
        style={{ fontSize: '32px', margin: 0, letterSpacing: '3px' }}
      >
        GAME OVER
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ color: '#aaa', fontSize: '14px' }}
      >
        SCORE: {score}
      </motion.p>
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onClick={() => { reset(); setScreen('menu'); }}
        style={{
          ...btnStyle,
          border: '2px solid #ff4444',
        }}
        whileHover={{ scale: 1.05, borderColor: '#ff6666' }}
        whileTap={{ scale: 0.95 }}
      >
        VOLTAR AO MENU
      </motion.button>
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: COLORS.sky,
      color: '#aaa',
      fontFamily: 'monospace',
      fontSize: '16px',
      gap: '12px',
      zIndex: 20,
    }}>
      <span>Carregando</span>
      <span style={{ animation: 'pulse 1s infinite' }}>...</span>
    </div>
  );
}

export function Victory() {
  const setScreen = useGameStore((s) => s.setScreen);
  const reset = useGameStore((s) => s.reset);
  const score = useGameStore((s) => s.score);

  return (
    <div style={{
      ...containerStyle,
      background: COLORS.sky,
      color: '#ffd700',
      gap: '16px',
    }}>
      <motion.h1
        initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 80 }}
        style={{ fontSize: '36px', margin: 0, letterSpacing: '3px' }}
      >
        VITÓRIA!
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{ color: '#aaa', fontSize: '14px' }}
      >
        SCORE FINAL: {score}
      </motion.p>
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        onClick={() => { reset(); setScreen('menu'); }}
        style={{
          ...btnStyle,
          border: '2px solid #ffd700',
        }}
        whileHover={{ scale: 1.05, borderColor: '#ffed4a' }}
        whileTap={{ scale: 0.95 }}
      >
        VOLTAR AO MENU
      </motion.button>
    </div>
  );
}

export function LevelComplete() {
  const setScreen = useGameStore((s) => s.setScreen);
  const setLevelComplete = useGameStore((s) => s.setLevelComplete);
  const setCurrentLevel = useGameStore((s) => s.setCurrentLevel);
  const currentLevel = useGameStore((s) => s.currentLevel);
  const setVictory = useGameStore((s) => s.setVictory);
  const score = useGameStore((s) => s.score);
  const reset = useGameStore((s) => s.reset);

  const levelNames = ['', 'Masmorra das Sombras', 'Salão dos Ossos', 'Torre do Necromante'];

  const handleNext = () => {
    setLevelComplete(false);
    if (currentLevel >= TOTAL_LEVELS) {
      setVictory(true);
    } else {
      setCurrentLevel(currentLevel + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        ...containerStyle,
        background: 'rgba(0,0,0,0.85)',
        color: '#ffd700',
        gap: '16px',
      }}
    >
      <motion.h1
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{ fontSize: '28px', margin: 0, letterSpacing: '3px' }}
      >
        FASE CONCLUÍDA!
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ color: '#ccc', fontSize: '16px' }}
      >
        {levelNames[currentLevel]}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ color: '#aaa', fontSize: '14px' }}
      >
        SCORE: {score}
      </motion.p>
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        onClick={handleNext}
        style={{
          ...btnStyle,
          border: '2px solid #ffd700',
          marginTop: '8px',
        }}
        whileHover={{ scale: 1.05, borderColor: '#ffed4a' }}
        whileTap={{ scale: 0.95 }}
      >
        PRÓXIMA FASE
      </motion.button>
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        onClick={() => { reset(); setScreen('menu'); }}
        style={{
          padding: '8px 24px',
          fontSize: '14px',
          fontFamily: 'monospace',
          background: 'transparent',
          color: '#666',
          border: '1px solid #444',
          cursor: 'pointer',
        }}
        whileHover={{ color: '#aaa', borderColor: '#888' }}
      >
        MENU PRINCIPAL
      </motion.button>
    </motion.div>
  );
}
