import { chromium } from 'playwright';
import fs from 'node:fs';

/**
 * 라피네 클래스 v2 (코딩 중심 정비) QA
 * ① 코딩 중심 학생 첫 화면 ② 작품 사진 업로드 & 리포트 사진·종합소견 편집·카톡 복사
 * ③ 복습 힌트 현재 주차 하이라이트 ④ 3탭 관리 도구 ⑤ 모바일 390×844 가로 스크롤 0 · 콘솔 오류 0
 */
const BASE = process.env.QA_BASE ?? 'http://127.0.0.1:4173/rafine-class/';
const OUT = '/workspace/attachments/2026-11-20';
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
const badResponses = [];
page.on('pageerror', (e) => consoleErrors.push(String(e)));
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('response', (r) => {
  const u = r.url();
  const isAppDocument = r.request().resourceType() === 'document' && /\/(works|hints|admin|game|shop|study)(\/|$)/.test(u);
  if (r.status() >= 400 && u.startsWith(BASE) && !u.includes('favicon') && !isAppDocument) {
    badResponses.push(`${r.status()} ${u}`);
  }
});

async function overflowCheck(label) {
  const data = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth }));
  if (data.scroll <= data.inner + 1) ok(`가로 스크롤 없음 (${label} 390px)`, `${data.scroll}px`);
  else fail(`가로 스크롤 발생 (${label} 390px)`, `${data.scroll} > ${data.inner}`);
}

async function loginPin(digits) {
  for (const d of digits) {
    await page.click(`[data-testid="pin-${d}"]`);
    await page.waitForTimeout(120);
  }
}

/* =============================== 학생 모드 =============================== */
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector('[data-testid="student-stu-seoyeon"]');
ok('첫 화면 로드', await page.title());

await page.click('[data-testid="student-stu-seoyeon"]');
await page.waitForSelector('[data-testid="pin-1"]');
await loginPin('1111');
await page.waitForSelector('[data-testid="coding-home"]', { timeout: 10000 });
await page.waitForTimeout(700);
ok('학생 로그인 후 코딩 홈이 첫 화면', '/');

// 코딩 중심 첫 화면
const homeText = await page.locator('main').innerText();
homeText.includes('오늘의 코딩 미션') ? ok('오늘의 코딩 미션 카드') : fail('코딩 미션 카드');
homeText.includes('오늘의 24주 진도') ? ok('오늘의 24주 진도 카드') : fail('24주 진도 카드');
homeText.includes('복습 힌트') ? ok('복습 힌트 바로가기') : fail('복습 힌트 바로가기');
homeText.includes('내 작품') ? ok('내 작품 바로가기') : fail('내 작품 바로가기');
homeText.includes('코딩 5종 게임') ? ok('코딩 5종 게임 노출') : fail('코딩 5종 게임');
const gameTiles = await page.locator('[data-testid^="coding-game-tile-"]').count();
gameTiles === 5 ? ok('코딩 게임 타일 5개') : fail('코딩 게임 타일 수', String(gameTiles));
// 영어 미션 화면이 기본으로 뜨지 않는지
homeText.includes('오늘의 미션') && !homeText.includes('오늘의 코딩 미션')
  ? fail('영어 미션이 첫 화면에 남음')
  : ok('영어 18단어 미션이 첫 화면에 없음');
// 영단어 미션 전용 문구(오답/신규) 검사
homeText.includes('신규') && homeText.includes('오답 대기') && homeText.includes('3분 시작하기')
  ? fail('영어 학습 화면 흔적')
  : ok('영어 학습 UI 숨김');

// 두 과목을 모두 켠 학생 → 상단 토글은 보이되 기본은 코딩
if (await page.locator('[data-testid="subject-switch"]').count()) {
  const selected = await page.locator('[data-testid="subject-coding"]').getAttribute('aria-selected');
  selected === 'true' ? ok('과목 토글 기본값 = 코딩') : fail('과목 토글 기본값', String(selected));
} else {
  fail('두 과목 학생인데 과목 토글이 없음');
}

const weekTitle = await page.locator('[data-testid="coding-week-title"]').innerText();
weekTitle.includes('8주차') ? ok('24주 진도 현재 주차 표시', weekTitle) : fail('24주 현재 주차', weekTitle);

await page.screenshot({ path: `${OUT}/qa_class_v2_student.png`, fullPage: false });
await overflowCheck('코딩 학생 홈');

// 힌트 바로가기 → 복습 힌트 상단 하이라이트
await page.click('[data-testid="coding-week-hint"]');
await page.waitForSelector('[data-testid="hint-week-highlight"]', { timeout: 10000 });
await page.waitForTimeout(500);
const hintText = await page.locator('[data-testid="hint-week-highlight"]').innerText();
hintText.includes('지금 김서연이가 배우는') ? ok('힌트 상단 주차 제목', hintText.split('\n')[0]) : fail('힌트 주차 제목', hintText.slice(0, 40));
hintText.includes('8주차') ? ok('힌트가 현재 다음 주차(8주)를 읽음') : fail('힌트 주차 불일치', hintText.slice(0, 80));
hintText.includes('이번 주 목표') ? ok('힌트 카드 · 이번 주 목표') : fail('힌트 목표 문장');
await page.click('[data-testid^="hint-week-open-"]');
await page.waitForTimeout(600);
const openedHint = await page.locator('text=스스로 확인:').count();
openedHint > 0 ? ok('힌트 펼치기 동작') : fail('힌트 펼치기');
await overflowCheck('복습 힌트(하이라이트)');

// 내 작품: 사진 1장 업로드
await page.goto(BASE + 'works', { waitUntil: 'networkidle' });
await page.waitForSelector('[data-testid="work-add"]');
await page.click('[data-testid="work-add"]');
await page.fill('[data-testid="work-title"]', 'QA 사진 작품');
await page.setInputFiles('[data-testid="work-photo-input"]', '/workspace/projects/rafine-class/public/icons/icon-512.png');
await page.waitForSelector('[data-testid="work-photo-preview"]', { timeout: 10000 });
ok('작품 사진 업로드 · 미리보기');
const previewSrc = await page.locator('[data-testid="work-photo-preview"] img').getAttribute('src');
previewSrc?.startsWith('data:image/jpeg') ? ok('캔버스 JPEG 압축 data URL', `${Math.round(previewSrc.length / 1024)}KB`) : fail('사진 data URL', String(previewSrc).slice(0, 30));
const kw = await page.locator('[data-testid="work-photo-preview"]').innerText();
/가로 800px/.test(kw) || /KB/.test(kw) ? ok('사진 용량 안내 문구') : fail('사진 안내 문구');
await page.click('[data-testid="work-save"]');
await page.waitForTimeout(700);
const newWorkPhoto = await page.locator('[data-testid^="work-photo-"]').count();
newWorkPhoto > 0 ? ok('작품 보관함 카드에 사진 렌더') : fail('작품 카드 사진');
await overflowCheck('내 작품(사진)');
await page.screenshot({ path: `${OUT}/qa_class_v2_work_photo.png` });

// =============================== 원장 모드 ===============================
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await page.click('text=나가기');
await page.waitForSelector('[data-testid="student-stu-seoyeon"]');
await page.click('button:has-text("원장님")');
await page.waitForSelector('[data-testid="pin-9"]');
await loginPin('9999');
await page.waitForSelector('[data-testid="student-select"]', { timeout: 10000 });
await page.waitForTimeout(500);
ok('원장 로그인');

const toselBadge = await page.locator('[data-testid="student-tosel-badge"]').innerText();
toselBadge.includes('ON') ? ok('학생 정보에 TOSEL 영어 ON 표시', toselBadge.trim()) : fail('TOSEL 배지', toselBadge);

// 학생 정보 수정 모달에 TOSEL 옵션
await page.click('[data-testid="student-edit"]');
await page.waitForSelector('[data-testid="student-edit-tosel"]');
ok('학생 정보에 TOSEL 영어 학습 사용 옵션');
await page.click('text=취소');

// 월말 리포트: 사진 + 종합 소견 편집
await page.click('[data-testid="step-report"]');
await page.waitForSelector('[data-testid="report-copy"]');
await page.waitForSelector('[data-testid="report-counselor-input"]');
await page.waitForTimeout(600);
const reportPhotos = await page.locator('[data-testid^="report-work-photo-"]').count();
reportPhotos > 0 ? ok('리포트 ‘이번 달 만든 작품’에 사진', `${reportPhotos}장`) : fail('리포트 작품 사진');
const autoDraft = await page.inputValue('[data-testid="report-counselor-input"]');
autoDraft.length > 30 ? ok('종합 소견 자동 초안 채워짐', `${autoDraft.length}자`) : fail('종합 소견 초안', autoDraft);

const editLine = 'QA 확인: 이번 달은 스스로 오류를 찾아낸 것이 가장 큰 성장이에요.';
await page.fill('[data-testid="report-counselor-input"]', editLine);
await page.waitForTimeout(600);
await page.click('[data-testid="report-copy"]');
await page.waitForTimeout(800);
let clip = '';
try {
  clip = await page.evaluate(() => navigator.clipboard.readText());
} catch {
  clip = '';
}
if (clip.includes(editLine)) ok('카톡 복사본에 수정한 종합 소견 반영', `${clip.length}자`);
else fail('카톡 복사 종합 소견', clip ? clip.slice(0, 60) : 'clipboard 비어 있음');

// 인쇄 화면: textarea 숨고 문단으로 출력
await page.emulateMedia({ media: 'print' });
await page.waitForTimeout(400);
const taVisible = await page.locator('[data-testid="report-counselor-input"]').isVisible();
taVisible ? fail('인쇄 시 textarea 노출') : ok('인쇄 시 수정칸 숨김');
const printText = await page.locator('#report-print').innerText();
printText.includes(editLine) ? ok('인쇄물에 수정 문장이 일반 문단으로 출력') : fail('인쇄물 종합 소견');

await page.locator('#report-print').screenshot({ path: `${OUT}/qa_class_v2_report.png` });
await page.pdf({ path: `${OUT}/qa_class_v2_report.pdf`, format: 'A4', printBackground: true });
const pdfSize = fs.statSync(`${OUT}/qa_class_v2_report.pdf`).size;
pdfSize > 10000 ? ok('인쇄/PDF 저장', `${Math.round(pdfSize / 1024)}KB`) : fail('PDF', String(pdfSize));
await page.emulateMedia({ media: 'screen' });
await page.waitForTimeout(300);
await overflowCheck('월말 리포트');

// 종합 소견 수정이 단계 전환에도 유지되는지
await page.click('[data-testid="step-memo"]');
await page.waitForTimeout(300);
await page.click('[data-testid="step-report"]');
await page.waitForSelector('[data-testid="report-counselor-input"]');
await page.waitForTimeout(400);
const kept = await page.inputValue('[data-testid="report-counselor-input"]');
kept.includes('QA 확인') ? ok('종합 소견 수정 저장·유지') : fail('종합 소견 저장', kept.slice(0, 30));
await page.click('[data-testid="report-counselor-reset"]');
await page.waitForTimeout(400);
const reset = await page.inputValue('[data-testid="report-counselor-input"]');
reset.includes('QA 확인') ? fail('자동 초안 되돌리기') : ok('자동 초안 되돌리기 동작');

// 관리 도구 3탭
await page.goto(BASE + 'admin/tools', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
const toolsText = await page.locator('body').innerText();
const keptTabs = ['학생 · PIN', '단어장', '상점 상품'].every((t) => toolsText.includes(t));
const goneTabs = !['대시보드', '레벨 배정', '금요일 리포트'].some((t) => toolsText.includes(t));
keptTabs && goneTabs ? ok('관리 도구 3탭 정리') : fail('관리 도구 탭', `kept=${keptTabs} gone=${goneTabs}`);
const tabCount = await page.locator('[data-testid^="tabm-"]').count();
tabCount === 3 ? ok('관리 도구 모바일 탭 3개') : fail('관리 도구 탭 수', String(tabCount));
const hasWordUpload = (await page.locator('[data-testid="tab-words"]').count()) > 0;
if (hasWordUpload) {
  await page.click('[data-testid="tab-words"]');
  await page.waitForTimeout(300);
  (await page.locator('text=CSV').count()) > 0 ? ok('단어장 CSV 화면 유지') : fail('단어장 화면');
}
await page.click('[data-testid="tab-shop"]');
await page.waitForTimeout(400);
(await page.locator('[data-testid="admin-shop-add"]').count()) > 0 ? ok('상점 상품 관리 유지') : fail('상점 관리');
await overflowCheck('관리 도구');
await page.screenshot({ path: `${OUT}/qa_class_v2_tools.png` });

// ===================== 코딩만 쓰는 학생(박준우) 회귀 =====================
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await page.click('text=나가기');
await page.waitForSelector('[data-testid="student-stu-junwoo"]');
await page.click('[data-testid="student-stu-junwoo"]');
await page.waitForSelector('[data-testid="pin-2"]');
await loginPin('2222');
await page.waitForSelector('[data-testid="coding-home"]', { timeout: 10000 });
await page.waitForTimeout(500);
const sw = await page.locator('[data-testid="subject-switch"]').count();
sw === 0 ? ok('코딩만 수강 학생은 상단 토글 없음') : fail('코딩만 학생 토글 노출');
await overflowCheck('코딩만 학생 홈');

// ============================ 태블릿/PC ============================
for (const w of [768, 1280]) {
  await page.setViewportSize({ width: w, height: 900 });
  for (const path of ['', 'admin']) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    await overflowCheck(`${path || '홈'} ${w}px`);
  }
}

// ============================== 오류 로그 ==============================
if (badResponses.length) fail('정적 자산/응답 오류', badResponses.slice(0, 3).join(' | '));
else ok('정적 자산 응답 정상 (4xx 없음)');
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
