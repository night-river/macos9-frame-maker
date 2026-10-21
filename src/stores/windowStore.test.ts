import { beforeEach, describe, expect, it } from 'vitest';
import { defaultTitle, windowIcon } from '@/windows/registry';
import { resolveBounds, toFrameWindows, useWindowStore, windowBounds } from './windowStore';

const viewport = { width: 1280, height: 760 };
const store = () => useWindowStore.getState();
const winOf = (id: string) => store().windows.find((w) => w.id === id)!;

beforeEach(() => {
    useWindowStore.setState({ windows: [], topZ: 0, hiddenForStickers: false, viewport });
});

describe('윈도우 종류 (6.1)', () => {
    it('menu는 메뉴마다 1개: 다시 열면 복원하고 맨 앞으로', () => {
        const id = store().open('menu', { menuKey: 'bgm', animate: false });
        store().open('menu', { menuKey: 'notice', animate: false });
        store().minimize(id);
        expect(store().open('menu', { menuKey: 'bgm', animate: false })).toBe(id);

        expect(store().windows).toHaveLength(2);
        expect(winOf(id).minimized).toBe(false);
        expect(winOf(id).z).toBe(store().topZ);
    });

    it('custom은 여러 개', () => {
        const a = store().open('custom', { animate: false });
        const b = store().open('custom', { animate: false });
        expect(a).not.toBe(b);
        expect(store().windows).toHaveLength(2);
    });

    it('기본 제목·아이콘: menu는 메뉴 라벨·아이콘, custom은 "새 윈도우"', () => {
        expect(defaultTitle('menu', { menuKey: 'all_posts' })).toBe('전체 글목록');
        expect(windowIcon('menu', { menuKey: 'all_posts' })).toBe('fa-solid fa-folder-open');
        expect(defaultTitle('custom')).toBe('새 윈도우');
        expect(windowIcon('custom')).toBe('fa-solid fa-image');
        expect(winOf(store().open('menu', { menuKey: 'dday', animate: false })).title).toBe('D-day');
    });

    it('처음 크기 360×270, 크기 조절 최소 120×90', () => {
        const id = store().open('custom', { animate: false });
        expect(windowBounds(winOf(id), viewport)).toMatchObject({ width: 360, height: 270 });
        store().setBounds(id, { x: 100, y: 100, width: 50, height: 50 });
        expect(windowBounds(winOf(id), viewport)).toMatchObject({ x: 100, y: 100, width: 120, height: 90 });
    });
});

describe('처음 위치 (6.1)', () => {
    it('앞서 연 윈도우에서 오른쪽 아래로 20px씩', () => {
        const a = windowBounds(winOf(store().open('custom', { animate: false })), viewport);
        const b = windowBounds(winOf(store().open('custom', { animate: false })), viewport);
        expect(b.x - a.x).toBe(20);
        expect(b.y - a.y).toBe(20);
    });

    it('화면 밖으로 나가면 왼쪽 위로 돌아감', () => {
        store().open('custom', { animate: false });
        store().setBounds(store().windows[0].id, { x: 900, y: 480, width: 360, height: 270 });
        expect(resolveBounds('custom', store())).toMatchObject({ x: 40, y: 30 });
    });
});

describe('비율 좌표 (3.1)', () => {
    it('생성할 때 px를 데스크톱 대비 비율로 바꿔 저장', () => {
        const id = store().open('custom', { animate: false });
        expect(winOf(id).rect).toEqual({ x: 40 / 1280, y: 30 / 760, w: 360 / 1280, h: 270 / 760 });
    });

    it('브라우저 크기가 바뀌면 같은 비율로 다시 그린다', () => {
        const id = store().open('custom', { animate: false });
        store().setBounds(id, { x: 640, y: 380, width: 320, height: 190 });
        const half = windowBounds(winOf(id), { width: 640, height: 380 });
        expect(half).toEqual({ x: 320, y: 190, width: 160, height: 95 });
    });

    it('작아진 화면에서도 최소 크기는 지킨다', () => {
        const id = store().open('custom', { animate: false });
        store().setBounds(id, { x: 0, y: 0, width: 120, height: 90 });
        expect(windowBounds(winOf(id), { width: 640, height: 380 })).toMatchObject({ width: 120, height: 90 });
    });
});

describe('동작 (6.2)', () => {
    it('최대화하면 데스크톱 영역 전체, 다시 누르면 원래 크기', () => {
        const id = store().open('custom', { animate: false });
        const before = windowBounds(winOf(id), viewport);
        store().toggleMaximize(id);
        expect(windowBounds(winOf(id), viewport)).toEqual({ x: 0, y: 0, width: 1280, height: 760 });
        store().toggleMaximize(id);
        expect(windowBounds(winOf(id), viewport)).toEqual(before);
    });

    it('제목 바꾸기: 앞뒤 공백 제거, 최대 40자, 비우면 기본 제목', () => {
        const id = store().open('menu', { menuKey: 'bgm', animate: false });
        store().rename(id, '  내 음악  ');
        expect(winOf(id).title).toBe('내 음악');
        store().rename(id, 'ㄱ'.repeat(50));
        expect(winOf(id).title).toHaveLength(40);
        store().rename(id, '   ');
        expect(winOf(id).title).toBe('BGM');
    });

    it('맨 앞으로: 클릭한 윈도우의 z를 가장 크게', () => {
        const a = store().open('custom', { animate: false });
        store().open('custom', { animate: false });
        store().focus(a);
        expect(winOf(a).z).toBe(Math.max(...store().windows.map((w) => w.z)));
    });

    it('저장 대상은 menu·custom만 (제어판은 저장하지 않음)', () => {
        store().open('menu', { menuKey: 'notice', animate: false });
        store().open('custom', { animate: false });
        store().open('control_panel', { animate: false });
        const saved = toFrameWindows(store().windows);
        expect(saved.map((w) => w.kind)).toEqual(['menu', 'custom']);
        expect(saved[0]).toMatchObject({ menuKey: 'notice', title: '공지사항', minimized: false, maximized: false, image: null });
        expect(saved[1]).not.toHaveProperty('menuKey');
    });

    it('불러온 윈도우로 바꿔 넣으면 topZ는 가장 큰 z', () => {
        store().hydrate([{ id: 'a', kind: 'custom', title: '하나', rect: { x: 0.1, y: 0.1, w: 0.3, h: 0.3 }, z: 7, minimized: true, maximized: false, image: null }]);
        expect(store().topZ).toBe(7);
        expect(winOf('a')).toMatchObject({ type: 'custom', title: '하나', minimized: true, appearing: false });
    });
});
