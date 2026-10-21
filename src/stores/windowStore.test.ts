import { beforeEach, describe, expect, it } from 'vitest';
import { defaultTitle, windowIcon } from '@/windows/registry';
import { resolveBounds, useWindowStore } from './windowStore';

const viewport = { width: 1280, height: 760 };

beforeEach(() => {
    useWindowStore.setState({ windows: [], topZ: 0, hiddenForStickers: false, viewport });
});

describe('윈도우 종류 (6.1)', () => {
    it('menu는 메뉴마다 1개: 다시 열면 복원하고 맨 앞으로', () => {
        const { open, minimize } = useWindowStore.getState();
        const key = open('menu', { menuKey: 'bgm' }, { animate: false });
        open('menu', { menuKey: 'notice' }, { animate: false });
        minimize(key);
        expect(open('menu', { menuKey: 'bgm' }, { animate: false })).toBe(key);

        const { windows, topZ } = useWindowStore.getState();
        expect(windows).toHaveLength(2);
        const bgm = windows.find((w) => w.key === key)!;
        expect(bgm.minimized).toBe(false);
        expect(bgm.z).toBe(topZ);
    });

    it('custom은 여러 개', () => {
        const { open } = useWindowStore.getState();
        const a = open('custom', {}, { animate: false });
        const b = open('custom', {}, { animate: false });
        expect(a).not.toBe(b);
        expect(useWindowStore.getState().windows).toHaveLength(2);
    });

    it('기본 제목·아이콘: menu는 메뉴 라벨·아이콘, custom은 "새 윈도우"', () => {
        expect(defaultTitle('menu', { menuKey: 'all_posts' })).toBe('전체 글목록');
        expect(windowIcon('menu', { menuKey: 'all_posts' })).toBe('fa-solid fa-folder-open');
        expect(defaultTitle('custom')).toBe('새 윈도우');
        expect(windowIcon('custom')).toBe('fa-solid fa-image');
        expect(defaultTitle('control_panel')).toBe('제어판');
    });

    it('처음 크기 360×270, 크기 조절 최소 120×90', () => {
        const { open, setBounds } = useWindowStore.getState();
        const key = open('custom', {}, { animate: false });
        expect(useWindowStore.getState().windows[0]).toMatchObject({ width: 360, height: 270 });
        setBounds(key, { x: 100, y: 100, width: 50, height: 50 });
        expect(useWindowStore.getState().windows[0]).toMatchObject({ width: 120, height: 90 });
    });
});

describe('처음 위치 (6.1)', () => {
    it('앞서 연 윈도우에서 오른쪽 아래로 20px씩', () => {
        const { open } = useWindowStore.getState();
        open('custom', {}, { animate: false });
        open('custom', {}, { animate: false });
        const [a, b] = useWindowStore.getState().windows;
        expect(b.x - a.x).toBe(20);
        expect(b.y - a.y).toBe(20);
    });

    it('화면 밖으로 나가면 왼쪽 위로 돌아감', () => {
        const last = { x: 900, y: 480, width: 360, height: 270 };
        const bounds = resolveBounds('custom', { windows: [last as never], viewport });
        expect(bounds).toMatchObject({ x: 40, y: 30 });
    });
});
