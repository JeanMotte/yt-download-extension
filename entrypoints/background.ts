/// <reference types="wxt/client" />

import { browser } from 'wxt/browser';
import { clearVideoCache } from '../utils/cache';

export const YOUTUBE_VIDEO_PAGE_REGEX =
  /^https?:\/\/(www\.)?youtube\.com\/(?:watch\?v=|shorts\/)([a-zA-Z0-9_-]{11})/;

export const YOUTUBE_SHORTS_REGEX =
  /^https?:\/\/(www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/;

const tabVideoUrlMap = new Map<number, string>();

/**
 * Updates the browser action state based on the URL.
 * In Firefox, this will enable or disable the toolbar button that opens the sidebar.
 */
const updateActionState = async (tabId: number, url: string | undefined) => {
  const isVideoPage = !!url && YOUTUBE_VIDEO_PAGE_REGEX.test(url);
  
  await browser.browserAction.setTitle({ tabId, title: 'YouLoad' });

  if (isVideoPage) {
    // Enable the BUTTON, making it clickable.
    await browser.browserAction.enable(tabId);
  } else {
    // Disable the BUTTON, making it gray and unclickable.
    await browser.browserAction.disable(tabId);
  }
};

export default defineBackground(() => {
  // We have NO browser.action.onClicked listener.
  // The manifest's "sidebar_action" handles opening the panel automatically.

  // The rest of your event listeners are correct and necessary.
  browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
    if (tab?.id && tab.url) {
      updateActionState(tab.id, tab.url);
    }
  });

  browser.tabs.onActivated.addListener(async (activeInfo) => {
    try {
      const tab = await browser.tabs.get(activeInfo.tabId);
      await updateActionState(activeInfo.tabId, tab.url);
    } catch (error) {
      console.error(`Error in onActivated for tab ${activeInfo.tabId}:`, error);
    }
  });

  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.url) {
      const previousUrl = tabVideoUrlMap.get(tabId);
      if (previousUrl && previousUrl !== changeInfo.url) {
        await clearVideoCache(previousUrl);
        tabVideoUrlMap.delete(tabId);
      }
      await updateActionState(tabId, changeInfo.url);
    }
    
    if (tab.url && YOUTUBE_VIDEO_PAGE_REGEX.test(tab.url)) {
      tabVideoUrlMap.set(tabId, tab.url);
    }
  });

  browser.tabs.onRemoved.addListener(async (tabId) => {
    const closedTabUrl = tabVideoUrlMap.get(tabId);
    if (closedTabUrl) {
      await clearVideoCache(closedTabUrl);
      tabVideoUrlMap.delete(tabId);
    }
  });
});