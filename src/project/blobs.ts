import { useEffect, useState } from 'react';
import { getStorage, type ProjectStorage } from './storage';
import type { Project } from './types';

/**
 * 이미지 원본(Blob) 저장 (docs/frame-maker.md 3.1·3.2)
 * - 키 `blob:{blobId}`에 프로젝트와 따로 저장한다
 * - 화면에는 object URL로 그린다. 같은 blobId는 URL 하나를 같이 쓴다
 * - 저장할 때 어디서도 쓰지 않는 blob은 지운다 (collectGarbage)
 */

const PREFIX = 'blob:';

export const blobKey = (blobId: string) => `${PREFIX}${blobId}`;

/** blobId → object URL */
const urls = new Map<string, string>();
/** 불러오는 중인 blobId → 결과 */
const loading = new Map<string, Promise<string | null>>();
/** 저장 중이라 아직 프로젝트에 들어가지 않은 blobId (정리에서 빼 둔다) */
const pending = new Set<string>();

function remember(blobId: string, blob: Blob): string {
    let url = urls.get(blobId);
    if (!url) {
        url = URL.createObjectURL(blob);
        urls.set(blobId, url);
    }

    return url;
}

function forget(blobId: string): void {
    const url = urls.get(blobId);
    if (url) {
        URL.revokeObjectURL(url);
        urls.delete(blobId);
    }
}

/** 아직 저장하지 않은 이미지를 화면에 그리기 위해 (편집 화면). 취소하면 discardBlob */
export function previewBlob(blob: Blob): { blobId: string; url: string } {
    const blobId = crypto.randomUUID();

    return { blobId, url: remember(blobId, blob) };
}

/** 저장하지 않고 버린 이미지의 URL 정리 */
export function discardBlob(blobId: string): void {
    if (!pending.has(blobId)) {
        forget(blobId);
    }
}

/**
 * 이미지를 저장소에 쓴다. 이 Promise가 끝난 뒤 곧바로(같은 틱에) 프로젝트에 넣고 finish를 부른다
 * 그 사이에 정리가 돌아도 지워지지 않게 pending으로 지킨다
 */
export async function storeBlob(blobId: string, blob: Blob, storage: ProjectStorage = getStorage()): Promise<() => void> {
    pending.add(blobId);
    remember(blobId, blob);
    try {
        await storage.set(blobKey(blobId), blob);
    } catch (error) {
        pending.delete(blobId);
        forget(blobId);
        throw error;
    }

    return () => pending.delete(blobId);
}

/** 화면에 그릴 URL. 저장소에 없으면 null */
export function loadBlobUrl(blobId: string, storage: ProjectStorage = getStorage()): Promise<string | null> {
    const ready = urls.get(blobId);
    if (ready) {
        return Promise.resolve(ready);
    }
    let promise = loading.get(blobId);
    if (!promise) {
        // 저장소가 곧바로 예외를 던져도 catch로 가도록 then 안에서 부른다
        promise = Promise.resolve()
            .then(() => storage.get(blobKey(blobId)))
            .then((value) => (value instanceof Blob ? remember(blobId, value) : null))
            .catch((error: unknown) => {
                console.error('이미지를 불러오지 못했습니다.', error);

                return null;
            })
            .finally(() => loading.delete(blobId));
        loading.set(blobId, promise);
    }

    return promise;
}

/** blobId의 URL (불러오는 동안·없으면 null) */
export function useBlobUrl(blobId: string | null | undefined): string | null {
    const [loaded, setLoaded] = useState<{ blobId: string; url: string | null } | null>(null);
    const ready = blobId ? urls.get(blobId) : undefined;

    useEffect(() => {
        if (!blobId || urls.has(blobId)) {
            return undefined;
        }
        let alive = true;
        void loadBlobUrl(blobId).then((url) => alive && setLoaded({ blobId, url }));

        return () => {
            alive = false;
        };
    }, [blobId]);

    if (!blobId) {
        return null;
    }

    return ready ?? (loaded?.blobId === blobId ? loaded.url : null);
}

/** 프로젝트가 쓰는 blobId (배경, 홈 아이콘, 윈도우 이미지, 스티커 목록) */
export function referencedBlobIds(project: Pick<Project, 'wallpaper' | 'homeIcon' | 'windows' | 'stickerLibrary'>): Set<string> {
    const ids = new Set<string>();
    if (project.wallpaper) {
        ids.add(project.wallpaper.blobId);
    }
    if (project.homeIcon) {
        ids.add(project.homeIcon.blobId);
    }
    for (const w of project.windows) {
        if (w.image) {
            ids.add(w.image.blobId);
        }
    }
    for (const s of project.stickerLibrary) {
        ids.add(s.blobId);
    }

    return ids;
}

/** keep과 저장 중인 것 외의 `blob:*`를 지운다 (3.2). 지운 개수를 돌려준다 */
export async function collectGarbage(keep: Set<string>, storage: ProjectStorage = getStorage()): Promise<number> {
    let removed = 0;
    for (const key of await storage.keys()) {
        if (typeof key !== 'string' || !key.startsWith(PREFIX)) {
            continue;
        }
        const blobId = key.slice(PREFIX.length);
        if (keep.has(blobId) || pending.has(blobId)) {
            continue;
        }
        await storage.del(key);
        forget(blobId);
        removed += 1;
    }

    return removed;
}

/** 테스트용 */
export function resetBlobsForTest(): void {
    urls.clear();
    loading.clear();
    pending.clear();
}
