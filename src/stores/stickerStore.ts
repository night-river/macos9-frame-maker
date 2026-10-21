import { create } from 'zustand';
import { useWindowStore } from './windowStore';

/**
 * 스티커 모드 (kkoriworld docs/frontend.md 9장, ui-decisions 6장 / docs/frame-maker.md 7장)
 * 진입하면 열려 있던 윈도우를 모두 숨기고(상태 유지) sticker_list를 연다. 종료하면 원래대로
 */
interface StickerState {
    active: boolean;
    selectedId: string | null;
    enter: () => void;
    exit: () => void;
    select: (id: string | null) => void;
}

export const useStickerStore = create<StickerState>()((set, get) => ({
    active: false,
    selectedId: null,
    enter: () => {
        if (get().active) {
            return;
        }
        set({ active: true, selectedId: null });
        const windows = useWindowStore.getState();
        windows.setHiddenForStickers(true);
        windows.open('sticker_list');
    },
    exit: () => {
        if (!get().active) {
            return;
        }
        set({ active: false, selectedId: null });
        const windows = useWindowStore.getState();
        windows.close('sticker_list');
        windows.setHiddenForStickers(false);
    },
    select: (id) => set({ selectedId: id }),
}));
