import { lazy, Suspense, type CSSProperties } from 'react';
import { useStickerStore } from '@/stores/stickerStore';

/** 스티커 편집기(react-moveable)는 스티커 모드에 들어갈 때만 불러온다 */
const StickerEditor = lazy(() => import('./StickerEditor'));

export interface StickerFrame {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
}

/** 화면에 그릴 스티커 하나 (px). 프로젝트 데이터(비율)에서 바꾸는 일은 부르는 쪽이 한다 */
export interface StickerView extends StickerFrame {
    id: string;
    src: string;
    z: number;
}

export interface StickerActions {
    /** 끌기·크기 조절·회전을 놓는 순간 */
    onChange: (id: string, frame: StickerFrame) => void;
    onRemove: (id: string) => void;
    /** 앞으로·뒤로 */
    onReorder: (id: string, z: number) => void;
}

/**
 * 스티커 (kkoriworld desktop/StickerLayer.tsx, docs/frame-maker.md 7장)
 * 평소에는 배경 장식(클릭·드래그 불가), 스티커 모드에서는 위로 올라와 편집 (StickerEditor)
 * TODO(P3): 프로젝트 데이터의 stickers와 연결 (비율 좌표, 3.1)
 */
export function StickerLayer({ stickers, ...actions }: { stickers: StickerView[] } & StickerActions) {
    const active = useStickerStore((s) => s.active);
    const sorted = [...stickers].sort((a, b) => a.z - b.z);

    if (active) {
        return (
            <Suspense fallback={<StaticStickers stickers={sorted} />}>
                <StickerEditor stickers={sorted} {...actions} />
            </Suspense>
        );
    }

    return <StaticStickers stickers={sorted} />;
}

function StaticStickers({ stickers }: { stickers: StickerView[] }) {
    return (
        <div className="kw-layer-stickers">
            {stickers.map((s) => (
                <div key={s.id} className="kw-sticker" style={stickerStyle(s)}>
                    <img src={s.src} alt="" draggable={false} />
                </div>
            ))}
        </div>
    );
}

export function stickerStyle(f: StickerFrame & { z?: number }): CSSProperties {
    return { left: f.x, top: f.y, width: f.width, height: f.height, transform: `rotate(${f.rotation}deg)`, zIndex: f.z };
}
