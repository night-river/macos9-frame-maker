import { useRef, type KeyboardEvent } from 'react';
import { adjustImage, chooseImage } from '@/desktop/imageActions';
import { FittedImage } from '@/desktop/FittedImage';
import { popupJustDismissed } from '@/desktop/PopupMenu';
import { useBlobUrl } from '@/project/blobs';
import type { ImageRef } from '@/project/types';
import { useUiStore } from '@/stores/uiStore';
import { useWindowStore, type Win } from '@/stores/windowStore';
import { Icon, WindowBody } from '@/ui';
import { useElementSize } from '@/utils/useElementSize';

/**
 * 윈도우 안의 이미지 (docs/frame-maker.md 6.3): 콘텐츠 영역 전체가 이미지 프레임
 * 이미지가 없으면 안내(PNG에서 빠짐) → 클릭하면 파일 선택 → 편집 화면
 * 이미지가 있으면 4.1로 표시, 클릭하면 팝업 메뉴 [이미지 바꾸기] [위치·크기 편집] [이미지 지우기]
 */
export function WindowImage({ win }: { win: Win }) {
    const frameRef = useRef<HTMLDivElement>(null);
    const size = useElementSize(frameRef);
    const src = useBlobUrl(win.image?.blobId);

    const setImage = (image: ImageRef | null) => useWindowStore.getState().setImage(win.id, image);
    // 편집 화면 비율 = 지금 콘텐츠 영역
    const aspect = () => {
        const el = frameRef.current;

        return el && el.clientHeight > 0 ? el.clientWidth / el.clientHeight : 4 / 3;
    };

    const act = (x: number, y: number) => {
        const image = win.image;
        if (!image) {
            void chooseImage(aspect, setImage);
            return;
        }
        useUiStore.getState().openPopup(x, y, [
            { label: '이미지 바꾸기', onSelect: () => void chooseImage(aspect, setImage) },
            { label: '위치·크기 편집', onSelect: () => void adjustImage(image, aspect(), setImage) },
            { label: '이미지 지우기', separated: true, onSelect: () => setImage(null) },
        ]);
    };

    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const r = e.currentTarget.getBoundingClientRect();
            act(r.left + r.width / 2, r.top + r.height / 2);
        }
    };

    return (
        <WindowBody scroll={false}>
            <div
                ref={frameRef}
                className="kw-image-frame"
                role="button"
                tabIndex={0}
                aria-label={win.image ? '이미지 메뉴' : '이미지 넣기'}
                onClick={(e) => !popupJustDismissed() && act(e.clientX, e.clientY)}
                onKeyDown={onKeyDown}
            >
                {win.image ? (
                    <FittedImage src={src} image={win.image} width={size.width} height={size.height} />
                ) : (
                    <div className="kw-image-empty" data-export-hide>
                        <Icon fa="fa-regular fa-image" />
                        <span>클릭해서 이미지 넣기</span>
                    </div>
                )}
            </div>
        </WindowBody>
    );
}
