/// <reference types="wxt/client" />

import { browser } from 'wxt/browser';
import { clearVideoCache } from '../utils/cache';

export const YOUTUBE_VIDEO_PAGE_REGEX =
  /^https?:\/\/(www\.)?youtube\.com\/(?:watch\?v=|shorts\/)([a-zA-Z0-9_-]{11})/;

export const YOUTUBE_SHORTS_REGEX =
  /^https?:\/\/(www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/;

/**
 * Track the last known video URL for each tab
 * { tabId: "https://youtube.com/watch?v=..." }
 */
const tabVideoUrlMap = new Map<number, string>();


const updateSidePanelState = async (tabId: number, url: string | undefined) => {
  const isVideoPage = !!url && YOUTUBE_VIDEO_PAGE_REGEX.test(url);
  
  // --- LOGGING ---
  console.log(`[Side Panel] Tab: ${tabId}, URL: ${url}, Is YouTube Video: ${isVideoPage}`);

  try {
    await browser.sidePanel.setOptions({
      tabId,
      path: 'sidepanel.html', // Not index.html, as WXT generates sidepanel.html
      enabled: isVideoPage,
    });


    if (isVideoPage) {
      await browser.action.enable(tabId);
    } else {
      await browser.sidePanel.setOptions({
        enabled: false,
      });
      await browser.action.disable(tabId);
    }
  } catch (error) {
    console.error(`[Side Panel] Error setting options for tab ${tabId}:`, error);
  }
};

export default defineBackground(() => {
  console.log('[Side Panel] Background script loaded.');

  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(error => {
    console.error('[Side Panel] Error setting panel behavior:', error);
  });

  browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
    if (tab?.id) {
      updateSidePanelState(tab.id, tab.url);
    }
  });

  browser.tabs.onActivated.addListener(async (activeInfo) => {
    try {
      const tab = await browser.tabs.get(activeInfo.tabId);
      await updateSidePanelState(activeInfo.tabId, tab.url);
    } catch (error) {
      console.error(`Error in onActivated for tab ${activeInfo.tabId}:`, error);
    }
  });

  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Only run if the URL changes to avoid unnecessary updates
    if (changeInfo.url) {
      const previousUrl = tabVideoUrlMap.get(tabId);
      if (previousUrl && previousUrl !== changeInfo.url) {
        await clearVideoCache(previousUrl);
        tabVideoUrlMap.delete(tabId);
      }
      await updateSidePanelState(tabId, changeInfo.url);
    }
    // Update map only if it's a new, valid video URL
    if (tab.url && YOUTUBE_VIDEO_PAGE_REGEX.test(tab.url)) {
      tabVideoUrlMap.set(tabId, tab.url);
    }
  });

  browser.tabs.onRemoved.addListener(async (tabId) => {
    const closedTabUrl = tabVideoUrlMap.get(tabId);
    if (closedTabUrl) {
      await clearVideoCache(closedTabUrl);
      tabVideoUrlMap.delete(tabId);
      console.log(`Cleaned up cache for closed tab ${tabId}.`);
    }
  });
});