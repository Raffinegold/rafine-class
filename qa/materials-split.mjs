/**
 * 수업안 / 수업자료 분리 QA (2026-11-20)
 *
 *  · 원장 로그인 → /admin/tools 에 📂 수업자료 · 📖 수업안 탭이 따로 있는지
 *  · 📖 수업안: 2시간 진행표·정답 코드가 보이고, 학생용 실습/미션 UI가 섞이지 않는지
 *  · 📂 수업자료: '수업 중 보기'에 학생 화면과 같은 카드(개념·따라 만들기·실습·미션)가 보이고
 *    정답 코드·수업안 문구가 새어 나오지 않는지
 *  · 학생 로그인 → /materials 에서도 새 보강 내용이 보이고 교사용 문구가 없는지
 *  · 모바일 390×844 가로 스크롤 0 · 콘솔 오류 0
 *
 * 실행: node qa/materials-split.mjs
 *   ADMIN_EMAIL / ADMIN_PW / STUDENT_NAME / STUDENT_PIN / QA_BASE 로 바꿀 수 있습니다.
 */
import { chromium } from 'playwright';

const BASE = process.env.QA_BASE || 'http://127.0.0.1:4173/rafine-class/';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PW = process.env.ADMIN_PW || '';
const STUDENT_NAME = process.env.STUDENT_NAME || '김서연';
const STUDENT_PIN = process.env.STUDENT_PIN || '1111';

const errors = [];
const checks = [];
const ok = (name, pass, extra = '') => {
  checks.push({ name, pass, extra });
  console.log(`${pass ? '✓' : '✗'} ${name}${extra ? ` — ${extra}` : ''}`);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', locale: 'ko-KR' });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});

async function noHScroll(label) {
  const h = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  ok(`${label} 가로 스크롤 없음`, h.sw <= h.cw + 1, `${h.sw}/${h.cw}`);
}

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /원장님/ }).first().click();

if (ADMIN_EMAIL) {
  await page.getByPlaceholder('원장님 이메일').fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').first().fill(ADMIN_PW);
  await page.getByRole('button', { name: /로그인|들어가기/ }).last().click();
} else {
  for (const d of '9999') {
    await page.locator(`[data-testid="pin-${d}"]`).click();
    await page.waitForTimeout(100);
  }
}
await page.waitForSelector('[data-testid="admin-tools-link"]', { timeout: 20000 });
await page.click('[data-testid="admin-tools-link"]');
await page.waitForSelector('[data-testid="tab-materials"]', { timeout: 20000 });

const tabLabels = await page.locator('header button[data-testid^="tab-"]').allInnerTexts();
ok('관리 도구에 수업자료·수업안 탭이 따로 있음', tabLabels.some((t) => t.includes('수업자료')) && tabLabels.some((t) => t.includes('수업안')), tabLabels.join(' | '));

/* ------------------------------- 📂 수업자료 ------------------------------- */
await page.click('[data-testid="tab-materials"]');
await page.waitForSelector('[data-testid="materials-sub-preview"]');
const previewTab = await page.locator('[data-testid="materials-sub-preview"]').innerText();
ok('수업자료 첫 화면이 수업 중 보기', previewTab.includes('수업 중 보기'));
await page.waitForTimeout(1200);
const previewCards = await page.locator('[data-testid="preview-material-card"]').count();
ok('수업 중 보기에 학생 화면 카드가 보임', previewCards > 0, `${previewCards}개`);
const previewMain = await page.locator('main').innerText();
ok('미리보기에 개념·따라 만들기·실습이 보임', previewMain.includes('따라 만들기') && (previewMain.includes('미니 실습') || previewMain.includes('망가뜨린 코드')));
ok('미리보기에 정답 코드가 없음', !previewMain.includes('전체 정답 코드') && !previewMain.includes('정답 코드 — 학생'));
ok('미리보기에 2시간 진행표가 없음', !previewMain.includes('2시간 진행표'));
await noHScroll('수업자료 미리보기');

// 자료 수정 모달에 교사용 칸이 없는지
await page.click('[data-testid="materials-sub-list"]');
await page.waitForTimeout(400);
await page.locator('main button:has-text("수정")').first().click();
await page.waitForSelector('div[role="dialog"]');
const dialog = await page.locator('div[role="dialog"]').innerText();
ok('수업자료 수정에 정답/수업안 칸 없음', !dialog.includes('정답 코드') && !dialog.includes('교사용 수업안'));
await page.locator('div[role="dialog"] button:has-text("취소")').first().click().catch(() => page.keyboard.press('Escape'));

/* -------------------------------- 📖 수업안 -------------------------------- */
await page.click('[data-testid="tab-guides"]');
await page.waitForSelector('[data-testid="guide-week"]');
await page.waitForTimeout(1200);
const guideMain = await page.locator('main').innerText();
ok('수업안에 2시간 진행표가 있음', guideMain.includes('2시간 진행표') && guideMain.includes('0~10'), '');
ok('수업안에 시연 멘트·비유·판서가 있음', guideMain.includes('시연 멘트') && guideMain.includes('핵심 비유') && guideMain.includes('판서'));
ok('수업안에 AI 코칭·에러·자주 묻는 질문이 있음', guideMain.includes('AI 틈틈이') && guideMain.includes('자주 나는 에러') && guideMain.includes('자주 묻는 질문'));
ok('수업안에 전체 정답 코드가 있음', guideMain.includes('전체 정답 코드') && guideMain.includes('input('));
ok('수업안에 학생 배정 UI가 없음', !guideMain.includes('배정 저장') && !guideMain.includes('추가 배정'));
await noHScroll('수업안');

// 수업안 편집 모달 — 교사용 칸만
await page.click('[data-testid="guide-edit"]');
await page.waitForSelector('[data-testid="guide-save"]');
const editText = await page.locator('div[role="dialog"]').innerText();
ok('수업안 편집이 교사용 칸 중심', editText.includes('진행표') && editText.includes('정답 코드'));
await page.locator('div[role="dialog"] button:has-text("취소")').first().click().catch(() => page.keyboard.press('Escape'));

/* ------------------------------- 학생 화면 ------------------------------- */
const page2 = await ctx.newPage();
page2.on('pageerror', (e) => errors.push(`student pageerror: ${e.message}`));
await page2.goto(BASE, { waitUntil: 'networkidle' });
await page2.getByPlaceholder('이름').first().fill(STUDENT_NAME);
await page2.getByPlaceholder('PIN 4자리').first().fill(STUDENT_PIN);
await page2.getByRole('button', { name: '로그인', exact: true }).first().click();
await page2.waitForTimeout(2500);
const body = await page2.locator('main').innerText();
const hasMaterialsLink = body.includes('수업자료') || body.includes('참고자료');
ok('학생 홈에서 수업자료 진입점이 보임', hasMaterialsLink);
await page2.getByTestId('coding-materials-link').click();
await page2.getByTestId('assigned-week').waitFor({ timeout: 15000 });
await page2.waitForTimeout(800);
const mBody = await page2.locator('main').innerText();
ok('학생 화면에 보강된 수업자료가 보임', mBody.includes('따라 만들기') && mBody.includes('오늘의 목표'));
ok('학생 화면에 정답·수업안이 없음', !mBody.includes('전체 정답 코드') && !mBody.includes('2시간 진행표') && !mBody.includes('시연 멘트'));
const h2 = await page2.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
ok('학생 자료실 가로 스크롤 없음', h2.sw <= h2.cw + 1, `${h2.sw}/${h2.cw}`);

ok('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));

await ctx.close();
await browser.close();

const failed = checks.filter((c) => !c.pass);
console.log(`\n${checks.length - failed.length}/${checks.length} 통과`);
if (failed.length) process.exit(1);
