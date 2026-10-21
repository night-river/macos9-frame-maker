import { textColorOn } from './color';

/** 테마 색 적용 (kkoriworld utils/theme.ts의 applyTheme, docs/frame-maker.md 3.1·9장) */

export interface Theme {
    bg: string;
    bg_sub: string;
    text: string;
    point_1: string;
    point_2: string;
}

/** 기본 테마 (kkoriworld의 기본값) */
export const DEFAULT_THEME: Theme = {
    bg: '#DDDDDD',
    bg_sub: '#EEEEEE',
    text: '#000000',
    point_1: '#6666CC',
    point_2: '#CCCCFF',
};

const THEME_VARS: Record<keyof Theme, string> = {
    bg: '--kw-bg',
    bg_sub: '--kw-bg-sub',
    text: '--kw-text',
    point_1: '--kw-point-1',
    point_2: '--kw-point-2',
};

export function applyTheme(theme: Theme): void {
    const style = document.documentElement.style;
    for (const [key, cssVar] of Object.entries(THEME_VARS) as [keyof Theme, string][]) {
        style.setProperty(cssVar, theme[key]);
    }
    style.setProperty('--kw-on-point-1', textColorOn(theme.point_1));
    style.setProperty('--kw-on-point-2', textColorOn(theme.point_2));
    // 글자 테두리: 글자색이 어두우면 흰색, 밝으면 검정
    style.setProperty('--kw-text-outline', textColorOn(theme.text));
}
