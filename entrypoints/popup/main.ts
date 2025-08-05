/// <reference types="wxt/client" />

import { browser } from 'wxt/browser';
import { getApiConfig } from '../../src/api/config';
import { AuthApi } from '../../src/api/services';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;

const loginView = `
  <h1>YouLoad</h1>
  <button id="login">Login with Google</button>
`;

const mainView = (user: string) => `
  <h1>Hello ${user}</h1>
`;

const render = (view: string) => {
  app.innerHTML = view;
};

const main = async () => {
  try {
    const manifest = browser.runtime.getManifest();
    if (manifest.oauth2?.client_id?.startsWith('YOUR_GOOGLE_OAUTH_CLIENT_ID')) {
      render(
        '<h1>Configuration needed</h1><p>Please replace <code>YOUR_GOOGLE_OAUTH_CLIENT_ID</code> in <code>wxt.config.ts</code> with your actual Google OAuth2 client ID.</p>',
      );
      return;
    }
    const config = await getApiConfig();
    if (!config.accessToken) {
      render(loginView);
      document.getElementById('login')?.addEventListener('click', async () => {
        const token = await browser.identity.getAuthToken({ interactive: true });
        if (token) {
          const authApi = new AuthApi(await getApiConfig());
          const user = await authApi.meApiAuthMeGet();
          render(mainView(user.email));
        }
      });
    } else {
      const authApi = new AuthApi(config);
      const user = await authApi.meApiAuthMeGet();
      render(mainView(user.email));
    }
  } catch (error) {
    console.error(error);
    render(`<h1>Something went wrong: ${error.message}</h1>`);
  }
};

main();
