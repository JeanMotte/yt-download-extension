import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: 'YouLoad',
    permissions: ['identity', 'tabs'],
    browser_specific_settings: {
      gecko: {
        id: 'youload@wxt.dev',
      },
    },
  },
});
