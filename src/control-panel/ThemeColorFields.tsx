import { ColorField } from '@/ui';
import type { Theme } from '@/utils/theme';

/** 테마 색 5가지의 라벨 (kkoriworld admin/AppearancePanel.tsx의 THEME_LABELS) */
export const THEME_LABELS: [keyof Theme, string][] = [
    ['bg', '바탕 (메뉴 바·윈도우 테두리·버튼)'],
    ['bg_sub', '콘텐츠 바탕 (윈도우 안·입력란)'],
    ['text', '글자'],
    ['point_1', '포인트 1 (선택·타이틀 바 줄무늬)'],
    ['point_2', '포인트 2 (마우스를 올렸을 때·선택 영역)'],
];

/**
 * 테마 색 입력 (docs/frame-maker.md 9장의 색상 부분)
 * 미리보기(applyTheme)와 저장·되돌리기는 부르는 쪽(제어판, P4)이 한다
 */
export function ThemeColorFields({ theme, onChange }: { theme: Theme; onChange: (theme: Theme) => void }) {
    return (
        <>
            {THEME_LABELS.map(([key, label]) => (
                <ColorField key={key} label={label} value={theme[key]} onChange={(v) => onChange({ ...theme, [key]: v })} />
            ))}
        </>
    );
}
