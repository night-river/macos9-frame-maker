import { create } from 'zustand';
import { MIN_VISIBLE, WINDOWS, windowKey, type WindowParams, type WindowType } from '@/windows/registry';
import { ZOOM_DURATION, playZoom, prefersReducedMotion, type Rect } from './uiStore';

/**
 * 윈도우 매니저 상태 (kkoriworld stores/windowStore.ts, docs/frame-maker.md 6장)
 * 좌표는 윈도우 레이어(메뉴 바 바로 아래) 기준 px.
 * TODO(P1): 데스크톱 대비 비율 좌표로 바꾸고 프로젝트 데이터(IndexedDB)에 저장 (3.1, 3.2)
 */

export const MENUBAR_HEIGHT = 20;

export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Win extends Bounds {
    key: string;
    type: WindowType;
    params: WindowParams;
    /** 사용자가 바꾼 제목 (null이면 기본 제목) */
    title: string | null;
    z: number;
    minimized: boolean;
    maximized: boolean;
    /** 최대화 전 크기 */
    restore: Bounds | null;
    /** 줌 사각형이 끝날 때까지 숨김 */
    appearing: boolean;
}

export interface OpenOptions {
    /** 줌 사각형 시작 위치 (클릭한 메뉴). 없으면 화면 가운데 */
    origin?: Rect | null;
    animate?: boolean;
}

interface WindowState {
    windows: Win[];
    topZ: number;
    /** 스티커 모드에서 모든 윈도우를 숨김 (닫지 않음) */
    hiddenForStickers: boolean;
    viewport: { width: number; height: number };

    setViewport: (width: number, height: number) => void;
    open: (type: WindowType, params?: WindowParams, options?: OpenOptions) => string;
    close: (key: string) => void;
    focus: (key: string) => void;
    minimize: (key: string) => void;
    restoreWindow: (key: string) => void;
    toggleMaximize: (key: string) => void;
    setBounds: (key: string, bounds: Bounds) => void;
    setHiddenForStickers: (hidden: boolean) => void;
}

/** 타이틀 바가 메뉴 바 아래·화면 안에 남도록 */
export function clampBounds(bounds: Bounds, viewport: { width: number; height: number }): Bounds {
    return {
        ...bounds,
        x: Math.round(Math.min(Math.max(bounds.x, MIN_VISIBLE - bounds.width), viewport.width - MIN_VISIBLE)),
        y: Math.round(Math.min(Math.max(bounds.y, 0), Math.max(0, viewport.height - 20))),
    };
}

const FIRST_POSITION = { x: 40, y: 30 };

/** 처음 위치 (6.1): 앞서 연 윈도우에서 오른쪽 아래로 20px씩, 화면 밖으로 나가면 왼쪽 위로 돌아감 */
export function resolveBounds(type: WindowType, state: Pick<WindowState, 'windows' | 'viewport'>): Bounds {
    const size = WINDOWS[type].size;
    const last = state.windows[state.windows.length - 1];
    let x = last ? last.x + 20 : FIRST_POSITION.x;
    let y = last ? last.y + 20 : FIRST_POSITION.y;
    if (x + size.width > state.viewport.width || y + size.height > state.viewport.height) {
        x = FIRST_POSITION.x;
        y = FIRST_POSITION.y;
    }

    return clampBounds({ x, y, ...size }, state.viewport);
}

function viewportNow(): { width: number; height: number } {
    return typeof window === 'undefined' ? { width: 1280, height: 780 } : { width: window.innerWidth, height: window.innerHeight - MENUBAR_HEIGHT };
}

const toScreen = (b: Bounds): Rect => ({ x: b.x, y: b.y + MENUBAR_HEIGHT, width: b.width, height: b.height });

export const useWindowStore = create<WindowState>()((set, get) => {
    const update = (key: string, patch: (w: Win) => Partial<Win>) =>
        set((s) => ({ windows: s.windows.map((w) => (w.key === key ? { ...w, ...patch(w) } : w)) }));

    return {
        windows: [],
        topZ: 0,
        hiddenForStickers: false,
        viewport: viewportNow(),

        setViewport: (width, height) => set({ viewport: { width, height } }),

        open: (type, params = {}, options = {}) => {
            const state = get();
            const key = windowKey(type, params);

            const existing = state.windows.find((w) => w.key === key);
            if (existing) {
                // 이미 열려 있으면 복원 + 맨 앞
                const z = state.topZ + 1;
                set({ topZ: z });
                update(key, () => ({ z, minimized: false }));

                return key;
            }

            const bounds = resolveBounds(type, state);
            const animate = options.animate !== false && !prefersReducedMotion();
            const z = state.topZ + 1;
            const win: Win = {
                key,
                type,
                params,
                title: null,
                ...bounds,
                z,
                minimized: false,
                maximized: false,
                restore: null,
                appearing: animate,
            };
            set({ windows: [...state.windows, win], topZ: z });

            if (animate) {
                playZoom(options.origin ?? null, toScreen(bounds));
                setTimeout(() => update(key, () => ({ appearing: false })), ZOOM_DURATION);
            }

            return key;
        },

        close: (key) => set((s) => ({ windows: s.windows.filter((w) => w.key !== key) })),

        focus: (key) => {
            const state = get();
            const win = state.windows.find((w) => w.key === key);
            if (!win || win.z === state.topZ) {
                return;
            }
            set({ topZ: state.topZ + 1 });
            update(key, () => ({ z: state.topZ + 1 }));
        },

        minimize: (key) => {
            const state = get();
            const win = state.windows.find((w) => w.key === key);
            if (!win) {
                return;
            }
            // 트레이 쪽으로 반대 방향 줌
            const trayIndex = state.windows.filter((w) => w.minimized).length;
            playZoom(toScreen(win), { x: 14 + trayIndex * 26, y: state.viewport.height + MENUBAR_HEIGHT - 18, width: 16, height: 16 });
            update(key, () => ({ minimized: true }));
        },

        restoreWindow: (key) => {
            const state = get();
            set({ topZ: state.topZ + 1 });
            update(key, () => ({ minimized: false, z: state.topZ + 1 }));
        },

        toggleMaximize: (key) => {
            const state = get();
            const win = state.windows.find((w) => w.key === key);
            if (!win || !WINDOWS[win.type].resizable) {
                return;
            }
            if (win.maximized) {
                update(key, (w) => ({ ...(w.restore ?? {}), maximized: false, restore: null }));
            } else {
                // 메뉴 바 아래부터 화면 끝까지
                update(key, (w) => ({
                    restore: { x: w.x, y: w.y, width: w.width, height: w.height },
                    maximized: true,
                    x: 0,
                    y: 0,
                    width: state.viewport.width,
                    height: state.viewport.height,
                }));
            }
        },

        setBounds: (key, bounds) => {
            const win = get().windows.find((w) => w.key === key);
            if (!win) {
                return;
            }
            const def = WINDOWS[win.type];
            const next = clampBounds(
                {
                    x: bounds.x,
                    y: bounds.y,
                    width: def.resizable ? Math.max(bounds.width, def.minSize?.width ?? 0) : win.width,
                    height: def.resizable ? Math.max(bounds.height, def.minSize?.height ?? 0) : win.height,
                },
                get().viewport,
            );
            update(key, () => ({ ...next, maximized: false, restore: null }));
        },

        setHiddenForStickers: (hidden) => set({ hiddenForStickers: hidden }),
    };
});

/** 맨 앞의 보이는 윈도우 ("활성" 모양) */
export function activeWindowKey(windows: Win[]): string | null {
    let top: Win | null = null;
    for (const w of windows) {
        if (!w.minimized && (!top || w.z > top.z)) {
            top = w;
        }
    }

    return top?.key ?? null;
}
