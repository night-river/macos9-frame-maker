import { useEffect, useState } from 'react';
import { useStickerStore } from '@/stores/stickerStore';
import { rectOf } from '@/stores/uiStore';
import { useWindowStore } from '@/stores/windowStore';
import { Icon } from '@/ui';
import { formatClock } from '@/utils/date';
import { MENU_ITEMS } from '@/windows/registry';

const HOME_ICON = `${import.meta.env.BASE_URL}favicon.svg`;

/**
 * 메뉴 바 (kkoriworld desktop/MenuBar.tsx, docs/frame-maker.md 5.1)
 * 왼쪽: 홈 아이콘 → 메뉴 8종 → 새 윈도우 / 오른쪽 끝부터: 시계 → 스티커 모드 버튼 → 제어판 버튼
 * kkoriworld의 검색 팝업·사용자 메뉴·로그인 버튼은 없다
 */
export function MenuBar() {
    const stickerActive = useStickerStore((s) => s.active);

    return (
        <div className="kw-menubar" role="menubar">
            {/* TODO(P5): 화면을 PNG로 저장 (8장). TODO(P4): homeIcon이 있으면 그 이미지 */}
            <button type="button" className="kw-menubar-item kw-menubar-home" title="화면을 PNG로 저장" aria-label="화면을 PNG로 저장">
                <img src={HOME_ICON} alt="" />
            </button>

            {MENU_ITEMS.map((menu) => (
                <button
                    type="button"
                    key={menu.key}
                    role="menuitem"
                    className="kw-menubar-item"
                    onClick={(e) => useWindowStore.getState().open('menu', { menuKey: menu.key, origin: rectOf(e.currentTarget) })}
                >
                    <span className="kw-menu-icon">
                        <Icon fa={menu.icon} />
                    </span>
                    {menu.label}
                </button>
            ))}

            <button type="button" role="menuitem" className="kw-menubar-item" onClick={(e) => useWindowStore.getState().open('custom', { origin: rectOf(e.currentTarget) })}>
                <span className="kw-menu-icon">
                    <Icon fa="fa-solid fa-plus" />
                </span>
                새 윈도우
            </button>

            <span className="kw-menubar-spacer" />

            <button type="button" className="kw-menubar-item" onClick={(e) => useWindowStore.getState().open('control_panel', { origin: rectOf(e.currentTarget) })}>
                <i className="fa-solid fa-sliders" aria-hidden="true" />
                제어판
            </button>

            <button
                type="button"
                className={['kw-menubar-item', stickerActive && 'is-open'].filter(Boolean).join(' ')}
                onClick={() => (stickerActive ? useStickerStore.getState().exit() : useStickerStore.getState().enter())}
                title={stickerActive ? '스티커 모드 끝내기' : '스티커 모드'}
                aria-pressed={stickerActive}
            >
                <i className="fa-solid fa-note-sticky" aria-hidden="true" />
            </button>

            <Clock />
        </div>
    );
}

/** 시계: 12시간제 `오전 01:27`, 분이 바뀔 때 갱신 */
function Clock() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        const tick = () => {
            setNow(new Date());
            timer = setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50);
        };
        timer = setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50);

        return () => clearTimeout(timer);
    }, []);

    return <span className="kw-menubar-clock">{formatClock(now)}</span>;
}
