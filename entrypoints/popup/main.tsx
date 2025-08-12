import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { browser } from 'wxt/browser';
import { Layout } from '../../components/Layout';
import { VideoDownloader } from '../../components/VideoDownloader';
import type { ResolutionOption, UserRead } from '../../src/api/models';
import { AuthApi, VideoApi } from '../../src/api/services';
import { VideoDownloaderFormData } from '../../src/schemas/schema';
import { getToken, removeToken, saveToken } from '../../utils/auth';
import { getVideoDetailsFromCache, saveVideoDetailsToCache } from '../../utils/cache';
import { baseUrl, getApiConfig } from '../../utils/config';
import { saveBlobAsFile } from '../../utils/download';
import './style.css';

type AuthStatus = 'pending' | 'authenticated' | 'unauthenticated';

interface VideoDetailsCache {
  title: string;
  resolutions: ResolutionOption[];
  duration: string; // Add duration to the cache
}

const App = () => {
  const [user, setUser] = useState<UserRead | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('pending');
  
  // State for video details
  const [videoTitle, setVideoTitle] = useState('');
  const [resolutions, setResolutions] = useState<ResolutionOption[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState('00:00:00');

  // State for loading and downloading statuses
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [isDownloadingFull, setIsDownloadingFull] = useState(false);
  const [isDownloadingSample, setIsDownloadingSample] = useState(false);

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

    const cachedData = await getVideoDetailsFromCache(tab.url);
    if (cachedData) {
      setVideoTitle(cachedData.title);
      setResolutions(cachedData.resolutions);
      setVideoDuration(cachedData.duration);
      setVideoUrl(tab.url);
      setIsLoadingVideo(false);
      return;
    }

    try {
      setVideoUrl(tab.url);
      
      // Assume the content script now returns title and duration
      const [detailsResponse, formatsResponse] = await Promise.all([
        browser.tabs.sendMessage(tab.id, { type: 'GET_VIDEO_DETAILS' }),
        (async () => {
          const config = await getApiConfig(token);
          const videoApi = new VideoApi(config);
          return videoApi.getFormatsApiVideoFormatsPost({ url: tab.url! });
        })(),
      ]);

      const { title, duration } = detailsResponse; // Destructure duration
      const resolutionsData = formatsResponse.resolutions ?? [];

      setVideoTitle(title);
      setResolutions(resolutionsData);
      setVideoDuration(duration); // Set the new duration state

      await saveVideoDetailsToCache(tab.url, { title, resolutions: resolutionsData, duration });

    } catch (error) {
      console.error('Failed to fetch video details:', error);
    } finally {
      setIsLoadingVideo(false);
    }
  }, []);

  // useEffect to fetch details when user is authenticated (no changes here)
  useEffect(() => {
    const fetchDetailsForUser = async () => {
      if (user) {
        const token = await getToken();
        if (token) {
          await getVideoDetails(token);
        }
      }
    };
    fetchDetailsForUser();
  }, [user, getVideoDetails]);


  // --- DOWNLOAD HANDLERS ---

  /**
   * Handles downloading the full video.
   */
  const handleDownloadFull = async (data: { resolution: string }) => {
    if (isDownloadingFull) return;
    setIsDownloadingFull(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("User not authenticated.");

      const response = await fetch(`${baseUrl}/api/video/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: videoUrl,
          format_id: data.resolution,
        }),
      });

      if (!response.ok) throw new Error(await response.text());

      const videoBlob = await response.blob();
      const safeFilename = `${videoTitle.replace(/[^a-z0-9_.-]/gi, '_')}.mp4`;
      await saveBlobAsFile(videoBlob, safeFilename);

    } catch (error) {
      console.error('Full download error:', error);
    } finally {
      setIsDownloadingFull(false);
    }
  };

  /**
   * Handles downloading a sample (clipped) version of the video.
   */
  const handleDownloadSample = async (data: VideoDownloaderFormData) => {
    if (isDownloadingSample) return;
    setIsDownloadingSample(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("User not authenticated.");

      const response = await fetch(`${baseUrl}/api/video/download/sample`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: videoUrl,
          format_id: data.resolution,
          start_time: data.startTime,
          end_time: data.endTime,
        }),
      });

      if (!response.ok) throw new Error(await response.text());

      const videoBlob = await response.blob();
      const safeFilename = `${videoTitle.replace(/[^a-z0-9_.-]/gi, '_')}_sample.mp4`;
      await saveBlobAsFile(videoBlob, safeFilename);

    } catch (error) {
      console.error('Sample download error:', error);
    } finally {
      setIsDownloadingSample(false);
    }
  };


  // --- Auth functions and component rendering ---
  
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
              videoDuration={videoDuration} // Pass the new duration prop
              isDownloadingFull={isDownloadingFull}
              isDownloadingSample={isDownloadingSample}
              onDownloadFull={handleDownloadFull}
              onDownloadSample={handleDownloadSample}
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