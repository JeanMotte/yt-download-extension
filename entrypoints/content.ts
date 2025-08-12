/// <reference types="wxt/client" />

export default defineContentScript({
  matches: ['*://*.youtube.com/watch?v=*'],
  
  main() {
    console.log('YouLoad content script loaded.');
  },
});