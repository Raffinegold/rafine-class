import { chromium } from 'playwright';

const BASE = 'https://raffinegold.github.io/rafine-class/';
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: 'ko-KR',
  serviceWorkers: 'block',
  permissions: ['clipboard-read', 'clipboard-write'],
});
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.click('button:has-text("원장님")');
for (const d of '9999') {
  await page.click(`[data-testid="pin-${d}"]`);
  await page.waitForTimeout(120);
}
await page.waitForSelector('[data-testid="student-select"]');
await page.click('[data-testid="step-report"]');
await page.waitForSelector('[data-testid="report-copy"]');
await page.click('[data-testid="report-copy"]');
await page.waitForTimeout(600);
const clip = await page.evaluate(() => navigator.clipboard.readText());
console.log('===== KAKAO TEXT =====');
console.log(clip);
console.log('===== END =====');

// 이전 달 (10월)
await page.click('button[aria-label="이전 달"]');
await page.waitForTimeout(500);
const oct = await page.locator('#report-print').innerText();
console.log('OCT_LABEL_OK', oct.includes('2026년 10월'));
console.log('OCT_MEMO_OK', oct.includes('10/22'));

// 기질 코드 없는 학생 (정유진)
await page.selectOption('[data-testid="student-select"]', 'stu-yujin');
await page.waitForTimeout(600);
const body = await page.locator('body').innerText();
console.log('YUJIN_NO_CRASH', body.includes('정유진'));
console.log('YUJIN_EMPTY_STATE', body.includes('이 달 기록이 아직 없어요'));
await page.click('[data-testid="step-mind"]');
await page.waitForTimeout(400);
const mind = await page.locator('main').innerText();
console.log('YUJIN_NO_CODE_HINT', mind.includes('코드가 없으면 기질 해석 없이'));
await page.screenshot({ path: '/workspace/attachments/2026-11-19/qa_class_report_empty.png' });
console.log('ERRORS', errs.length ? errs.join(' | ') : 'none');
await ctx.close();
await browser.close();
