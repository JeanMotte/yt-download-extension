import { browser } from 'wxt/browser';

/**
 * Takes a Blob and a suggested filename and uses the browser's downloads API
 * to save the file to the user's machine.
 */
export const saveBlobAsFile = async (blob: Blob, filename: string): Promise<void> => {
  // Create a short-lived, efficient pointer to the blob in memory.
  const url = URL.createObjectURL(blob);
  console.log(`Created blob URL: ${url} for blob of size ${blob.size}`);

  try {
    // Pass this temporary URL to the downloads API.
    await browser.downloads.download({
      url: url,
      filename: filename,
      saveAs: true, // This requests the "Save As" dialog.
    });
    console.log('browser.downloads.download call initiated successfully.');

  } catch (error) {
    console.error('Download failed:', error);
    // This error will now properly appear in the background script's console if there's an issue.
  } finally {
    URL.revokeObjectURL(url);
    console.log(`Revoked blob URL: ${url}`);
  }
};

/**
 * Handling download inputs
 */
export const durationRegex = /^\d{2}:\d{2}:\d{2}$/;

export const timeToSeconds = (time: string): number => {
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

export const secondsToTime = (totalSeconds: number): string => {
  const positiveSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(positiveSeconds / 3600);
  const minutes = Math.floor((positiveSeconds % 3600) / 60);
  const seconds = positiveSeconds % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};