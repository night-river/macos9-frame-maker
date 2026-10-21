/**
 * 윈도우 종류 정의 (docs/frame-maker.md 6.1 표가 그대로 코드가 됨)
 * 크기 조절 여부·버튼·같은 윈도우 기준·기본 크기·제목·아이콘을 이 한 곳에서 정한다.
 */

export type WindowType = 'menu' | 'custom' | 'control_panel' | 'sticker_list';

export type MenuKey = 'search' | 'dday' | 'bgm' | 'calendar' | 'banner' | 'notice' | 'all_posts' | 'guestbook';

/** 메뉴 바의 메뉴 8종: kkoriworld의 기본 라벨·아이콘 (순서도 같음, 5.1) */
export const MENU_ITEMS: { key: MenuKey; label: string; icon: string }[] = [
    { key: 'search', label: '검색', icon: 'fa-solid fa-magnifying-glass' },
    { key: 'dday', label: 'D-day', icon: 'fa-solid fa-heart' },
    { key: 'bgm', label: 'BGM', icon: 'fa-solid fa-music' },
    { key: 'calendar', label: '캘린더', icon: 'fa-solid fa-calendar-days' },
    { key: 'banner', label: '배너', icon: 'fa-solid fa-link' },
    { key: 'notice', label: '공지사항', icon: 'fa-solid fa-bullhorn' },
    { key: 'all_posts', label: '전체 글목록', icon: 'fa-solid fa-folder-open' },
    { key: 'guestbook', label: '방명록', icon: 'fa-solid fa-envelope' },
];

export interface WindowParams {
    /** menu 윈도우의 메뉴 */
    menuKey?: MenuKey;
}

export interface Size {
    width: number;
    height: number;
}

interface WindowDef {
    resizable: boolean;
    size: Size;
    minSize?: Size;
    /** 같은 종류를 여러 개 열 수 있음 */
    multiple?: boolean;
    title?: string;
    icon?: string;
}

const FRAME_SIZE: Size = { width: 360, height: 270 };
const FRAME_MIN: Size = { width: 120, height: 90 };

export const WINDOWS: Record<WindowType, WindowDef> = {
    menu: { resizable: true, size: FRAME_SIZE, minSize: FRAME_MIN },
    custom: { resizable: true, size: FRAME_SIZE, minSize: FRAME_MIN, multiple: true, title: '새 윈도우', icon: 'fa-solid fa-image' },
    control_panel: { resizable: false, size: { width: 340, height: 360 }, title: '제어판', icon: 'fa-solid fa-sliders' },
    // kkoriworld와 같음 (300×400, 크기 고정)
    sticker_list: { resizable: false, size: { width: 300, height: 400 }, title: '스티커', icon: 'fa-solid fa-note-sticky' },
};

/** 타이틀 바가 화면 안에 남는 최소 폭 */
export const MIN_VISIBLE = 40;

/** 제목 최대 길이 (6.2) */
export const TITLE_MAX = 40;

/** 같은 윈도우로 보는 기준: menu는 메뉴마다 1개, custom은 매번 새로, 나머지는 종류마다 1개 */
export function windowKey(type: WindowType, params: WindowParams = {}): string {
    if (type === 'menu') {
        return `menu:${params.menuKey ?? 'search'}`;
    }
    if (WINDOWS[type].multiple) {
        return `${type}:${crypto.randomUUID()}`;
    }

    return type;
}

/** 기본 제목: menu는 메뉴 라벨 */
export function defaultTitle(type: WindowType, params: WindowParams = {}): string {
    if (type === 'menu') {
        return MENU_ITEMS.find((m) => m.key === params.menuKey)?.label ?? '';
    }

    return WINDOWS[type].title ?? type;
}

/** 윈도우 아이콘 (Font Awesome 클래스): 타이틀 바, 하단 트레이에 쓴다 */
export function windowIcon(type: WindowType, params: WindowParams = {}): string {
    if (type === 'menu') {
        return MENU_ITEMS.find((m) => m.key === params.menuKey)?.icon ?? 'fa-solid fa-window-maximize';
    }

    return WINDOWS[type].icon ?? 'fa-solid fa-window-maximize';
}
