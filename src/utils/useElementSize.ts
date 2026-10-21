import { useLayoutEffect, useState, type RefObject } from 'react';

/** 요소의 안쪽 크기(px). 크기가 바뀌면 다시 그린다 (ResizeObserver가 없으면 처음 한 번만) */
export function useElementSize(ref: RefObject<HTMLElement | null>): { width: number; height: number } {
    const [size, setSize] = useState({ width: 0, height: 0 });

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) {
            return undefined;
        }
        const measure = () => {
            const width = el.clientWidth;
            const height = el.clientHeight;
            setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
        };
        measure();
        if (typeof ResizeObserver === 'undefined') {
            return undefined;
        }
        const observer = new ResizeObserver(measure);
        observer.observe(el);

        return () => observer.disconnect();
    }, [ref]);

    return size;
}
