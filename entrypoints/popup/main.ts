import { browser } from 'wxt/browser';
import { getApiConfig } from '../../src/api/config';
import { AuthApi } from '../../src/api/services';
import { getToken, saveToken } from '../../utils/auth';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;

const loginView = `
  <h1>YouLoad</h1>
  <button id="login">Login with Google</button>
`;

const mainView = (user: string) => `
  <h1>Hello ${user}</h1>
  <button id="logout">Logout</button>
`;

const render = (view: string) => {
  app.innerHTML = view;
};

// This function will handle the entire login flow
const handleLogin = async () => {
  try {
    console.log('Requesting Google Auth Token from browser...');
    // 1. Get Google OAuth token from the browser
    const googleAuth = await browser.identity.getAuthToken({ interactive: true });

    if (!googleAuth || !googleAuth.token) {
      console.error('Could not get Google auth token.');
      render(loginView);
      addLoginListener(); // Re-add listener
      return;
    }

    console.log('Google token received. Sending to backend...');
    // 2. Send the Google token to our backend to get our app JWT
    // NOTE: We create a temporary AuthApi instance without a token for this call
    const tempConfig = await getApiConfig();
    const authApi = new AuthApi(tempConfig);
    
    const response = await authApi.loginGoogleTokenApiAuthLoginGoogleTokenPost({
      token: googleAuth.token
    });

    console.log('App JWT received from backend.');
    // 3. Save our application's JWT to storage
    await saveToken(response.accessToken);

    // 4. Now that the token is saved, we can fetch the user's data
    await showMainView();

  } catch (error) {
    console.error('Login failed:', error);
    render(loginView);
    addLoginListener();
  }
};

const addLoginListener = () => {
  document.getElementById('login')?.addEventListener('click', handleLogin);
};

const showMainView = async () => {
    // Re-create the config, which will now pick up the stored token
    const config = await getApiConfig();
    if (!config.accessToken) {
      render(loginView);
      addLoginListener();
      return;
    }
    const authApi = new AuthApi(config);
    try {
        const user = await authApi.meApiAuthMeGet();
        render(mainView(user.email));
        // Add logout listener if needed
    } catch (e) {
        console.error("Failed to get user, token might be expired.", e)
        render(loginView);
        addLoginListener();
    }
};


const main = async () => {
  const token = await getToken();
  if (token) {
    // If a token exists, try to show the main view
    await showMainView();
  } else {
    // Otherwise, show the login view
    render(loginView);
    addLoginListener();
  }
};

main();