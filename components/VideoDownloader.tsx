import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import type { ResolutionOption } from '../src/api/models';
import { VideoDownloaderFormData, videoDownloaderSchema } from '../src/schemas/schema';
import { VideoDownloaderForm } from './VideoDownloaderForm';

interface VideoDownloaderProps {
  videoTitle: string;
  resolutions: ResolutionOption[];
  videoDuration: string;
  isDownloadingFull: boolean;
  isDownloadingSample: boolean;
  onDownloadFull: (data: { resolution: string }) => void;
  onDownloadSample: (data: { resolution: string }) => void;
}

export const VideoDownloader: React.FC<VideoDownloaderProps> = ({
  videoTitle,
  resolutions,
  videoDuration,
  isDownloadingFull,
  isDownloadingSample,
  onDownloadFull,
  onDownloadSample,
}) => {
  const methods = useForm<VideoDownloaderFormData>({
    resolver: zodResolver(videoDownloaderSchema),
    mode: 'onChange',
    defaultValues: {
      resolution: resolutions[0]?.formatId || '',
      startTime: '00:00:00',
      endTime: '00:00:05',
    },
  });

  const handleDownloadFull = (data: VideoDownloaderFormData) => {
    onDownloadFull({ resolution: data.resolution });
  };

  const handleDownloadSample = (data: VideoDownloaderFormData) => {
    onDownloadSample({ resolution: data.resolution });
  }

  return (
    <FormProvider {...methods}>
      <Box sx={{ p: 2 }}>
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Resolution</TableCell>
                <TableCell>Duration</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resolutions.map((res) => (
                <TableRow key={res.formatId}>
                  <TableCell>{videoTitle}</TableCell>
                  <TableCell>{res.resolution}</TableCell>
                  <TableCell>{videoDuration}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <VideoDownloaderForm
          isDownloadingFull={isDownloadingFull}
          isDownloadingSample={isDownloadingSample}
          onDownloadFull={methods.handleSubmit(handleDownloadFull)}
          onDownloadSample={methods.handleSubmit(onDownloadSample)}
          resolutions={resolutions}
        />
      </Box>
    </FormProvider>
  );
};