import { useEffect } from 'react';
import { MENUBAR_HEIGHT, useWindowStore } from '@/stores/windowStore';
import { Dialogs } from '@/ui';
import { WindowLayer } from '@/windows/WindowLayer';
import { ImageEditor } from './ImageEditor';
import { MenuBar } from './MenuBar';
import { PopupMenu } from './PopupMenu';
import { noticeSmallScreen } from './smallScreen';
import { Tray } from './Tray';
import { Wallpaper } from './Wallpaper';
import { ZoomRects } from './ZoomRects';

/**
 * 데스크톱 (kkoriworld desktop/Desktop.tsx). 레이어 순서 (아래에서 위로):
 * 배경 → 스티커 → 윈도우 → 하단 트레이 → 메뉴 바 → 팝업·툴팁·줌 사각형 → 이미지 편집 화면 → 알림창
 * 브라우저 크기가 바뀌면 데스크톱 영역 크기만 바꾸고, 윈도우는 저장된 비율대로 다시 그린다 (3.1)
 * TODO: 스티커 레이어(P3, 7장)
 */
export function Desktop() {
    const setViewport = useWindowStore((s) => s.setViewport);

    useEffect(() => {
        const onResize = () => setViewport(window.innerWidth, window.innerHeight - MENUBAR_HEIGHT);
        onResize();
        window.addEventListener('resize', onResize);

        return () => window.removeEventListener('resize', onResize);
    }, [setViewport]);

    useEffect(() => noticeSmallScreen(), []);

    return (
        <div className="kw-desktop">
            <Wallpaper />
            <WindowLayer />
            <Tray />
            <MenuBar />
            <div className="kw-layer-popups">
                <PopupMenu />
                <ZoomRects />
            </div>
            <ImageEditor />
            <Dialogs />
        </div>
    );
}
