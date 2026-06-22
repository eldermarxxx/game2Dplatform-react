import { useEffect } from 'react';
import { input } from '../engine/input.js';

export function useKeyboard() {
  useEffect(() => {
    input.init();
    return () => input.destroy();
  }, []);
}
