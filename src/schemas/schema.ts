import z from "zod";
import { durationRegex, timeToSeconds } from "../../utils/download";

export const createVideoDownloaderSchema = (videoDuration: string) => {
  // Convert the total video duration to seconds just once.
  const totalDurationInSeconds = timeToSeconds(videoDuration);

  return z
    .object({
      resolution: z.string().nonempty('Resolution is required.'),
      startTime: z.string().regex(durationRegex, 'Use hh:mm:ss format'),
      endTime: z.string().regex(durationRegex, 'Use hh:mm:ss format'),
    })
    .refine(
      (data) => {
        const startTimeInSeconds = timeToSeconds(data.startTime);
        const endTimeInSeconds = timeToSeconds(data.endTime);
        return endTimeInSeconds > startTimeInSeconds;
      },
      {
        message: 'End must be > start',
        path: ['endTime'],
      }
    )
    .refine(
      (data) => {
        const startTimeInSeconds = timeToSeconds(data.startTime);
        const endTimeInSeconds = timeToSeconds(data.endTime);
        return endTimeInSeconds - startTimeInSeconds <= 180;
      },
      {
        message: 'Must be ≤ 3 min',
        path: ['endTime'],
      }
    )
    .superRefine((data, ctx) => {
      const startTimeInSeconds = timeToSeconds(data.startTime);
      const endTimeInSeconds = timeToSeconds(data.endTime);

      if (startTimeInSeconds > totalDurationInSeconds) {
        ctx.addIssue({
          code: 'custom',
          message: `Must be ≤ ${videoDuration}`,
          path: ['startTime'], // Show error on the start time field
        });
      }

      if (endTimeInSeconds > totalDurationInSeconds) {
        ctx.addIssue({
          code: 'custom',
          message: `Must be ≤ ${videoDuration}`,
          path: ['endTime'], // Show error on the end time field
        });
      }
    });
};

export type VideoDownloaderFormData = z.infer<
  ReturnType<typeof createVideoDownloaderSchema>
>;