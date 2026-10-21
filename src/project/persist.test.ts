import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProjectStore } from '@/stores/projectStore';
import { useUiStore } from '@/stores/uiStore';
import { useWindowStore } from '@/stores/windowStore';
import { PROJECT_KEY, QUOTA_MESSAGE, createDebounced, loadProject, resetPersistenceForTest, startPersistence, type ProjectStorage } from './persist';
import { emptyProject, type Project } from './types';

function memoryStorage(initial?: unknown) {
    const data = new Map<string, unknown>(initial === undefined ? [] : [[PROJECT_KEY, initial]]);
    const storage: ProjectStorage & { data: Map<string, unknown>; writes: number } = {
        data,
        writes: 0,
        get: async (key) => data.get(key),
        set: async (key, value) => {
            storage.writes += 1;
            data.set(key, structuredClone(value));
        },
    };

    return storage;
}

const savedWindow = { id: 'w1', kind: 'custom' as const, title: '저장된 윈도우', rect: { x: 0.1, y: 0.2, w: 0.3, h: 0.4 }, z: 3, minimized: false, maximized: false, image: null };

let stop: (() => void) | null = null;

beforeEach(() => {
    vi.useFakeTimers();
    resetPersistenceForTest();
    useWindowStore.setState({ windows: [], topZ: 0, hiddenForStickers: false, viewport: { width: 1000, height: 500 } });
    useProjectStore.setState({ loaded: false });
    useUiStore.setState({ dialogs: [] });
});

afterEach(() => {
    stop?.();
    stop = null;
    vi.useRealTimers();
});

describe('불러오기 (3.2)', () => {
    it('없거나 손상되었으면 빈 프로젝트, 읽기 실패도 빈 프로젝트', async () => {
        expect(await loadProject(memoryStorage())).toEqual(emptyProject());
        expect(await loadProject(memoryStorage({ broken: true }))).toEqual(emptyProject());
        const failing: ProjectStorage = { get: () => Promise.reject(new Error('읽기 실패')), set: async () => undefined };
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        expect(await loadProject(failing)).toEqual(emptyProject());
    });

    it('저장된 윈도우와 테마를 상태에 넣는다', async () => {
        const project: Project = { ...emptyProject(), theme: { ...emptyProject().theme, point_1: '#336699' }, windows: [savedWindow] };
        stop = await startPersistence(memoryStorage(project));
        expect(useProjectStore.getState().loaded).toBe(true);
        expect(useProjectStore.getState().theme.point_1).toBe('#336699');
        expect(useWindowStore.getState().windows[0]).toMatchObject({ id: 'w1', title: '저장된 윈도우', rect: savedWindow.rect });
        expect(document.documentElement.style.getPropertyValue('--kw-point-1')).toBe('#336699');
    });
});

describe('자동 저장 (3.2)', () => {
    it('변경 0.5초 뒤 저장, 연속 변경은 한 번으로 묶음', async () => {
        const storage = memoryStorage();
        stop = await startPersistence(storage);
        const { open } = useWindowStore.getState();
        open('custom', { animate: false });
        await vi.advanceTimersByTimeAsync(300);
        open('custom', { animate: false });
        await vi.advanceTimersByTimeAsync(499);
        expect(storage.writes).toBe(0);
        await vi.advanceTimersByTimeAsync(1);
        expect(storage.writes).toBe(1);
        expect((storage.data.get(PROJECT_KEY) as Project).windows).toHaveLength(2);
    });

    it('저장할 내용이 같으면 쓰지 않는다 (화면 크기 변경, 제어판)', async () => {
        const storage = memoryStorage({ ...emptyProject(), windows: [savedWindow] });
        stop = await startPersistence(storage);
        useWindowStore.getState().setViewport(800, 400);
        useWindowStore.getState().open('control_panel', { animate: false });
        await vi.advanceTimersByTimeAsync(1000);
        expect(storage.writes).toBe(0);
    });

    it('새로고침해도 유지: 저장한 것을 다시 불러오면 같은 윈도우', async () => {
        const storage = memoryStorage();
        stop = await startPersistence(storage);
        const id = useWindowStore.getState().open('menu', { menuKey: 'calendar', animate: false });
        useWindowStore.getState().setBounds(id, { x: 100, y: 50, width: 400, height: 300 });
        useWindowStore.getState().rename(id, '내 달력');
        useWindowStore.getState().minimize(id);
        await vi.advanceTimersByTimeAsync(500);

        const reloaded = await loadProject(storage);
        expect(reloaded.windows).toEqual([{ id, kind: 'menu', menuKey: 'calendar', title: '내 달력', rect: { x: 0.1, y: 0.1, w: 0.4, h: 0.6 }, z: 1, minimized: true, maximized: false, image: null }]);
    });

    it('저장 공간이 부족하면 알림창', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const storage = memoryStorage();
        storage.set = () => Promise.reject(new DOMException('가득 참', 'QuotaExceededError'));
        stop = await startPersistence(storage);
        useWindowStore.getState().open('custom', { animate: false });
        await vi.advanceTimersByTimeAsync(500);
        expect(useUiStore.getState().dialogs.map((d) => d.message)).toEqual([QUOTA_MESSAGE]);
    });
});

describe('createDebounced', () => {
    it('flush는 기다리는 저장을 바로 실행, 없으면 아무것도 안 함', () => {
        const run = vi.fn();
        const d = createDebounced(run, 500);
        d.flush();
        expect(run).not.toHaveBeenCalled();
        d.schedule();
        d.flush();
        expect(run).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(1000);
        expect(run).toHaveBeenCalledTimes(1);
    });
});
