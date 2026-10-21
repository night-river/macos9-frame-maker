import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME, applyTheme } from './theme';

describe('테마 적용', () => {
    it('기본 5색과 포인트 색 위 글자색을 :root에 넣는다', () => {
        applyTheme(DEFAULT_THEME);
        const style = document.documentElement.style;
        expect(style.getPropertyValue('--kw-bg')).toBe('#DDDDDD');
        expect(style.getPropertyValue('--kw-bg-sub')).toBe('#EEEEEE');
        expect(style.getPropertyValue('--kw-text')).toBe('#000000');
        expect(style.getPropertyValue('--kw-point-1')).toBe('#6666CC');
        expect(style.getPropertyValue('--kw-point-2')).toBe('#CCCCFF');
        expect(style.getPropertyValue('--kw-on-point-1')).toBe('#FFFFFF');
        expect(style.getPropertyValue('--kw-on-point-2')).toBe('#000000');
        expect(style.getPropertyValue('--kw-text-outline')).toBe('#FFFFFF');
    });
});
