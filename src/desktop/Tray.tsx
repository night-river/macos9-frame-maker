import { useWindowStore } from '@/stores/windowStore';
import { Icon, Tooltip } from '@/ui';
import { windowIcon } from '@/windows/registry';

/**
 * 하단 트레이 (컨트롤 스트립, kkoriworld 5.6): 최소화한 윈도우마다 아이콘 버튼
 * 최소화한 윈도우가 없으면 왼쪽 끝의 작은 손잡이만. 클릭하면 복원하고 맨 앞으로
 */
export function Tray() {
    const windows = useWindowStore((s) => s.windows);
    const restore = useWindowStore((s) => s.restoreWindow);
    const minimized = windows.filter((w) => w.minimized);

    return (
        <div className="kw-tray" role="toolbar" aria-label="최소화한 윈도우">
            <span className="kw-tray-handle" />
            {minimized.map((w) => (
                <Tooltip key={w.id} text={w.title} className="kw-tray-btn-wrap" style={{ display: 'flex' }}>
                    <button type="button" className="kw-tray-btn" onClick={() => restore(w.id)} aria-label={`${w.title} 복원`}>
                        <Icon fa={windowIcon(w.type, { menuKey: w.menuKey })} />
                    </button>
                </Tooltip>
            ))}
            {minimized.length > 0 && <span className="kw-tray-end" />}
        </div>
    );
}
