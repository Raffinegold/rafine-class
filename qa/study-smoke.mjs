import { chromium } from 'playwright';

const BASE = 'https://raffinegold.github.io/rafine-class/';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', locale: 'ko-KR' });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.click('[data-testid="student-stu-seoyeon"]');
for (const d of '1111') {
  await page.click(`[data-testid="pin-${d}"]`);
  await page.waitForTimeout(120);
}
await page.waitForSelector('[data-testid="start-mission"]');
await page.click('[data-testid="start-mission"]');
await page.waitForSelector('[data-testid="card-know"]');
console.log('STUDY_CARD_OK true');
await page.click('[data-testid="card-know"]');
await page.waitForTimeout(500);
const body = await page.locator('body').innerText();
console.log('STUDY_PROGRESS_OK', /1\s*\/\s*18|2\s*\/\s*18|3\s*\/\s*18/.test(body));
await page.screenshot({ path: '/workspace/attachments/2026-11-19/qa_class_study.png' });
console.log('ERRORS', errs.length ? errs.join(' | ') : 'none');
await ctx.close();
await browser.close();
