# 라피네 클래스 (Rafine Class)

라피네코딩컴퓨터학원 두정점(천안)의 **학생관리 · 학습 · 학부모 리포트 통합 웹앱**입니다.
원장 박종혁(미술심리상담사)의 상담 방식인 `RC-XXXX` 기질 코드를 수업과 월말 리포트에 그대로 연결합니다.

- 배포 주소: https://raffinegold.github.io/rafine-class/
- 로그인 없이 체험 가능한 **데모 모드**(LocalStorage) — 학생 5명 · 영단어 100개 · 10종 게임 · 작품/메모 샘플 탑재
- `.env`에 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`가 있으면 Supabase 실시간 모드로 전환됩니다.

## 2026-11-26 · 원터치화 1단계

학생이 노트북을 켜고 로그인하면 **① 오늘 기본 이론(전원 공통) → ② 내 기질 맞춤 숙제·문제·팁 → ③ 오늘 수업 완료 체크** 3단이 첫 화면에 바로 나옵니다.

| 구분 | 새로 생긴 것 |
| --- | --- |
| 학생 | **오늘의 원터치** 3단 보드 · **🏆 대회·IT뉴스** 탭(D-day·대상 필터) · **🏅 작품·상장 포트폴리오**(승인 요청 → 학부모 공유 링크) |
| 원장 | **📊 진도·완료 보드**(20초 자동 갱신·기질 원클릭 변경) · **🖼️ 포트폴리오 승인함** · **🏆 대회·IT뉴스 관리**(노출 ON/OFF·추가·수정) · 원장 홈에 기질 4종 버튼 |
| 학부모 | `/p/<공유토큰>` — PIN 없이 열리는 작품·상장 포트폴리오(인쇄·PDF) |
| 연동 | rafine-mind 결과지의 **「라피네 클래스에 저장」**(학생 이름+PIN) → `students.temperament_type` |

### 기질 4종 정형화 (rafine-mind K1~K4 → 라피네 학습 기질)

| rafine-mind | 라피네 기질 | 성향 |
| --- | --- | --- |
| K1 도전·실험형 | `CHALLENGER` 실전·미션형 | 일단 해 보고 고치는 타입 — 짧은 미션·시간 제한 |
| K2 표현·발표형 | `CREATOR` 창작·시각형 | 만들고 보여 줄 때 실력이 붙는 타입 — 내 것으로 표현 |
| K3 규칙·설계형 | `SYSTEMATIC` 체계·암기형 | 순서와 틀을 세우면 힘이 나는 타입 — 단계·규칙 정리 |
| K4 몰입·관찰형 | `EXPLORER` 탐구·원리형 | 왜 그런지 파고드는 타입 — 예측·원리 확인 |

- 파이썬 1~4주(8차시) × 기질 4종 × (숙제·문제·팁) = **96건**을 DB(`temperament_missions`)에 시드했습니다. 내용은 `src/data/onetouchSeed.ts`가 원본입니다.
- 기질이 비어 있는 학생은 학생 화면에 ‘기질 검사 하러 가기’ 안내가 뜨고, 기본 맞춤(체계형)은 쓰지 않습니다.

### Supabase 새 객체 (2026-11-26)

- 테이블: `temperament_results` `temperament_missions` `lesson_completions` `competitions` `it_news` `portfolios` `portfolio_items` + `students.temperament_type/temperament_code`
- 학생 RPC(토큰): `student_today_bundle` `student_complete_lesson` `student_portfolio_save` `student_portfolio_get` `student_work_save` `student_work_delete`
- 공개 RPC(토큰): `portfolio_public(share_token)` — 승인된 포트폴리오만, 이름·학년·과정·작품만
- 검사 저장 RPC: `mind_submit(name, pin, kid, code, axes, shares)` — PIN 확인 · 아이 결과만 저장
- 원장 RPC: `admin_set_temperament` `admin_review_portfolio`
- SQL: `supabase/onetouch.sql` `supabase/onetouch-seedkey.sql` `supabase/student-works.sql`
- 시드: `ADMIN_ACCESS_TOKEN=<원장 JWT> node scripts/seed-onetouch.mjs`

### 보안 메모

- `temperament_missions` `temperament_results` `lesson_completions` `portfolios` `portfolio_items`는 **anon 직접 접근 불가**, 학생은 세션 토큰 RPC로만 자기 것만 읽고 씁니다.
- `portfolio_public`은 `status='approved'`만 돌려주고 PIN·전화·부모 토큰은 담지 않습니다.
- `student_login`·`student_bundle` 응답에서 `parent_token`(학부모 리포트 열쇠)을 제거했습니다.
- 포트폴리오 사진은 브라우저에서 640px JPEG로 줄여 data URL로 저장합니다(요청 1MB 이하 유지).

## 학생 화면 (탭 6개 · 코딩 중심)

학생이 로그인하면 **항상 💻 코딩 화면이 첫 화면**입니다. 원장님이 학생 정보에서 `TOSEL 영어 학습`을 켠 학생만 위쪽에 📚 영어 전환이 생깁니다.

| 탭 | 내용 |
| --- | --- |
| 💻 학습 | **오늘의 원터치(① 이론 ② 기질 맞춤 ③ 완료 체크)** · 오늘의 코딩 미션 · **오늘의 24주 진도** · 복습 힌트 · 내 작품 · 코딩 5종 게임 |
| 🎨 내 작품 | 제목·날짜·사용 도구·한 줄 소감·링크 + **사진 1장** · **🏅 작품·상장 포트폴리오 만들기** 바로가기 |
| 🏆 대회·뉴스 | 대회(D-day·대상 필터·공식 링크) + IT뉴스 |
| 📂 수업자료 | 배정된 차시 자료(개념·따라 만들기·디버깅·미션) |
| 💡 복습 힌트 | 현재 진도 주차 하이라이트 + 트랙별 힌트 카드 |
| 🎁 상점 | 하루 50원 캐시로 기프티콘 교환 신청 |

## 원장 화면 (학생 1명 선택 → 3단계)

| 단계 | 내용 |
| --- | --- |
| 1️⃣ 기질 · 진도 | `RC-XXXX` 입력 즉시 자동 해석 + **기질 4종 원클릭 변경** · 24주 커리큘럼 주차별 체크와 진행률 · 작품 보관함 관리 |
| 2️⃣ 수업 메모 | 오늘 만든 것 / 잘한 점 / 보완할 점 세 칸 → 저장 (10초) · 최근 메모 목록 |
| 3️⃣ 월말 리포트 | 그 달 메모 + 작품(사진 포함) + 기질 코멘트 + 박종혁 원장 종합 소견을 한 장으로 자동 생성 · **종합 소견 직접 수정** · **카톡 전송용 복사** · **인쇄/PDF 저장** |

원장 화면 상단 탭은 **원장 홈 · 📊 진도·완료 보드 · 🖼️ 포트폴리오 승인 · 🏆 대회·IT뉴스 · ⚙️ 관리 도구** 다섯 개입니다.

- **📊 진도·완료 보드**: 재원생/오늘 완료/미완료/승인 대기 요약, 학생별 오늘 완료 시각·배정·24주 진도·포트폴리오 상태, **기질 4종 원클릭 변경**, 20초 자동 갱신.
- **🖼️ 포트폴리오 승인**: 학생이 올린 작품·상장을 보고 [승인하고 공개]/[반려]. 승인하면 학부모 링크(`/p/<토큰>`)가 만들어지고 복사·열람할 수 있습니다. 학생이 고쳐 다시 올리면 자동으로 ‘승인 대기’로 돌아갑니다.
- **🏆 대회·IT뉴스**: 항목별 노출 ON/OFF, 추가·수정·삭제. 날짜를 비우면 학생 화면에 ‘일정 확인’으로 표시됩니다.

## `RC-XXXX` 규격 (rafine-mind 동일)

```
RC-14E1
 │  ││  └─ 아이 4축 높낮이 (4비트 hex, 1 = 높은 쪽)
 │  │└──── 어머니 4축 높낮이
 │  └───── 아이 유형 (1~4 → K1~K4)
 └──────── 어머니 유형 (1~4 → M1~M4)
```

축 순서는 `속도 · 구조 · 표현 · 민감`입니다. 해석 문구·유형 정의·16가지 조합은 `projects/rafine-mind/index.html`의 데이터를 그대로 옮겨 와(`src/lib/mind/data.ts`) 두 앱의 해석이 100% 같습니다.

## 실행 · 배포

```bash
cd projects/rafine-class
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc --noEmit && vite build → dist/
npm run preview  # http://localhost:4173/rafine-class/
```

`vite.config.ts`의 배포 base는 `/rafine-class/`입니다 (GitHub Pages 프로젝트 사이트).
GitHub Pages는 `gh-pages` 브랜치의 빌드 결과물을 그대로 올리는 방식입니다.

```bash
npm run build
npx gh-pages -d dist        # 또는 dist 내용을 gh-pages 브랜치에 push
```

### 데모 계정

| 구분 | 값 |
| --- | --- |
| 학생 | 김서연 1111 · 박준우 2222 · 이하은 3333 · 최민준 4444 · 정유진 5555 |
| 원장 | 9999 |

학생별 샘플 기질 코드: 김서연 `RC-14E1` · 박준우 `RC-22F6` · 이하은 `RC-31E2` · 최민준 `RC-43A8` · 정유진 `RC-12B4`.

데모 학생 5명은 **파이썬 1~4주 시범 과정**으로 통일해 두었습니다(트랙 `python` · 배정 1주차 1회차 · C2).
기질은 김서연=탐구·원리형(K4) · 박준우=창작·시각형(K2) · 이하은=실전·미션형(K1) · 최민준=체계·암기형(K3) · 정유진=창작·시각형(K2)으로,
같은 화면이라도 학생마다 다른 맞춤 숙제·문제·팁이 나오는 것을 바로 확인할 수 있습니다.
(실제 운영에서는 `관리 도구 → 수업자료 → 학생 배정`에서 트랙·주차를 바꾸면 됩니다.)

## QA

```bash
node qa/qa-class.mjs
```

모바일 390×844에서 가로 스크롤 0건, 학생 탭 4개, 게임 10종, 작품 등록, 힌트 아코디언,
`RC-XXXX` 즉시 해석, 24주 진도 체크, 수업 메모 저장, 월말 리포트 자동 생성·카톡 복사·PDF 저장까지 자동 확인합니다.

---

## 📂 수업자료 · 📖 수업안 (2026-11-20 분리)

원장님이 **과정·주차·회차**를 지정해 자료를 올리면, 학생은 자기 화면에서 바로 그 차시를 따라 만듭니다.
관리 도구에서 **수업자료(학생용)** 와 **수업안(선생님용)** 은 완전히 다른 탭입니다.

- **학생**: 하단 `📂 수업자료` — 배정된 `과정 · N주차 · 1회차/2회차` 카드 → 개념 표 · 따라 만들기 3개(기초→변형→실전) · 미니 실습(예상 출력) · 디버깅 3문제 · 업그레이드 미션(기본/도전/심화 + 예시 출력) · AI 틈틈이 힌트 → “다 봤어요”
- **원장 `📂 수업자료`** (`/admin/tools`): **수업 중 보기**(학생 화면과 같은 컴포넌트로 그대로 미리보기) · 자료 등록/수정(학생용 내용만) · 학생 배정 · 열람/완료 확인
- **원장 `📖 수업안`**: 선생님 전용. **2시간 진행표** → 30초 시연 멘트 → 핵심 비유 → 설명 순서·판서 → AI 코칭 타이밍 → 자주 나는 에러·코치 멘트 → 학생이 자주 묻는 질문 → 운영 팁 → **전체 정답 코드**(보기/작성/수정)
- **분량**: 파이썬 1~4주 8차시를 실제 **90~120분 수업**에 맞춰 보강(1회차 = 개념 + 따라 만들기 3 + 실습 3~4 / 2회차 = 디버깅 3 + 미션 3단계)
- **보안**: `teacher_guide`(수업안)와 `answer_code`(정답)는 학생 RPC 결과에 담기지 않습니다. anon 키로 테이블 직접 접근도 차단됩니다.
- **Supabase**: `materials` · `material_assignments` · `material_extra_assignments` · `material_views` + 24주 진도/메모/작품/소견 동기화(`class_*`, `lesson_memos`, `student_works`, `report_notes`). 시드 재적용은 `ADMIN_ACCESS_TOKEN=<원장 JWT> node scripts/seed-cloud.mjs`

설정·운영 방법은 **[docs/supabase-setup.md](docs/supabase-setup.md)** 를 보세요.
