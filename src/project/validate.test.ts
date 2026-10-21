import { describe, expect, it } from 'vitest';
import { emptyProject } from './types';
import { parseProject } from './validate';

const validWindow = { id: 'w1', kind: 'menu', menuKey: 'bgm', title: 'BGM', rect: { x: 0.1, y: 0.1, w: 0.3, h: 0.3 }, z: 1, minimized: false, maximized: false, image: null };

describe('불러온 프로젝트 검사 (3.2)', () => {
    it('빈 프로젝트와 올바른 윈도우는 통과', () => {
        expect(parseProject(emptyProject())).toEqual(emptyProject());
        const project = { ...emptyProject(), windows: [validWindow, { ...validWindow, id: 'w2', kind: 'custom', menuKey: undefined }] };
        expect(parseProject(project)).toEqual(project);
    });

    it('없거나 형식이 다르면 null', () => {
        expect(parseProject(undefined)).toBeNull();
        expect(parseProject('project')).toBeNull();
        expect(parseProject({ ...emptyProject(), version: 2 })).toBeNull();
        expect(parseProject({ ...emptyProject(), windows: 'x' })).toBeNull();
        expect(parseProject({ ...emptyProject(), theme: { ...emptyProject().theme, bg: 'red' } })).toBeNull();
    });

    it('윈도우 하나라도 손상되면 null', () => {
        expect(parseProject({ ...emptyProject(), windows: [{ ...validWindow, rect: { x: 0, y: 0, w: 0, h: 0.3 } }] })).toBeNull();
        expect(parseProject({ ...emptyProject(), windows: [{ ...validWindow, menuKey: 'unknown' }] })).toBeNull();
        expect(parseProject({ ...emptyProject(), windows: [{ ...validWindow, z: Number.NaN }] })).toBeNull();
    });

    it('homeIcon이 빠져 있으면 null', () => {
        const { homeIcon: _ignored, ...rest } = emptyProject();
        expect(parseProject(rest)).toBeNull();
    });
});
