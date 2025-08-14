/// <reference types="wxt/client" />

import { browser } from 'wxt/browser';

// 1. Create a MatchPattern instance for the specific pages we care about.
// This is a utility provided by WXT for this exact use case.
const videoWatchPattern = new MatchPattern('*://*.youtube.com/watch?v=*');

// We need a variable to ensure we don't attach multiple listeners
// if the user navigates back and forth between videos.
let isListenerActive = false;

/**
 * This function contains the actual logic we want to run on the video page.
 * We've moved it into a separate function to keep the main entrypoint clean.
 */
function runVideoListenerLogic() {
  // If we've already set up the listener, don't do it again.
  if (isListenerActive) return;

  console.log('[YouLoad] URL is a video page. Running listener logic...');

  const videoElement = document.querySelector<HTMLVideoElement>('video.html5-main-video');

  if (videoElement) {
    let lastSentTime = -1;
    console.log('[YouLoad] Video element found. Attaching timeupdate listener.');

    const timeUpdateHandler = () => {
      const currentTime = videoElement.currentTime;
      const roundedTime = Math.floor(currentTime);

      if (roundedTime !== lastSentTime) {
        lastSentTime = roundedTime;
        browser.runtime.sendMessage({
          type: 'VIDEO_TIME_UPDATE',
          payload: {
            time: new Date(currentTime * 1000).toISOString().substr(11, 8),
          },
        }).catch(() => {});
      }
    };
    
    videoElement.addEventListener('timeupdate', timeUpdateHandler);
    isListenerActive = true;
    console.log('[YouLoad] Listener attached.');
  } else {
    // Sometimes the script can run before the video element is on the page.
    // A more robust solution could use a MutationObserver, but for now,
    // a simple retry is often effective.
    setTimeout(runVideoListenerLogic, 500);
  }
}

export default defineContentScript({
  // 2. We now match ALL YouTube pages so our script is always present.
  matches: ['*://*.youtube.com/*'],
  
  main(ctx) {
    console.log('[YouLoad] Content script loaded on youtube.com');

    // 3. Listen for WXT's custom location change event.
    // This fires every time the user navigates within the SPA.
    ctx.addEventListener(window, 'wxt:locationchange', (event) => {
      console.log('[YouLoad] Navigation detected. New URL:', event.detail.newUrl);

      // Check if the new URL is a video watch page.
      if (videoWatchPattern.includes(event.detail.newUrl)) {
        // If it is, run our logic.
        runVideoListenerLogic();
      } else {
        // If we navigate away from a video page, reset our flag.
        isListenerActive = false;
        console.log('[YouLoad] Navigated away from video page. Listener deactivated.');
      }
    });

    // 4. IMPORTANT: We must also check the initial URL when the script first loads.
    // This handles the case where the user lands directly on a video page.
    if (videoWatchPattern.includes(location.href)) {
      runVideoListenerLogic();
    }
  },
});