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
    const config = await getApiConfig();
    
    if (!config.accessToken) {
      render(loginView);
      document.getElementById('login')?.addEventListener('click', async () => {
        const token = await browser.identity.getAuthToken({ interactive: true });
        if (token) {
          const authApi = new AuthApi(config);
          const user = await authApi.loginGoogleApiAuthLoginGoogleGet();
          render(mainView(user.email));
        }
      });
    } else {
      const authApi = new AuthApi(config);
      const user = await authApi.loginGoogleApiAuthLoginGoogleGet();
      render(mainView(user.email));
    }
  } catch (error) {
    render(loginView);
  }
};

main();
