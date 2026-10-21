import type { ReactNode } from 'react';
import { Rnd } from 'react-rnd';
import { useStickerStore } from '@/stores/stickerStore';
import { useWindowStore, type Win } from '@/stores/windowStore';
import { Icon } from '@/ui';
import { WINDOWS, defaultTitle, windowIcon } from './registry';

/**
 * 윈도우 공통 크롬 (kkoriworld windows/WindowFrame.tsx, docs/frame-maker.md 6장)
 * - 타이틀 바: 버튼은 모두 왼쪽 [닫기][최소화][최대화(크기 조절 가능한 윈도우만)][아이콘] → 줄무늬 → 제목(가운데) → 줄무늬
 * - 이동은 타이틀 바를 잡을 때만, 크기 조절은 오른쪽 아래 상자로만 (Mac 방식)
 * - 숨김(최소화·스티커 모드·줌 중)이어도 언마운트하지 않는다
 * - kkoriworld의 "타이틀 바 더블클릭 = 최대화"는 없앰 (6.2, 더블클릭은 제목 바꾸기 — P1)
 */
export function WindowFrame({ win, active, children }: { win: Win; active: boolean; children: ReactNode }) {
    const hiddenForStickers = useWindowStore((s) => s.hiddenForStickers);
    const { focus, minimize, toggleMaximize, setBounds, close } = useWindowStore.getState();
    const def = WINDOWS[win.type];
    const title = win.title ?? defaultTitle(win.type, win.params);
    const icon = windowIcon(win.type, win.params);
    const hidden = win.minimized || win.appearing || (hiddenForStickers && win.type !== 'sticker_list');
    const resizable = def.resizable && !win.maximized;

    const requestClose = () => {
        if (win.type === 'sticker_list') {
            useStickerStore.getState().exit(); // sticker_list를 닫으면 스티커 모드 종료
        } else {
            close(win.key);
        }
    };

    return (
        <Rnd
            className={['kw-window', active && 'is-active', hidden && 'is-hidden'].filter(Boolean).join(' ')}
            style={{ zIndex: win.z, display: 'flex' }}
            size={{ width: win.width, height: win.height }}
            position={{ x: win.x, y: win.y }}
            minWidth={def.minSize?.width}
            minHeight={def.minSize?.height}
            dragHandleClassName="kw-titlebar"
            cancel=".kw-wbtn"
            disableDragging={win.maximized}
            enableResizing={resizable ? { bottomRight: true } : false}
            resizeHandleComponent={{ bottomRight: <div className="kw-resize-box" aria-hidden="true" /> }}
            resizeHandleStyles={{ bottomRight: { right: 0, bottom: 0, width: 15, height: 15, cursor: 'default' } }}
            onMouseDown={() => focus(win.key)}
            onDragStop={(_e, d) => {
                if (d.x !== win.x || d.y !== win.y) {
                    setBounds(win.key, { x: d.x, y: d.y, width: win.width, height: win.height });
                }
            }}
            onResizeStop={(_e, _dir, el, _delta, pos) => setBounds(win.key, { x: pos.x, y: pos.y, width: el.offsetWidth, height: el.offsetHeight })}
            aria-hidden={hidden}
        >
            <section className="kw-window-inner" aria-label={title} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, minWidth: 0 }}>
                <header className={['kw-titlebar', def.resizable ? 'has-max' : 'no-max'].join(' ')}>
                    <button type="button" className="kw-wbtn kw-wbtn-close" aria-label="닫기" title="닫기" onClick={requestClose} />
                    <button type="button" className="kw-wbtn kw-wbtn-min" aria-label="최소화" title="최소화" onClick={() => minimize(win.key)} />
                    {def.resizable && <button type="button" className="kw-wbtn kw-wbtn-max" aria-label={win.maximized ? '이전 크기로' : '최대화'} title={win.maximized ? '이전 크기로' : '최대화'} onClick={() => toggleMaximize(win.key)} />}
                    <span className="kw-window-icon">
                        <Icon fa={icon} />
                    </span>
                    <span className="kw-title-gap" />
                    <h2 className="kw-title">
                        <span className="kw-title-text">{title}</span>
                    </h2>
                </header>
                {children}
            </section>
        </Rnd>
    );
}
