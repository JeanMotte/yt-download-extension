import { Box, Button, CircularProgress } from '@mui/material';
import React from 'react';
import { useForm } from 'react-hook-form';
import type { ResolutionOption } from '../src/api/models';

interface VideoDownloaderProps {
  videoTitle: string;
  resolutions: ResolutionOption[];
  isDownloadingFull: boolean;
  isDownloadingSample: boolean;
  onSubmit: (data: { resolution: string }) => void;
}

export const VideoDownloader: React.FC<VideoDownloaderProps> = ({
  videoTitle,
  resolutions,
  isDownloadingFull,
  isDownloadingSample,
  onSubmit,
}) => {
  const { register, handleSubmit } = useForm<{ resolution: string }>();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Video Title:</label>
        <p>{videoTitle}</p>
      </div>
      <div>
        <label htmlFor="resolution">Resolution</label>
        <select id="resolution" {...register('resolution')}>
          {resolutions.map((res) => (
            <option key={res.formatId} value={res.formatId!}>
              {res.resolution}
            </option>
          ))}
        </select>
      </div>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 2 }}>

      <Button type="submit" disabled={isDownloadingFull} sx={{ textTransform: 'none' }}
      startIcon={isDownloadingFull ? undefined : <i className="ti ti-download" />}>
        {isDownloadingFull ? <CircularProgress size={24} /> : 'Download Full'}
      </Button>
      <Button sx={{ textTransform: 'none'}} disabled={isDownloadingSample}
      startIcon={isDownloadingSample ? undefined : <i className="ti ti-download" />}>
        {isDownloadingSample ? <CircularProgress size={24} /> : 'Download Sample'}
      </Button>
      </Box>
    </form>
  );
};