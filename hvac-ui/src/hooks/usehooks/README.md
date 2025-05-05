# Custom React Hooks

This directory contains custom React hooks inspired by the `@uidotdev/usehooks` package. These hooks provide common functionality for React components in a reusable way.

## Available Hooks

### `useLocalStorage`

A hook for managing localStorage values with a useState-like API.

```tsx
const [value, setValue, removeValue] = useLocalStorage<string>('key', 'default value');
```

### `useSessionStorage`

A hook for managing sessionStorage values with a useState-like API.

```tsx
const [value, setValue, removeValue] = useSessionStorage<string>('key', 'default value');
```

### `useWindowSize`

A hook for tracking window dimensions.

```tsx
const { width, height } = useWindowSize();
```

### `useMediaQuery`

A hook for responsive design using media queries.

```tsx
const isMobile = useMediaQuery(mediaQueries.mobile);
const isDarkMode = useMediaQuery(mediaQueries.darkMode);
```

### `useToggle`

A hook for toggling boolean values.

```tsx
const [isOpen, toggle, setIsOpen] = useToggle(false);
```

### `useClickAway`

A hook for detecting clicks outside of a specified element.

```tsx
const ref = useClickAway<HTMLDivElement>(() => {
  // Handle click outside
});
```

## Usage

Import the hooks from the `@/hooks/usehooks` directory:

```tsx
import { useLocalStorage, useWindowSize, useMediaQuery, mediaQueries } from '@/hooks/usehooks';
```

## Media Query Presets

The `mediaQueries` object provides common media query strings:

- `mobile`: `(max-width: 480px)`
- `tablet`: `(min-width: 481px) and (max-width: 768px)`
- `laptop`: `(min-width: 769px) and (max-width: 1024px)`
- `desktop`: `(min-width: 1025px)`
- `darkMode`: `(prefers-color-scheme: dark)`
- `lightMode`: `(prefers-color-scheme: light)`
- `reducedMotion`: `(prefers-reduced-motion: reduce)`
- `portrait`: `(orientation: portrait)`
- `landscape`: `(orientation: landscape)`