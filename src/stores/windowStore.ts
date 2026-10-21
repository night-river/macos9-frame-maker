import { create } from 'zustand';
import type { FrameWindow, ImageRef, RatioRect } from '@/project/types';
import { toPx, toRatio, type Bounds, type Viewport } from '@/utils/coords';
import { MIN_VISIBLE, TITLE_MAX, WINDOWS, defaultTitle, type MenuKey, type WindowType } from '@/windows/registry';
import { ZOOM_DURATION, playZoom, prefersReducedMotion, type Rect } from './uiStore';

/**
 * 윈도우 매니저 상태 (kkoriworld stores/windowStore.ts, docs/frame-maker.md 3.1·6장)
 * 위치·크기는 데스크톱 영역(메뉴 바 아래부터 화면 끝까지) 대비 비율로 들고, 그릴 때 px로 바꾼다.
 * menu·custom 윈도우는 프로젝트 데이터에 저장되고, control_panel·sticker_list는 저장하지 않는다.
 */

export const MENUBAR_HEIGHT = 20;

export interface Win {
    id: string;
    type: WindowType;
    menuKey?: MenuKey;
    title: string;
    /** 최대화 중에도 원래 크기를 담는다 */
    rect: RatioRect;
    z: number;
    minimized: boolean;
    maximized: boolean;
    image: ImageRef | null;
    /** 줌 사각형이 끝날 때까지 숨김 (저장하지 않음) */
    appearing: boolean;
}

export interface OpenOptions {
    /** 메뉴 윈도우의 메뉴 */
    menuKey?: MenuKey;
    /** 줌 사각형 시작 위치 (클릭한 메뉴). 없으면 화면 가운데 */
    origin?: Rect | null;
    animate?: boolean;
}

interface WindowState {
    windows: Win[];
    topZ: number;
    /** 스티커 모드에서 모든 윈도우를 숨김 (닫지 않음) */
    hiddenForStickers: boolean;
    viewport: Viewport;

    setViewport: (width: number, height: number) => void;
    /** 저장된 윈도우로 바꿔 넣기 (처음 불러올 때) */
    hydrate: (windows: FrameWindow[]) => void;
    open: (type: WindowType, options?: OpenOptions) => string;
    close: (id: string) => void;
    focus: (id: string) => void;
    minimize: (id: string) => void;
    restoreWindow: (id: string) => void;
    toggleMaximize: (id: string) => void;
    /** 이동·크기 조절을 놓는 순간 (px) */
    setBounds: (id: string, bounds: Bounds) => void;
    /** 제목 바꾸기: 앞뒤 공백 제거, 최대 40자, 비우면 기본 제목 */
    rename: (id: string, title: string) => void;
    setHiddenForStickers: (hidden: boolean) => void;
}

/** 타이틀 바가 메뉴 바 아래·화면 안에 남도록 */
export function clampBounds(bounds: Bounds, viewport: Viewport): Bounds {
    return {
        ...bounds,
        x: Math.round(Math.min(Math.max(bounds.x, MIN_VISIBLE - bounds.width), viewport.width - MIN_VISIBLE)),
        y: Math.round(Math.min(Math.max(bounds.y, 0), Math.max(0, viewport.height - 20))),
    };
}

/**
 * 화면에 그릴 px 위치·크기
 * 최대화면 데스크톱 영역 전체, 크기 고정 윈도우는 정해진 크기, 나머지는 비율 → px (최소 크기 보장)
 */
export function windowBounds(win: Pick<Win, 'type' | 'rect' | 'maximized'>, viewport: Viewport): Bounds {
    const def = WINDOWS[win.type];
    if (win.maximized && def.resizable) {
        return { x: 0, y: 0, width: viewport.width, height: viewport.height };
    }
    const px = toPx(win.rect, viewport);
    if (!def.resizable) {
        return { ...px, ...def.size };
    }

    return { ...px, width: Math.max(px.width, def.minSize?.width ?? 0), height: Math.max(px.height, def.minSize?.height ?? 0) };
}

const FIRST_POSITION = { x: 40, y: 30 };

/** 처음 위치 (6.1, px): 앞서 연 윈도우에서 오른쪽 아래로 20px씩, 화면 밖으로 나가면 왼쪽 위로 돌아감 */
export function resolveBounds(type: WindowType, state: Pick<WindowState, 'windows' | 'viewport'>): Bounds {
    const size = WINDOWS[type].size;
    const last = state.windows[state.windows.length - 1];
    const lastPx = last ? toPx(last.rect, state.viewport) : null;
    let x = lastPx ? lastPx.x + 20 : FIRST_POSITION.x;
    let y = lastPx ? lastPx.y + 20 : FIRST_POSITION.y;
    if (x + size.width > state.viewport.width || y + size.height > state.viewport.height) {
        x = FIRST_POSITION.x;
        y = FIRST_POSITION.y;
    }

    return clampBounds({ x, y, ...size }, state.viewport);
}

/** 프로젝트 데이터에 저장할 윈도우 (menu·custom만) */
export function toFrameWindows(windows: Win[]): FrameWindow[] {
    const saved: FrameWindow[] = [];
    for (const w of windows) {
        if (w.type === 'menu' || w.type === 'custom') {
            saved.push({ id: w.id, kind: w.type, ...(w.type === 'menu' ? { menuKey: w.menuKey } : {}), title: w.title, rect: w.rect, z: w.z, minimized: w.minimized, maximized: w.maximized, image: w.image });
        }
    }

    return saved;
}

function viewportNow(): Viewport {
    return typeof window === 'undefined' ? { width: 1280, height: 780 } : { width: window.innerWidth, height: window.innerHeight - MENUBAR_HEIGHT };
}

const toScreen = (b: Bounds): Rect => ({ x: b.x, y: b.y + MENUBAR_HEIGHT, width: b.width, height: b.height });

/** 같은 윈도우로 보는 기준: menu는 메뉴마다 1개, custom은 매번 새로, 나머지는 종류마다 1개 */
function findSame(windows: Win[], type: WindowType, menuKey?: MenuKey): Win | undefined {
    if (WINDOWS[type].multiple) {
        return undefined;
    }

    return windows.find((w) => w.type === type && (type !== 'menu' || w.menuKey === menuKey));
}

export const useWindowStore = create<WindowState>()((set, get) => {
    const update = (id: string, patch: (w: Win) => Partial<Win>) =>
        set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, ...patch(w) } : w)) }));

    return {
        windows: [],
        topZ: 0,
        hiddenForStickers: false,
        viewport: viewportNow(),

        setViewport: (width, height) => set({ viewport: { width, height } }),

        hydrate: (saved) =>
            set({
                windows: saved.map((w) => ({ id: w.id, type: w.kind, ...(w.kind === 'menu' ? { menuKey: w.menuKey } : {}), title: w.title, rect: w.rect, z: w.z, minimized: w.minimized, maximized: w.maximized, image: w.image, appearing: false })),
                topZ: saved.reduce((max, w) => Math.max(max, w.z), 0),
            }),

        open: (type, options = {}) => {
            const state = get();
            const menuKey = type === 'menu' ? (options.menuKey ?? 'search') : undefined;

            const existing = findSame(state.windows, type, menuKey);
            if (existing) {
                // 이미 열려 있으면 복원 + 맨 앞
                const z = state.topZ + 1;
                set({ topZ: z });
                update(existing.id, () => ({ z, minimized: false }));

                return existing.id;
            }

            const bounds = resolveBounds(type, state);
            const animate = options.animate !== false && !prefersReducedMotion();
            const z = state.topZ + 1;
            const id = type === 'menu' || type === 'custom' ? crypto.randomUUID() : type;
            const win: Win = {
                id,
                type,
                ...(menuKey ? { menuKey } : {}),
                title: defaultTitle(type, { menuKey }),
                rect: toRatio(bounds, state.viewport),
                z,
                minimized: false,
                maximized: false,
                image: null,
                appearing: animate,
            };
            set({ windows: [...state.windows, win], topZ: z });

            if (animate) {
                playZoom(options.origin ?? null, toScreen(bounds));
                setTimeout(() => update(id, () => ({ appearing: false })), ZOOM_DURATION);
            }

            return id;
        },

        close: (id) => set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),

        focus: (id) => {
            const state = get();
            const win = state.windows.find((w) => w.id === id);
            if (!win || win.z === state.topZ) {
                return;
            }
            set({ topZ: state.topZ + 1 });
            update(id, () => ({ z: state.topZ + 1 }));
        },

        minimize: (id) => {
            const state = get();
            const win = state.windows.find((w) => w.id === id);
            if (!win) {
                return;
            }
            // 트레이 쪽으로 반대 방향 줌
            const trayIndex = state.windows.filter((w) => w.minimized).length;
            playZoom(toScreen(windowBounds(win, state.viewport)), { x: 14 + trayIndex * 26, y: state.viewport.height + MENUBAR_HEIGHT - 18, width: 16, height: 16 });
            update(id, () => ({ minimized: true }));
        },

        restoreWindow: (id) => {
            const state = get();
            set({ topZ: state.topZ + 1 });
            update(id, () => ({ minimized: false, z: state.topZ + 1 }));
        },

        // 최대화는 그릴 때만 데스크톱 영역 전체로 (rect는 원래 크기 그대로)
        toggleMaximize: (id) => {
            const win = get().windows.find((w) => w.id === id);
            if (win && WINDOWS[win.type].resizable) {
                update(id, (w) => ({ maximized: !w.maximized }));
            }
        },

        setBounds: (id, bounds) => {
            const { windows, viewport } = get();
            const win = windows.find((w) => w.id === id);
            if (!win) {
                return;
            }
            const def = WINDOWS[win.type];
            const next = clampBounds(
                {
                    x: bounds.x,
                    y: bounds.y,
                    width: def.resizable ? Math.max(bounds.width, def.minSize?.width ?? 0) : def.size.width,
                    height: def.resizable ? Math.max(bounds.height, def.minSize?.height ?? 0) : def.size.height,
                },
                viewport,
            );
            update(id, () => ({ rect: toRatio(next, viewport), maximized: false }));
        },

        rename: (id, title) => {
            const win = get().windows.find((w) => w.id === id);
            if (!win) {
                return;
            }
            const trimmed = title.trim().slice(0, TITLE_MAX);
            update(id, (w) => ({ title: trimmed || defaultTitle(w.type, { menuKey: w.menuKey }) }));
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

    return top?.id ?? null;
}
