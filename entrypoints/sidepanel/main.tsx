import { Box, Button, CircularProgress, Typography } from '@mui/material';
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
import { YOUTUBE_SHORTS_REGEX, YOUTUBE_VIDEO_PAGE_REGEX } from '../background';
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
  const [isShortUrl, setIsShortUrl] = useState(false);
  const [isValidPage, setIsValidPage] = useState(true);

  // State for loading and downloading statuses
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [isDownloadingFull, setIsDownloadingFull] = useState(false);
  const [isDownloadingSample, setIsDownloadingSample] = useState(false);
  const [isDownloadingAny, setIsDownloadingAny] = useState(false);

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
    if (videoUrl) {
      setIsShortUrl(YOUTUBE_SHORTS_REGEX.test(videoUrl));
    }
  }, [videoUrl]);

  const getVideoDetails = useCallback(async (url: string, token: string) => {
    setIsLoadingVideo(true);
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    if (!tab?.url || !tab.id) {
      setIsLoadingVideo(false);
      return;
    }

    // Determine if its a short or not to display download button accordingly

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
      
      // SINGLE API CALL: Get title, duration, and resolutions from your backend.
      const config = await getApiConfig(token);
      const videoApi = new VideoApi(config);
      const formatsResponse = await videoApi.getFormatsApiVideoFormatsPost({ url: tab.url });

      // 3. Destructure all data from the single response
      const { title, duration, resolutions } = formatsResponse;
      const resolutionsData = resolutions ?? [];

      // 4. Set state from the API response
      setVideoTitle(title);
      setResolutions(resolutionsData);
      setVideoDuration(duration);

      // 5. Save complete data to cache
      await saveVideoDetailsToCache(tab.url, { title, duration, resolutions: resolutionsData });

    } catch (error) {
      console.error('Failed to fetch video details from API:', error);
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

  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) return;

    const tokenPromise = getToken();

    const handleTabUpdate = async (tab: browser.Tabs.Tab | undefined) => {
        if (!tab?.url || !YOUTUBE_VIDEO_PAGE_REGEX.test(tab.url)) {
            setIsValidPage(false);
            setIsLoadingVideo(false);
            return;
        }

        // Avoid refetching if the URL hasn't changed
        if (tab.url === videoUrl) return;

        const token = await tokenPromise;
        if (token && tab.url) {
            getVideoDetails(tab.url, token);
        }
    };
    
    // Initial load for the active tab when component mounts/user authenticates
    browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => handleTabUpdate(tab));

    // Listener for when user switches to a different tab
    const onTabActivated = (activeInfo: browser.Tabs.OnActivatedActiveInfoType) => {
        browser.tabs.get(activeInfo.tabId).then(handleTabUpdate);
    };

    // Listener for when a tab's URL changes
    const onTabUpdated = (tabId: number, changeInfo: browser.Tabs.OnUpdatedChangeInfoType, tab: browser.Tabs.Tab) => {
        if (tab.active && changeInfo.url) {
            handleTabUpdate(tab);
        }
    };

    browser.tabs.onActivated.addListener(onTabActivated);
    browser.tabs.onUpdated.addListener(onTabUpdated);

    // Cleanup listeners when the component unmounts
    return () => {
        browser.tabs.onActivated.removeListener(onTabActivated);
        browser.tabs.onUpdated.removeListener(onTabUpdated);
    };
  }, [authStatus, user, getVideoDetails, videoUrl]);


  /**
   * Handles downloading the full video.
   */
  const handleDownloadFull = async (data: { resolution: string }) => {
    if (isDownloadingFull) return;
    setIsDownloadingFull(true);
    setIsDownloadingAny(true);
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
      setIsDownloadingAny(false);
    }
  };

  /**
   * Handles downloading a sample (clipped) version of the video.
   */
  const handleDownloadSample = async (data: VideoDownloaderFormData) => {
    if (isDownloadingSample) return;
    setIsDownloadingSample(true);
    setIsDownloadingAny(true);
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
      setIsDownloadingAny(false);
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
    return (
      <Box>
        <CircularProgress style={{ display: 'block', margin: 'auto', marginTop: '50px' }} />
        <Typography variant="body2" color="text.secondary" align="center" sx={{ marginTop: 2 }}>
          Logging...
        </Typography>
      </Box>
    );
  }

  return (
    <div>
      {authStatus === 'authenticated' && user ? (
        <Layout onLogout={handleLogout}>
          {isLoadingVideo ? (
            <Box>
              <CircularProgress style={{ display: 'block', margin: 'auto', marginTop: '50px' }} />
              <Typography variant="body2" color="text.secondary" align="center" sx={{ marginTop: 2 }}>
                Loading video details...
              </Typography>
            </Box>

          ) : (
            <VideoDownloader
              videoTitle={videoTitle}
              resolutions={resolutions}
              videoDuration={videoDuration} // Pass the new duration prop
              isDownloadingFull={isDownloadingFull}
              isDownloadingSample={isDownloadingSample}
              isDownloadingAny={isDownloadingAny}
              isShortUrl={isShortUrl}
              onDownloadFull={handleDownloadFull}
              onDownloadSample={handleDownloadSample}
            />
          )}
        </Layout>
      ) : (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          marginTop: '50px'
        }}>
          <div style={{ marginBottom: '4px' }}>
            <img src="/youload-logo.svg" alt="YouLoad logo" style={{ height: '100px' }} />
            <h1 style={{ fontSize: "1.5rem", fontStyle: 'italic', marginTop: 0, marginBottom: 8 }}>YouLoad</h1>
          </div>
          <div>
            <Button onClick={handleLogin} variant="outlined" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50px', textTransform: 'none' }}>
              <img src="/google-logo.svg" alt="Google logo" style={{ marginRight: '10px', height: '20px' }} />
              Login With Google
            </Button>
          </div>
        </Box>
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