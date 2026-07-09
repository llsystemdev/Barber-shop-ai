/**
 * Utility to compress and resize images on the client side before uploading to prevent payload size errors.
 */
export const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions preserving aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw image into canvas with new dimensions
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with specified quality
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                console.log(`[ImageCompression] Compressed "${file.name}" from ${(file.size / 1024).toFixed(1)}KB to ${(compressedFile.size / 1024).toFixed(1)}KB`);
                resolve(compressedFile);
              } else {
                console.warn('[ImageCompression] Canvas toBlob failed, using original file');
                resolve(file);
              }
            },
            'image/jpeg',
            quality
          );
        } else {
          console.warn('[ImageCompression] Canvas context not available, using original file');
          resolve(file);
        }
      };
      img.onerror = () => {
        console.error('[ImageCompression] Failed to load image element');
        resolve(file);
      };
    };
    reader.onerror = () => {
      console.error('[ImageCompression] FileReader readAsDataURL failed');
      resolve(file);
    };
  });
};
