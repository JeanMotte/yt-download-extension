import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: () => ({
    name: 'YouLoad: Video Downloader',
    description: 'Download YouTube Shorts and sample videos.',
    version: '1.0.0',
    icons: {
      '16': 'icon-16.png',
      '32': 'icon-32.png',
      '48': 'icon-48.png',
      '128': 'icon-128.png',
    },
    permissions: ['identity', 'tabs', 'storage', 'downloads', 'sidePanel', 'cookies'],
    oauth2: {
      client_id: import.meta.env.WXT_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_OAUTH_CLIENT_ID',
      scopes: ['openid', 'email', 'profile'],
    },
    browser_specific_settings: {
      gecko: {
        id: 'youload@wxt.dev',
      },
    },
    action: {
      default_title: 'YouLoad',
    },
    host_permissions: [
      "https://youload-service.onrender.com/*",
      "*://*.youtube.com/",
    ],
  }),
});
