import { useRef, useCallback } from 'react';

export default function useAutosave(saveFn, delay = 1000) {
  const timerRef = useRef(null);

  const autosave = useCallback(
    (data) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        saveFn(data);
      }, delay);
    },
    [saveFn, delay]
  );

  return autosave;
}
