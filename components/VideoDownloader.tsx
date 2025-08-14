import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import type { ResolutionOption } from '../src/api/models';
import { createVideoDownloaderSchema, type VideoDownloaderFormData } from '../src/schemas/schema';
import { VideoDownloaderForm } from './VideoDownloaderForm';

interface VideoDownloaderProps {
  videoTitle: string;
  resolutions: ResolutionOption[];
  videoDuration: string;
  isDownloadingFull: boolean;
  isDownloadingSample: boolean;
  isShortUrl: boolean;
  isDownloadingAny: boolean;
  onDownloadFull: (data: { resolution: string }) => void;
  onDownloadSample: (data: { resolution: string }) => void;
}

export const VideoDownloader: React.FC<VideoDownloaderProps> = ({
  videoTitle,
  resolutions,
  videoDuration,
  isDownloadingFull,
  isDownloadingSample,
  isShortUrl,
  isDownloadingAny,
  onDownloadFull,
  onDownloadSample,
}) => {
  const methods = useForm<VideoDownloaderFormData>({
    resolver: zodResolver(createVideoDownloaderSchema(videoDuration)),
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
      <Box sx={{ padding: 2, paddingTop: 1 }}>
        <TableContainer sx={{ mb: 3 }}>
          <Table sx={{tableLayout: 'fixed'}}>
            <TableHead >
              <TableRow >
                <TableCell sx={{paddingBlock: 1, width: '60%'}}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Title
                  </Typography>
                </TableCell>
                <TableCell sx={{paddingBlock:1}}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                    Duration
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <Tooltip title={videoTitle} placement="top">
                  <TableCell sx={{ paddingBlock: 1 }}>
                    <Typography variant="body2" noWrap>
                      {videoTitle}
                    </Typography>
                  </TableCell>
                </Tooltip>
                <TableCell sx={{ paddingBlock: 1 }}>
                  <Typography variant="body2" noWrap>
                    {videoDuration}
                </Typography></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <VideoDownloaderForm
          isDownloadingFull={isDownloadingFull}
          isDownloadingSample={isDownloadingSample}
          onDownloadFull={methods.handleSubmit(handleDownloadFull)}
          onDownloadSample={methods.handleSubmit(onDownloadSample)}
          resolutions={resolutions}
          isShortUrl={isShortUrl}
          isDownloadingAny={isDownloadingAny}
        />
      </Box>
    </FormProvider>
  );
};