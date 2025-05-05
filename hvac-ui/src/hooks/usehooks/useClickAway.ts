import { useEffect, useRef, RefObject } from 'react';

/**
 * Custom hook for detecting clicks outside of a specified element
 * Inspired by @uidotdev/usehooks
 * 
 * @param onClickAway Function to call when a click outside is detected
 * @param events DOM events to listen for (default: ['mousedown', 'touchstart'])
 * @returns {RefObject<T>} Ref to attach to the element
 */
export function useClickAway<T extends HTMLElement = HTMLElement>(
  onClickAway: (event: MouseEvent | TouchEvent) => void,
  events: string[] = ['mousedown', 'touchstart']
): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handler = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      // Do nothing if the ref doesn't exist or if the click was inside the element
      if (!el || el.contains(event.target as Node)) {
        return;
      }

      onClickAway(event);
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handler);
    });

    // Remove event listeners on cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handler);
      });
    };
  }, [onClickAway, events]);

  return ref;
}

export default useClickAway;