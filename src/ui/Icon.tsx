/** 아이콘: 이미지(url)가 있으면 이미지, 없으면 Font Awesome 클래스 */
export function Icon({ fa, url, alt = '', className }: { fa?: string | null; url?: string | null; alt?: string; className?: string }) {
    if (url) {
        return <img src={url} alt={alt} className={['kw-pixel', className].filter(Boolean).join(' ')} draggable={false} />;
    }

    return <i className={[fa ?? 'fa-solid fa-square', className].filter(Boolean).join(' ')} aria-hidden="true" />;
}
