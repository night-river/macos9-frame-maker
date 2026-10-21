# macos9-frame-maker — AI 작업 지침 (모든 AI 도구 공통)

> Claude Code는 `CLAUDE.md`를 통해, GitHub Copilot 등 다른 도구는 이 파일을 직접 읽는다. 지침은 이 파일 한 곳에서만 관리한다.

## 프로젝트
Mac OS 9(Platinum) 디자인의 데스크톱 화면에 사용자가 자기 이미지를 채워 넣고 PNG로 저장하는 **정적 웹 도구**. GitHub Pages로 배포한다.
- 서버 없음. 모든 처리(이미지 편집, 배치, 저장, PNG 생성)는 브라우저 안에서. 사용자의 이미지는 어디에도 업로드하지 않는다.
- React 19 + TypeScript + Vite. 디자인은 형제 폴더의 `kkoriworld` 프론트엔드를 가져와 쓴다.

## 작업 폴더 (중요)
- VS Code는 상위 폴더 `Github/`를 열고 있을 수 있다. **이 프로젝트의 모든 작업은 `Github/macos9-frame-maker/` 안에서만** 한다.
- `Github/kkoriworld/`는 **읽기 전용 참고 자료**다. 파일을 수정·삭제·이동하지 않고, 그 폴더에서 명령(npm, docker, git 등)을 실행하지 않는다. 필요한 파일은 이 프로젝트로 **복사**해서 고친다.
- `Github/` 안의 다른 파일과 폴더는 건드리지 않는다.
- 터미널 명령은 항상 이 프로젝트 폴더에서 실행한다 (`cd macos9-frame-maker` 확인 후).

## 작업 전에 읽을 문서
| 문서 | 내용 |
|---|---|
| `docs/frame-maker.md` | 명세 — **구현 기준** |
| `docs/tasks.md` | 단계별 작업 목록과 완료 조건 |

## 명령
- 개발 서버: `npm run dev` / 타입 검사: `npx tsc --noEmit` / 테스트: `npx vitest run` / 빌드: `npm run build`
- `git commit`, `git push`는 하지 않는다 (커밋 메시지만 제안).

## 코드 규칙
- 주석과 사용자에게 보이는 문구는 한국어.
- 패키지는 `docs/frame-maker.md` 1장 표에 있는 것만. Tailwind, UI 키트, CSS-in-JS, 라우터, 서버 통신 라이브러리 금지. 그 밖의 패키지가 필요하면 설치 전에 질문.
- 색은 테마 CSS 변수(`--kw-*`)만 사용. 화면 요소는 `src/ui/`의 기본 컴포넌트로.
- 윈도우 종류·크기·버튼은 `src/windows/registry.ts` 한 곳에서 정의.
- Apple의 로고·아이콘·폰트는 쓰지 않는다 (모양만 참고해 직접 그림).
- 서버 API를 부르는 코드가 남아 있으면 안 된다 (`fetch`, `axios` 사용 금지. 단 같은 출처의 폰트·정적 파일 로딩은 예외).

## 작업 방식
1. 사용자가 지정한 Phase만 작업한다.
2. 명세가 모호하거나 다르게 구현해야 할 이유가 생기면 임의로 정하지 말고 먼저 질문한다.
3. 각 Phase에서 테스트를 작성·통과시키고 `npx tsc --noEmit`도 통과시킨다.
4. 끝나면 한국어로 보고: 변경 파일, **사용자가 화면에서 확인할 순서**, 해석이 필요했던 부분, 제안 커밋 메시지.
5. `docs/tasks.md`의 체크박스를 갱신한다.
