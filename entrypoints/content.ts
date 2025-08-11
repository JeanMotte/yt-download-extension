/// <reference types="wxt/client" />

import { browser } from 'wxt/browser';

export default defineContentScript({
  matches: ['*://*.youtube.com/watch?v=*'], // More specific match pattern
  
  main() {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'GET_VIDEO_DETAILS') {
        const titleElement = document.querySelector('h1.ytd-watch-metadata');
        const title = titleElement ? titleElement.textContent?.trim() : 'Video Title Not Found';
        sendResponse({ title });

        // Must return `true` to keep the message channel open until `sendResponse` is called.
        return true; 
      }
    });
  },
});