import { chromium } from 'playwright';

const BASE = 'https://raffinegold.github.io/rafine-class/';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', locale: 'ko-KR' });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.click('button:has-text("원장님")');
for (const d of '9999') {
  await page.click(`[data-testid="pin-${d}"]`);
  await page.waitForTimeout(120);
}
await page.waitForSelector('[data-testid="student-edit"]');

// 정보 수정 모달
await page.click('[data-testid="student-edit"]');
await page.waitForSelector('[data-testid="student-edit-code"]');
await page.fill('[data-testid="student-edit-code"]', 'RC-22F6');
await page.click('[data-testid="student-edit-save"]');
await page.waitForTimeout(600);
const main1 = await page.locator('main').innerText();
console.log('EDIT_CODE_SAVED', main1.includes('표현·발표형') && main1.includes('RC-22F6'));

// 주차별 직접 체크
await page.click('text=주차별로 직접 체크하기');
await page.waitForTimeout(300);
const before = await page.locator('[data-testid="week-9"]').innerText();
const clsBefore = await page.locator('[data-testid="week-9"]').getAttribute('class');
await page.click('[data-testid="week-9"]');
await page.waitForTimeout(400);
const clsAfter = await page.locator('[data-testid="week-9"]').getAttribute('class');
console.log('WEEK_GRID_TOGGLE', clsBefore !== clsAfter, before);

// 트랙 변경 (파이썬 → 24주 진도 초기화 여부 확인)
await page.click('[data-testid="student-edit"]');
await page.waitForSelector('[data-testid="student-edit-code"]');
await page.selectOption('div[role="dialog"] select', 'python');
await page.click('[data-testid="student-edit-save"]');
await page.waitForTimeout(500);
const main2 = await page.locator('main').innerText();
console.log('TRACK_CHANGED', main2.includes('파이썬'));
console.log('ERRORS', errs.length ? errs.join(' | ') : 'none');
await ctx.close();
await browser.close();
