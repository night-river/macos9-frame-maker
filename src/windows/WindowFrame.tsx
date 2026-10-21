import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Rnd } from 'react-rnd';
import { useStickerStore } from '@/stores/stickerStore';
import { askConfirm } from '@/stores/uiStore';
import { useWindowStore, windowBounds, type Win } from '@/stores/windowStore';
import { Icon } from '@/ui';
import { TITLE_MAX, WINDOWS, windowIcon } from './registry';

/**
 * 윈도우 공통 크롬 (kkoriworld windows/WindowFrame.tsx, docs/frame-maker.md 6장)
 * - 타이틀 바: 버튼은 모두 왼쪽 [닫기][최소화][최대화(크기 조절 가능한 윈도우만)][아이콘] → 줄무늬 → 제목(가운데) → 줄무늬
 * - 이동은 타이틀 바를 잡을 때만, 크기 조절은 오른쪽 아래 상자로만 (Mac 방식)
 * - 타이틀 바 더블클릭 = 제목 바꾸기 (kkoriworld의 "더블클릭 = 최대화"는 없앰, 6.2)
 * - 숨김(최소화·스티커 모드·줌 중)이어도 언마운트하지 않는다
 */
export function WindowFrame({ win, active, children }: { win: Win; active: boolean; children: ReactNode }) {
    const hiddenForStickers = useWindowStore((s) => s.hiddenForStickers);
    const viewport = useWindowStore((s) => s.viewport);
    const { focus, minimize, toggleMaximize, setBounds, close } = useWindowStore.getState();
    const [editing, setEditing] = useState(false);
    const def = WINDOWS[win.type];
    const bounds = windowBounds(win, viewport);
    const hidden = win.minimized || win.appearing || (hiddenForStickers && win.type !== 'sticker_list');
    const resizable = def.resizable && !win.maximized;
    const renamable = win.type === 'menu' || win.type === 'custom';

    const requestClose = async () => {
        if (win.type === 'sticker_list') {
            useStickerStore.getState().exit(); // sticker_list를 닫으면 스티커 모드 종료
            return;
        }
        if (win.image && !(await askConfirm('이 윈도우와 이미지를 지울까요?', '지우기'))) {
            return;
        }
        close(win.id);
    };

    return (
        <Rnd
            className={['kw-window', active && 'is-active', hidden && 'is-hidden'].filter(Boolean).join(' ')}
            style={{ zIndex: win.z, display: 'flex' }}
            size={{ width: bounds.width, height: bounds.height }}
            position={{ x: bounds.x, y: bounds.y }}
            minWidth={def.minSize?.width}
            minHeight={def.minSize?.height}
            dragHandleClassName="kw-titlebar"
            cancel=".kw-wbtn, .kw-title-input"
            disableDragging={win.maximized || editing}
            enableResizing={resizable ? { bottomRight: true } : false}
            resizeHandleComponent={{ bottomRight: <div className="kw-resize-box" aria-hidden="true" /> }}
            resizeHandleStyles={{ bottomRight: { right: 0, bottom: 0, width: 15, height: 15, cursor: 'default' } }}
            onMouseDown={() => focus(win.id)}
            onDragStop={(_e, d) => {
                if (d.x !== bounds.x || d.y !== bounds.y) {
                    setBounds(win.id, { x: d.x, y: d.y, width: bounds.width, height: bounds.height });
                }
            }}
            onResizeStop={(_e, _dir, el, _delta, pos) => setBounds(win.id, { x: pos.x, y: pos.y, width: el.offsetWidth, height: el.offsetHeight })}
            aria-hidden={hidden}
        >
            <section className="kw-window-inner" aria-label={win.title} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, minWidth: 0 }}>
                <header
                    className={['kw-titlebar', def.resizable ? 'has-max' : 'no-max'].join(' ')}
                    onDoubleClick={(e) => {
                        if (renamable && !(e.target as HTMLElement).closest('.kw-wbtn')) {
                            setEditing(true);
                        }
                    }}
                >
                    <button type="button" className="kw-wbtn kw-wbtn-close" aria-label="닫기" title="닫기" onClick={requestClose} />
                    <button type="button" className="kw-wbtn kw-wbtn-min" aria-label="최소화" title="최소화" onClick={() => minimize(win.id)} />
                    {def.resizable && <button type="button" className="kw-wbtn kw-wbtn-max" aria-label={win.maximized ? '이전 크기로' : '최대화'} title={win.maximized ? '이전 크기로' : '최대화'} onClick={() => toggleMaximize(win.id)} />}
                    <span className="kw-window-icon">
                        <Icon fa={windowIcon(win.type, { menuKey: win.menuKey })} />
                    </span>
                    <span className="kw-title-gap" />
                    <h2 className="kw-title">
                        {editing ? <TitleInput win={win} onDone={() => setEditing(false)} /> : <span className="kw-title-text">{win.title}</span>}
                    </h2>
                </header>
                {children}
            </section>
        </Rnd>
    );
}

/** 제목 입력란 (6.2): Enter 저장, Esc 취소, 다른 곳을 누르면 저장, 최대 40자, 비우면 기본 제목 */
function TitleInput({ win, onDone }: { win: Win; onDone: () => void }) {
    const [value, setValue] = useState(win.title);
    // Esc로 닫힌 뒤 blur가 한 번 더 와도 저장하지 않게
    const finished = useRef(false);

    const finish = (save: boolean) => {
        if (finished.current) {
            return;
        }
        finished.current = true;
        if (save) {
            useWindowStore.getState().rename(win.id, value);
        }
        onDone();
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            finish(true);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            finish(false);
        }
    };

    return (
        <input
            className="kw-title-input"
            value={value}
            maxLength={TITLE_MAX}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => finish(true)}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="윈도우 제목"
            autoFocus
        />
    );
}
