import type { Win } from '@/stores/windowStore';
import { EmptyState, WindowBody } from '@/ui';

/**
 * 윈도우 종류별 콘텐츠
 * TODO: menu·custom의 이미지 프레임(P2, 6.3), sticker_list(P3, 7장), control_panel(P4, 9장)
 */
export function WindowContent({ win }: { win: Win }) {
    switch (win.type) {
        case 'menu':
        case 'custom':
            return <WindowBody scroll={false}>{null}</WindowBody>;
        default:
            return (
                <WindowBody>
                    <EmptyState>준비 중입니다.</EmptyState>
                </WindowBody>
            );
    }
}
