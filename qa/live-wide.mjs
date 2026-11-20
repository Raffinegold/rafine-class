/**
 * 라이브 넓은 화면 점검 (2026-11-20)
 *  - 실제 배포본에 학생으로 로그인해 390 / 820 / 1440 폭 스크린샷과 가로 넘침을 확인합니다.
 *  - 원장 계정 정보는 쓰지 않습니다(관리 화면은 데모 빌드로 점검: qa/wide-layout.mjs).
 * 실행: node qa/live-wide.mjs
 */
import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.LIVE_BASE || 'https://raffinegold.github.io/rafine-class/';
const NAME = process.env.STUDENT_NAME || '김서연';
const PIN = process.env.STUDENT_PIN || '1111';
const SHOTS = new URL('./screens-live/', import.meta.url).pathname;
if (!existsSync(SHOTS)) mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch();
const problems = [];

const shoot = async (page, width, name) => {
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(SHOTS, `${width}-${name}.png`) });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  if (overflow > 1) problems.push(`${width}-${name}: 가로 넘침 ${overflow}px`);
  console.log(`  · ${width}-${name}.png`);
};

for (const [w, h] of [
  [390, 844],
  [820, 1180],
  [1440, 900],
  [1920, 1080],
]) {
  console.log(`▶ ${w}px`);
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push(`${w}: pageerror ${e.message}`));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('textbox', { name: '이름', exact: true }).fill(NAME);
  await page.getByRole('textbox', { name: 'PIN 4자리' }).fill(PIN);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await page.getByTestId('coding-home').waitFor({ timeout: 20000 });
  await shoot(page, w, 'home');

  await page.getByTestId('nav-materials').click();
  await page.getByTestId('assigned-week').waitFor({ timeout: 15000 });
  await shoot(page, w, 'materials-1');
  await page.getByTestId('session-2').click();
  await shoot(page, w, 'materials-2');

  await page.getByTestId('nav-hints').click();
  await page.waitForTimeout(800);
  await shoot(page, w, 'hints');

  await page.getByTestId('nav-shop').click();
  await page.waitForTimeout(800);
  await shoot(page, w, 'shop');

  await page.getByTestId('nav-works').click();
  await page.waitForTimeout(800);
  await shoot(page, w, 'works');

  await ctx.close();
}

await browser.close();
console.log(problems.length ? `\n⚠️ 문제\n- ${problems.join('\n- ')}` : '\n✅ 가로 넘침·페이지 오류 없음');
console.log(`스크린샷: ${SHOTS}`);
