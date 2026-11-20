/** 임시 진단: 뷰포트보다 넓은 요소 찾기 (라이브, 390px) */
import { chromium } from 'playwright';

const BASE = process.env.LIVE_BASE || 'https://raffinegold.github.io/rafine-class/';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto(BASE, { waitUntil: 'networkidle' });
await p.getByRole('textbox', { name: '이름', exact: true }).fill(process.env.STUDENT_NAME || '김서연');
await p.getByRole('textbox', { name: 'PIN 4자리' }).fill(process.env.STUDENT_PIN || '1111');
await p.getByRole('button', { name: '로그인', exact: true }).click();
await p.getByTestId('coding-home').waitFor({ timeout: 20000 });
await p.getByTestId('nav-materials').click();
await p.getByTestId('assigned-week').waitFor({ timeout: 15000 });
await p.waitForTimeout(800);

const out = await p.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const rows = [];
  document.querySelectorAll('body *').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > vw + 1 || r.right > vw + 2) {
      rows.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().slice(0, 90),
        w: Math.round(r.width),
        right: Math.round(r.right),
        text: (el.textContent || '').trim().slice(0, 30),
      });
    }
  });
  return { vw, scrollW: document.documentElement.scrollWidth, rows: rows.slice(0, 25) };
});
console.log(JSON.stringify(out, null, 1));
await b.close();
