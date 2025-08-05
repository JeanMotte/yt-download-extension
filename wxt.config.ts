import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: 'YouLoad',
    permissions: ['identity', 'tabs'],
    oauth2: {
      client_id: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_OAUTH_CLIENT_ID',
      scopes: ['openid', 'email', 'profile'],
    },
    browser_specific_settings: {
      gecko: {
        id: 'youload@wxt.dev',
      },
    },
  },
});
