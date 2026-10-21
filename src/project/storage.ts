import { del as idbDel, get as idbGet, keys as idbKeys, set as idbSet } from 'idb-keyval';

/** 브라우저 저장소 (IndexedDB). 테스트에서는 메모리로 바꿔 끼운다 */
export interface ProjectStorage {
    get: (key: string) => Promise<unknown>;
    set: (key: string, value: unknown) => Promise<void>;
    keys: () => Promise<IDBValidKey[]>;
    del: (key: string) => Promise<void>;
}

export const idbStorage: ProjectStorage = {
    get: (key) => idbGet(key),
    set: (key, value) => idbSet(key, value),
    keys: () => idbKeys(),
    del: (key) => idbDel(key),
};

let current: ProjectStorage = idbStorage;

/** 지금 쓰는 저장소 (startPersistence가 정한다) */
export const getStorage = (): ProjectStorage => current;

export function setStorage(storage: ProjectStorage): void {
    current = storage;
}
