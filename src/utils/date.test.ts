import { describe, expect, it } from 'vitest';
import { formatClock } from './date';

describe('메뉴 바 시계', () => {
    it('12시간제 오전/오후 hh:mm (PC 시간대)', () => {
        expect(formatClock(new Date(2026, 9, 19, 1, 27))).toBe('오전 01:27');
        expect(formatClock(new Date(2026, 9, 19, 12, 5))).toBe('오후 12:05');
        expect(formatClock(new Date(2026, 9, 19, 0, 0))).toBe('오전 12:00');
        expect(formatClock(new Date(2026, 9, 19, 23, 59))).toBe('오후 11:59');
    });
});
