import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useUiStore, type Popup } from '@/stores/uiStore';

/** 바깥을 눌러 팝업을 닫은 시각. 그 클릭이 배경·이미지에 닿아도 새 팝업을 열지 않게 */
let dismissedAt = -Infinity;
const DISMISS_CLICK_MS = 600;

/** 방금 바깥 클릭으로 팝업이 닫혔는지 (그 클릭은 메뉴를 닫는 데만 쓴다) */
export function popupJustDismissed(): boolean {
    return performance.now() - dismissedAt < DISMISS_CLICK_MS;
}

/**
 * 클릭한 위치의 작은 팝업 메뉴 (docs/frame-maker.md 5.2, 6.3)
 * 다른 곳을 누르거나 Esc, 화면 크기가 바뀌면 닫힌다. 화면 밖으로 나가지 않게 위치를 당긴다
 */
export function PopupMenu() {
    const popup = useUiStore((s) => s.popup);

    return popup ? <PopupBox key={popup.id} popup={popup} /> : null;
}

function PopupBox({ popup }: { popup: Popup }) {
    const ref = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ left: popup.x, top: popup.y });
    const close = useUiStore((s) => s.closePopup);

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) {
            return;
        }
        setPos({ left: Math.max(0, Math.min(popup.x, window.innerWidth - el.offsetWidth - 2)), top: Math.max(0, Math.min(popup.y, window.innerHeight - el.offsetHeight - 2)) });
        el.querySelector<HTMLElement>('.kw-dropdown-item')?.focus();
    }, [popup]);

    useEffect(() => {
        const onPointerDown = (e: PointerEvent) => {
            if (!ref.current?.contains(e.target as Node)) {
                dismissedAt = performance.now();
                close();
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                close();
            }
        };
        document.addEventListener('pointerdown', onPointerDown, true);
        window.addEventListener('keydown', onKey);
        window.addEventListener('resize', close);
        window.addEventListener('blur', close);

        return () => {
            document.removeEventListener('pointerdown', onPointerDown, true);
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('resize', close);
            window.removeEventListener('blur', close);
        };
    }, [close]);

    return (
        <div ref={ref} className="kw-dropdown" role="menu" style={pos} data-export-hide>
            <div className="kw-dropdown-items">
                {popup.items.map((item) => (
                    <Fragment key={item.label}>
                        {item.separated && <div className="kw-dropdown-sep" />}
                        <button
                            type="button"
                            role="menuitem"
                            className="kw-dropdown-item"
                            onClick={() => {
                                // 파일 선택 창은 사용자가 누른 이벤트 안에서 열어야 하므로 기다리지 않고 바로 부른다
                                close();
                                item.onSelect();
                            }}
                        >
                            {item.label}
                        </button>
                    </Fragment>
                ))}
            </div>
        </div>
    );
}
