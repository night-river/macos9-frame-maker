import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PopupMenu } from '@/desktop/PopupMenu';
import { setStorage } from '@/project/storage';
import { useUiStore } from '@/stores/uiStore';
import { useWindowStore } from '@/stores/windowStore';
import { WindowImage } from './WindowImage';

const image = { blobId: 'b1', naturalWidth: 400, naturalHeight: 300, focusX: 0.5, focusY: 0.5, zoom: 1 };

function renderWindow() {
    const win = useWindowStore.getState().windows[0]!;

    return render(
        <>
            <WindowImage win={win} />
            <PopupMenu />
        </>,
    );
}

beforeEach(() => {
    setStorage({ get: async () => undefined, set: async () => undefined, keys: async () => [], del: async () => undefined });
    useUiStore.setState({ dialogs: [], popup: null, imageEdit: null });
    useWindowStore.setState({ windows: [], topZ: 0, viewport: { width: 1000, height: 500 } });
    useWindowStore.getState().open('custom', { animate: false });
    // 바깥 클릭으로 팝업을 닫은 직후로 보지 않게
    vi.spyOn(performance, 'now').mockReturnValue(1e9);
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe('윈도우 이미지 (6.3)', () => {
    it('이미지가 없으면 안내를 보여주고, 안내는 PNG에서 빠진다', () => {
        renderWindow();
        const hint = screen.getByText('클릭해서 이미지 넣기');
        expect(hint.closest('[data-export-hide]')).not.toBeNull();
    });

    it('이미지가 있으면 클릭 위치에 팝업 메뉴, [이미지 지우기]로 지운다', () => {
        const id = useWindowStore.getState().windows[0]!.id;
        useWindowStore.getState().setImage(id, image);
        renderWindow();
        expect(screen.queryByText('클릭해서 이미지 넣기')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: '이미지 메뉴' }), { clientX: 30, clientY: 40 });
        expect(useUiStore.getState().popup).toMatchObject({ x: 30, y: 40 });
        expect(screen.getAllByRole('menuitem').map((b) => b.textContent)).toEqual(['이미지 바꾸기', '위치·크기 편집', '이미지 지우기']);

        act(() => screen.getByRole('menuitem', { name: '이미지 지우기' }).click());
        expect(useWindowStore.getState().windows[0]!.image).toBeNull();
        expect(useUiStore.getState().popup).toBeNull();
    });
});
