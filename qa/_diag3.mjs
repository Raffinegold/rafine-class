/** 임시: 390 수업자료 칩 확인 */
import { chromium } from 'playwright';

const BASE = process.env.LIVE_BASE || 'https://raffinegold.github.io/rafine-class/';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, bypassCSP: true });
const p = await ctx.newPage();
await p.goto(BASE, { waitUntil: 'networkidle' });
await p.getByRole('textbox', { name: '이름', exact: true }).fill(process.env.STUDENT_NAME || '김서연');
await p.getByRole('textbox', { name: 'PIN 4자리' }).fill(process.env.STUDENT_PIN || '1111');
await p.getByRole('button', { name: '로그인', exact: true }).click();
await p.getByTestId('coding-home').waitFor({ timeout: 20000 });
await p.getByTestId('nav-materials').click();
await p.getByTestId('material-card').first().waitFor({ timeout: 15000 });
await p.waitForTimeout(600);
const info = await p.evaluate(() => {
  const s1 = document.querySelector('[data-testid="session-1"]');
  const span = s1.querySelector('span');
  return {
    s1text: s1.innerText,
    spanDisplay: span ? getComputedStyle(span).display : 'no-span',
    bundle: [...document.querySelectorAll('script[src]')].map((s) => s.src.split('/').pop()),
    scrollW: document.documentElement.scrollWidth,
  };
});
console.log(JSON.stringify(info));
await p.screenshot({ path: new URL('./screens-live/390-final-chips.png', import.meta.url).pathname });
await b.close();
