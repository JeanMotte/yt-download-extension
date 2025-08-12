import z from "zod";
import { durationRegex, timeToSeconds } from "../../utils/download";

export const videoDownloaderSchema = z
  .object({
    resolution: z.string().nonempty('Resolution is required.'),
    startTime: z.string().regex(durationRegex, 'Invalid time format. Use xx:xx:xx'),
    endTime: z.string().regex(durationRegex, 'Invalid time format. Use xx:xx:xx'),
  })
  .refine(
    (data) => {
      const startTimeInSeconds = timeToSeconds(data.startTime);
      const endTimeInSeconds = timeToSeconds(data.endTime);
      return endTimeInSeconds > startTimeInSeconds;
    },
    {
      message: 'End time must be greater than start time.',
      path: ['endTime'], // where to show the error
    }
  );

export type VideoDownloaderFormData = z.infer<typeof videoDownloaderSchema>;