/// <reference types="wxt/client" />

import { browser } from 'wxt/browser';

export default defineContentScript({
  matches: ['*://*.youtube.com/watch?v=*'], // More specific match pattern
  
  main() {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'GET_VIDEO_DETAILS') {
        const titleElement = document.querySelector('h1.ytd-watch-metadata');
        const title = titleElement ? titleElement.textContent?.trim() : 'Video Title Not Found';
        const duration = document.querySelector('span.ytp-time-duration')?.textContent?.trim() || '00:00:00';

        console.log(`Video Title: ${title}`);
        console.log(`Video Duration: ${duration}`);

        // Send the title and duration back to the popup script
        sendResponse({ title, duration });
        
        // Must return `true` to keep the message channel open until `sendResponse` is called.
        return true; 
      }
    });
  },
});