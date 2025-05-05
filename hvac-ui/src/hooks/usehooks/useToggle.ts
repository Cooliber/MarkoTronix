import { useState, useCallback } from 'react';

/**
 * Custom hook for toggling a boolean value
 * Inspired by @uidotdev/usehooks
 * 
 * @param initialValue The initial boolean value
 * @returns [value, toggle, setValue]
 */
export function useToggle(
  initialValue: boolean = false
): [boolean, () => void, (value: boolean) => void] {
  // Initialize the state
  const [value, setValue] = useState<boolean>(initialValue);

  // Define and memoize toggler function
  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  return [value, toggle, setValue];
}

export default useToggle;