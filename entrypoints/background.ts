/// <reference types="wxt/client" />

import { browser } from 'wxt/browser';
import { clearVideoCache } from '../utils/cache';

const YOUTUBE_VIDEO_PAGE_REGEX =
  /^https?:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/;

/**
 * Track the last known video URL for each tab
 * { tabId: "https://youtube.com/watch?v=..." }
 */
const tabVideoUrlMap = new Map<number, string>();

/**
 * Checks if the URL is a YouTube video page and enables/disables the
 * browser action icon accordingly.
 */
const updateActionIconState = (tabId: number, url: string | undefined) => {
  if (url && YOUTUBE_VIDEO_PAGE_REGEX.test(url)) {
    browser.action.enable(tabId);
  } else {
    browser.action.disable(tabId);
  }
};

export default defineBackground(() => {
  /**
   * Fires when the active tab in a window changes.
   * Useful for setting the initial state of the action icon.
   */
  browser.tabs.onActivated.addListener(async (activeInfo) => {
    try {
      const tab = await browser.tabs.get(activeInfo.tabId);
      updateActionIconState(activeInfo.tabId, tab.url);
    } catch (error) {
      console.error(`Error getting tab ${activeInfo.tabId}:`, error);
    }
  });

  /**
   * Fires when a tab is updated, like when the URL changes.
   * This is the perfect place to handle cache invalidation.
   */
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // We only care about events where the URL has actually changed.
    if (changeInfo.url) {
      const previousUrl = tabVideoUrlMap.get(tabId);
      
      // If the tab previously had a video URL, clear its cache because the user navigated away.
      if (previousUrl) {
        await clearVideoCache(previousUrl);
        tabVideoUrlMap.delete(tabId); // Clean up the map
      }

      // Update the action icon state for the new URL.
      updateActionIconState(tabId, tab.url);
    }
    
    // After all checks, if the current URL is a video, store it in our map.
    if (tab.url && YOUTUBE_VIDEO_PAGE_REGEX.test(tab.url)) {
      tabVideoUrlMap.set(tabId, tab.url);
    }
  });
  
  /**
   * Fires when a tab is closed.
   * We should clear any associated cache and clean up our tracking map.
   */
  browser.tabs.onRemoved.addListener(async (tabId) => {
    const closedTabUrl = tabVideoUrlMap.get(tabId);
    if (closedTabUrl) {
      await clearVideoCache(closedTabUrl);
      tabVideoUrlMap.delete(tabId);
      console.log(`Cleaned up cache for closed tab ${tabId}.`);
    }
  });
});