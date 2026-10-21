import type { ComponentProps, ReactNode } from 'react';
import { Icon } from './Icon';

/** Platinum 버튼. 기본 버튼(isDefault)은 바깥에 굵은 테두리 한 겹 더 (kkoriworld 4.5) */
export function Button({ isDefault, small, className, type = 'button', ...props }: ComponentProps<'button'> & { isDefault?: boolean; small?: boolean }) {
    return <button type={type} className={['kw-btn', isDefault && 'is-default', small && 'is-small', className].filter(Boolean).join(' ')} {...props} />;
}

/** 작은 정사각 버튼 (툴바, 크롬용). icon은 Font Awesome 클래스 */
export function IconButton({ icon, label, on, children, className, type = 'button', ...props }: ComponentProps<'button'> & { icon?: string; label: string; on?: boolean; children?: ReactNode }) {
    return (
        <button type={type} className={['kw-icon-btn', on && 'is-on', className].filter(Boolean).join(' ')} aria-label={label} title={label} {...props}>
            {icon ? <Icon fa={icon} /> : children}
        </button>
    );
}
