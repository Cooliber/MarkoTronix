import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing localStorage values
 * Inspired by @uidotdev/usehooks
 * 
 * @param key The localStorage key
 * @param initialValue The initial value (or function that returns the initial value)
 * @returns [storedValue, setValue, removeValue]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // Get from localStorage then parse stored json or return initialValue
  const readValue = useCallback((): T => {
    // Prevent build error "window is undefined" but keep working
    if (typeof window === 'undefined') {
      return typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : (
        typeof initialValue === 'function'
          ? (initialValue as () => T)()
          : initialValue
      );
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue;
    }
  }, [initialValue, key]);

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        // Dispatch a custom event so other instances can update
        window.dispatchEvent(new Event('local-storage'));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      // Remove from localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        // Dispatch a custom event so other instances can update
        window.dispatchEvent(new Event('local-storage'));
      }
      
      // Reset state to initial value
      setStoredValue(
        typeof initialValue === 'function'
          ? (initialValue as () => T)()
          : initialValue
      );
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [initialValue, key]);

  // Listen for changes to this localStorage key in other windows/tabs
  useEffect(() => {
    const handleStorageChange = () => {
      setStoredValue(readValue());
    };
    
    // this only works for other documents, not the current one
    window.addEventListener('storage', handleStorageChange);
    // this is a custom event, triggered in setValue
    window.addEventListener('local-storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleStorageChange);
    };
  }, [readValue]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;