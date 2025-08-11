import { browser } from 'wxt/browser';

browser.runtime.onMessage.addListener((message) => {
  if (message.type === 'GET_VIDEO_DETAILS') {
    const titleElement = document.querySelector('yt-formatted-string.style-scope.ytd-watch-metadata');
    const title = titleElement ? titleElement.textContent : '';
    return Promise.resolve({ title });
  }
});

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  main() {
    // The listener is already set up above
  },
});
