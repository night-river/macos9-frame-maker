import { describe, expect, it } from 'vitest';
import { toPx, toRatio } from './coords';

describe('좌표 변환 (3.1)', () => {
    const vp = { width: 1000, height: 500 };

    it('px → 비율 → px로 되돌리면 같은 값', () => {
        const px = { x: 120, y: 45, width: 360, height: 270 };
        const ratio = toRatio(px, vp);
        expect(ratio).toEqual({ x: 0.12, y: 0.09, w: 0.36, h: 0.54 });
        expect(toPx(ratio, vp)).toEqual(px);
    });

    it('화면 크기가 바뀌면 비율대로', () => {
        expect(toPx({ x: 0.5, y: 0.5, w: 0.25, h: 0.5 }, { width: 1600, height: 900 })).toEqual({ x: 800, y: 450, width: 400, height: 450 });
    });

    it('px로 바꿀 때는 정수로 반올림', () => {
        expect(toPx({ x: 1 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 }, { width: 100, height: 100 })).toEqual({ x: 33, y: 33, width: 33, height: 33 });
    });

    it('화면 크기가 0이어도 나눗셈 오류 없음', () => {
        const ratio = toRatio({ x: 10, y: 10, width: 10, height: 10 }, { width: 0, height: 0 });
        expect(Object.values(ratio).every(Number.isFinite)).toBe(true);
    });
});
