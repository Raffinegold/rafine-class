# 라피네 클래스 · Supabase 자료실 운영 가이드 (2026-11-20)

## 1. 지금 연결된 프로젝트

| 항목 | 값 |
| --- | --- |
| 프로젝트 이름 | `rafine-class` |
| 프로젝트 ref | `ckuxpbeemamovepzkoja` |
| Project URL | `https://ckuxpbeemamovepzkoja.supabase.co` |
| 리전 | Northeast Asia (Seoul, `ap-northeast-2`) |
| 플랜 | Free |
| 프론트엔드 | Vite + React (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) |
| 원장 로그인 | Supabase Auth 이메일/비밀번호 (앱 `metadata.role = admin`) |
| 학생 로그인 | 이름 + 4자리 PIN → `student_login` RPC → 12시간 토큰 |

> 브라우저에는 **anon(public) 키만** 들어갑니다. `service_role` 키는 절대 프론트엔드·깃허브에 넣지 마세요.
> `.env` 는 `.gitignore` 에 있어 저장소에 올라가지 않습니다.

## 2. 스키마 적용 (새 프로젝트일 때)

1. Supabase 대시보드 → **SQL Editor**
2. `supabase/schema.sql` 전체를 붙여 실행 (여러 번 실행해도 안전합니다 — `if not exists` / `drop policy if exists`)
3. `supabase/seed-demo.sql` 실행 → 데모 학생 5명(앱과 같은 PIN)·단어 100개·상점 상품
4. `supabase/seed-materials.sql` 실행 → 파이썬 1~4주차 8차시 자료 12건

시드는 `node scripts/gen-seed-sql.mjs` 로 다시 만들 수 있습니다(앱 코드의 시드와 항상 같은 내용).

### 만들어진 것 (26개 테이블)

- 기존: `students` `word_sets` `words` `assignments` `study_logs` `wrong_notes` `weekly_reports` `level_history` `student_sessions` `cash_wallets` `shop_items` `redemption_requests` `game_sessions` `app_settings` `coding_logs` `coding_wrong_notes` `coding_sessions`
- **자료실(신규)**: `materials` `material_assignments` `material_extra_assignments` `material_views`
- **클래스 동기화(신규)**: `class_profiles` `class_progress` `lesson_memos` `student_works` `report_notes`

### RPC (학생은 토큰으로만 접근)

| RPC | 하는 일 |
| --- | --- |
| `student_login(name, pin)` | PIN 확인 후 12시간 토큰 발급 |
| `student_bundle(token)` | 영어 학습 묶음 |
| `student_coding_bundle(token)` | 코딩 기록 묶음 |
| `student_materials(token)` | **내 배정 + 자료** — `teacher_guide`·`answer_code` 는 결과에 담지 않음 |
| `material_mark(token, id, done)` | “다 봤어요” 열람·완료 기록 |
| `student_class_bundle(token)` | 내 진도·작품 (수업 메모는 제외) |

## 3. 원장 계정 만들기 / 비밀번호 바꾸기

1. 대시보드 → **Authentication → Users → Add user** (이메일 + 비밀번호)
2. 관리자 권한 부여 (SQL Editor, service_role 권한이 필요한 작업이라 대시보드에서만):
   ```sql
   update auth.users
      set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
    where email = '원장이메일';
   ```
3. 비밀번호 변경은 **Authentication → Users → 해당 사용자 → Reset password**(또는 앱 로그인 화면에서 재설정)
4. `metadata.role = admin` 이 없는 계정은 자료·학생 데이터를 **읽을 수도 쓸 수도 없습니다**(RLS).

> 2단계 인증은 Supabase Auth → Providers → Email 설정에서 켤 수 있습니다. 켜면 앱 로그인 때 6자리 코드를 한 번 더 묻습니다.

## 4. 원장님이 매일 하는 일

### 자료 올리기
`/admin/tools → 📂 자료실 · 수업안 → 자료 등록`
- **종류**: 이론 · 예제 코드 · 업그레이드 미션 · 그림 · 링크
- **트랙 / 주차(1~24) / 회차(1·2)** 를 고르면 그 차시 학생에게만 나갑니다
- **학생 화면에 보일 설명**과 **교사용 수업안 메모·정답 코드**는 칸이 분리되어 있고, 정답·수업안은 학생에게 절대 내려가지 않습니다
- **학생에게 공개** 를 끄면 초안으로 저장됩니다

### 학생 배정
`📂 자료실 · 수업안 → 학생 배정`
- 학생을 고르고 **과정(트랙) · 주차 · 회차**를 저장하면 학생 화면 맨 위 카드가 바로 바뀝니다
- 반 공통 자료 외에 **특정 학생에게만** 자료를 추가 배정할 수 있습니다

### 수업안 보기 (새 선생님용)
`📂 자료실 · 수업안 → 수업안 보기`
① 30초 시연 멘트 ② 핵심 비유 ③ 설명 순서·판서 ④ AI 틈틈이 코칭 ⑤ 자주 나는 에러·코치 멘트 ⑥ 운영 팁 ⑦ 정답 코드 — 순서대로 읽으면 바로 수업할 수 있습니다.

### 학생이 봤는지 확인
`자료 등록·수정` 목록에 **열람 N명 · 완료 N명** 이 표시되고, 학생이 “다 봤어요”를 누르면 즉시 반영됩니다.

## 5. 수업 순서 (24주, 2026-11-20 확정)

주 2회 리듬 — **1회차 이론 1개 + 만들기 / 2회차 마무리 → 수정(디버깅) → 응용 업그레이드**, AI는 세 자리(만들기 전 아이디어 · 막혔을 때 원인 힌트 · 끝난 뒤 리뷰)에서만.

- **1~12주 = 부품 익히기 + 4주마다 미니 작품** (파이썬: 소개 카드 → 계산기 → 조건문 → ★추천기 → 반복 → 리스트 → ★단어장 → 딕셔너리 → 함수 → 파일 → ★기록 관리)
- **13~24주 = 심화 + 내 포트폴리오** (예외 → 모듈 → 클래스 → ★텍스트 RPG → CSV·자동화 → GUI → ★퀴즈 앱 → 데이터 → ★메인 앱)

근거(국내 인기 강의 공통 순서): 눈에 보이는 출력 먼저 → 자료형·연산자 → 제어문 → 자료구조 → 함수 → 파일 → 클래스 → 예외 → 프로젝트·배포.
참고: 나도코딩(자료형→연산자→문자열→자료구조→제어문→함수→파일→클래스), 점프 투 파이썬/조코딩(자료형→제어문→입출력→클래스→모듈), 코드잇(기본 개념→데이터 다루기→제어문→함수→프로젝트), 스파르타(작은 결과물 먼저 → 기능 → 배포).

전체 주차표는 `src/lib/curriculum.ts` 의 `CURRICULUM` 에 있고, 앱 화면(원장 진도 체크·학생 홈)이 이 표를 그대로 씁니다.

## 6. 배포

```bash
cd work/rafine-class
npm ci
# .env 에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 넣기
npm run build          # tsc --noEmit + vite build + 404.html 생성
# dist/ 를 gh-pages 브랜치에 올리면 https://raffinegold.github.io/rafine-class/ 반영
```

- `.env` 없이 빌드하면 **데모(로컬) 모드**로 떨어지고 학생 로그인도 브라우저 로컬에서만 동작합니다.
- `.github/workflows/` 는 GitHub App 권한(`workflows`) 때문에 앱에서 푸시할 수 없습니다. 자동 배포를 원하면 GitHub 웹에서 `docs/github-actions-deploy.yml` 을 `.github/workflows/deploy.yml` 로 한 번 옮겨 주세요.
- **PWA 주의**: 배포 직후 학생 폰에는 이전 화면이 잠깐 남을 수 있습니다(서비스 워커). 새로고침 한두 번이면 새 버전으로 바뀝니다.

## 7. 점검 기록 (2026-11-20)

- `supabase/schema.sql` SQL Editor 실행 → 26개 테이블 생성 확인
- `seed-demo.sql` / `seed-materials.sql` 실행 → 학생 5 · 단어 100 · 자료 12건 확인
- anon 키로 `students` 직접 조회 → **차단(42501)**, `words` 조회 → 정상
- 학생 RPC(`student_materials`) 결과에 `teacher_guide` / `answer_code` **없음** 확인
- 학생 “다 봤어요” → `material_views` 1행 생성 확인
- 원장 로그인 후 자료 수정·배정 저장·삭제 → 200/204 확인(점검 후 원래 값으로 원복)
- 배포본에서 학생 로그인 → 자료실 → 1·2회차 전환 → 완료 표시 → **새로고침 후 유지** 확인
