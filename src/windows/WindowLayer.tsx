import { activeWindowKey, useWindowStore } from '@/stores/windowStore';
import { WindowContent } from './WindowContent';
import { WindowFrame } from './WindowFrame';

/** 열려 있는 윈도우 전부 (윈도우 레이어). 맨 앞 윈도우만 "활성" 모양 */
export function WindowLayer() {
    const windows = useWindowStore((s) => s.windows);
    const active = activeWindowKey(windows);

    return (
        <div className="kw-layer-windows">
            {windows.map((win) => (
                <WindowFrame key={win.key} win={win} active={win.key === active}>
                    <WindowContent win={win} />
                </WindowFrame>
            ))}
        </div>
    );
}
