/**
 * 이미지 받아들이기 (docs/frame-maker.md 3.3)
 * - jpg, png, webp, gif만. 30MB 초과는 거절
 * - GIF와 움직이는 WebP는 그대로
 * - 그 외는 긴 변이 2560px을 넘으면 2560px로 줄여 다시 저장 (투명도 있으면 PNG, 없으면 WebP 0.92, WebP 미지원이면 JPEG 0.92)
 * 모든 처리는 브라우저 안에서 (서버로 보내지 않는다)
 */

export const MAX_BYTES = 30 * 1024 * 1024;
export const MAX_SIDE = 2560;
export const QUALITY = 0.92;

export const TOO_LARGE_MESSAGE = '30MB 이하의 이미지를 올려주세요.';
export const BAD_TYPE_MESSAGE = 'jpg, png, webp, gif 이미지만 올릴 수 있습니다.';
export const DECODE_FAILED_MESSAGE = '이미지를 읽지 못했습니다. 다른 파일을 골라주세요.';

/** 파일 선택 창에서 고를 수 있는 형식 */
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif';

export type ImageKind = 'jpeg' | 'png' | 'webp' | 'gif';

/** 사용자에게 그대로 보여줄 문구를 담은 오류 */
export class IntakeError extends Error {}

export interface IntakeResult {
    blob: Blob;
    /** 저장된 이미지 기준 */
    naturalWidth: number;
    naturalHeight: number;
}

const BY_MIME: Record<string, ImageKind> = { 'image/jpeg': 'jpeg', 'image/jpg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
const BY_EXT: Record<string, ImageKind> = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', webp: 'webp', gif: 'gif' };

/** 형식·크기 검사. 형식은 MIME, 없으면 확장자로 */
export function checkFile(file: Pick<File, 'name' | 'type' | 'size'>): ImageKind {
    const kind = BY_MIME[file.type.toLowerCase()] ?? (file.type ? undefined : BY_EXT[file.name.split('.').pop()?.toLowerCase() ?? '']);
    if (!kind) {
        throw new IntakeError(BAD_TYPE_MESSAGE);
    }
    if (file.size > MAX_BYTES) {
        throw new IntakeError(TOO_LARGE_MESSAGE);
    }

    return kind;
}

/** WebP 머리(앞 21바이트 이상)에서 VP8X 청크의 애니메이션 표시를 본다 */
export function isAnimatedWebp(bytes: Uint8Array): boolean {
    const text = (start: number, length: number) => String.fromCharCode(...bytes.subarray(start, start + length));
    if (bytes.length < 21 || text(0, 4) !== 'RIFF' || text(8, 4) !== 'WEBP' || text(12, 4) !== 'VP8X') {
        return false;
    }

    return (bytes[20]! & 0x02) !== 0;
}

/** 긴 변이 MAX_SIDE를 넘으면 비율을 지켜 줄인 크기, 아니면 null */
export function scaledSize(width: number, height: number, maxSide = MAX_SIDE): { width: number; height: number } | null {
    const longest = Math.max(width, height);
    if (longest <= maxSide) {
        return null;
    }
    const scale = maxSide / longest;

    return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** RGBA 픽셀 중 하나라도 불투명하지 않으면 true */
export function hasAlpha(data: Uint8ClampedArray): boolean {
    for (let i = 3; i < data.length; i += 4) {
        if (data[i]! < 255) {
            return true;
        }
    }

    return false;
}

function loadImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new IntakeError(DECODE_FAILED_MESSAGE));
        };
        img.src = url;
    });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** 줄여서 다시 저장 (3.3) */
async function downscale(img: HTMLImageElement, kind: ImageKind, size: { width: number; height: number }): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
        throw new IntakeError(DECODE_FAILED_MESSAGE);
    }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, size.width, size.height);

    // JPEG는 투명도가 없다
    const transparent = kind !== 'jpeg' && hasAlpha(ctx.getImageData(0, 0, size.width, size.height).data);
    if (transparent) {
        const png = await canvasToBlob(canvas, 'image/png');
        if (png) {
            return png;
        }
    } else {
        // WebP를 지원하지 않는 브라우저는 PNG를 돌려준다 → JPEG로
        const webp = await canvasToBlob(canvas, 'image/webp', QUALITY);
        if (webp && webp.type === 'image/webp') {
            return webp;
        }
        const jpeg = await canvasToBlob(canvas, 'image/jpeg', QUALITY);
        if (jpeg) {
            return jpeg;
        }
    }
    throw new IntakeError(DECODE_FAILED_MESSAGE);
}

/** 고른 파일을 저장할 이미지로. 거절·실패는 IntakeError (message를 알림창에 그대로) */
export async function intakeImage(file: File): Promise<IntakeResult> {
    const kind = checkFile(file);
    const img = await loadImage(file);
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    if (!width || !height) {
        throw new IntakeError(DECODE_FAILED_MESSAGE);
    }

    const animated = kind === 'gif' || (kind === 'webp' && isAnimatedWebp(new Uint8Array(await file.slice(0, 32).arrayBuffer())));
    const size = animated ? null : scaledSize(width, height);
    if (!size) {
        return { blob: file, naturalWidth: width, naturalHeight: height };
    }

    return { blob: await downscale(img, kind, size), naturalWidth: size.width, naturalHeight: size.height };
}
