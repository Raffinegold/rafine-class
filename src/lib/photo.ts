/**
 * 작품 사진 1장을 브라우저에서 바로 줄여서 저장합니다.
 * - 가로 800px을 넘으면 비율을 유지한 채 800px로 줄입니다.
 * - JPEG 품질 0.72로 다시 그려 data URL(문자열)로 돌려줍니다.
 * - localStorage 용량을 아끼려고 원본(수 MB)은 저장하지 않습니다.
 */
export async function fileToCompressedPhoto(file: File, maxWidth = 800, quality = 0.72): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('사진 파일(JPG·PNG)만 올릴 수 있어요');
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('사진이 너무 커요. 15MB 이하 사진을 골라 주세요');
  }

  const source = await loadImageSource(file);
  const scale = Math.min(1, maxWidth / source.width);
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('이 브라우저에서는 사진을 줄일 수 없어요');
  // 투명 PNG를 JPEG로 바꿀 때 배경이 검게 나오지 않게 흰색을 깝니다
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source.image, 0, 0, width, height);
  source.release();
  return canvas.toDataURL('image/jpeg', quality);
}

interface ImageSource {
  image: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

async function loadImageSource(file: File): Promise<ImageSource> {
  // 대부분의 브라우저: 사진 회전 정보(EXIF)까지 반영해서 읽습니다
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { image: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      /* 아래 <img> 방식으로 다시 시도 */
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('사진을 열 수 없어요. 다른 사진으로 시도해 주세요'));
      el.src = url;
    });
    return { image: img, width: img.naturalWidth || img.width, height: img.naturalHeight || img.height, release: () => URL.revokeObjectURL(url) };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

/** 저장된 data URL의 대략적인 용량 (KB) — 화면 안내용 */
export function photoSizeKb(dataUrl: string | undefined | null): number {
  if (!dataUrl) return 0;
  const base64 = dataUrl.split(',')[1] ?? '';
  return Math.round((base64.length * 3) / 4 / 1024);
}
