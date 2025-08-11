import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { browser } from 'wxt/browser';
import { Layout } from '../../components/Layout';
import { VideoDownloader } from '../../components/VideoDownloader';
import type { ResolutionOption, UserRead } from '../../src/api/models';
import { AuthApi, VideoApi } from '../../src/api/services';
import { getToken, removeToken, saveToken } from '../../utils/auth';
import { getApiConfig } from '../../utils/config';
import './style.css';

type AuthStatus = 'pending' | 'authenticated' | 'unauthenticated';

const App = () => {
  const [user, setUser] = useState<UserRead | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('pending');
  const [videoTitle, setVideoTitle] = useState('');
  const [resolutions, setResolutions] = useState<ResolutionOption[]>([]);
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    const initializeApp = async () => {
      const existingToken = await getToken();
      if (existingToken) {
        try {
          const userData = await getMe(existingToken);
          setUser(userData);
          setAuthStatus('authenticated');
        } catch (error) {
          await removeToken();
          setAuthStatus('unauthenticated');
        }
      } else {
        setAuthStatus('unauthenticated');
      }
    };
    initializeApp();
  }, []);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      getVideoDetails();
    }
  }, [authStatus]);

  const getVideoDetails = async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.url && tab.id) {
      console.log('Current tab URL:', tab.url);
      setVideoUrl(tab.url);
      const response = await browser.tabs.sendMessage(tab.id, { type: 'GET_VIDEO_DETAILS' });
      console.log('response from content script:', response);
      setVideoTitle(response.title);
      
      const config = await getApiConfig();
      const videoApi = new VideoApi(config);
      const formatsResponse = await videoApi.getFormatsApiVideoFormatsPost({ url: tab.url });
      setResolutions(formatsResponse.resolutions ?? []);
    }
  };

  const handleLogin = async () => {
    try {
      setAuthStatus('pending');
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
      setAuthStatus('authenticated');
    } catch (error) {
      await removeToken();
      setUser(null);
      setAuthStatus('unauthenticated');
    }
  };

  const handleLogout = async () => {
    await removeToken();
    setUser(null);
    setAuthStatus('unauthenticated');
  };

  const getMe = async (token: string): Promise<UserRead> => {
    const config = await getApiConfig(token);
    const authApi = new AuthApi(config);
    return await authApi.meApiAuthMeGet();
  };

  const handleDownload = async (data: { resolution: string }) => {
    const config = await getApiConfig();
    const videoApi = new VideoApi(config);
    await videoApi.downloadFullVideoApiVideoDownloadPost({
      url: videoUrl,
      formatId: data.resolution,
    });
  };

  if (authStatus === 'pending') {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {authStatus === 'authenticated' && user ? (
        <Layout onLogout={handleLogout}>
          <VideoDownloader
            videoTitle={videoTitle}
            resolutions={resolutions}
            onSubmit={handleDownload}
          />
        </Layout>
      ) : (
        <div>
          <h1>YouLoad</h1>
          <button onClick={handleLogin} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/google-logo.svg" alt="Google logo" style={{ marginRight: '10px', height: '20px' }} />
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
