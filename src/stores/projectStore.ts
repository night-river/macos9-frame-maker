import { create } from 'zustand';
import { emptyProject, type ImageRef, type Project } from '@/project/types';

/**
 * 프로젝트 데이터 중 윈도우를 뺀 나머지 (docs/frame-maker.md 3.1). 윈도우는 windowStore가 든다
 * TODO: 테마(P4), 홈 아이콘(P4), 스티커(P3)를 바꾸는 동작
 */
type ProjectMeta = Omit<Project, 'windows'>;

interface ProjectState extends ProjectMeta {
    /** 저장된 프로젝트를 불러왔는지 (불러오기 전에는 화면을 그리지 않고 저장하지도 않는다) */
    loaded: boolean;
    hydrate: (meta: ProjectMeta) => void;
    /** 배경 이미지 넣기·바꾸기·지우기 (5.2) */
    setWallpaper: (image: ImageRef | null) => void;
}

function emptyMeta(): ProjectMeta {
    const { version, theme, wallpaper, homeIcon, stickerLibrary, stickers } = emptyProject();

    return { version, theme, wallpaper, homeIcon, stickerLibrary, stickers };
}

export const useProjectStore = create<ProjectState>()((set) => ({
    ...emptyMeta(),
    loaded: false,
    hydrate: (meta) => set({ ...meta, loaded: true }),
    setWallpaper: (wallpaper) => set({ wallpaper }),
}));
