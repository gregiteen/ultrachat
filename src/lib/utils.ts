import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AnyFunction = (...args: any[]) => any;

export function debounce<T extends AnyFunction>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function debouncedFn(...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends AnyFunction>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function throttledFn(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function memoize<T extends AnyFunction>(
  fn: T,
  getKey: (...args: Parameters<T>) => string = (...args) => JSON.stringify(args)
): T {
  const cache = new Map<string, ReturnType<T>>();
  return function memoizedFn(...args: Parameters<T>) {
    const key = getKey(...args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  } as T;
}

export function batchUpdates<T>(
  updates: Array<() => Promise<T>>,
  batchSize = 5
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = [];
    let current = 0;
    
    const processBatch = async () => {
      const batch = updates.slice(current, current + batchSize);
      const batchResults = await Promise.all(batch.map(update => update()));
      results.push(...batchResults);
      current += batchSize;
      current >= updates.length ? resolve(results) : processBatch();
    };
    processBatch().catch(reject);
  });
}