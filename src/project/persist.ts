import { get as idbGet, set as idbSet } from 'idb-keyval';
import { useProjectStore } from '@/stores/projectStore';
import { showAlert } from '@/stores/uiStore';
import { toFrameWindows, useWindowStore } from '@/stores/windowStore';
import { applyTheme } from '@/utils/theme';
import { emptyProject, type Project } from './types';
import { parseProject } from './validate';

/** 프로젝트 저장·불러오기 (docs/frame-maker.md 3.2) */

export const PROJECT_KEY = 'project';
export const SAVE_DELAY = 500;
export const QUOTA_MESSAGE = '브라우저 저장 공간이 부족합니다. 사용하지 않는 이미지를 지워주세요.';

/** 저장소 (테스트에서는 메모리로 바꿔 끼운다) */
export interface ProjectStorage {
    get: (key: string) => Promise<unknown>;
    set: (key: string, value: unknown) => Promise<void>;
}

export const idbStorage: ProjectStorage = { get: (key) => idbGet(key), set: (key, value) => idbSet(key, value) };

/** 없거나 형식이 맞지 않거나 읽기에 실패하면 빈 프로젝트 */
export async function loadProject(storage: ProjectStorage): Promise<Project> {
    try {
        const project = parseProject(await storage.get(PROJECT_KEY));
        if (project) {
            return project;
        }
    } catch (error) {
        console.error('프로젝트를 불러오지 못했습니다.', error);
    }

    return emptyProject();
}

/** 지금 화면 상태를 프로젝트 데이터로 */
export function currentProject(): Project {
    const { version, theme, wallpaper, homeIcon, stickerLibrary, stickers } = useProjectStore.getState();

    return { version, theme, wallpaper, homeIcon, windows: toFrameWindows(useWindowStore.getState().windows), stickerLibrary, stickers };
}

export function isQuotaError(error: unknown): boolean {
    return error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
}

/** 연속 변경은 마지막 변경 delay 뒤 한 번으로 묶는다 */
export function createDebounced(run: () => void, delay = SAVE_DELAY) {
    let timer: ReturnType<typeof setTimeout> | null = null;

    return {
        schedule: () => {
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(() => {
                timer = null;
                run();
            }, delay);
        },
        /** 기다리는 저장이 있으면 지금 바로 */
        flush: () => {
            if (timer) {
                clearTimeout(timer);
                timer = null;
                run();
            }
        },
        cancel: () => {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
        },
    };
}

let started: Promise<() => void> | null = null;

/**
 * 처음 한 번: 불러오기 → 상태에 넣기 → 테마 적용 → 이후 변경을 자동 저장
 * 내용이 지난번 저장과 같으면 쓰지 않는다 (줌 사각형·화면 크기 변경 등은 저장할 내용이 아님)
 * 돌려주는 함수는 구독 해제 (테스트용)
 */
export function startPersistence(storage: ProjectStorage = idbStorage): Promise<() => void> {
    started ??= (async () => {
        const project = await loadProject(storage);
        const { windows, ...meta } = project;
        useWindowStore.getState().hydrate(windows);
        useProjectStore.getState().hydrate(meta);
        applyTheme(project.theme);

        let lastSaved = JSON.stringify(currentProject());
        const save = () => {
            const next = currentProject();
            const json = JSON.stringify(next);
            if (json === lastSaved) {
                return;
            }
            storage.set(PROJECT_KEY, next).then(
                () => {
                    lastSaved = json;
                },
                (error: unknown) => {
                    console.error('프로젝트를 저장하지 못했습니다.', error);
                    if (isQuotaError(error)) {
                        void showAlert(QUOTA_MESSAGE);
                    }
                },
            );
        };
        const debounced = createDebounced(save);
        const unsubWindows = useWindowStore.subscribe(debounced.schedule);
        const unsubProject = useProjectStore.subscribe(debounced.schedule);
        // 0.5초 안에 탭을 닫거나 숨겨도 마지막 변경을 남기도록
        const onHide = () => document.visibilityState === 'hidden' && debounced.flush();
        window.addEventListener('pagehide', debounced.flush);
        document.addEventListener('visibilitychange', onHide);

        return () => {
            debounced.cancel();
            unsubWindows();
            unsubProject();
            window.removeEventListener('pagehide', debounced.flush);
            document.removeEventListener('visibilitychange', onHide);
        };
    })();

    return started;
}

/** 테스트용: 다시 시작할 수 있게 */
export function resetPersistenceForTest(): void {
    started = null;
}
