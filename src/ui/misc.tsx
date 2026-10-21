import { useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** 윈도우 타이틀 바 아래의 버튼 줄 */
export function Toolbar({ children }: { children: ReactNode }) {
    return <div className="kw-toolbar">{children}</div>;
}

export function ToolbarGap() {
    return <span className="kw-toolbar-gap" />;
}

/** 윈도우의 콘텐츠 영역 (들어간 면). scroll이면 안쪽 스크롤 */
export function WindowBody({ children, scroll = true, className, style }: { children: ReactNode; scroll?: boolean; className?: string; style?: CSSProperties }) {
    return (
        <div className={['kw-window-body', className].filter(Boolean).join(' ')} style={style}>
            {scroll ? <div className="kw-window-scroll">{children}</div> : children}
        </div>
    );
}

/** 목록이 비었을 때 가운데 안내 문구 */
export function EmptyState({ children }: { children: ReactNode }) {
    return <div className="kw-empty">{children}</div>;
}

/** Mac 시계 커서 느낌의 작은 아이콘 (불러오는 중) */
export function Spinner() {
    return (
        <div className="kw-spinner" role="status" aria-label="불러오는 중">
            <i className="fa-regular fa-clock" aria-hidden="true" />
        </div>
    );
}

/** 들어간 트랙 + --kw-point-1 채움 */
export function ProgressBar({ value, max = 100, label }: { value: number; max?: number; label?: string }) {
    const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

    return (
        <div className="kw-progress" role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
            <span style={{ width: `${percent}%` }} />
        </div>
    );
}

export function Slider({ value, onChange, min = 0, max = 100, vertical, label }: { value: number; onChange: (value: number) => void; min?: number; max?: number; vertical?: boolean; label: string }) {
    const percent = ((value - min) / (max - min)) * 100;

    return (
        <input
            type="range"
            className={['kw-slider', vertical && 'is-vertical'].filter(Boolean).join(' ')}
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label={label}
            style={{ '--kw-fill': `${percent}%` } as CSSProperties}
        />
    );
}

/** Mac 풍선 도움말처럼 노란 툴팁. 마우스를 올리면 커서 옆에 */
export function Tooltip({ text, children, className, style }: { text: string | null | undefined; children: ReactNode; className?: string; style?: CSSProperties }) {
    const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

    if (!text) {
        return (
            <span className={className} style={style}>
                {children}
            </span>
        );
    }

    return (
        <span
            className={className}
            style={style}
            onMouseMove={(e) => setPos({ x: e.clientX + 12, y: e.clientY + 16 })}
            onMouseLeave={() => setPos(null)}
        >
            {children}
            {pos &&
                createPortal(
                    <div className="kw-tooltip" style={{ left: Math.min(pos.x, window.innerWidth - 270), top: Math.min(pos.y, window.innerHeight - 40) }}>
                        {text}
                    </div>,
                    document.body,
                )}
        </span>
    );
}

/** 테두리 상자 + 제목 */
export function Group({ title, children }: { title: ReactNode; children: ReactNode }) {
    return (
        <fieldset className="kw-group" style={{ margin: 0 }}>
            <legend className="kw-group-title" style={{ position: 'static', padding: '0 4px', marginLeft: -2 }}>
                {title}
            </legend>
            <div className="kw-stack">{children}</div>
        </fieldset>
    );
}
