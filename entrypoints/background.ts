/// <reference types="wxt/client" />

const YOUTUBE_REGEX =
  /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)\/(watch\?v=|embed\/|v\/|.+\?v=)?([a-zA-Z0-9_-]{11})/;

const checkUrl = (url: string) => {
  if (url && YOUTUBE_REGEX.test(url)) {
    browser.action.enable();
  } else {
    browser.action.disable();
  }
};

export default defineBackground(() => {
  browser.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await browser.tabs.get(activeInfo.tabId);
    checkUrl(tab.url ?? '');
  });

  browser.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    checkUrl(tab.url ?? '');
  });
});
