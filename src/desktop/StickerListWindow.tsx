import { useState } from 'react';
import { askConfirm } from '@/stores/uiStore';
import { EmptyState, FileField, IconButton, Toolbar, WindowBody } from '@/ui';

export interface StickerListItem {
    id: string;
    src: string;
}

/**
 * 스티커 목록 (kkoriworld windows/sticker-list/StickerListWindow.tsx, docs/frame-maker.md 7장, 스티커 모드에서만)
 * 썸네일 격자, 위에 `스티커 올리기`, 칸에 마우스를 올리면 삭제 버튼. 목록에서 누르면 배경 가운데에 놓는다
 * TODO(P3): 프로젝트 데이터의 stickerLibrary와 연결, 업로드는 3.3 규칙
 */
export function StickerListWindow({
    items,
    onUpload,
    onPlace,
    onRemove,
}: {
    items: StickerListItem[];
    /** 실패하면 사용자에게 보여줄 문구를 담은 Error를 던진다 */
    onUpload: (file: File) => Promise<void>;
    onPlace: (id: string) => void;
    onRemove: (id: string) => void;
}) {
    const [error, setError] = useState<string>();
    const [uploading, setUploading] = useState(false);

    const upload = async (file: File | null) => {
        if (!file) {
            return;
        }
        setUploading(true);
        setError(undefined);
        try {
            await onUpload(file);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setUploading(false);
        }
    };

    const remove = async (id: string) => {
        if (await askConfirm('배치된 스티커도 모두 삭제됩니다.', '삭제')) {
            onRemove(id);
        }
    };

    return (
        <>
            <Toolbar>
                <FileField file={null} accept="image/jpeg,image/png,image/webp,image/gif" buttonLabel={uploading ? '올리는 중…' : '스티커 올리기'} onChange={upload} error={error} />
            </Toolbar>
            <WindowBody>
                {items.length === 0 ? (
                    <EmptyState>jpg·png·webp·gif 스티커를 올려 주세요.</EmptyState>
                ) : (
                    <div className="kw-sticker-grid">
                        {items.map((item) => (
                            <div key={item.id} className="kw-sticker-cell">
                                <button type="button" onClick={() => onPlace(item.id)} title="배경에 놓기" aria-label="배경에 놓기">
                                    <img src={item.src} alt="" draggable={false} />
                                </button>
                                <IconButton className="kw-sticker-delete" icon="fa-solid fa-trash" label="스티커 삭제" onClick={() => remove(item.id)} />
                            </div>
                        ))}
                    </div>
                )}
            </WindowBody>
        </>
    );
}
