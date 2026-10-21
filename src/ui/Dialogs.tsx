import { useEffect, useRef } from 'react';
import { useUiStore, type Dialog } from '@/stores/uiStore';
import { Button } from './Button';

/**
 * Mac 알림창·확인창 (kkoriworld 4.5): 왼쪽 아이콘, 메시지, 오른쪽 아래 버튼. 데스크톱 위 모달
 * Esc로 취소, 열리면 기본 버튼에 포커스
 */
export function Dialogs() {
    const dialogs = useUiStore((s) => s.dialogs);
    const current = dialogs[0];

    if (!current) {
        return null;
    }

    return (
        <div className="kw-layer-dialogs">
            <div className="kw-dialog-backdrop">
                <DialogBox key={current.id} dialog={current} />
            </div>
        </div>
    );
}

function DialogBox({ dialog }: { dialog: Dialog }) {
    const close = useUiStore((s) => s.closeDialog);
    const okRef = useRef<HTMLButtonElement>(null);

    const finish = (ok: boolean) => {
        close(dialog.id);
        if (dialog.kind === 'alert') {
            dialog.resolve();
        } else {
            dialog.resolve(ok);
        }
    };

    useEffect(() => {
        okRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                finish(false);
            }
        };
        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const icon = dialog.kind === 'alert' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-question';

    return (
        <form
            className="kw-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-label={dialog.message}
            onSubmit={(e) => {
                e.preventDefault();
                finish(true);
            }}
        >
            <div className="kw-dialog-icon">
                <i className={icon} aria-hidden="true" />
            </div>
            <div className="kw-dialog-main">
                <div className="kw-dialog-message">{dialog.message}</div>
                <div className="kw-dialog-actions">
                    {dialog.kind !== 'alert' && <Button onClick={() => finish(false)}>취소</Button>}
                    <Button ref={okRef} type="submit" isDefault>
                        {dialog.okLabel}
                    </Button>
                </div>
            </div>
        </form>
    );
}
