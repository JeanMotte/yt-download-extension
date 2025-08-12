import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { browser } from 'wxt/browser';
import { Layout } from '../../components/Layout';
import { VideoDownloader } from '../../components/VideoDownloader';
import type { ResolutionOption, UserRead } from '../../src/api/models';
import { AuthApi, VideoApi } from '../../src/api/services';
import { getToken, removeToken, saveToken } from '../../utils/auth';
import { getVideoDetailsFromCache, saveVideoDetailsToCache } from '../../utils/cache';
import { baseUrl, getApiConfig } from '../../utils/config';
import { saveBlobAsFile } from '../../utils/download';
import './style.css';

type AuthStatus = 'pending' | 'authenticated' | 'unauthenticated';

const App = () => {
  const [user, setUser] = useState<UserRead | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('pending');
  const [videoTitle, setVideoTitle] = useState('');
  const [resolutions, setResolutions] = useState<ResolutionOption[]>([]);
  const [videoUrl, setVideoUrl] = useState('');

  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

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

    const getVideoDetails = useCallback(async (token: string) => {
    setIsLoadingVideo(true);
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    if (!tab?.url || !tab.id) {
      setIsLoadingVideo(false);
      return;
    }

    // 1. Check the cache first
    const cachedData = await getVideoDetailsFromCache(tab.url);
    if (cachedData) {
      setVideoTitle(cachedData.title);
      setResolutions(cachedData.resolutions);
      setVideoUrl(cachedData.url);
      setIsLoadingVideo(false);
      return;
    }

    // 2. Fetch data if no cache
    try {
      setVideoUrl(tab.url);
      
      // Fetch title and formats in parallel to speed it up
      const [titleResponse, formatsResponse] = await Promise.all([
        browser.tabs.sendMessage(tab.id, { type: 'GET_VIDEO_DETAILS' }),
        (async () => {
          const config = await getApiConfig(token);
          const videoApi = new VideoApi(config);
          return videoApi.getFormatsApiVideoFormatsPost({ url: tab.url! });
        })(),
      ]);

      const title = titleResponse.title;
      const resolutionsData = formatsResponse.resolutions ?? [];

      setVideoTitle(title);
      setResolutions(resolutionsData);
      
      // 3. Save newly fetched data to cache
      await saveVideoDetailsToCache(tab.url, { title, resolutions: resolutionsData });

    } catch (error) {
      console.error('Failed to fetch video details:', error);
    } finally {
      setIsLoadingVideo(false);
    }
  }, []);

    useEffect(() => {
  // We fetch details only when we have a confirmed user object
  const fetchDetailsForUser = async () => {
    if (user) {
      // We need the token that authenticated this user.
      const token = await getToken(); // It's safe to get it here now.
      if (token) {
        await getVideoDetails(token);
      }
    }
  };
  fetchDetailsForUser();
}, [user, getVideoDetails]);

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
  if (isDownloading) return;

  setIsDownloading(true);
  try {
    const token = await getToken();
    if (!token) throw new Error("User not authenticated for download.");

    const downloadUrl = `${baseUrl}/api/video/download`;

    const requestBody = {
      url: videoUrl,
      format_id: data.resolution,
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(downloadUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Download failed with status ${response.status}: ${errorText}`);
    }

    const videoBlob = await response.blob();
    
    console.log(`Correctly created Blob with size: ${videoBlob.size}`);

    const safeFilename = videoTitle.replace(/[^a-z0-9_.-]/gi, '_').substring(0, 100) + '.mp4';
    
    await saveBlobAsFile(videoBlob, safeFilename);
    
    console.log('Download process completed successfully.');

  } catch (error) {
    console.error('An error occurred during download:', error);
    if (error instanceof Error) {
      alert(`Download failed: ${error.message}`);
    }
  } finally {
    setIsDownloading(false);
  }
};

  if (authStatus === 'pending') {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {authStatus === 'authenticated' && user ? (
        <Layout onLogout={handleLogout}>
          {isLoadingVideo ? (
            <div>Loading video details...</div>
          ) : (
            <VideoDownloader
              videoTitle={videoTitle}
              resolutions={resolutions}
              isDownloadingFull={isDownloading} // <-- Pass the state down
              onSubmit={handleDownload}
            />
          )}
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
