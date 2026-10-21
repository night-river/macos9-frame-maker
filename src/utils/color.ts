/** 색 계산 (kkoriworld docs/frontend.md 4.2) */

export function isHexColor(value: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(value);
}

function channel(hex: string, offset: number): number {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;

    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/** 상대 밝기 (WCAG) */
export function luminance(hex: string): number {
    return 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
}

/** 포인트 색 위의 글자색: 흰색과 검정 중 대비가 큰 쪽 (--kw-on-point-1, --kw-on-point-2) */
export function textColorOn(background: string): '#000000' | '#FFFFFF' {
    if (!isHexColor(background)) {
        return '#000000';
    }
    const l = luminance(background);
    const contrastWithBlack = (l + 0.05) / 0.05;
    const contrastWithWhite = 1.05 / (l + 0.05);

    return contrastWithBlack >= contrastWithWhite ? '#000000' : '#FFFFFF';
}
