/**
 * 넓은 화면(태블릿·PC) 레이아웃 점검 스크립트 (2026-11-20)
 *  - 데모(로컬) 빌드를 임시로 띄워 390 / 820 / 1440 폭에서 화면을 찍습니다.
 *  - .env 의 Supabase 값이 없으면 데모 모드로 동작하고, 원장 PIN은 9999 입니다.
 * 실행: node qa/wide-layout.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('../dist-demo/', import.meta.url).pathname;
const SHOTS = new URL('./screens/', import.meta.url).pathname;
if (!existsSync(SHOTS)) mkdirSync(SHOTS, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
};

const server = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let file = join(ROOT, normalize(url).replace(/^(\.\.[/\\])+/, ''));
  if (url === '/' || url.endsWith('/')) file = join(ROOT, 'index.html');
  if (!existsSync(file) || extname(file) === '') file = join(ROOT, 'index.html');
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();
const problems = [];

const shoot = async (page, width, name) => {
  await page.waitForTimeout(450);
  const path = join(SHOTS, `${width}-${name}.png`);
  await page.screenshot({ path, fullPage: false });
  // 넘치는 가로 스크롤이 있으면 기록
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  if (overflow > 1) problems.push(`${width}-${name}: 가로 넘침 ${overflow}px`);
  console.log(`  · ${width}-${name}.png`);
};

const run = async (width, height) => {
  console.log(`▶ ${width}px`);
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push(`${width}: pageerror ${e.message}`));

  // 1) 로그인
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '원장님', exact: true }).waitFor({ timeout: 15000 });
  await shoot(page, width, 'login');

  // 2) 원장 로그인 → /admin
  await page.getByRole('button', { name: '원장님', exact: true }).click();
  for (const d of ['9', '9', '9', '9']) await page.getByTestId(`pin-${d}`).first().click();
  await page.getByTestId('student-select').waitFor({ timeout: 15000 });
  await shoot(page, width, 'admin-mind');
  await page.getByTestId('step-memo').click();
  await shoot(page, width, 'admin-memo');
  await page.getByTestId('step-report').click();
  await shoot(page, width, 'admin-report');

  // 3) 관리 도구
  const tabPrefix = width >= 768 ? 'tab-' : 'tabm-';
  await page.getByTestId('admin-tools-link').click();
  await page.getByTestId(`${tabPrefix}materials`).first().click();
  await page.waitForTimeout(900);
  await shoot(page, width, 'tools-materials');
  await page.getByTestId(`${tabPrefix}guides`).click();
  await page.waitForTimeout(600);
  await shoot(page, width, 'tools-guides');

  // 4) 학생 화면 (새 컨텍스트 — 원장 세션과 분리)
  await ctx.close();
  const sctx = await browser.newContext({ viewport: { width, height } });
  const spage = await sctx.newPage();
  spage.on('pageerror', (e) => problems.push(`${width}: pageerror ${e.message}`));
  await spage.goto(BASE, { waitUntil: 'networkidle' });
  await spage.getByRole('button', { name: /김서연/ }).first().click();
  for (const d of ['1', '1', '1', '1']) await spage.getByTestId(`pin-${d}`).first().click();
  await spage.getByTestId('coding-home').waitFor({ timeout: 15000 });
  await shoot(spage, width, 'student-home');

  await spage.getByTestId('nav-materials').click();
  await spage.getByTestId('assigned-week').waitFor({ timeout: 10000 });
  await shoot(spage, width, 'student-materials-dec2');
  await spage.getByTestId('session-2').click();
  await shoot(spage, width, 'student-materials');

  await spage.getByTestId('nav-works').click();
  await spage.waitForTimeout(700);
  await shoot(spage, width, 'student-works');

  await spage.getByTestId('nav-hints').click();
  await spage.waitForTimeout(700);
  await shoot(spage, width, 'student-hints');

  await spage.getByTestId('nav-shop').click();
  await spage.waitForTimeout(700);
  await shoot(spage, width, 'student-shop');

  await sctx.close();
};

for (const [w, h] of [
  [390, 844],
  [820, 1180],
  [1440, 900],
]) {
  await run(w, h);
}

await browser.close();
server.close();

console.log(problems.length ? `\n⚠️ 문제 ${problems.length}건\n- ${problems.join('\n- ')}` : '\n✅ 가로 넘침·페이지 오류 없음');
console.log(`스크린샷: ${SHOTS}`);
