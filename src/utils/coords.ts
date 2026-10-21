import type { RatioRect } from '@/project/types';

/** 좌표 변환 (docs/frame-maker.md 3.1): 저장은 데스크톱 영역 대비 비율, 화면에는 px */

export interface Viewport {
    width: number;
    height: number;
}

export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function toPx(rect: RatioRect, vp: Viewport): Bounds {
    return {
        x: Math.round(rect.x * vp.width),
        y: Math.round(rect.y * vp.height),
        width: Math.round(rect.w * vp.width),
        height: Math.round(rect.h * vp.height),
    };
}

export function toRatio(b: Bounds, vp: Viewport): RatioRect {
    const w = Math.max(1, vp.width);
    const h = Math.max(1, vp.height);

    return { x: b.x / w, y: b.y / h, w: b.width / w, h: b.height / h };
}
