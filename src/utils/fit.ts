/** 이미지 맞춤 계산 (docs/frame-maker.md 4.1). 윈도우·배경·홈 아이콘·편집 화면 공통 */

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 4;

/** 맞춤에 쓰는 값 (ImageRef의 일부) */
export interface FitInput {
    naturalWidth: number;
    naturalHeight: number;
    focusX: number;
    focusY: number;
    zoom: number;
}

/** 프레임 안에서 <img>를 놓을 위치·크기 (px) */
export interface FitBox {
    left: number;
    top: number;
    width: number;
    height: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const clampZoom = (zoom: number) => clamp(Number.isFinite(zoom) ? zoom : ZOOM_MIN, ZOOM_MIN, ZOOM_MAX);

/**
 * 프레임 W×H를 빈 곳 없이 채우도록 (cover × zoom), focus 지점을 프레임 가운데로 놓되 가장자리를 넘지 않게
 */
export function fitImage(frameWidth: number, frameHeight: number, image: FitInput): FitBox {
    const iw = Math.max(image.naturalWidth, 1);
    const ih = Math.max(image.naturalHeight, 1);
    const s = Math.max(frameWidth / iw, frameHeight / ih) * clampZoom(image.zoom);
    const width = iw * s;
    const height = ih * s;
    const left = clamp(frameWidth / 2 - clamp(image.focusX, 0, 1) * width, frameWidth - width, 0);
    const top = clamp(frameHeight / 2 - clamp(image.focusY, 0, 1) * height, frameHeight - height, 0);

    return { left, top, width, height };
}

/** 지금 화면에 실제로 보이는 위치에 맞춘 focus (가장자리 제한으로 밀린 만큼을 반영) */
export function effectiveFocus(frameWidth: number, frameHeight: number, image: FitInput): { focusX: number; focusY: number } {
    const box = fitImage(frameWidth, frameHeight, image);

    return {
        focusX: clamp((frameWidth / 2 - box.left) / box.width, 0, 1),
        focusY: clamp((frameHeight / 2 - box.top) / box.height, 0, 1),
    };
}

/**
 * 미리보기를 dx, dy(px)만큼 끌었을 때의 focus (4.2)
 * 이미지가 손가락을 따라 움직이도록 보이는 위치에서 출발하고, 결과도 가장자리 제한을 적용한 값으로 돌려준다
 */
export function panFocus(frameWidth: number, frameHeight: number, image: FitInput, dx: number, dy: number): { focusX: number; focusY: number } {
    const box = fitImage(frameWidth, frameHeight, image);
    const moved = { ...image, focusX: (frameWidth / 2 - (box.left + dx)) / box.width, focusY: (frameHeight / 2 - (box.top + dy)) / box.height };

    return effectiveFocus(frameWidth, frameHeight, moved);
}

/** 가로세로 비율 aspect(가로/세로)를 maxWidth×maxHeight 안에 가장 크게 */
export function fitAspect(aspect: number, maxWidth: number, maxHeight: number): { width: number; height: number } {
    const a = Number.isFinite(aspect) && aspect > 0 ? aspect : maxWidth / maxHeight;
    if (a >= maxWidth / maxHeight) {
        return { width: maxWidth, height: Math.round(maxWidth / a) };
    }

    return { width: Math.round(maxHeight * a), height: maxHeight };
}
