import { create } from 'zustand';
import type { FitInput } from '@/utils/fit';

/** 알림창·확인창, 줌 사각형 (kkoriworld docs/frontend.md 4.5, 5.4), 팝업 메뉴·이미지 편집 화면 (frame-maker.md 4.2, 5.2, 6.3) */

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

type Dialog =
    | { id: number; kind: 'alert'; message: string; okLabel: string; resolve: () => void }
    | { id: number; kind: 'confirm'; message: string; okLabel: string; resolve: (ok: boolean) => void };

export interface Zoom {
    id: number;
    from: Rect;
    to: Rect;
}

export interface PopupItem {
    label: string;
    onSelect: () => void;
    /** 위에 구분선 */
    separated?: boolean;
}

/** 클릭한 위치에 뜨는 작은 팝업 메뉴 (화면 좌표 px) */
export interface Popup {
    id: number;
    x: number;
    y: number;
    items: PopupItem[];
}

/** 편집 화면 결과 */
export type ImageAdjust = Pick<FitInput, 'focusX' | 'focusY' | 'zoom'>;

/** 이미지 편집 화면 (4.2) 요청 */
export interface ImageEdit {
    id: number;
    src: string;
    image: FitInput;
    /** 대상 프레임의 가로/세로 */
    aspect: number;
    resolve: (result: ImageAdjust | null) => void;
}

interface UiState {
    dialogs: Dialog[];
    zooms: Zoom[];
    popup: Popup | null;
    imageEdit: ImageEdit | null;
    closeDialog: (id: number) => void;
    addZoom: (from: Rect, to: Rect) => void;
    removeZoom: (id: number) => void;
    openPopup: (x: number, y: number, items: PopupItem[]) => void;
    closePopup: () => void;
}

let nextId = 1;

export const useUiStore = create<UiState>()((set) => ({
    dialogs: [],
    zooms: [],
    popup: null,
    imageEdit: null,
    closeDialog: (id) => set((s) => ({ dialogs: s.dialogs.filter((d) => d.id !== id) })),
    addZoom: (from, to) => set((s) => ({ zooms: [...s.zooms, { id: nextId++, from, to }] })),
    removeZoom: (id) => set((s) => ({ zooms: s.zooms.filter((z) => z.id !== id) })),
    openPopup: (x, y, items) => set({ popup: { id: nextId++, x, y, items } }),
    closePopup: () => set({ popup: null }),
}));

/** 이미지 편집 화면을 열고 [적용]이면 결과, [취소]면 null */
export function editImage(request: Omit<ImageEdit, 'id' | 'resolve'>): Promise<ImageAdjust | null> {
    // 이미 열린 편집 화면이 있으면 취소로 끝낸다
    useUiStore.getState().imageEdit?.resolve(null);

    return new Promise((resolve) => {
        const id = nextId++;
        const finish = (result: ImageAdjust | null) => {
            useUiStore.setState((s) => (s.imageEdit?.id === id ? { imageEdit: null } : {}));
            resolve(result);
        };
        useUiStore.setState({ popup: null, imageEdit: { ...request, id, resolve: finish } });
    });
}

function push(dialog: Dialog): void {
    useUiStore.setState((s) => ({ dialogs: [...s.dialogs, dialog] }));
}

/** 알림창 (버튼 하나) */
export function showAlert(message: string, okLabel = '확인'): Promise<void> {
    return new Promise((resolve) => push({ id: nextId++, kind: 'alert', message, okLabel, resolve }));
}

/** 확인창: 버튼은 `취소` / 동작 이름 */
export function askConfirm(message: string, okLabel = '확인'): Promise<boolean> {
    return new Promise((resolve) => push({ id: nextId++, kind: 'confirm', message, okLabel, resolve }));
}

export type { Dialog };

export function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/** 줌 사각형 (5.4): 시작 위치를 모르면 화면 가운데에서 */
export const ZOOM_DURATION = 180;

export function playZoom(from: Rect | null, to: Rect): void {
    if (prefersReducedMotion()) {
        return;
    }
    const start = from ?? { x: window.innerWidth / 2 - 10, y: window.innerHeight / 2 - 10, width: 20, height: 20 };
    useUiStore.getState().addZoom(start, to);
}

export function rectOf(element: Element | null | undefined): Rect | null {
    if (!element) {
        return null;
    }
    const r = element.getBoundingClientRect();

    return { x: r.left, y: r.top, width: r.width, height: r.height };
}
