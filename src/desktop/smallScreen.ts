import { showAlert } from '@/stores/uiStore';

/** 작은 화면 안내 (docs/frame-maker.md 0장 4번, kkoriworld desktop/entry.ts와 같음): 너비 1024px 미만이면 처음 한 번 */

const SMALL_SCREEN_KEY = 'macos9-frame-maker:small-screen-notice';
export const SMALL_SCREEN_MESSAGE = '이 도구는 데스크톱 화면에 맞춰 만들었습니다. 화면이 넓은 기기에서 쓰는 것을 권장합니다.';

export function noticeSmallScreen(): void {
    if (window.innerWidth >= 1024 || readFlag()) {
        return;
    }
    writeFlag();
    void showAlert(SMALL_SCREEN_MESSAGE, '계속 보기');
}

function readFlag(): boolean {
    try {
        return window.localStorage.getItem(SMALL_SCREEN_KEY) === '1';
    } catch {
        return false;
    }
}

function writeFlag(): void {
    try {
        window.localStorage.setItem(SMALL_SCREEN_KEY, '1');
    } catch {
        // 저장 공간을 쓸 수 없으면 다음에 또 안내
    }
}
