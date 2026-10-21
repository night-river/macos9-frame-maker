import type { Win } from '@/stores/windowStore';
import { EmptyState, WindowBody } from '@/ui';
import { WindowImage } from './WindowImage';

/**
 * 윈도우 종류별 콘텐츠
 * TODO: sticker_list(P3, 7장), control_panel(P4, 9장)
 */
export function WindowContent({ win }: { win: Win }) {
    switch (win.type) {
        case 'menu':
        case 'custom':
            return <WindowImage win={win} />;
        default:
            return (
                <WindowBody>
                    <EmptyState>준비 중입니다.</EmptyState>
                </WindowBody>
            );
    }
}
