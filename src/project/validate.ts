import { isHexColor } from '@/utils/color';
import type { Theme } from '@/utils/theme';
import { MENU_ITEMS } from '@/windows/registry';
import type { FrameWindow, ImageRef, Project, RatioRect, StickerAsset, StickerPlacement } from './types';

/**
 * 불러온 프로젝트 데이터 검사 (3.2): 형식이 맞지 않으면 null → 빈 프로젝트로 시작
 * 데이터가 손상되어도 앱이 멈추지 않게, 하나라도 틀리면 전체를 버린다
 */

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const MENU_KEYS = new Set<unknown>(MENU_ITEMS.map((m) => m.key));

function isTheme(v: unknown): v is Theme {
    return isObj(v) && (['bg', 'bg_sub', 'text', 'point_1', 'point_2'] as const).every((k) => isStr(v[k]) && isHexColor(v[k]));
}

function isImageRef(v: unknown): v is ImageRef {
    return isObj(v) && isStr(v.blobId) && isNum(v.naturalWidth) && isNum(v.naturalHeight) && isNum(v.focusX) && isNum(v.focusY) && isNum(v.zoom);
}

const isImageOrNull = (v: unknown) => v === null || isImageRef(v);

function isRect(v: unknown): v is RatioRect {
    return isObj(v) && isNum(v.x) && isNum(v.y) && isNum(v.w) && isNum(v.h) && v.w > 0 && v.h > 0;
}

function isWindow(v: unknown): v is FrameWindow {
    if (!isObj(v) || !isStr(v.id) || !isStr(v.title) || !isRect(v.rect) || !isNum(v.z) || !isBool(v.minimized) || !isBool(v.maximized) || !isImageOrNull(v.image)) {
        return false;
    }

    return v.kind === 'custom' || (v.kind === 'menu' && MENU_KEYS.has(v.menuKey));
}

function isStickerAsset(v: unknown): v is StickerAsset {
    return isObj(v) && isStr(v.id) && isStr(v.blobId) && isNum(v.naturalWidth) && isNum(v.naturalHeight);
}

function isStickerPlacement(v: unknown): v is StickerPlacement {
    return isObj(v) && isStr(v.id) && isStr(v.assetId) && isNum(v.x) && isNum(v.y) && isNum(v.w) && isNum(v.rotation) && isNum(v.z);
}

export function parseProject(raw: unknown): Project | null {
    if (!isObj(raw) || raw.version !== 1) {
        return null;
    }
    const ok =
        isTheme(raw.theme) &&
        isImageOrNull(raw.wallpaper) &&
        isImageOrNull(raw.homeIcon) &&
        Array.isArray(raw.windows) &&
        raw.windows.every(isWindow) &&
        Array.isArray(raw.stickerLibrary) &&
        raw.stickerLibrary.every(isStickerAsset) &&
        Array.isArray(raw.stickers) &&
        raw.stickers.every(isStickerPlacement);

    return ok ? (raw as unknown as Project) : null;
}
