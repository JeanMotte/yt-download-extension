import React from 'react';
import { useForm } from 'react-hook-form';
import { ResolutionOption } from '../src/api/models';

interface VideoDownloaderProps {
  videoTitle: string;
  resolutions: ResolutionOption[];
  onSubmit: (data: { resolution: string }) => void;
}

export const VideoDownloader: React.FC<VideoDownloaderProps> = ({ videoTitle, resolutions, onSubmit }) => {
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
            <option key={res.formatId} value={res.formatId}>
              {res.resolution}
            </option>
          ))}
        </select>
      </div>
      <button type="submit">Download</button>
    </form>
  );
};
