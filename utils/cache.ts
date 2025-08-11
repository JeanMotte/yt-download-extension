import { browser } from 'wxt/browser';
import type { ResolutionOption } from '../src/api/models';

const CACHE_KEY_PREFIX = 'video_cache_';

export interface VideoCacheData {
  title: string;
  resolutions: ResolutionOption[];
  url: string;
  timestamp: number;
}

/**
 * Saves video details to local storage, using the video URL as a key.
 */
export const saveVideoDetailsToCache = async (
  url: string,
  data: Omit<VideoCacheData, 'url' | 'timestamp'>
): Promise<void> => {
  const cacheKey = `${CACHE_KEY_PREFIX}${url}`;
  const cacheEntry: VideoCacheData = {
    ...data,
    url,
    timestamp: Date.now(),
  };
  await browser.storage.local.set({ [cacheKey]: cacheEntry });
};

/**
 * Retrieves cached video details for a specific URL.
 * Returns null if no cache is found or if it's stale (e.g., older than 1 hour).
 */
export const getVideoDetailsFromCache = async (url: string): Promise<VideoCacheData | null> => {
  const cacheKey = `${CACHE_KEY_PREFIX}${url}`;
  const result = await browser.storage.local.get(cacheKey);
  
  if (!result[cacheKey]) {
    return null;
  }
  
  const cacheEntry = result[cacheKey] as VideoCacheData;
  const ONE_HOUR = 60 * 60 * 1000;

  // Optional: Invalidate cache after a certain time
  if (Date.now() - cacheEntry.timestamp > ONE_HOUR) {
    console.log('Cache is stale, removing.');
    await browser.storage.local.remove(cacheKey);
    return null;
  }

  return cacheEntry;
};

/**
 * Clears the cache for a specific video URL.
 */
export const clearVideoCache = async (url: string): Promise<void> => {
    const cacheKey = `${CACHE_KEY_PREFIX}${url}`;
    await browser.storage.local.remove(cacheKey);
    console.log(`Cache cleared for URL: ${url}`);
};