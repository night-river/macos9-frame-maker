import { describe, expect, it } from 'vitest';
import { BAD_TYPE_MESSAGE, MAX_BYTES, TOO_LARGE_MESSAGE, checkFile, hasAlpha, isAnimatedWebp, scaledSize } from './imageIntake';

const file = (name: string, type: string, size = 1000) => ({ name, type, size });

describe('checkFile (3.3)', () => {
    it('jpg, png, webp, gif만 받는다 (MIME, 없으면 확장자)', () => {
        expect(checkFile(file('a.jpg', 'image/jpeg'))).toBe('jpeg');
        expect(checkFile(file('a.PNG', ''))).toBe('png');
        expect(checkFile(file('a.gif', 'image/gif'))).toBe('gif');
        expect(() => checkFile(file('a.bmp', 'image/bmp'))).toThrow(BAD_TYPE_MESSAGE);
        expect(() => checkFile(file('a.png', 'text/plain'))).toThrow(BAD_TYPE_MESSAGE);
    });

    it('30MB 초과는 거절', () => {
        expect(checkFile(file('a.png', 'image/png', MAX_BYTES))).toBe('png');
        expect(() => checkFile(file('a.png', 'image/png', MAX_BYTES + 1))).toThrow(TOO_LARGE_MESSAGE);
    });
});

function webpHeader(chunk: string, flags: number) {
    const bytes = new Uint8Array(32);
    const put = (at: number, s: string) => [...s].forEach((c, i) => (bytes[at + i] = c.charCodeAt(0)));
    put(0, 'RIFF');
    put(8, 'WEBP');
    put(12, chunk);
    bytes[20] = flags;

    return bytes;
}

describe('isAnimatedWebp', () => {
    it('VP8X 청크의 애니메이션 표시를 본다', () => {
        expect(isAnimatedWebp(webpHeader('VP8X', 0x02))).toBe(true);
        expect(isAnimatedWebp(webpHeader('VP8X', 0x10))).toBe(false);
        expect(isAnimatedWebp(webpHeader('VP8 ', 0x02))).toBe(false);
        expect(isAnimatedWebp(new Uint8Array(4))).toBe(false);
    });
});

describe('scaledSize', () => {
    it('긴 변이 2560px을 넘을 때만 비율을 지켜 줄인다', () => {
        expect(scaledSize(2560, 1000)).toBeNull();
        expect(scaledSize(5120, 2880)).toEqual({ width: 2560, height: 1440 });
        expect(scaledSize(3000, 6000)).toEqual({ width: 1280, height: 2560 });
    });
});

describe('hasAlpha', () => {
    it('불투명하지 않은 픽셀이 있는지', () => {
        expect(hasAlpha(new Uint8ClampedArray([1, 2, 3, 255, 4, 5, 6, 255]))).toBe(false);
        expect(hasAlpha(new Uint8ClampedArray([1, 2, 3, 255, 4, 5, 6, 254]))).toBe(true);
    });
});
