import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.QA_BASE ?? 'http://127.0.0.1:4173/rafine-class/';
const OUT = '/workspace/attachments/2026-11-19';
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const problems = [];
function ok(name, extra = '') {
  results.push(`PASS ${name}${extra ? ' — ' + extra : ''}`);
  console.log('PASS', name, extra);
}
function fail(name, extra = '') {
  results.push(`FAIL ${name}${extra ? ' — ' + extra : ''}`);
  problems.push(`${name} ${extra}`);
  console.log('FAIL', name, extra);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  locale: 'ko-KR',
  serviceWorkers: 'block',
  permissions: ['clipboard-read', 'clipboard-write'],
});
const page = await ctx.newPage();
const consoleErrors = [];
page.on('pageerror', (e) => consoleErrors.push(String(e)));
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});

async function overflowCheck(label) {
  const data = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }));
  if (data.scroll <= data.inner + 1) ok(`가로 스크롤 없음 (${label} 390px)`, `${data.scroll}px`);
  else fail(`가로 스크롤 발생 (${label} 390px)`, `${data.scroll} > ${data.inner}`);
}

async function loginPin(digits) {
  for (const d of digits) {
    await page.click(`[data-testid="pin-${d}"]`);
    await page.waitForTimeout(120);
  }
}

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector('[data-testid="student-stu-seoyeon"]');
ok('첫 화면 로드', await page.title());

// ------------------------------- 학생 모드 -------------------------------
await page.click('[data-testid="student-stu-seoyeon"]');
await page.waitForSelector('[data-testid="pin-1"]');
await loginPin('1111');
await page.waitForSelector('[data-testid="student-nav"]', { timeout: 10000 });
await page.waitForTimeout(600);
ok('학생 로그인 (김서연 1111)');

const navCount = await page.locator('[data-testid="student-nav"] button').count();
navCount === 4 ? ok('학생 하단 탭 4개') : fail('학생 하단 탭 개수', String(navCount));

const greet = (await page.locator('main').innerText()).includes('안녕, 김서연');
greet ? ok('학생 홈 인사말 표시') : fail('학생 홈 인사말');

if (await page.locator('[data-testid="home-game-card"]').count()) ok('학습 탭 게임 놀이터 카드');
else fail('게임 놀이터 카드');

await overflowCheck('학생 홈');
await page.screenshot({ path: `${OUT}/qa_class_student.png` });

// 게임 10종: 영어 5 + 코딩 5
await page.click('[data-testid="home-game-card"]');
await page.waitForSelector('[data-testid="eng-game-menu"]');
const engGames = await page.locator('[data-testid^="eng-pick-"]').count();
engGames === 5 ? ok('영어 게임 5종 노출') : fail('영어 게임 수', String(engGames));
await page.click('[data-testid="eng-pick-match"]');
await page.waitForSelector('[data-testid="game-board"]', { timeout: 15000 });
await page.click('[data-testid="game-card-0"]');
await page.waitForTimeout(400);
const boardCards = await page.locator('[data-testid^="game-card-"]').count();
boardCards >= 8 ? ok('영어 게임 실제 실행 (카드 보드 렌더)', `${boardCards}장`) : fail('게임 보드 카드', String(boardCards));
await page.goto(BASE + 'game', { waitUntil: 'networkidle' });
await page.waitForSelector('[data-testid="eng-game-menu"]');
await page.click('[data-testid="subject-coding"]');
await page.waitForSelector('[data-testid="coding-game-menu"]');
const codingGames = await page.locator('[data-testid^="coding-pick-"]').count();
codingGames === 5 ? ok('코딩 게임 5종 노출') : fail('코딩 게임 수', String(codingGames));
await overflowCheck('게임 메뉴(코딩)');
await page.click('[data-testid="subject-english"]');

// 내 작품 보관함
await page.goto(BASE + 'works', { waitUntil: 'networkidle' });
await page.waitForSelector('[data-testid="work-add"]');
ok('내 작품 탭 진입');
const beforeWorks = await page.locator('[data-testid^="work-work-"]').count();
await page.click('[data-testid="work-add"]');
await page.fill('[data-testid="work-title"]', '반짝이 우주선');
await page.fill('input[placeholder="예) 점수 기능을 스스로 만들었어요"]', '반짝이 효과를 직접 넣었어요');
await page.click('[data-testid="work-save"]');
await page.waitForTimeout(500);
const hasNewWork = (await page.locator('text=반짝이 우주선').count()) > 0;
hasNewWork ? ok('작품 등록·저장') : fail('작품 등록');
await overflowCheck('내 작품');
await page.screenshot({ path: `${OUT}/qa_class_works.png` });

// 복습 힌트
await page.goto(BASE + 'hints', { waitUntil: 'networkidle' });
await page.waitForSelector('[data-testid="hint-track-roblox"]');
const defaultTrackHint = await page.locator('text=파트와 좌표').count();
defaultTrackHint ? ok('힌트 탭이 내 트랙(로블록스)으로 열림') : fail('힌트 기본 트랙');
await page.click('[data-testid="hint-track-scratch"]');
await page.click('[data-testid="hint-sc-order-0"]');
await page.waitForTimeout(300);
const hintOpen = await page.locator('text=스프라이트가 움직이지 않아요').count();
hintOpen ? ok('복습 힌트 아코디언 열림') : fail('복습 힌트 열림');
await overflowCheck('복습 힌트');
await page.screenshot({ path: `${OUT}/qa_class_hints.png` });

// 상점
await page.goto(BASE + 'shop', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const shopItems = await page.locator('text=츄파춥스').count();
shopItems ? ok('캐시 상점 상품 유지') : fail('상점 상품');
await overflowCheck('상점');

// 로그아웃
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await page.click('text=나가기');
await page.waitForSelector('[data-testid="student-stu-seoyeon"]');
ok('학생 로그아웃');

// ------------------------------- 원장 모드 -------------------------------
await page.click('button:has-text("원장님")');
await page.waitForSelector('[data-testid="pin-9"]');
await loginPin('9999');
await page.waitForSelector('[data-testid="student-select"]', { timeout: 10000 });
await page.waitForTimeout(600);
ok('원장 로그인 (PIN 9999)');

const codeValue = await page.inputValue('[data-testid="mind-code-input"]');
codeValue === 'RC-14E1' ? ok('기질 코드 기본 탑재', codeValue) : fail('기질 코드 값', codeValue);
for (const t of ['부딪히는 지점', '수업 지도 팁', '24주 커리큘럼 진도']) {
  const n = await page.locator(`text=${t}`).count();
  n ? ok(`원장 1단계 · ${t} 표시`) : fail(`원장 1단계 · ${t} 없음`);
}
const body1 = await page.locator('main').innerText();
body1.includes('직진·추진형') && body1.includes('몰입·관찰형')
  ? ok('RC-14E1 자동 해석 (M1 / K4)')
  : fail('RC-14E1 해석 문구');
await overflowCheck('원장 기질·진도');
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/qa_class_admin.png` });

// 코드 즉시 재해석
await page.fill('[data-testid="mind-code-input"]', 'RC-22F6');
await page.waitForTimeout(500);
const body2 = await page.locator('main').innerText();
body2.includes('대화·감성형') && body2.includes('표현·발표형')
  ? ok('코드 변경 시 즉시 재해석 (RC-22F6 → M2/K2)')
  : fail('코드 재해석');
await page.fill('[data-testid="mind-code-input"]', 'RC-14E1');
await page.waitForTimeout(300);

// 24주 진도 토글
const beforePct = await page.locator('main').innerText();
await page.click('[data-testid="week-done-toggle"]');
await page.waitForTimeout(400);
const afterPct = await page.locator('main').innerText();
beforePct !== afterPct ? ok('24주 진도 체크 반영') : fail('24주 진도 체크');

// 수업 1줄 메모
await page.click('[data-testid="step-memo"]');
await page.waitForSelector('[data-testid="memo-made"]');
await page.fill('[data-testid="memo-made"]', '반짝이 효과 파트 만들기');
await page.fill('[data-testid="memo-good"]', '스스로 오류를 찾았어요');
await page.fill('[data-testid="memo-todo"]', '저장을 자주 누르기');
await page.click('[data-testid="memo-save"]');
await page.waitForTimeout(500);
const memoShown = await page.locator('text=반짝이 효과 파트 만들기').count();
memoShown ? ok('수업 메모 저장·목록 표시') : fail('수업 메모 저장');
await overflowCheck('수업 메모');

// 월말 리포트
await page.click('[data-testid="step-report"]');
await page.waitForSelector('[data-testid="report-copy"]');
await page.waitForTimeout(500);
const reportText = await page.locator('#report-print').innerText();
const need = ['이번 달 만든 작품', '진행 과정', '아이의 강점', '보완할 점', '원장 종합 소견', '박종혁 원장', '미술심리상담사'];
for (const t of need) {
  reportText.includes(t) ? ok(`리포트 항목 · ${t}`) : fail(`리포트 항목 없음 · ${t}`);
}
reportText.includes('반짝이 효과 파트 만들기') ? ok('리포트에 수업 메모 자동 반영') : fail('리포트 메모 반영');
await overflowCheck('월말 리포트');

await page.click('[data-testid="report-copy"]');
await page.waitForTimeout(700);
let clip = '';
try {
  clip = await page.evaluate(() => navigator.clipboard.readText());
} catch (e) {
  clip = '';
}
if (clip && clip.includes('라피네 클래스') && clip.includes('박종혁 원장')) ok('카톡 전송용 복사', `${clip.length}자`);
else fail('카톡 복사', clip ? clip.slice(0, 40) : 'clipboard 비어 있음');

await page.waitForTimeout(3000);
await page.evaluate(() => {
  const h = document.querySelector('header');
  if (h) h.setAttribute('data-qa-hidden', '1'), (h.style.display = 'none');
});
await page.locator('#report-print').screenshot({ path: `${OUT}/qa_class_report.png` });
await page.evaluate(() => {
  const h = document.querySelector('header');
  if (h) (h.style.display = '');
});
await page.emulateMedia({ media: 'print' });
await page.pdf({ path: `${OUT}/qa_class_report.pdf`, format: 'A4', printBackground: true });
await page.emulateMedia({ media: 'screen' });
const pdfSize = fs.statSync(`${OUT}/qa_class_report.pdf`).size;
pdfSize > 10000 ? ok('인쇄/PDF 저장', `${Math.round(pdfSize / 1024)}KB`) : fail('PDF 저장', String(pdfSize));

// 신규 학생 등록
await page.click('[data-testid="step-mind"]');
await page.click('[data-testid="student-add"]');
await page.fill('[data-testid="student-add-name"]', 'QA학생');
await page.fill('input[placeholder="예) RC-14E1"]', 'RC-31E2');
await page.click('[data-testid="student-add-save"]');
await page.waitForTimeout(700);
const pinShown = await page.locator('text=PIN 발급').count();
const qaStudent = await page.locator('text=QA학생').count();
pinShown || qaStudent ? ok('신규 학생 등록 + PIN 발급') : fail('신규 학생 등록');

// 관리 도구(기존 기능) 유지
await page.goto(BASE + 'admin/tools', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const toolsText = await page.locator('body').innerText();
['대시보드', '학생', '단어장', '레벨 배정', '코딩', '상점', '금요일 리포트'].every((t) => toolsText.includes(t))
  ? ok('기존 원장 관리 도구 7탭 유지')
  : fail('관리 도구 탭');
await overflowCheck('관리 도구');

// ------------------------------- 태블릿/PC -------------------------------
for (const w of [768, 1280]) {
  await page.setViewportSize({ width: w, height: 900 });
  for (const path of ['', 'admin']) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await overflowCheck(`${path || '홈'} ${w}px`);
  }
}

// ------------------------------- 오류 로그 -------------------------------
const realErrors = consoleErrors.filter(
  (e) => !/favicon|manifest|404|Download the React DevTools/i.test(e) && !/Failed to load resource/.test(e)
);
if (realErrors.length) fail('콘솔/페이지 오류', realErrors.slice(0, 3).join(' | '));
else ok('콘솔 오류 없음');

await ctx.close();
await browser.close();

console.log('\n===== SUMMARY =====');
console.log(results.join('\n'));
console.log(`\nPASS ${results.filter((r) => r.startsWith('PASS')).length} / FAIL ${results.filter((r) => r.startsWith('FAIL')).length}`);
process.exit(problems.length ? 1 : 0);
