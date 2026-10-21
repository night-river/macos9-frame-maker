import { describe, expect, it } from 'vitest';
import { clampZoom, effectiveFocus, fitAspect, fitImage, panFocus } from './fit';

const center = { focusX: 0.5, focusY: 0.5, zoom: 1 };

describe('fitImage (4.1)', () => {
    it('가로로 긴 이미지: 세로를 꽉 채우고 가로는 가운데에서 잘린다', () => {
        // 2000×1000 → 400×300 프레임: s0 = max(0.2, 0.3) = 0.3
        expect(fitImage(400, 300, { naturalWidth: 2000, naturalHeight: 1000, ...center })).toEqual({ left: -100, top: 0, width: 600, height: 300 });
    });

    it('세로로 긴 이미지: 가로를 꽉 채우고 세로는 가운데에서 잘린다', () => {
        // 1000×2000 → 400×300 프레임: s0 = max(0.4, 0.15) = 0.4
        expect(fitImage(400, 300, { naturalWidth: 1000, naturalHeight: 2000, ...center })).toEqual({ left: 0, top: -250, width: 400, height: 800 });
    });

    it('zoom 배율만큼 커지고 가운데 초점은 프레임 가운데에 온다', () => {
        const box = fitImage(400, 300, { naturalWidth: 400, naturalHeight: 300, focusX: 0.5, focusY: 0.5, zoom: 2 });
        expect(box).toEqual({ left: -200, top: -150, width: 800, height: 600 });
    });

    it('focus를 가운데로 놓되 가장자리를 넘으면 빈 곳이 생기지 않게 제한', () => {
        const image = { naturalWidth: 400, naturalHeight: 300, zoom: 2 };
        // focus 0.25 → left = 200 − 200 = 0 (경계 그대로)
        expect(fitImage(400, 300, { ...image, focusX: 0.25, focusY: 0.5 }).left).toBe(0);
        // focus 0 → left = 200 이지만 0으로 제한
        expect(fitImage(400, 300, { ...image, focusX: 0, focusY: 0 })).toMatchObject({ left: 0, top: 0 });
        // focus 1 → 오른쪽·아래 끝이 프레임 끝에 맞음
        expect(fitImage(400, 300, { ...image, focusX: 1, focusY: 1 })).toMatchObject({ left: -400, top: -300 });
    });

    it('zoom 1이면 남는 쪽이 없는 축은 focus와 관계없이 0', () => {
        const box = fitImage(400, 300, { naturalWidth: 2000, naturalHeight: 1000, focusX: 0.5, focusY: 0, zoom: 1 });
        expect(box.top).toBe(0);
        expect(box.height).toBe(300);
    });

    it('프레임 크기가 바뀌어도 항상 꽉 채운다', () => {
        const image = { naturalWidth: 1200, naturalHeight: 800, focusX: 0.9, focusY: 0.1, zoom: 1.5 };
        for (const [w, h] of [
            [120, 90],
            [800, 200],
            [200, 900],
            [1920, 1080],
        ]) {
            const box = fitImage(w, h, image);
            expect(box.left).toBeLessThanOrEqual(0);
            expect(box.top).toBeLessThanOrEqual(0);
            expect(box.left + box.width).toBeGreaterThanOrEqual(w - 1e-9);
            expect(box.top + box.height).toBeGreaterThanOrEqual(h - 1e-9);
        }
    });

    it('zoom은 1~4로 제한', () => {
        expect(clampZoom(0.5)).toBe(1);
        expect(clampZoom(9)).toBe(4);
        expect(clampZoom(Number.NaN)).toBe(1);
        expect(fitImage(100, 100, { naturalWidth: 100, naturalHeight: 100, ...center, zoom: 10 }).width).toBe(400);
    });
});

describe('effectiveFocus·panFocus (4.2 끌기)', () => {
    const image = { naturalWidth: 400, naturalHeight: 300, focusX: 0.5, focusY: 0.5, zoom: 2 };

    it('경계에 밀린 focus는 실제로 보이는 위치로 바뀐다', () => {
        expect(effectiveFocus(400, 300, { ...image, focusX: 0, focusY: 1 })).toEqual({ focusX: 0.25, focusY: 0.75 });
    });

    it('끈 만큼 이미지가 따라 움직인다', () => {
        // 오른쪽으로 100px 끌면 이미지가 오른쪽으로 → 보이는 지점은 왼쪽으로 100/800
        const next = panFocus(400, 300, image, 100, 0);
        expect(next).toEqual({ focusX: 0.375, focusY: 0.5 });
        expect(fitImage(400, 300, { ...image, ...next }).left).toBe(-100);
    });

    it('경계 밖으로는 끌리지 않는다', () => {
        expect(panFocus(400, 300, image, 9999, -9999)).toEqual({ focusX: 0.25, focusY: 0.75 });
    });
});

describe('fitAspect', () => {
    it('최대 480×360 안에 같은 비율로', () => {
        expect(fitAspect(16 / 9, 480, 360)).toEqual({ width: 480, height: 270 });
        expect(fitAspect(1, 480, 360)).toEqual({ width: 360, height: 360 });
        expect(fitAspect(0, 480, 360)).toEqual({ width: 480, height: 360 });
    });
});
