import { create } from 'zustand';

/** 알림창·확인창, 줌 사각형 (kkoriworld docs/frontend.md 4.5, 5.4) */

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

interface UiState {
    dialogs: Dialog[];
    zooms: Zoom[];
    closeDialog: (id: number) => void;
    addZoom: (from: Rect, to: Rect) => void;
    removeZoom: (id: number) => void;
}

let nextId = 1;

export const useUiStore = create<UiState>()((set) => ({
    dialogs: [],
    zooms: [],
    closeDialog: (id) => set((s) => ({ dialogs: s.dialogs.filter((d) => d.id !== id) })),
    addZoom: (from, to) => set((s) => ({ zooms: [...s.zooms, { id: nextId++, from, to }] })),
    removeZoom: (id) => set((s) => ({ zooms: s.zooms.filter((z) => z.id !== id) })),
}));

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
