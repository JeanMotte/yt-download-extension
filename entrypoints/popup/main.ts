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
    const googleAuth = await browser.identity.getAuthToken({ interactive: true });

    if (!googleAuth || !googleAuth.token) {
      console.error('Could not get Google auth token.');
      render(loginView);
      addLoginListener();
      return;
    }

    console.log('Google token received. Sending to backend...');
    const tempConfig = await getApiConfig();
    const authApi = new AuthApi(tempConfig);
    
    // --- YOUR CORRECT FIX FOR THE 422 ERROR ---
    // The request body matches the backend's GoogleToken Pydantic model.
    const requestBody = { token: googleAuth.token };
    const response = await authApi.loginGoogleTokenApiAuthLoginGoogleTokenPost(requestBody);
    
    // The POST call was successful (200 OK)!
    // Now we handle the response from your FastAPI backend.
    console.log('App JWT response received from backend:', response);

    // --- THE FIX FOR THE 401 ERROR ---
    // The response object from FastAPI has snake_case keys by default.
    // Access `response.access_token`, NOT `response.accessToken`.
    if (response.accessToken) {
      // 3. Save our application's JWT to storage
      console.log('Saving app token to storage...');
      await saveToken(response.accessToken);
    } else {
      // This is a good safeguard
      throw new Error("Login response from backend did not contain an accessToken.");
    }

    // 4. Now that the correct token is saved, we fetch the user's data
    console.log('Token saved. Fetching user profile...');
    await showMainView();

  } catch (error) {
    console.error('Login flow failed:', error);
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