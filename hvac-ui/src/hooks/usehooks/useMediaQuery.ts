import { useState, useEffect } from 'react';

/**
 * Custom hook for media queries
 * Inspired by @uidotdev/usehooks
 * 
 * @param query The media query to check
 * @returns {boolean} True if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with false on the server, true only if it matches on the client
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Ensure we're in the browser environment
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      
      // Update the state with the current value
      setMatches(media.matches);

      // Create a handler to update the state whenever the media query changes
      const listener = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };

      // Add the listener to the media query
      media.addEventListener('change', listener);

      // Clean up the listener when the component unmounts
      return () => {
        media.removeEventListener('change', listener);
      };
    }
  }, [query]);

  return matches;
}

// Common media query presets
export const mediaQueries = {
  mobile: '(max-width: 480px)',
  tablet: '(min-width: 481px) and (max-width: 768px)',
  laptop: '(min-width: 769px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
  darkMode: '(prefers-color-scheme: dark)',
  lightMode: '(prefers-color-scheme: light)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
};

export default useMediaQuery;