import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and tailwind-merge
 * This ensures proper handling of Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Debounces a function call
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Throttles a function call
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastFn: NodeJS.Timeout;
  let lastTime: number;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      fn(...args);
      lastTime = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFn);
      lastFn = setTimeout(() => {
        if (Date.now() - lastTime >= ms) {
          fn(...args);
          lastTime = Date.now();
        }
      }, Math.max(ms - (Date.now() - lastTime), 0));
    }
  };
}

/**
 * Creates a memoized function that only recalculates when dependencies change
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey: (...args: Parameters<T>) => string = (...args) => JSON.stringify(args)
): T {
  const cache = new Map<string, ReturnType<T>>();

  return function (...args: Parameters<T>) {
    const key = getKey(...args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  } as T;
}

/**
 * Ensures a value is within specified bounds
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Formats a number as pixels if it's a number, otherwise returns the value as is
 */
export function px(value: number | string): string {
  if (typeof value === 'number') {
    return `${value}px`;
  }
  return value;
}

/**
 * Checks if an element is partially in viewport
 */
export function isElementInViewport(element: HTMLElement, threshold = 0): boolean {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  const vertInView = (rect.top + threshold) <= windowHeight && (rect.top + rect.height) >= -threshold;
  const horInView = (rect.left + threshold) <= windowWidth && (rect.left + rect.width) >= -threshold;

  return vertInView && horInView;
}

/**
 * Creates a unique ID with an optional prefix
 */
export function uniqueId(prefix = ''): string {
  return `${prefix}${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Safely parses JSON with a fallback value
 */
export function safeJSONParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/**
 * Formats a number to a specific precision
 */
export function formatNumber(
  value: number,
  options: { minimumFractionDigits?: number; maximumFractionDigits?: number } = {}
): string {
  return new Intl.NumberFormat('en-US', options).format(value);
}

/**
 * Checks if the current environment is development
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Type guard for checking if a value is not null or undefined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Combines multiple refs into one
 */
export function combineRefs<T>(...refs: Array<React.Ref<T>>): React.RefCallback<T> {
  return (value: T) => {
    refs.forEach(ref => {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref && 'current' in ref) {
        (ref as React.MutableRefObject<T>).current = value;
      }
    });
  };
}