import { lazy, Suspense, useEffect } from 'react';
import { startPersistence } from './project/persist';
import { useProjectStore } from './stores/projectStore';
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

    return <DesktopRoot />;
}

/** 저장된 프로젝트를 불러온 뒤 데스크톱을 그린다 (3.2) */
function DesktopRoot() {
    const loaded = useProjectStore((s) => s.loaded);

    useEffect(() => {
        void startPersistence();
    }, []);

    return loaded ? <Desktop /> : null;
}
