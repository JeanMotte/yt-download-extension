import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { browser } from 'wxt/browser';
import type { UserRead } from '../../src/api/models';
import { AuthApi } from '../../src/api/services';
import { getToken, removeToken, saveToken } from '../../utils/auth';
import { getApiConfig } from '../../utils/config';
import './style.css';
import googleLogo from '/google-logo.svg';

const App = () => {
  const [user, setUser] = useState<UserRead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      const existingToken = await getToken();
      if (existingToken) {
        try {
          const userData = await getMe(existingToken);
          setUser(userData);
        } catch (error) {
          await removeToken();
        }
      }
      setLoading(false);
    };
    initializeApp();
  }, []);

  const handleLogin = async () => {
    try {
      const googleAuth = await browser.identity.getAuthToken({ interactive: true });
      if (!googleAuth?.token) {
        throw new Error('Could not get Google auth token.');
      }

      const unauthConfig = await getApiConfig();
      const authApiUnauth = new AuthApi(unauthConfig);
      const response = await authApiUnauth.loginGoogleTokenApiAuthLoginGoogleTokenPost({
        token: googleAuth.token,
      });

      const appJwt = response.accessToken;
      if (!appJwt) {
        throw new Error("Login response did not contain an access_token.");
      }

      await saveToken(appJwt);
      const userData = await getMe(appJwt);
      setUser(userData);
    } catch (error) {
      await removeToken();
      setUser(null);
    }
  };

  const handleLogout = async () => {
    await removeToken();
    setUser(null);
  };

  const getMe = async (token: string): Promise<UserRead> => {
    const config = await getApiConfig(token);
    const authApi = new AuthApi(config);
    return await authApi.meApiAuthMeGet();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {user ? (
        <div>
          <h1>Hello {user.firstName} {user.lastName}</h1>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <div>
          <h1>YouLoad</h1>
          <button onClick={handleLogin} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={googleLogo} alt="Google logo" style={{ marginRight: '10px', height: '20px' }} />
            Login with Google
          </button>
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('app')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
