import type { MenuKey } from '@/windows/registry';
import { DEFAULT_THEME, type Theme } from '@/utils/theme';

/** 프로젝트 데이터 (docs/frame-maker.md 3.1). IndexedDB 키 `project`에 통째로 저장한다 */

export interface ImageRef {
    /** 이미지 원본(Blob)은 별도 키 `blob:{blobId}`에 저장 */
    blobId: string;
    naturalWidth: number;
    naturalHeight: number;
    /** 0~1, 이미지에서 프레임 가운데에 오는 지점 */
    focusX: number;
    focusY: number;
    /** 1~4, 1 = 프레임을 꽉 채우는 최소 배율 */
    zoom: number;
}

/** 데스크톱 영역(메뉴 바 아래부터 화면 끝까지) 대비 비율 0~1 */
export interface RatioRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface FrameWindow {
    id: string;
    kind: 'menu' | 'custom';
    menuKey?: MenuKey;
    title: string;
    /** 최대화 중에도 원래 크기를 담는다 (다시 누르면 이 크기로) */
    rect: RatioRect;
    z: number;
    minimized: boolean;
    maximized: boolean;
    image: ImageRef | null;
}

export interface StickerAsset {
    id: string;
    blobId: string;
    naturalWidth: number;
    naturalHeight: number;
}

export interface StickerPlacement {
    id: string;
    assetId: string;
    /** 데스크톱 대비 비율 (스티커 왼쪽 위) */
    x: number;
    y: number;
    /** 데스크톱 가로 대비 비율 (세로는 이미지 비율로 계산) */
    w: number;
    /** 도 */
    rotation: number;
    z: number;
}

export interface Project {
    version: 1;
    theme: Theme;
    wallpaper: ImageRef | null;
    /** 메뉴 바 홈 아이콘·탭 파비콘 (null = 앱 기본 아이콘) */
    homeIcon: ImageRef | null;
    windows: FrameWindow[];
    /** 업로드한 스티커 이미지 목록 */
    stickerLibrary: StickerAsset[];
    /** 배경에 붙인 스티커 */
    stickers: StickerPlacement[];
}

export function emptyProject(): Project {
    return { version: 1, theme: { ...DEFAULT_THEME }, wallpaper: null, homeIcon: null, windows: [], stickerLibrary: [], stickers: [] };
}
