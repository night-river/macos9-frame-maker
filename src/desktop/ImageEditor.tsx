import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { useUiStore, type ImageAdjust, type ImageEdit } from '@/stores/uiStore';
import { Button, Slider } from '@/ui';
import { clampZoom, fitAspect, panFocus, ZOOM_MAX, ZOOM_MIN } from '@/utils/fit';
import { FittedImage } from './FittedImage';

/** 미리보기 최대 크기 (4.2) */
const PREVIEW_MAX = { width: 480, height: 360 };
/** 작은 화면에서 미리보기 바깥(타이틀 바·조작 줄·여백)에 남길 공간 */
const CHROME_SPACE = { width: 60, height: 150 };

/**
 * 이미지 편집 화면 (docs/frame-maker.md 4.2): 오버레이 위 Platinum 윈도우 "이미지 편집"
 * 미리보기는 대상 프레임과 같은 비율. 끌어서 위치, Slider·마우스 휠로 확대, [맞춤 초기화]
 * [취소] [적용](기본), Esc = 취소. PNG에는 포함되지 않는다
 */
export function ImageEditor() {
    const edit = useUiStore((s) => s.imageEdit);

    if (!edit) {
        return null;
    }

    return (
        <div className="kw-layer-modal" data-export-hide>
            <div className="kw-modal-backdrop">
                <EditorWindow key={edit.id} edit={edit} />
            </div>
        </div>
    );
}

function EditorWindow({ edit }: { edit: ImageEdit }) {
    const [adjust, setAdjust] = useState<ImageAdjust>({ focusX: edit.image.focusX, focusY: edit.image.focusY, zoom: clampZoom(edit.image.zoom) });
    const drag = useRef<{ x: number; y: number; start: ImageAdjust } | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const applyRef = useRef<HTMLButtonElement>(null);
    const size = fitAspect(edit.aspect, Math.min(PREVIEW_MAX.width, window.innerWidth - CHROME_SPACE.width), Math.min(PREVIEW_MAX.height, window.innerHeight - CHROME_SPACE.height));
    const image = { ...edit.image, ...adjust };

    // Esc = 취소 (알림창이 위에 떠 있으면 알림창이 먼저)
    useEffect(() => {
        applyRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && useUiStore.getState().dialogs.length === 0) {
                e.preventDefault();
                edit.resolve(null);
            }
        };
        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [edit]);

    // 마우스 휠로 확대 (페이지가 움직이지 않게 passive: false)
    useEffect(() => {
        const el = previewRef.current;
        if (!el) {
            return undefined;
        }
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
            setAdjust((a) => ({ ...a, zoom: clampZoom(a.zoom * Math.exp(-delta * 0.0015)) }));
        };
        el.addEventListener('wheel', onWheel, { passive: false });

        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0) {
            return;
        }
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, y: e.clientY, start: adjust };
    };

    const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
        const d = drag.current;
        if (!d) {
            return;
        }
        const focus = panFocus(size.width, size.height, { ...edit.image, ...d.start }, e.clientX - d.x, e.clientY - d.y);
        setAdjust({ ...d.start, ...focus });
    };

    const endDrag = () => {
        drag.current = null;
    };

    return (
        <form
            className="kw-window is-active kw-modal kw-image-editor"
            aria-label="이미지 편집"
            onSubmit={(e) => {
                e.preventDefault();
                edit.resolve(adjust);
            }}
        >
            <header className="kw-titlebar no-max">
                <button type="button" className="kw-wbtn kw-wbtn-close" aria-label="취소" title="취소" onClick={() => edit.resolve(null)} />
                <span className="kw-window-icon">
                    <i className="fa-solid fa-crop-simple" aria-hidden="true" />
                </span>
                <span className="kw-title-gap" />
                <h2 className="kw-title">
                    <span className="kw-title-text">이미지 편집</span>
                </h2>
            </header>
            <div className="kw-window-body kw-image-editor-body">
                <div
                    ref={previewRef}
                    className="kw-image-editor-preview"
                    style={{ width: size.width, height: size.height }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    title="끌어서 위치 이동, 휠로 확대"
                >
                    <FittedImage src={edit.src} image={image} width={size.width} height={size.height} />
                </div>
            </div>
            <div className="kw-row kw-image-editor-controls">
                <span>확대</span>
                <span className="kw-grow">
                    <Slider label="확대" min={ZOOM_MIN * 100} max={ZOOM_MAX * 100} value={Math.round(adjust.zoom * 100)} onChange={(v) => setAdjust((a) => ({ ...a, zoom: clampZoom(v / 100) }))} />
                </span>
                <span className="kw-image-editor-percent">{Math.round(adjust.zoom * 100)}%</span>
                <Button small onClick={() => setAdjust({ focusX: 0.5, focusY: 0.5, zoom: 1 })}>
                    맞춤 초기화
                </Button>
            </div>
            <div className="kw-row kw-image-editor-actions">
                <Button onClick={() => edit.resolve(null)}>취소</Button>
                <Button ref={applyRef} type="submit" isDefault>
                    적용
                </Button>
            </div>
        </form>
    );
}
