// @ts-ignore
import heic2any from 'heic2any';

/**
 * Checks if a file is a HEIC or HEIF image.
 */
export const isHeicFile = (file: File): boolean => {
  if (!file) return false;
  
  const mimeType = file.type ? file.type.toLowerCase() : '';
  const fileName = file.name ? file.name.toLowerCase() : '';
  
  return (
    mimeType === 'image/heic' ||
    mimeType === 'image/heif' ||
    fileName.endsWith('.heic') ||
    fileName.endsWith('.heif')
  );
};

/**
 * Automatically converts a HEIC/HEIF file to JPEG in the browser.
 * If conversion fails, logs the error and returns the original file to avoid breaking the flow.
 */
export const convertHeicToJpeg = async (
  file: File,
  onProgress?: (msg: string) => void
): Promise<File> => {
  if (!isHeicFile(file)) {
    return file;
  }

  try {
    if (onProgress) {
      onProgress('Convirtiendo fotografía...');
    }
    console.log(`[HEIC Converter] Starting conversion for "${file.name}"...`);

    // Dynamic import fallback or direct use
    let converter = heic2any;
    if (typeof converter !== 'function' && (converter as any).default) {
      converter = (converter as any).default;
    }

    const conversionResult = await converter({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9, // high quality
    });

    let resultBlob: Blob;
    if (Array.isArray(conversionResult)) {
      resultBlob = conversionResult[0];
    } else {
      resultBlob = conversionResult;
    }

    // Generate new filename with .jpeg extension
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const newFileName = `${baseName}.jpeg`;

    const convertedFile = new File([resultBlob], newFileName, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });

    console.log(
      `[HEIC Converter] Successfully converted "${file.name}" to "${newFileName}". Size change: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(convertedFile.size / 1024 / 1024).toFixed(2)}MB`
    );

    return convertedFile;
  } catch (error) {
    console.error('[HEIC Converter] Error during HEIC/HEIF conversion:', error);
    // Return original file as fallback
    return file;
  }
};
