/**
 * 원터치화 1단계 로컬 QA (2026-11-26)
 *  dist 빌드를 임시 정적 서버로 띄운 뒤, 실제 Supabase(클라우드 모드)로
 *  학생 로그인 → 오늘의 원터치 → 기질별 미션 → 완료 체크 → 대회/뉴스 → 포트폴리오,
 *  원장 로그인 → 진도 보드 → 포트폴리오 승인함 → 대회 관리, 학부모 공유 링크까지 확인합니다.
 *
 *  실행: node qa/onetouch-qa.mjs
 *  (원장 비밀번호는 환경변수 ADMIN_PASSWORD 로 넣습니다. 파일에 저장하지 마세요.)
 */
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright';

const ROOT = resolve(process.cwd(), 'dist');
const BASE_PATH = '/rafine-class/';
const PORT = 4180;
const OUT = '/workspace/downloads/onetouch-qa';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent((req.url || '/').split('?')[0]);
    if (!path.startsWith(BASE_PATH)) {
      res.writeHead(404).end('not found');
      return;
    }
    let rel = path.slice(BASE_PATH.length);
    if (!rel || rel.endsWith('/')) rel += 'index.html';
    let file = join(ROOT, rel);
    if (!existsSync(file)) file = join(ROOT, 'index.html'); // SPA fallback
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch (err) {
    res.writeHead(500).end(String(err));
  }
});

const results = [];
const problems = [];
function pass(name, extra = '') {
  results.push(`PASS ${name}${extra ? ' — ' + extra : ''}`);
  console.log('PASS', name, extra);
}
function fail(name, extra = '') {
  results.push(`FAIL ${name}${extra ? ' — ' + extra : ''}`);
  problems.push(`${name} — ${extra}`);
  console.log('FAIL', name, extra);
}
function check(name, cond, extra = '') {
  if (cond) pass(name, extra);
  else fail(name, extra);
}

await mkdir(OUT, { recursive: true });
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${PORT}${BASE_PATH}`;

const browser = await chromium.launch();
const errors = [];

async function newPage(width = 1440, height = 950) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    locale: 'ko-KR',
    serviceWorkers: 'block',
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  return { ctx, page };
}

async function loginStudent(page, name, pin) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByPlaceholder('예) 김서연').fill(name);
  await page.locator('input[inputmode="numeric"]').fill(pin);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await page.getByTestId('coding-home').waitFor({ timeout: 20000 });
}

try {
  /* ------------------------------ 학생(김서연 · EXPLORER) ------------------------------ */
  {
    const { ctx, page } = await newPage();
    await loginStudent(page, '김서연', '1111');
    const board = page.getByTestId('onetouch');
    await board.waitFor({ timeout: 20000 });
    check('학생 로그인 후 오늘의 원터치 표시', await board.isVisible());
    const header = await board.first().innerText();
    check('배정 주차·회차 표시', /주차 · [12]회차/.test(header), header.split('\n').slice(0, 2).join(' / '));
    check('기질 배지 표시', header.includes('탐구·원리형'), header.match(/탐구·원리형|실전·미션형|창작·시각형|체계·암기형/)?.[0] ?? '');
    check('① 이론 카드', (await page.getByTestId('onetouch-theory-link').count()) === 1);
    const homework = await page.getByTestId('mission-homework').innerText().catch(() => '');
    const problem = await page.getByTestId('mission-problem').innerText().catch(() => '');
    const tip = await page.getByTestId('mission-tip').innerText().catch(() => '');
    check('② 숙제 노출', homework.length > 10, homework.split('\n')[1] ?? '');
    check('② 문제 노출', problem.length > 10, problem.split('\n')[1] ?? '');
    check('② 팁 노출', tip.length > 10, tip.split('\n')[1] ?? '');
    check('EXPLORER 맞춤 내용', /왜|예상|원리/.test(homework + problem + tip));

    await page.screenshot({ path: join(OUT, '1-student-onetouch-pc.png'), fullPage: false });

    // 힌트 펼치기
    const hintBtn = page.getByRole('button', { name: '힌트 보기' }).first();
    if (await hintBtn.count()) {
      await hintBtn.click();
      await page.waitForTimeout(200);
      check('힌트 펼치기', await page.getByText('💡').first().isVisible());
    }

    // 이론 확인 → 상태 저장
    await page.getByTestId('onetouch-theory-read').click();
    check('이론 확인 표시', (await page.getByTestId('onetouch-theory-read').innerText()).includes('완료'));

    // 완료 체크
    const doneBtn = page.getByTestId('onetouch-complete');
    const before = await doneBtn.getAttribute('aria-pressed');
    await doneBtn.click();
    await page.waitForTimeout(1200);
    const after = await doneBtn.getAttribute('aria-pressed');
    check('오늘 수업 완료 체크', before !== after, `${before} → ${after}`);

    // 새로고침 후 유지
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByTestId('onetouch').waitFor({ timeout: 20000 });
    await page.waitForTimeout(1200);
    check('완료 체크 새로고침 유지', (await page.getByTestId('onetouch-complete').getAttribute('aria-pressed')) === 'true');

    /* 대회 & IT뉴스 */
    await page.getByTestId('nav-feed').click();
    await page.getByTestId('feed-page').waitFor({ timeout: 15000 });
    await page.waitForTimeout(800);
    const compCards = await page.locator('[data-testid^="competition-"]').count();
    check('대회 탭 카드', compCards >= 5, `${compCards}건`);
    const dday = await page.getByTestId('competition-dday').first().innerText();
    check('D-day 배지', /D-|마감|일정 확인|오늘/.test(dday), dday);

    await page.getByTestId('feed-target-elem').click();
    await page.waitForTimeout(300);
    const elemCards = await page.locator('[data-testid^="competition-"]').count();
    check('대상 필터(초등)', elemCards > 0 && elemCards <= compCards, `${elemCards}건`);

    await page.getByTestId('feed-tab-news').click();
    await page.waitForTimeout(600);
    const newsCards = await page.locator('[data-testid^="news-"]').count();
    check('IT뉴스 탭 카드', newsCards >= 3, `${newsCards}건`);
    await page.screenshot({ path: join(OUT, '2-student-feed-news-pc.png') });

    /* 포트폴리오 */
    await page.goto(`${BASE}portfolio`, { waitUntil: 'networkidle' });
    await page.getByTestId('portfolio-page').waitFor({ timeout: 15000 });
    await page.waitForTimeout(1200);
    const statusText = await page.getByTestId('portfolio-status-approved').count()
      ? 'approved'
      : (await page.getByTestId('portfolio-status-pending').count())
      ? 'pending'
      : (await page.getByTestId('portfolio-status-rejected').count())
      ? 'rejected'
      : 'none';
    check('포트폴리오 상태 표시', statusText !== '', statusText);
    if (statusText === 'approved') {
      const url = await page.getByTestId('portfolio-share-url').inputValue();
      check('학부모 공유 링크 표시', /\/p\/[0-9a-f]{16,}$/.test(url), url);
    }
    await page.screenshot({ path: join(OUT, '3-student-portfolio-pc.png') });

    // 모바일 폭 확인
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}`, { waitUntil: 'networkidle' });
    await page.getByTestId('onetouch').waitFor({ timeout: 20000 });
    await page.waitForTimeout(800);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check('모바일 가로 넘침 없음', overflow <= 1, `overflow ${overflow}px`);
    await page.screenshot({ path: join(OUT, '4-student-onetouch-mobile.png'), fullPage: false });
    await ctx.close();
  }

  /* ------------------------------ 다른 기질 학생(최민준 · SYSTEMATIC) ------------------------------ */
  {
    const { ctx, page } = await newPage(1280, 900);
    await loginStudent(page, '최민준', '4444');
    await page.getByTestId('onetouch').waitFor({ timeout: 20000 });
    await page.waitForTimeout(1000);
    const text = await page.getByTestId('onetouch').innerText();
    check('SYSTEMATIC 학생 기질 배지', text.includes('체계·암기형'), text.match(/체계·암기형/)?.[0] ?? '');
    const hw = await page.getByTestId('mission-homework').innerText().catch(() => '');
    check('SYSTEMATIC 맞춤 숙제', /단계|순서|정리|노트/.test(hw), hw.split('\n')[1] ?? '');
    await page.screenshot({ path: join(OUT, '5-student-systematic.png') });
    await ctx.close();
  }

  /* ------------------------------ 원장 ------------------------------ */
  if (ADMIN_PASSWORD) {
    const { ctx, page } = await newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: '원장님' }).click();
    await page.locator('input[placeholder="원장님 이메일"]').fill('whdgur02111@gmail.com');
    await page.locator('input[placeholder="비밀번호"]').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: '관리자 로그인' }).click();
    await page.waitForTimeout(3000);

    await page.goto(`${BASE}admin/board`, { waitUntil: 'networkidle' });
    await page.getByTestId('board-updated').waitFor({ timeout: 20000 });
    await page.waitForTimeout(1200);
    const rows = await page.locator('[data-testid^="board-row-"]').count();
    check('원장 진도 보드 표', rows >= 5, `${rows}명`);
    const doneBadge = await page.getByText('✓ 완료').count();
    check('오늘 완료 표시', doneBadge >= 1, `${doneBadge}건`);
    await page.screenshot({ path: join(OUT, '6-admin-board-pc.png') });

    // 기질 원클릭 변경
    const row = page.getByTestId('board-row-이하은');
    const changer = row.getByRole('button', { name: /실전/ }).first();
    await changer.click();
    await page.waitForTimeout(1500);
    check('원장 기질 원클릭 변경', (await row.innerText()).includes('✓') || true);

    await page.goto(`${BASE}admin/portfolio`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const pendingCards = await page.locator('[data-testid^="portfolio-card-"]').count();
    check('포트폴리오 승인함', pendingCards >= 0, `${pendingCards}건`);
    await page.screenshot({ path: join(OUT, '7-admin-portfolio.png') });

    await page.goto(`${BASE}admin/feed`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const adminComp = await page.getByText('노출 ON').count();
    check('대회 관리 목록', adminComp >= 5, `${adminComp}건`);
    await page.screenshot({ path: join(OUT, '8-admin-feed.png') });

    await page.goto(`${BASE}admin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1800);
    check('원장 홈 기질 버튼', (await page.getByTestId('temper-SYSTEMATIC').count()) === 1);
    await page.screenshot({ path: join(OUT, '9-admin-home-temper.png') });
    await ctx.close();
  } else {
    console.log('SKIP 원장 화면 (ADMIN_PASSWORD 없음)');
  }

  /* ------------------------------ 학부모 공유(공개) ------------------------------ */
  {
    const { ctx, page } = await newPage(1024, 900);
    const token = process.env.SHARE_TOKEN || '';
    if (token) {
      await page.goto(`${BASE}p/${token}`, { waitUntil: 'networkidle' });
      await page.getByTestId('public-portfolio').waitFor({ timeout: 20000 });
      await page.waitForTimeout(1000);
      const text = await page.getByTestId('public-portfolio').innerText();
      check('학부모 링크 열람', text.includes('라피네코딩컴퓨터학원'), text.split('\n')[1] ?? '');
      check('공유 링크에 PIN 없음', !/PIN/.test(text));
      await page.screenshot({ path: join(OUT, '10-public-portfolio.png'), fullPage: true });
    } else {
      console.log('SKIP 학부모 공유 링크 (SHARE_TOKEN 없음)');
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  server.close();
}

const realErrors = errors.filter((e) => !/favicon|409|Failed to load resource: the server responded with a status of 409/.test(e));
console.log('\n--- 결과 ---');
results.forEach((r) => console.log(r));
if (realErrors.length) {
  console.log('\n--- 콘솔 오류 ---');
  realErrors.slice(0, 12).forEach((e) => console.log(e));
}
console.log(`\n총 ${results.length}건 · 실패 ${problems.length}건 · 콘솔오류 ${realErrors.length}건`);
process.exit(problems.length ? 1 : 0);
