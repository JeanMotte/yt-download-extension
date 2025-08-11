import { browser } from 'wxt/browser';

/**
 * Converts a Blob into a Base64-encoded data URL.
 */
const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader did not return a string.'));
      }
    };
    reader.onerror = () => {
      reject(new Error('FileReader error.'));
    };
    reader.readAsDataURL(blob);
  });
};

/**
 * Takes a Blob and a suggested filename and uses the browser's downloads API
 * to save the file to the user's machine.
 */
export const saveBlobAsFile = async (blob: Blob, filename: string): Promise<void> => {
  try {
    console.log('Converting blob to data URL...');
    // 1. Convert the blob to a data: URL.
    const dataUrl = await blobToDataUrl(blob);
    console.log('Data URL created, calling downloads API...');

    // 2. Use the data: URL with the downloads API.
    await browser.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: true,
    });
    console.log('browser.downloads.download call succeeded.');

  } catch (error) {
    console.error('Download failed:', error);
    // You could display a user-facing notification here.
  }
  // No need for URL.revokeObjectURL as we are not using it.
};