/** Pixel coordinates and dimensions of the crop region. */
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Crop and resize an image to a square blob using an off-screen canvas. */
export async function cropImage(
  imageSrc: string,
  cropArea: CropArea,
  mimeType: string = 'image/jpeg',
  outputSize: number = 256
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  const size = Math.min(outputSize, cropArea.width, cropArea.height);

  canvas.width = size;
  canvas.height = size;

  ctx.drawImage(image, cropArea.x, cropArea.y, cropArea.width, cropArea.height, 0, 0, size, size);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob failed'));
        }
      },
      mimeType,
      0.9
    );
  });
}

/** Load an image element from a source URL with CORS enabled. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
