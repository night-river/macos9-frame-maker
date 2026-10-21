import { fitImage, type FitInput } from '@/utils/fit';

/**
 * 프레임(width×height)을 꽉 채우는 이미지 (4.1). 프레임 요소는 position: relative, overflow: hidden이어야 한다
 * 프레임 크기를 아직 모르면(0) 그리지 않는다
 */
export function FittedImage({ src, image, width, height }: { src: string | null; image: FitInput; width: number; height: number }) {
    if (!src || width <= 0 || height <= 0) {
        return null;
    }
    const box = fitImage(width, height, image);

    return <img className="kw-fit-img" src={src} alt="" draggable={false} style={{ left: box.left, top: box.top, width: box.width, height: box.height }} />;
}
