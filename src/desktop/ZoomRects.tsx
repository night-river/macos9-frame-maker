import { useEffect, useState } from 'react';
import { ZOOM_DURATION, useUiStore, type Rect, type Zoom } from '@/stores/uiStore';

const STEPS = 6;

/**
 * 줌 사각형 (kkoriworld 5.4, 유일한 연출): 시작 위치에서 목표 위치까지 테두리만 있는 사각형 5~6개가 이어진다 (약 180ms)
 */
export function ZoomRects() {
    const zooms = useUiStore((s) => s.zooms);

    return (
        <>
            {zooms.map((zoom) => (
                <ZoomAnimation key={zoom.id} zoom={zoom} />
            ))}
        </>
    );
}

function lerp(a: Rect, b: Rect, t: number): Rect {
    return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        width: a.width + (b.width - a.width) * t,
        height: a.height + (b.height - a.height) * t,
    };
}

function ZoomAnimation({ zoom }: { zoom: Zoom }) {
    const remove = useUiStore((s) => s.removeZoom);
    const [frame, setFrame] = useState(0);

    useEffect(() => {
        const interval = ZOOM_DURATION / STEPS;
        let current = 0;
        const timer = setInterval(() => {
            current += 1;
            if (current > STEPS) {
                clearInterval(timer);
                remove(zoom.id);
            } else {
                setFrame(current);
            }
        }, interval);

        return () => clearInterval(timer);
    }, [zoom.id, remove]);

    // 지금 프레임까지의 사각형을 최근 3개만 남겨 꼬리처럼
    const rects = [];
    for (let i = Math.max(1, frame - 2); i <= frame; i++) {
        rects.push(lerp(zoom.from, zoom.to, i / STEPS));
    }

    return (
        <>
            {rects.map((r, i) => (
                <div key={i} className="kw-zoom-rect" style={{ left: r.x, top: r.y, width: r.width, height: r.height }} />
            ))}
        </>
    );
}
