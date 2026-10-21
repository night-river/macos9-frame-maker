import { describe, expect, it } from 'vitest';
import { isHexColor, textColorOn } from './color';

describe('포인트 색 위 글자색', () => {
    it('밝은 색 위는 검정, 어두운 색 위는 흰색', () => {
        expect(textColorOn('#CCCCFF')).toBe('#000000'); // 기본 point_2
        expect(textColorOn('#FFFFFF')).toBe('#000000');
        expect(textColorOn('#FFFF00')).toBe('#000000');
        expect(textColorOn('#000000')).toBe('#FFFFFF');
        expect(textColorOn('#333399')).toBe('#FFFFFF');
    });

    it('기본 point_1(#6666CC)은 대비가 큰 쪽', () => {
        expect(['#000000', '#FFFFFF']).toContain(textColorOn('#6666CC'));
        expect(textColorOn('#6666CC')).toBe('#FFFFFF');
    });

    it('형식이 틀리면 검정', () => {
        expect(isHexColor('#abc')).toBe(false);
        expect(textColorOn('red')).toBe('#000000');
    });
});
