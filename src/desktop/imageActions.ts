import { discardBlob, loadBlobUrl, previewBlob, storeBlob } from '@/project/blobs';
import { QUOTA_MESSAGE, isQuotaError } from '@/project/persist';
import type { ImageRef } from '@/project/types';
import { editImage, showAlert } from '@/stores/uiStore';
import { IMAGE_ACCEPT, IntakeError, intakeImage } from '@/utils/imageIntake';

/**
 * 이미지 넣기·편집 흐름 (docs/frame-maker.md 3.3, 4.2, 5.2, 6.3)
 * 새 이미지: 파일 선택 → 받아들이기 → 편집 화면 → [적용]이면 저장소에 쓰고 프로젝트에 넣음
 * 편집 화면에서 취소하면 아무것도 저장하지 않는다
 */

/** 파일 선택 창. 사용자가 누른 직후(같은 이벤트 안)에 불러야 한다. 취소하면 null */
export function pickImageFile(): Promise<File | null> {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = IMAGE_ACCEPT;
        input.className = 'kw-sr-only';
        const done = (file: File | null) => {
            input.remove();
            resolve(file);
        };
        input.addEventListener('change', () => done(input.files?.[0] ?? null), { once: true });
        input.addEventListener('cancel', () => done(null), { once: true });
        document.body.appendChild(input);
        input.click();
    });
}

/**
 * 새 이미지 고르기. aspect는 편집 화면에서 쓸 프레임 비율(가로/세로)이고, 함수면 편집 화면을 여는 순간에 잰다
 * [적용]이면 apply(image)를 불러 프로젝트에 넣는다
 */
export async function chooseImage(aspect: number | (() => number), apply: (image: ImageRef) => void): Promise<void> {
    const file = await pickImageFile();
    if (!file) {
        return;
    }

    let intake;
    try {
        intake = await intakeImage(file);
    } catch (error) {
        if (!(error instanceof IntakeError)) {
            console.error('이미지를 받아들이지 못했습니다.', error);
        }
        await showAlert(error instanceof IntakeError ? error.message : '이미지를 읽지 못했습니다. 다른 파일을 골라주세요.');
        return;
    }

    const { blobId, url } = previewBlob(intake.blob);
    const image: ImageRef = { blobId, naturalWidth: intake.naturalWidth, naturalHeight: intake.naturalHeight, focusX: 0.5, focusY: 0.5, zoom: 1 };
    const adjust = await editImage({ src: url, image, aspect: typeof aspect === 'function' ? aspect() : aspect });
    if (!adjust) {
        discardBlob(blobId);
        return;
    }

    let finish: () => void;
    try {
        finish = await storeBlob(blobId, intake.blob);
    } catch (error) {
        console.error('이미지를 저장하지 못했습니다.', error);
        await showAlert(isQuotaError(error) ? QUOTA_MESSAGE : '이미지를 저장하지 못했습니다.');
        return;
    }
    apply({ ...image, ...adjust });
    finish();
}

/** 이미 넣은 이미지의 위치·크기 편집. [적용]이면 apply */
export async function adjustImage(image: ImageRef, aspect: number, apply: (image: ImageRef) => void): Promise<void> {
    const src = await loadBlobUrl(image.blobId);
    if (!src) {
        await showAlert('이미지를 불러오지 못했습니다. 이미지를 다시 넣어주세요.');
        return;
    }
    const adjust = await editImage({ src, image, aspect });
    if (adjust) {
        apply({ ...image, ...adjust });
    }
}
