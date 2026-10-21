import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Kit from './Kit';

describe('디자인 키트 (/?kit=1)', () => {
    it('기본 컴포넌트와 윈도우 프레임 견본을 그린다', () => {
        render(<Kit />);
        expect(screen.getByText('활성 윈도우')).toBeTruthy();
        expect(screen.getByText('비활성 윈도우')).toBeTruthy();
        expect(screen.getByText('크기 고정 윈도우')).toBeTruthy();
        expect(screen.getAllByLabelText('색 코드').length).toBeGreaterThanOrEqual(6); // 견본 1 + 테마 색 5
    });
});
