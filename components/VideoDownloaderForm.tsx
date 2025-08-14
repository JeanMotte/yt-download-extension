import { Box, Button, CircularProgress, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { ResolutionOption } from '../src/api/models';
import { TimeInput } from './TimeInput';

interface VideoDownloaderFormProps {
  resolutions: ResolutionOption[];
  isDownloadingFull: boolean;
  isDownloadingSample: boolean;
  isShortUrl: boolean;
  isDownloadingAny: boolean;
  onDownloadFull: () => void;
  onDownloadSample: () => void;
}

export const VideoDownloaderForm: React.FC<VideoDownloaderFormProps> = ({
  resolutions,
  isDownloadingFull,
  isDownloadingSample,
  isShortUrl,
  isDownloadingAny,
  onDownloadFull,
  onDownloadSample,
}) => {
  const {
    control,
    formState: { errors, isValid },
  } = useFormContext();

  return (
    <form>
      <Box sx={{ display: 'grid', gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel id="resolution-label">Resolution</InputLabel>
          <Controller
            name="resolution"
            control={control}
            render={({ field }) => (
              <Select labelId="resolution-label" label="Resolution" {...field}>
                {resolutions.map((res) => (
                  <MenuItem key={res.formatId} value={res.formatId!}>
                    {res.resolution}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
        </FormControl>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TimeInput name="startTime" label="Start Time" />
          <TimeInput name="endTime" label="End Time" />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 1 }}>
            {isShortUrl && <Box width="50%">
              <Button
                onClick={onDownloadFull}
                disabled={isDownloadingFull || !isShortUrl || isDownloadingAny}
                sx={{ textTransform: 'none', width: '100%' }}
                startIcon={isDownloadingFull ? null : <i className="ti ti-download" />}
              variant="contained"
              >
              {isDownloadingFull ? <CircularProgress size={24} /> : 'Full Short'}
              </Button>
            </Box>}
          <Button
            onClick={onDownloadSample}
            sx={{ textTransform: 'none', width: isShortUrl ? '50%' : '100%', border: '1px solid' }}
            disabled={isDownloadingSample || !isValid || isDownloadingAny}
            startIcon={isDownloadingSample ? null : <i className="ti ti-download" />}
          >
            {isDownloadingSample ? <CircularProgress size={24} /> : isShortUrl ? 'Sample' : 'Download Sample'}
          </Button>
        </Box>
      </Box>
    </form>
  );
};