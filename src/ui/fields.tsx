import { useEffect, useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { isHexColor } from '@/utils/color';

/** 입력란 공통: 라벨 + 입력 + 오류(각 입력란 아래) */
export function Field({ label, error, hint, children, htmlFor }: { label?: ReactNode; error?: string; hint?: ReactNode; children: ReactNode; htmlFor?: string }) {
    return (
        <div className="kw-field">
            {label && (
                <label className="kw-field-label" htmlFor={htmlFor}>
                    {label}
                </label>
            )}
            {children}
            {hint && <div className="kw-field-hint">{hint}</div>}
            {error && (
                <div className="kw-field-error" role="alert">
                    {error}
                </div>
            )}
        </div>
    );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode; error?: string; hint?: ReactNode };

/** 들어간 면, 배경 --kw-bg-sub, 포커스 시 --kw-point-1 테두리 */
export function TextField({ label, error, hint, className, id, ...props }: InputProps) {
    const autoId = useId();
    const inputId = id ?? autoId;

    return (
        <Field label={label} error={error} hint={hint} htmlFor={inputId}>
            <input id={inputId} className={['kw-input', className].filter(Boolean).join(' ')} aria-invalid={error ? true : undefined} {...props} />
        </Field>
    );
}

export function TextArea({ label, error, hint, className, id, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: ReactNode; error?: string; hint?: ReactNode }) {
    const autoId = useId();
    const inputId = id ?? autoId;

    return (
        <Field label={label} error={error} hint={hint} htmlFor={inputId}>
            <textarea id={inputId} className={['kw-textarea', className].filter(Boolean).join(' ')} aria-invalid={error ? true : undefined} {...props} />
        </Field>
    );
}

export function Checkbox({ label, checked, onChange, disabled }: { label: ReactNode; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
    return (
        <label className="kw-check">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
            <span>{label}</span>
        </label>
    );
}

export function Radio<T extends string>({ label, name, value, current, onChange }: { label: ReactNode; name: string; value: T; current: T; onChange: (value: T) => void }) {
    return (
        <label className="kw-check">
            <input type="radio" name={name} value={value} checked={current === value} onChange={() => onChange(value)} />
            <span>{label}</span>
        </label>
    );
}

/** Platinum 팝업 메뉴 버튼 (오른쪽 위·아래 화살표) */
export function Select({ label, error, options, className, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label?: ReactNode; error?: string; options: { value: string; label: string }[] }) {
    const id = useId();

    return (
        <Field label={label} error={error} htmlFor={id}>
            <select id={id} className={['kw-select', className].filter(Boolean).join(' ')} {...props}>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </Field>
    );
}

/** 색 칸 + #RRGGBB 입력란 + 브라우저 색 선택기 */
export function ColorField({ label, value, onChange, error }: { label?: ReactNode; value: string; onChange: (value: string) => void; error?: string }) {
    const [text, setText] = useState(value);
    useEffect(() => setText(value), [value]);

    return (
        <Field label={label} error={error}>
            <span className="kw-color">
                <span className="kw-color-swatch" style={{ background: isHexColor(value) ? value : undefined }}>
                    <input type="color" value={isHexColor(value) ? value : '#000000'} onChange={(e) => onChange(e.target.value.toUpperCase())} aria-label="색 선택" />
                </span>
                <input
                    className="kw-input"
                    value={text}
                    maxLength={7}
                    onChange={(e) => {
                        setText(e.target.value);
                        if (isHexColor(e.target.value)) {
                            onChange(e.target.value.toUpperCase());
                        }
                    }}
                    aria-label="색 코드"
                />
            </span>
        </Field>
    );
}

/** 버튼 + 선택한 파일 이름 + 이미지면 작은 미리보기 */
export function FileField({ label, accept, onChange, error, hint, buttonLabel = '파일 선택…', file, currentUrl }: { label?: ReactNode; accept?: string; onChange: (file: File | null) => void; error?: string; hint?: ReactNode; buttonLabel?: string; file: File | null; currentUrl?: string | null }) {
    const id = useId();
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (file && file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreview(url);

            return () => URL.revokeObjectURL(url);
        }
        setPreview(null);

        return undefined;
    }, [file]);

    const shown = preview ?? currentUrl ?? null;

    return (
        <Field label={label} error={error} hint={hint}>
            <span className="kw-file">
                <label htmlFor={id} className="kw-btn">
                    {buttonLabel}
                </label>
                <input
                    id={id}
                    type="file"
                    accept={accept}
                    className="kw-sr-only"
                    onChange={(e) => {
                        onChange(e.target.files?.[0] ?? null);
                        e.target.value = '';
                    }}
                />
                {shown && <img className="kw-file-preview" src={shown} alt="" />}
                <span className="kw-file-name">{file ? file.name : currentUrl ? '' : '선택한 파일 없음'}</span>
            </span>
        </Field>
    );
}
