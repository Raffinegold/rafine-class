/** 임시 진단: 라이브에서 실패한 응답 URL 확인 (토큰 값은 출력하지 않음) */
import { chromium } from 'playwright';

const BASE = process.env.LIVE_BASE || 'https://raffinegold.github.io/rafine-class/';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const failed = [];
p.on('response', (r) => {
  if (r.status() >= 400) failed.push(`${r.status()} ${r.request().method()} ${r.url().replace(/\?.*$/, '')}`);
});
await p.goto(BASE, { waitUntil: 'networkidle' });
await p.getByRole('textbox', { name: '이름', exact: true }).fill(process.env.STUDENT_NAME || '김서연');
await p.getByRole('textbox', { name: 'PIN 4자리' }).fill(process.env.STUDENT_PIN || '1111');
await p.getByRole('button', { name: '로그인', exact: true }).click();
await p.getByTestId('coding-home').waitFor({ timeout: 20000 });
await p.waitForTimeout(2500);
await p.getByTestId('nav-materials').click();
await p.waitForTimeout(3000);
const cards1 = await p.getByTestId('material-card').count();
await p.getByTestId('session-2').click();
await p.waitForTimeout(2500);
const cards2 = await p.getByTestId('material-card').count();
console.log(JSON.stringify({ cards1, cards2, failed: [...new Set(failed)] }, null, 1));
await b.close();
