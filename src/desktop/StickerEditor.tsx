import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Moveable from 'react-moveable';
import { useStickerStore } from '@/stores/stickerStore';
import { askConfirm } from '@/stores/uiStore';
import { IconButton } from '@/ui';
import { stickerStyle, type StickerActions, type StickerFrame, type StickerView } from './StickerLayer';

/**
 * 스티커 모드 편집 (kkoriworld desktop/StickerEditor.tsx, docs/frame-maker.md 7장)
 * 배치된 스티커를 누르면 선택 → 이동·크기 조절(비율 유지)·회전 핸들, 옆에 작은 툴바(앞으로·뒤로·삭제)
 * 끌기·크기 조절·회전을 놓는 순간 onChange (kkoriworld의 서버 저장 대신 자동 저장, 3.2)
 */
export default function StickerEditor({ stickers, ...actions }: { stickers: StickerView[] } & StickerActions) {
    const selectedId = useStickerStore((s) => s.selectedId);
    const select = useStickerStore((s) => s.select);

    return (
        <div
            className="kw-layer-stickers is-editing"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    select(null);
                }
            }}
        >
            {stickers.map((s) => (
                <EditableSticker key={s.id} sticker={s} selected={selectedId === s.id} onSelect={() => select(s.id)} all={stickers} {...actions} />
            ))}
        </div>
    );
}

const sameFrame = (a: StickerFrame, b: StickerFrame) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height && a.rotation === b.rotation;

/** 저장할 때만 정수로 맞춘다 (조작 중에는 반올림하지 않음) */
const roundFrame = (f: StickerFrame): StickerFrame => ({
    x: Math.round(f.x),
    y: Math.round(f.y),
    width: Math.max(1, Math.round(f.width)),
    height: Math.max(1, Math.round(f.height)),
    rotation: Math.round(f.rotation * 100) / 100,
});

const toolbarTop = (y: number) => Math.max(24, y - 30);

const frameOf = (s: StickerView): StickerFrame => ({ x: s.x, y: s.y, width: s.width, height: s.height, rotation: s.rotation });

/**
 * 조작 중에는 React 상태를 건드리지 않고 요소의 style만 바꾼다 (이동·크기는 translate로 임시 표시).
 * 손을 떼는 순간 translate를 left/top에 한 번 더해 상태로 확정하고(같은 프레임에 transform은 rotate만 남김) 저장한다.
 * 렌더링은 항상 left=x, top=y, transform=rotate(회전) 한 가지 방식
 */
function EditableSticker({ sticker, selected, onSelect, all, onChange, onRemove, onReorder }: { sticker: StickerView; selected: boolean; onSelect: () => void; all: StickerView[] } & StickerActions) {
    const ref = useRef<HTMLDivElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const moveableRef = useRef<Moveable>(null);
    const [frame, setFrame] = useState<StickerFrame>(() => frameOf(sticker));
    const frameRef = useRef<StickerFrame>(frame);
    // 조작을 시작한 순간의 값 (끝날 때 translate를 더할 기준)
    const startRef = useRef<StickerFrame>(frame);
    // 조작 중에는 바깥 값으로 덮어쓰지 않는다
    const busy = useRef(false);

    // 바깥 값이 바뀌었을 때만(화면 크기 변경 등) 다시 맞춤
    useEffect(() => {
        const next = frameOf(sticker);
        if (busy.current || sameFrame(frameRef.current, next)) {
            return;
        }
        frameRef.current = next;
        setFrame(next);
    }, [sticker]);

    /** 확정: DOM과 상태를 같은 프레임에 맞추고 핸들 위치를 다시 계산 */
    const commit = (next: StickerFrame) => {
        const el = ref.current;
        if (el) {
            el.style.left = `${next.x}px`;
            el.style.top = `${next.y}px`;
            el.style.width = `${next.width}px`;
            el.style.height = `${next.height}px`;
            el.style.transform = `rotate(${next.rotation}deg)`;
        }
        frameRef.current = next;
        flushSync(() => setFrame(next));
        moveableRef.current?.updateRect();
    };

    const moveToolbar = (x: number, y: number) => {
        if (toolbarRef.current) {
            toolbarRef.current.style.left = `${x}px`;
            toolbarRef.current.style.top = `${toolbarTop(y)}px`;
        }
    };

    const begin = () => {
        busy.current = true;
        startRef.current = frameRef.current;
    };

    const finish = (next: StickerFrame | null) => {
        busy.current = false;
        if (!next) {
            return;
        }
        const rounded = roundFrame(next);
        commit(rounded);
        onChange(sticker.id, rounded);
    };

    const remove = async () => {
        if (!(await askConfirm('이 스티커를 배경에서 뺄까요?', '삭제'))) {
            return;
        }
        onRemove(sticker.id);
        useStickerStore.getState().select(null);
    };

    const zValues = all.map((s) => s.z);

    return (
        <>
            <div
                ref={ref}
                className="kw-sticker"
                style={{ ...stickerStyle({ ...frame, z: sticker.z }), cursor: 'move' }}
                onMouseDown={(e) => {
                    e.stopPropagation();
                    onSelect();
                }}
            >
                <img src={sticker.src} alt="" draggable={false} />
            </div>
            {selected && (
                <>
                    <Moveable
                        ref={moveableRef}
                        target={ref}
                        draggable
                        resizable
                        rotatable
                        keepRatio
                        origin={false}
                        onDragStart={begin}
                        onDrag={(e) => {
                            e.target.style.transform = e.transform;
                            moveToolbar(startRef.current.x + e.beforeTranslate[0], startRef.current.y + e.beforeTranslate[1]);
                        }}
                        onDragEnd={(e) => {
                            const s = startRef.current;
                            const last = e.lastEvent;
                            finish(last ? { ...s, x: s.x + last.beforeTranslate[0], y: s.y + last.beforeTranslate[1] } : null);
                        }}
                        onResizeStart={(e) => {
                            begin();
                            e.setOrigin(['%', '%']);
                            if (e.dragStart) {
                                e.dragStart.set([0, 0]);
                            }
                        }}
                        onResize={(e) => {
                            // 왼쪽·위쪽 핸들은 위치도 함께 바뀌므로 크기와 translate를 같이 적용
                            e.target.style.width = `${e.width}px`;
                            e.target.style.height = `${e.height}px`;
                            e.target.style.transform = e.drag.transform;
                            moveToolbar(startRef.current.x + e.drag.beforeTranslate[0], startRef.current.y + e.drag.beforeTranslate[1]);
                        }}
                        onResizeEnd={(e) => {
                            const s = startRef.current;
                            const last = e.lastEvent;
                            finish(
                                last
                                    ? { ...s, x: s.x + last.drag.beforeTranslate[0], y: s.y + last.drag.beforeTranslate[1], width: last.width, height: last.height }
                                    : null,
                            );
                        }}
                        onRotateStart={begin}
                        onRotate={(e) => {
                            e.target.style.transform = e.transform;
                        }}
                        onRotateEnd={(e) => finish(e.lastEvent ? { ...startRef.current, rotation: e.lastEvent.rotation } : null)}
                    />
                    <div
                        ref={toolbarRef}
                        className="kw-sticker-toolbar"
                        style={{ left: frame.x, top: toolbarTop(frame.y), zIndex: 1000 }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <IconButton icon="fa-solid fa-arrow-up" label="앞으로" onClick={() => onReorder(sticker.id, Math.max(...zValues) + 1)} />
                        <IconButton icon="fa-solid fa-arrow-down" label="뒤로" onClick={() => onReorder(sticker.id, Math.min(...zValues) - 1)} />
                        <IconButton icon="fa-solid fa-trash" label="삭제" onClick={remove} />
                    </div>
                </>
            )}
        </>
    );
}
