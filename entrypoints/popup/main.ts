import { browser } from 'wxt/browser';
import type { UserRead } from '../../src/api/models';
import { AuthApi } from '../../src/api/services';
import { getToken, removeToken, saveToken } from '../../utils/auth';
import { getApiConfig } from '../../utils/config';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;

const loginView = `
  <h1>YouLoad</h1>
  <p>Please log in to continue.</p>
  <button id="login">Login with Google</button>
`;

const mainView = (user: UserRead) => `
  <h1>Hello ${user.firstName} ${user.lastName}</h1>
  <button id="logout">Logout</button>
`;

const render = (view: string) => {
  app.innerHTML = view;
};

// --- Event Listeners ---
const addLoginListener = () => {
  document.getElementById('login')?.addEventListener('click', handleLogin);
};

const addLogoutListener = async () => {
  document.getElementById('logout')?.addEventListener('click', async () => {
    await removeToken();
    render(loginView);
    addLoginListener();
  });
};


/**
 * Handles the entire login flow, from getting the Google token
 * to fetching the user and rendering the main view.
 */
const handleLogin = async () => {
  try {
    const googleAuth = await browser.identity.getAuthToken({ interactive: true });

    if (!googleAuth?.token) {
      throw new Error('Could not get Google auth token.');
    }

    // 1. Use an unauthenticated client to exchange the Google token for our app JWT
    const unauthConfig = await getApiConfig(); // This will have no token
    const authApiUnauth = new AuthApi(unauthConfig);
    const response = await authApiUnauth.loginGoogleTokenApiAuthLoginGoogleTokenPost({
      token: googleAuth.token,
    });

    const appJwt = response.accessToken;
    if (!appJwt) {
      throw new Error("Login response did not contain an access_token.");
    }
    console.log('[handleLogin] Received application JWT.');

    // 2. Save the token for the next time the popup is opened.
    // We can do this now and not wait for it to finish.
    await saveToken(appJwt);

    // 3. Use the JWT we just received in memory to fetch the user.
    const user = await getMe(appJwt);
    
    // 4. Render the main view with the user data
    render(mainView(user));
    addLogoutListener();

  } catch (error) {
    await removeToken(); // Clean up any partial state
    render(loginView);
    addLoginListener();
  }
};

/**
 * Fetches the current user from the /me endpoint using a provided token.
 * Reusable helper function.
 */
const getMe = async (token: string): Promise<UserRead> => {
    const config = await getApiConfig(token);
    const authApi = new AuthApi(config);
    return await authApi.meApiAuthMeGet();
}

/**
 * The main entry point for the application. Checks for an existing session
 * or shows the login page.
 */
const initializeApp = async () => {
  const existingToken = await getToken();

  if (existingToken) {
    console.log('[main] Found existing token. Verifying with /me endpoint...');
    try {
      // Validate the token by fetching user data
      const user = await getMe(existingToken);
      render(mainView(user));
      addLogoutListener();
    } catch (error) {
      await removeToken();
      render(loginView);
      addLoginListener();
    }
  } else {
    render(loginView);
    addLoginListener();
  }
};

// Start the app
initializeApp();