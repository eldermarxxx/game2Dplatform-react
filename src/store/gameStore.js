import { create } from 'zustand';

export const useGameStore = create((set) => ({
  screen: 'menu',
  hp: 16,
  maxHp: 16,
  score: 0,
  hearts: 5,
  gameOver: false,
  levelComplete: false,
  victory: false,
  loading: false,
  currentLevel: 1,
  respawning: false,

  setScreen: (screen) => set({ screen }),
  setHp: (hp) => set({ hp }),
  setScore: (score) => set({ score }),
  setHearts: (hearts) => set({ hearts }),
  setGameOver: (gameOver) => set({ gameOver }),
  setLevelComplete: (levelComplete) => set({ levelComplete }),
  setVictory: (victory) => set({ victory }),
  setLoading: (loading) => set({ loading }),
  setCurrentLevel: (currentLevel) => set({ currentLevel }),
  setRespawning: (respawning) => set({ respawning }),
  reset: () => set({
    hp: 16, score: 0, hearts: 5, gameOver: false,
    levelComplete: false, victory: false, loading: false,
    currentLevel: 1, respawning: false,
  }),
}));
