# Mac OS 9 프레임 메이커 명세

> 사용자는 이미지만 준비하고, 이 페이지는 이미지를 넣을 **Mac OS 9 디자인의 프레임**(데스크톱, 윈도우, 배경, 스티커)을 제공한다. 완성한 화면은 PNG로 저장한다.
> 디자인과 화면 동작은 `kkoriworld`의 프론트엔드(`kkoriworld/docs/frontend.md`, `ui-decisions.md`)를 따르고, 이 문서에는 **달라지는 점**만 적는다. 둘이 다르면 이 문서가 우선한다.

---

## 0. 원칙
1. **서버 없음**: 정적 파일만으로 동작. GitHub Pages 배포.
2. **이미지는 브라우저 밖으로 나가지 않는다**: 저장은 브라우저의 IndexedDB, 결과물은 사용자의 PC로 PNG 다운로드.
3. **kkoriworld의 모양을 그대로**: 테마 토큰, Platinum 크롬, 윈도우 프레임, 메뉴 바, 트레이, 줌 사각형, 스티커 모드, 기본 컴포넌트.
4. **데스크톱 전용**: 화면 너비 1024px 미만이면 처음 한 번 안내 알림창 (kkoriworld frontend.md 5.8과 같음).

---

## 1. 기술 스택

| 용도 | 사용 | 비고 |
|---|---|---|
| UI | React 19 + TypeScript (strict) | |
| 빌드 | Vite (`base: './'`) | 저장소 이름과 관계없이 GitHub Pages에서 동작하도록 상대 경로 |
| 화면 상태 | `zustand` | |
| 윈도우 이동·크기 조절 | `react-rnd` | |
| 스티커 이동·크기·회전 | `react-moveable` | |
| 브라우저 저장소 | `idb-keyval` | IndexedDB |
| PNG 저장 | `html-to-image` | 브라우저가 직접 그리는 방식(SVG foreignObject). `color-mix()` 등 최신 CSS를 그대로 반영하기 위해 이 방식이어야 함 |
| 아이콘 | `@fortawesome/fontawesome-free` (CSS) | |
| UI 폰트 | Galmuri11 (`galmuri` 패키지 또는 woff2 직접 포함) | 반드시 이 프로젝트 안에 포함 (외부 CDN 금지 — PNG 저장 시 폰트가 빠짐) |
| 테스트 | `vitest`, `@testing-library/react`, `jsdom` | |

사용하지 않는 것: Tailwind, UI 키트, CSS-in-JS, 라우터, axios, TipTap, React Query, 서버 통신 라이브러리.

---

## 2. kkoriworld에서 가져올 것

`Github/kkoriworld/`에서 **복사**한다 (원본 수정 금지). 복사한 뒤 서버 API, 로그인, 게시판 의존성을 모두 걷어낸다.

| 가져올 것 (kkoriworld 경로) | 이 프로젝트 위치 | 비고 |
|---|---|---|
| `resources/css/tokens.css`, `base.css`, `chrome.css`, `kit.css` | `src/styles/` | `content.css`는 가져오지 않음 |
| `resources/js/ui/` 기본 컴포넌트 | `src/ui/` | API를 쓰는 컴포넌트는 제외 |
| `resources/js/windows/WindowFrame.tsx`, 크기 조절 상자 | `src/windows/` | 버튼은 왼쪽 정렬 규칙 그대로 |
| `resources/js/stores/windowStore.ts` | `src/stores/` | 3장 좌표 규칙에 맞게 고침 |
| 메뉴 바, 하단 트레이, 줌 사각형, 시계, 스티커 레이어·스티커 모드 | `src/desktop/` | |
| `resources/js/utils/color.ts` (포인트 색 위 글자색), 날짜·시계 유틸 | `src/utils/` | |
| Galmuri11, Font Awesome 설정 | `src/` 및 `package.json` | |
| 제어판의 테마 색 미리보기·`ColorField` | `src/control-panel/` | 색상 부분만 |

가져오지 않는 것: `api/`, `board/`, `editor/`, 로그인·회원, 방명록, 위젯(BGM·D-day·캘린더·배너)의 **내용**, 제어판의 나머지 패널, 부트스트랩·서버 데이터 관련 코드.

---

## 3. 데이터와 저장

### 3.1 프로젝트 데이터 (IndexedDB, 키 `project`)
```ts
type Project = {
  version: 1
  theme: { bg: string; bg_sub: string; text: string; point_1: string; point_2: string }
  wallpaper: ImageRef | null
  homeIcon: ImageRef | null           // 메뉴 바 홈 아이콘·탭 파비콘 (null = 앱 기본 아이콘, 5.1·9장)
  windows: FrameWindow[]
  stickerLibrary: StickerAsset[]      // 업로드한 스티커 이미지 목록
  stickers: StickerPlacement[]        // 배경에 붙인 스티커
}

type ImageRef = {
  blobId: string                      // 이미지 원본(Blob)은 별도 키 `blob:{blobId}`에 저장
  naturalWidth: number
  naturalHeight: number
  focusX: number                      // 0~1, 이미지에서 프레임 가운데에 오는 지점
  focusY: number                      // 0~1
  zoom: number                        // 1~4, 1 = 프레임을 꽉 채우는 최소 배율
}

type FrameWindow = {
  id: string                          // uuid
  kind: 'menu' | 'custom'
  menuKey?: 'search' | 'dday' | 'bgm' | 'calendar' | 'banner' | 'notice' | 'all_posts' | 'guestbook'
  title: string
  rect: { x: number; y: number; w: number; h: number }   // 데스크톱 영역 대비 비율 0~1
  z: number
  minimized: boolean
  maximized: boolean
  image: ImageRef | null
}

type StickerAsset = { id: string; blobId: string; naturalWidth: number; naturalHeight: number }
type StickerPlacement = {
  id: string; assetId: string
  x: number; y: number                // 데스크톱 대비 비율 (스티커 왼쪽 위)
  w: number                           // 데스크톱 가로 대비 비율 (세로는 이미지 비율로 계산)
  rotation: number                    // 도
  z: number
}
```
- **좌표는 모두 데스크톱 영역(메뉴 바 아래부터 화면 끝까지) 대비 비율**로 저장한다. 브라우저 크기가 바뀌면 같은 비율로 다시 그린다 (반응형).
- 기본 테마는 kkoriworld의 기본값 (`bg #DDDDDD`, `bg_sub #EEEEEE`, `text #000000`, `point_1 #6666CC`, `point_2 #CCCCFF`).

### 3.2 저장 규칙
- 변경이 생기면 0.5초 뒤 자동 저장 (연속 변경은 한 번으로 묶음).
- 저장할 때 어디서도 쓰지 않는 `blob:*`는 삭제한다 (`wallpaper`, `homeIcon`, 윈도우 `image`, `stickerLibrary`가 참조하는 것만 남김).
- 처음 열 때 `project`를 불러온다. 없거나 형식이 맞지 않으면 빈 프로젝트로 시작 (데이터 손상 시 앱이 멈추지 않게).
- 저장 공간이 부족해 저장이 실패하면 알림창 "브라우저 저장 공간이 부족합니다. 사용하지 않는 이미지를 지워주세요."

### 3.3 이미지 받아들이기 (`utils/imageIntake.ts`)
- 형식: jpg, png, webp, gif. 30MB 초과는 거절 ("30MB 이하의 이미지를 올려주세요.").
- GIF와 움직이는 WebP는 그대로 저장한다.
- 그 외 이미지는 긴 변이 2560px을 넘으면 브라우저에서 2560px로 줄여 저장한다 (canvas). 투명도가 있으면 PNG, 없으면 WebP(품질 0.92)로. 브라우저가 WebP 저장을 지원하지 않으면 JPEG(품질 0.92).
- 저장 후 `naturalWidth`, `naturalHeight`는 저장된 이미지 기준.

---

## 4. 이미지 맞춤 (윈도우·배경 공통)

### 4.1 표시 계산 (`utils/fit.ts`, 테스트 필수)
프레임 크기 `W×H`, 이미지 크기 `iw×ih`, `focusX`, `focusY`, `zoom`일 때:
```
s0 = max(W / iw, H / ih)          // 프레임을 꽉 채우는 최소 배율 (cover)
s  = s0 × zoom
dw = iw × s,  dh = ih × s          // 표시 크기
left = W/2 − focusX × dw           // 초점을 프레임 가운데로
top  = H/2 − focusY × dh
left = clamp(left, W − dw, 0)      // 빈 곳이 생기지 않게 제한
top  = clamp(top,  H − dh, 0)
```
- `<img>`를 `position: absolute`로 `left`, `top`, `dw`, `dh`에 놓고 프레임은 `overflow: hidden`.
- 윈도우 크기가 바뀌어도 같은 `focus`, `zoom`으로 다시 계산하므로 항상 프레임을 꽉 채운다.

### 4.2 편집 화면 (모달)
- kkoriworld의 회원가입 모달처럼 오버레이 위의 Platinum 윈도우. 제목 "이미지 편집".
- 미리보기: 대상 프레임과 **같은 가로세로 비율**의 영역 (최대 480×360에 맞춤). 4.1 계산으로 표시.
- 조작:
  - 미리보기를 끌어서 위치 이동 (끈 만큼 focus 변경, 4.1의 제한 적용)
  - 확대 Slider 100%~400% (zoom 1~4), 마우스 휠로도 조절
  - [맞춤 초기화]: focus 0.5/0.5, zoom 1
- 버튼: [취소] [적용](기본). Esc = 취소.
- 새 이미지를 고른 직후에도 이 화면을 연다.

---

## 5. 데스크톱

### 5.1 메뉴 바
- **왼쪽**: 홈 아이콘 → 메뉴 8종 + `새 윈도우`
  - 홈 아이콘: **화면을 PNG로 저장** (8장). 툴팁 "화면을 PNG로 저장"
  - 홈 아이콘 모양: `homeIcon`이 있으면 그 이미지(정사각형, 4.1 맞춤 계산), 없으면 앱 기본 아이콘. 크기는 kkoriworld 메뉴 바 홈 아이콘과 같게 (16×16). 바꾸기는 제어판 (9장).
  - 앱 기본 아이콘: Apple 아이콘이 아닌, 이 프로젝트를 위해 직접 만든 16×16 기반 픽셀 아이콘(예: 액자 모양)을 SVG로 `public/favicon.svg`에 두고, `index.html`의 기본 파비콘과 메뉴 바 기본 홈 아이콘으로 함께 쓴다.
  - 메뉴 8종: kkoriworld의 기본 라벨·아이콘 (검색, D-day, BGM, 캘린더, 배너, 공지사항, 전체 글목록, 방명록). 누르면 그 메뉴의 윈도우를 추가 (이미 있으면 맨 앞으로, 최소화 상태면 복원). 검색 메뉴도 팝업 없이 윈도우만.
  - `새 윈도우`: 이름 없는 프레임(`kind: custom`, 제목 "새 윈도우")을 하나 추가. 여러 개 가능.
- **오른쪽** (오른쪽 끝부터): 시계 → 스티커 모드 버튼 → `제어판` 버튼

### 5.2 배경
- 빈 배경(윈도우·스티커·메뉴 바·트레이가 아닌 곳)을 클릭하면:
  - 배경 이미지가 없으면: 파일 선택 → 편집 화면(비율 = 데스크톱 영역) → 적용
  - 있으면: 클릭한 위치에 작은 팝업 메뉴 [배경 바꾸기] [위치·크기 편집] [배경 지우기]
- 배경 이미지가 없으면 `--kw-bg`.
- 배경 이미지 표시는 4.1과 같음 (데스크톱 영역이 프레임).
- 열린 팝업 메뉴는 다른 곳을 클릭하거나 Esc로 닫힘.

### 5.3 하단 트레이
- kkoriworld와 같음. 최소화한 윈도우의 아이콘이 모인다.

---

## 6. 윈도우

### 6.1 종류와 크기 (`windows/registry.ts`)
| kind | 제목 기본값 | 아이콘 | 처음 크기 | 같은 윈도우 |
|---|---|---|---|---|
| `menu` | 메뉴 라벨 | 메뉴 아이콘 | 360×270px | 메뉴마다 1개 |
| `custom` | 새 윈도우 | `fa-solid fa-image` | 360×270px | 여러 개 |
| `control_panel` | 제어판 | `fa-solid fa-sliders` | 340×360px (고정) | 1개 (프로젝트 데이터에 저장하지 않음, PNG에 포함되지 않음) |
| `sticker_list` | 스티커 | `fa-solid fa-note-sticky` | kkoriworld와 같음 | 1개 (스티커 모드에서만) |

- 처음 위치: 앞서 연 윈도우에서 오른쪽 아래로 20px씩 비켜서. 화면 밖으로 나가면 왼쪽 위로 돌아감. 생성 시 px 값을 데스크톱 대비 비율로 바꿔 저장.
- `menu`, `custom`은 모두 **크기 조절 가능** (크기 조절 상자), 최소 120×90px. 버튼은 닫기·최소화·최대화 (왼쪽 정렬, kkoriworld와 같음).

### 6.2 동작
| 동작 | 처리 |
|---|---|
| 이동·크기 조절 | kkoriworld와 같음. 놓는 순간 비율로 저장 |
| 맨 앞으로 | 클릭한 윈도우의 z를 가장 크게 |
| 제목 바꾸기 | **타이틀 바 더블클릭** → 제목 자리에 입력란. Enter 저장, Esc 취소, 최대 40자, 비우면 기본 제목. (kkoriworld의 "더블클릭 = 최대화"는 없앰) |
| 최소화 | 트레이로. **PNG에 포함되지 않음** |
| 최대화 | 데스크톱 영역을 꽉 채움, 다시 누르면 원래 크기 |
| 닫기 | 윈도우 삭제. 이미지가 있으면 확인창 "이 윈도우와 이미지를 지울까요?" |
| 줌 사각형 | kkoriworld와 같음 |

### 6.3 윈도우 안의 이미지
- 콘텐츠 영역(들어간 면, 배경 `--kw-bg-sub`) 전체가 이미지 프레임.
- **이미지가 없을 때**: 가운데에 그림 아이콘 + "클릭해서 이미지 넣기" (`--kw-text-dim`). 이 안내는 PNG에 포함되지 않음 (빈 프레임만 저장됨).
  - 클릭 → 파일 선택 → 편집 화면(비율 = 지금 콘텐츠 영역) → 적용
- **이미지가 있을 때**: 4.1로 표시. 클릭하면 클릭 위치에 팝업 메뉴 [이미지 바꾸기] [위치·크기 편집] [이미지 지우기]
- 콘텐츠 영역을 클릭해도 윈도우는 맨 앞으로 온다.

---

## 7. 스티커 모드
- kkoriworld `ui-decisions.md` 6장과 같다. 차이점:
  - 스티커 모드 버튼은 항상 보인다 (로그인 없음).
  - 스티커 목록은 `stickerLibrary`, 배치는 `stickers` (3.1). 업로드는 3.3 규칙 (GIF 그대로).
  - 좌표·크기는 데스크톱 대비 비율 (3.1). 크기 조절은 비율 유지.
  - 서버 저장 대신 3.2 자동 저장.
- 스티커 모드 중에는 배경 클릭 메뉴(5.2)가 동작하지 않는다.

---

## 8. PNG 저장 (홈 아이콘)
1. 스티커 모드 중이면 알림창 "스티커 모드를 끝낸 뒤 저장해주세요." 후 중단.
2. 열린 팝업 메뉴·툴팁을 닫고 선택 상태를 해제한다.
3. 작은 알림창 "PNG로 저장하는 중…" 표시 (이 알림창은 캡처에서 제외).
4. `document.fonts.ready`를 기다린 뒤, 화면 루트 요소(메뉴 바 + 데스크톱)를 `html-to-image`의 `toPng`로 캡처.
   - `pixelRatio`: `window.devicePixelRatio` (최소 1)
   - 제외할 요소: `data-export-hide` 속성이 있는 요소 (빈 프레임 안내, 하단 트레이, 제어판 윈도우, 진행 알림창, 선택 테두리, 툴팁)
   - 최소화한 윈도우는 화면에 없으므로 자연히 빠진다.
   - 메뉴 바의 홈 아이콘(`homeIcon` 또는 앱 기본 아이콘)은 PNG에 포함된다.
5. 파일 이름 `macos9-frame-YYYYMMDD-HHmmss.png`로 다운로드.
6. 실패하면 알림창 "PNG 저장에 실패했습니다. 다른 브라우저에서 다시 시도해주세요." (콘솔에 원인 기록)

- Chrome, Firefox, Safari에서 확인한다. Safari에서 첫 캡처에 이미지가 빠지는 문제가 있으면 캡처를 두 번 실행해 두 번째 결과를 쓰는 방식으로 해결한다.
- 메뉴 바 시계는 저장 순간의 시각이 들어간다.

---

## 9. 제어판
- 메뉴 바의 `제어판` 버튼으로 연다.
- 내용:
  1. **테마 색 5가지** (`ColorField`, 바꾸는 즉시 미리보기). [저장]을 누르면 프로젝트에 저장, 저장하지 않고 닫으면 원래 색으로 되돌림.
  2. **홈 아이콘**: 지금 아이콘 미리보기(32×32) + [아이콘 바꾸기] [위치·크기 편집] [기본 아이콘으로]
     - [아이콘 바꾸기]: 파일 선택(3.3 규칙) → 편집 화면(4.2, 비율 1:1) → 적용
     - [기본 아이콘으로]: `homeIcon`을 null로
     - 바꾸면 메뉴 바와 이 브라우저 탭의 파비콘(`<link rel="icon">`)에 바로 반영. 탭 파비콘은 `homeIcon`을 64×64 PNG로 그린 data URL을 사용
     - 이 항목은 테마 색처럼 [저장]을 기다리지 않고 적용 즉시 프로젝트에 저장
  3. 구분선 아래 **[전부 지우기]** → 확인창 "모든 윈도우, 이미지, 스티커, 배경, 색상 설정을 지웁니다. 되돌릴 수 없습니다." → IndexedDB를 비우고 빈 프로젝트로.
- 테마 색과 홈 아이콘 외의 kkoriworld 제어판 패널은 없다.

---

## 10. 배포
- 새 공개 저장소 `macos9-frame-maker` (GitHub 무료 계정은 **공개 저장소만** GitHub Pages 사용 가능).
- `.github/workflows/deploy.yml`: main 브랜치에 push하면 `npm ci && npm run build` → `dist/`를 GitHub Pages에 배포 (`actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`, Node LTS).
- 저장소 Settings → Pages → Source를 **GitHub Actions**로 설정 (사용자가 직접).
- `README.md`: 무엇을 하는 도구인지, 사용 방법(윈도우 추가 → 이미지 넣기 → 배경·스티커 → 색상 → 홈 아이콘으로 PNG 저장), 이미지가 서버로 전송되지 않는다는 안내, 데스크톱 브라우저 권장.
