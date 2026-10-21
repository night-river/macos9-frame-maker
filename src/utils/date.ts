/**
 * 날짜·시간 (kkoriworld utils/date.ts에서 시계 부분만)
 * kkoriworld는 한국 시간 고정이지만, 이 도구는 사용자 PC의 시간대를 쓴다
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** 메뉴 바 시계: 오전/오후 hh:mm (12시간제, 두 자리) */
export function formatClock(now: Date): string {
    const hour = now.getHours();
    const h12 = hour % 12 === 0 ? 12 : hour % 12;

    return `${hour < 12 ? '오전' : '오후'} ${pad(h12)}:${pad(now.getMinutes())}`;
}
