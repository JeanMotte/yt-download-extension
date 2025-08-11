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

const App = () => {
  const [user, setUser] = useState<UserRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoTitle, setVideoTitle] = useState('');
  const [resolutions, setResolutions] = useState<ResolutionOption[]>([]);
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const existingToken = await getToken();
        if (existingToken) {
          const userData = await getMe(existingToken);
          setUser(userData);
          await getVideoDetails();
        }
      } catch (error) {
        await removeToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initializeApp();
  }, []);

  const getVideoDetails = async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.url && tab.id) {
      setVideoUrl(tab.url);
      const response = await browser.tabs.sendMessage(tab.id, { type: 'GET_VIDEO_DETAILS' });
      setVideoTitle(response.title);
      
      const config = await getApiConfig();
      const videoApi = new VideoApi(config);
      const formatsResponse = await videoApi.getFormatsApiVideoFormatsPost({ url: tab.url });
      setResolutions(formatsResponse.resolutions ?? []);
    }
  };

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

  const handleDownload = async (data: { resolution: string }) => {
    const config = await getApiConfig();
    const videoApi = new VideoApi(config);
    await videoApi.downloadFullVideoApiVideoDownloadPost({
      url: videoUrl,
      formatId: data.resolution,
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {user ? (
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
