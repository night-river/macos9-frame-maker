import type { MouseEvent } from 'react';
import { useBlobUrl } from '@/project/blobs';
import { useProjectStore } from '@/stores/projectStore';
import { useStickerStore } from '@/stores/stickerStore';
import { useUiStore } from '@/stores/uiStore';
import { useWindowStore } from '@/stores/windowStore';
import { adjustImage, chooseImage } from './imageActions';
import { FittedImage } from './FittedImage';
import { popupJustDismissed } from './PopupMenu';

/** 데스크톱 영역의 가로/세로 (편집 화면 비율) */
const desktopAspect = () => {
    const { width, height } = useWindowStore.getState().viewport;

    return width / Math.max(height, 1);
};

/**
 * 배경 (docs/frame-maker.md 5.2): 데스크톱 영역(메뉴 바 아래)이 프레임. 이미지가 없으면 --kw-bg
 * 빈 배경을 클릭하면: 이미지가 없으면 파일 선택 → 편집 화면, 있으면 팝업 메뉴. 스티커 모드 중에는 동작하지 않는다
 */
export function Wallpaper() {
    const wallpaper = useProjectStore((s) => s.wallpaper);
    const viewport = useWindowStore((s) => s.viewport);
    const src = useBlobUrl(wallpaper?.blobId);
    const { setWallpaper } = useProjectStore.getState();

    const onClick = (e: MouseEvent<HTMLDivElement>) => {
        if (useStickerStore.getState().active || popupJustDismissed()) {
            return;
        }
        if (!wallpaper) {
            void chooseImage(desktopAspect, setWallpaper);
            return;
        }
        useUiStore.getState().openPopup(e.clientX, e.clientY, [
            { label: '배경 바꾸기', onSelect: () => void chooseImage(desktopAspect, setWallpaper) },
            { label: '위치·크기 편집', onSelect: () => void adjustImage(wallpaper, desktopAspect(), setWallpaper) },
            { label: '배경 지우기', separated: true, onSelect: () => setWallpaper(null) },
        ]);
    };

    return (
        <div className="kw-layer-wallpaper" onClick={onClick}>
            {wallpaper && <FittedImage src={src} image={wallpaper} width={viewport.width} height={viewport.height} />}
        </div>
    );
}
