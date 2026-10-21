import { useEffect, useState } from 'react';
import { ThemeColorFields } from '@/control-panel/ThemeColorFields';
import { askConfirm, showAlert } from '@/stores/uiStore';
import { DEFAULT_THEME, applyTheme, type Theme } from '@/utils/theme';
import { Button, Checkbox, ColorField, Dialogs, EmptyState, FileField, IconButton, ProgressBar, Radio, Select, Slider, Spinner, TextArea, TextField, Toolbar, ToolbarGap, Tooltip } from '.';

/** 견본 타이틀 바: WindowFrame과 같은 순서 [닫기][최소화][최대화][아이콘] → 줄무늬 → 제목 */
function SampleTitlebar({ title, icon, resizable }: { title: string; icon: string; resizable: boolean }) {
    return (
        <header className={['kw-titlebar', resizable ? 'has-max' : 'no-max'].join(' ')}>
            <button type="button" className="kw-wbtn kw-wbtn-close" aria-label="닫기" />
            <button type="button" className="kw-wbtn kw-wbtn-min" aria-label="최소화" />
            {resizable && <button type="button" className="kw-wbtn kw-wbtn-max" aria-label="최대화" />}
            <span className="kw-window-icon">
                <i className={icon} aria-hidden="true" />
            </span>
            <span className="kw-title-gap" />
            <h2 className="kw-title">
                <span className="kw-title-text">{title}</span>
            </h2>
        </header>
    );
}

/** 개발 중 확인용: 모든 기본 컴포넌트와 윈도우 프레임을 한 화면에 (/?kit=1, 개발 빌드에서만) */
export default function Kit() {
    const [check, setCheck] = useState(true);
    const [radio, setRadio] = useState<'a' | 'b'>('a');
    const [color, setColor] = useState('#6666CC');
    const [slider, setSlider] = useState(40);
    const [file, setFile] = useState<File | null>(null);
    const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

    useEffect(() => applyTheme(theme), [theme]);

    return (
        <div className="kw-kit">
            <h1 style={{ fontSize: 12 }}>macos9-frame-maker 디자인 키트</h1>

            <h2>메뉴 바 · 하단 트레이</h2>
            <div className="kw-menubar" style={{ position: 'relative' }}>
                <span className="kw-menubar-item kw-menubar-home">
                    <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" />
                </span>
                <span className="kw-menubar-item">
                    <span className="kw-menu-icon">
                        <i className="fa-solid fa-magnifying-glass" />
                    </span>
                    검색
                </span>
                <span className="kw-menubar-item is-open">
                    <span className="kw-menu-icon">
                        <i className="fa-solid fa-heart" />
                    </span>
                    D-day (눌린 상태)
                </span>
                <span className="kw-menubar-spacer" />
                <span className="kw-menubar-clock">오후 09:41</span>
            </div>
            <div className="kw-tray" style={{ position: 'relative', display: 'inline-flex', marginTop: 8 }}>
                <span className="kw-tray-handle" />
                <button type="button" className="kw-tray-btn">
                    <i className="fa-solid fa-image" />
                </button>
                <button type="button" className="kw-tray-btn">
                    <i className="fa-solid fa-music" />
                </button>
                <span className="kw-tray-end" />
            </div>

            <h2>윈도우 프레임 (활성 / 비활성 / 크기 고정)</h2>
            <div className="kw-row" style={{ alignItems: 'flex-start', gap: 24 }}>
                {[true, false].map((active) => (
                    <div key={String(active)} className={['kw-window', active && 'is-active'].filter(Boolean).join(' ')} style={{ position: 'relative', width: 340, height: 200 }}>
                        <SampleTitlebar title={active ? '활성 윈도우' : '비활성 윈도우'} icon="fa-solid fa-image" resizable />
                        <Toolbar>
                            <Button small>목록</Button>
                            <ToolbarGap />
                            <Button small isDefault>
                                저장
                            </Button>
                        </Toolbar>
                        <div className="kw-window-body">
                            <div className="kw-window-scroll kw-pad">콘텐츠 영역 (들어간 면)</div>
                        </div>
                        <div className="kw-resize-box" />
                    </div>
                ))}
                <div className="kw-window is-active" style={{ position: 'relative', width: 240, height: 200 }}>
                    <SampleTitlebar title="크기 고정 윈도우" icon="fa-solid fa-sliders" resizable={false} />
                    <div className="kw-window-body">
                        <EmptyState>최대화 버튼과 크기 조절 상자가 없음</EmptyState>
                    </div>
                </div>
            </div>

            <h2>편집 모달 (오버레이 위 윈도우)</h2>
            <div style={{ position: 'relative', padding: 16, background: 'var(--kw-overlay)', display: 'inline-block' }}>
                <section className="kw-window is-active kw-modal" aria-label="이미지 편집">
                    <SampleTitlebar title="이미지 편집" icon="fa-solid fa-crop-simple" resizable={false} />
                    <div className="kw-window-body" style={{ height: 120 }}>
                        <EmptyState>미리보기 영역</EmptyState>
                    </div>
                    <div className="kw-row" style={{ justifyContent: 'flex-end', padding: '0 8px 8px' }}>
                        <Button>취소</Button>
                        <Button isDefault>적용</Button>
                    </div>
                </section>
            </div>

            <h2>버튼 · 알림창</h2>
            <div className="kw-row">
                <Button>취소</Button>
                <Button isDefault>저장</Button>
                <Button disabled>비활성</Button>
                <Button small>작은 버튼</Button>
                <IconButton icon="fa-solid fa-arrow-up" label="앞으로" />
                <IconButton icon="fa-solid fa-trash" label="삭제" on />
                <Button onClick={() => showAlert('브라우저 저장 공간이 부족합니다. 사용하지 않는 이미지를 지워주세요.')}>알림창</Button>
                <Button onClick={() => askConfirm('이 윈도우와 이미지를 지울까요?', '지우기')}>확인창</Button>
            </div>

            <h2>입력</h2>
            <div className="kw-row" style={{ alignItems: 'flex-start' }}>
                <div style={{ width: 200 }}>
                    <TextField label="입력란" placeholder="글자" />
                </div>
                <div style={{ width: 200 }}>
                    <TextField label="오류 표시" defaultValue="잘못된 값" error="30MB 이하의 이미지를 올려주세요." />
                </div>
                <div style={{ width: 260 }}>
                    <TextArea label="여러 줄" rows={3} defaultValue={'첫 줄\n둘째 줄'} />
                </div>
            </div>
            <div className="kw-row">
                <Checkbox label="체크박스" checked={check} onChange={setCheck} />
                <Radio name="kit" value="a" current={radio} onChange={setRadio} label="라디오 A" />
                <Radio name="kit" value="b" current={radio} onChange={setRadio} label="라디오 B" />
                <Select options={[{ value: '1', label: '팝업 메뉴' }, { value: '2', label: '두 번째' }]} />
                <ColorField value={color} onChange={setColor} />
            </div>
            <FileField label="파일" file={file} onChange={setFile} accept="image/*" />

            <h2>진행 바 · 슬라이더 · 툴팁 · 빈 상태 · 팝업 메뉴</h2>
            <div className="kw-row" style={{ alignItems: 'center' }}>
                <div style={{ width: 160 }}>
                    <ProgressBar value={slider} />
                </div>
                <div style={{ width: 160 }}>
                    <Slider value={slider} onChange={setSlider} label="값" />
                </div>
                <Tooltip text="풍선 도움말">
                    <span style={{ textDecoration: 'underline dotted' }}>마우스를 올려 보세요</span>
                </Tooltip>
                <div className="kw-window-body" style={{ width: 160, margin: 0 }}>
                    <Spinner />
                </div>
                <div className="kw-window-body" style={{ width: 160, margin: 0 }}>
                    <EmptyState>클릭해서 이미지 넣기</EmptyState>
                </div>
                <div className="kw-dropdown" style={{ position: 'relative' }} role="menu">
                    <div className="kw-dropdown-items">
                        <button type="button" role="menuitem" className="kw-dropdown-item">
                            배경 바꾸기
                        </button>
                        <button type="button" role="menuitem" className="kw-dropdown-item">
                            위치·크기 편집
                        </button>
                        <div className="kw-dropdown-sep" />
                        <button type="button" role="menuitem" className="kw-dropdown-item">
                            배경 지우기
                        </button>
                    </div>
                </div>
            </div>

            <h2>테마 색 (바꾸면 이 화면 전체에 바로 반영)</h2>
            <div className="kw-stack" style={{ width: 320 }}>
                <ThemeColorFields theme={theme} onChange={setTheme} />
                <div>
                    <Button onClick={() => setTheme(DEFAULT_THEME)}>기본값으로</Button>
                </div>
            </div>
            <Dialogs />
        </div>
    );
}
