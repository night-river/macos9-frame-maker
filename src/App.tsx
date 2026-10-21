import { lazy, Suspense } from 'react';
import { Desktop } from './desktop/Desktop';

/** 개발 중 확인용 키트 화면 (/?kit=1, 개발 빌드에서만) */
const Kit = import.meta.env.DEV ? lazy(() => import('@/ui/Kit')) : null;

export function App() {
    if (Kit && new URLSearchParams(window.location.search).get('kit') === '1') {
        return (
            <Suspense fallback={null}>
                <Kit />
            </Suspense>
        );
    }

    return <Desktop />;
}
