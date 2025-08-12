import { Box, Button, CircularProgress, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { ResolutionOption } from '../src/api/models';

interface VideoDownloaderFormProps {
  resolutions: ResolutionOption[];
  isDownloadingFull: boolean;
  isDownloadingSample: boolean;
  onDownloadFull: () => void;
  onDownloadSample: () => void;
}

export const VideoDownloaderForm: React.FC<VideoDownloaderFormProps> = ({
  resolutions,
  isDownloadingFull,
  isDownloadingSample,
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
          <Controller
            name="startTime"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Start"
                error={!!errors.startTime}
                helperText={errors.startTime?.message as string}
                fullWidth
              />
            )}
          />
          <Controller
            name="endTime"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="End"
                error={!!errors.endTime}
                helperText={errors.endTime?.message as string}
                fullWidth
              />
            )}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 2 }}>
          <Button
            onClick={onDownloadFull}
            disabled={isDownloadingFull}
            sx={{ textTransform: 'none' }}
            startIcon={isDownloadingFull ? null : <i className="ti ti-download" />}
            variant="contained"
          >
            {isDownloadingFull ? <CircularProgress size={24} /> : 'Download Full'}
          </Button>
          <Button
            onClick={onDownloadSample}
            sx={{ textTransform: 'none' }}
            disabled={isDownloadingSample || !isValid} // Disable if downloading or form is invalid [1, 23]
            startIcon={isDownloadingSample ? null : <i className="ti ti-download" />}
            variant="outlined"
          >
            {isDownloadingSample ? <CircularProgress size={24} /> : 'Download Sample'}
          </Button>
        </Box>
      </Box>
    </form>
  );
};