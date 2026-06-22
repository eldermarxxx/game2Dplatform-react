import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from './store/gameStore.js';
import { useKeyboard } from './hooks/useKeyboard.js';
import { GameCanvas } from './components/GameCanvas.jsx';
import { HUD } from './components/HUD.jsx';
import {
  MainMenu, GameOver, Victory, LoadingScreen, LevelComplete,
} from './components/MainMenu.jsx';
import './App.css';

function App() {
  const screen = useGameStore((s) => s.screen);
  const gameOver = useGameStore((s) => s.gameOver);
  const victory = useGameStore((s) => s.victory);
  const loading = useGameStore((s) => s.loading);
  const levelComplete = useGameStore((s) => s.levelComplete);

  useKeyboard();

  return (
    <div className="game-container">
      <AnimatePresence mode="wait">
        {screen === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <MainMenu />
          </motion.div>
        )}
        {screen === 'game' && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="game-wrapper">
              {loading && <LoadingScreen />}
              <AnimatePresence>
                {gameOver && (
                  <motion.div
                    key="gameover"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    style={{ position: 'absolute', inset: 0, zIndex: 30 }}
                  >
                    <GameOver />
                  </motion.div>
                )}
                {victory && (
                  <motion.div
                    key="victory"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    style={{ position: 'absolute', inset: 0, zIndex: 30 }}
                  >
                    <Victory />
                  </motion.div>
                )}
                {levelComplete && (
                  <motion.div
                    key="levelcomplete"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ position: 'absolute', inset: 0, zIndex: 30 }}
                  >
                    <LevelComplete />
                  </motion.div>
                )}
              </AnimatePresence>
              <GameCanvas />
              {!gameOver && !victory && !loading && !levelComplete && <HUD />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
