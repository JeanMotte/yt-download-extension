import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: () => ({
    name: 'YouLoad',
    permissions: ['identity', 'tabs', 'storage', 'downloads', 'sidePanel'],
    oauth2: {
      client_id: import.meta.env.WXT_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_OAUTH_CLIENT_ID',
      scopes: ['openid', 'email', 'profile'],
    },
    browser_specific_settings: {
      gecko: {
        id: 'youload@wxt.dev',
      },
    },
    content_scripts: [
      {
        matches: ['*://*.youtube.com/watch?v=*'],
        js: ['content-scripts/content.js'],
      },
    ],
    action: {
      default_title: 'YouLoad',
    },
    host_permissions: [
      "http://localhost:8000/*",
    ]
  }),
  
});
