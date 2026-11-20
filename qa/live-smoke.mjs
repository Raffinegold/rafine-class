/**
 * 라이브 점검 스크립트 (2026-11-20)
 *  - 배포본에 접속해 학생/원장 로그인 → 자료실 → 새로고침 세션 유지까지 확인
 *  - 콘솔 오류와 localStorage 키(값은 출력하지 않음)를 함께 봅니다.
 * 실행: node qa/live-smoke.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.LIVE_BASE || 'https://raffinegold.github.io/rafine-class/';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PW = process.env.ADMIN_PW || '';
const STUDENT_NAME = process.env.STUDENT_NAME || '김서연';
const STUDENT_PIN = process.env.STUDENT_PIN || '1111';

const errors = [];
const logs = [];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
page.on('console', (m) => {
  const t = `${m.type()}: ${m.text()}`;
  logs.push(t);
  if (m.type() === 'error') errors.push(t);
});
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

const step = async (name, fn) => {
  try {
    const r = await fn();
    console.log(`✓ ${name}${r ? ` — ${r}` : ''}`);
  } catch (e) {
    console.log(`✗ ${name} — ${e.message}`);
    errors.push(`${name}: ${e.message}`);
  }
};

await page.goto(BASE, { waitUntil: 'networkidle' });
await step('학생 로그인 폼', async () => {
  await page.getByRole('textbox', { name: '이름', exact: true }).fill(STUDENT_NAME);
  await page.getByRole('textbox', { name: 'PIN 4자리' }).fill(STUDENT_PIN);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await page.getByText('오늘의 코딩', { exact: false }).first().waitFor({ timeout: 15000 });
  return '로그인 성공';
});

await step('홈 자료실 카드', async () => {
  const t = await page.getByTestId('coding-materials-link').innerText();
  return t.replace(/\s+/g, ' ').slice(0, 60);
});

await step('자료실 진입 · 배정 표시', async () => {
  await page.getByTestId('coding-materials-link').click();
  await page.getByTestId('assigned-week').waitFor({ timeout: 10000 });
  const week = await page.getByTestId('assigned-week').innerText();
  const cards = await page.getByTestId('material-card').count();
  return `${week} · 카드 ${cards}개`;
});

await step('2회차 탭', async () => {
  // 자료가 다 불러온 뒤에 탭을 누릅니다 (배정 정보가 늦게 오면 회차가 1회차로 되돌아감)
  await page.getByTestId('material-card').first().waitFor({ timeout: 15000 });
  await page.waitForTimeout(400);
  await page.getByTestId('session-2').click();
  await page.getByText('업그레이드 미션', { exact: false }).first().waitFor({ timeout: 8000 });
  return '업그레이드 미션 보임';
});

await step('교사용 내용 미노출', async () => {
  const html = await page.content();
  const leaked = ['정답 코드', '선생님용 수업안', 'answer_code', 'teacher_guide'].filter((k) => html.includes(k));
  if (leaked.length) throw new Error(`노출 의심: ${leaked.join(', ')}`);
  return '정답·수업안 없음';
});

await step('완료 표시 저장', async () => {
  const btn = page.getByRole('button', { name: /다 봤어요/ }).first();
  await btn.click();
  await page.getByRole('button', { name: /선생님께 표시됨/ }).first().waitFor({ timeout: 8000 });
  return '완료 표시됨';
});

await step('학생 새로고침 후 세션 유지', async () => {
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const stillIn = await page.getByRole('button', { name: /다 봤어요|선생님께/ }).count();
  const login = await page.getByRole('button', { name: '로그인', exact: true }).count();
  return `자료실 화면=${stillIn > 0 ? '유지' : '아님'} · 로그인화면=${login > 0 ? '보임' : '없음'}`;
});

if (ADMIN_EMAIL) {
  await step('원장 로그인', async () => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const logout = page.getByRole('button', { name: '나가기' }).first();
    if (await logout.count()) await logout.click();
    await page.getByRole('button', { name: '원장님' }).click();
    await page.getByRole('textbox', { name: '원장님 이메일' }).fill(ADMIN_EMAIL);
    await page.getByRole('textbox', { name: '비밀번호' }).fill(ADMIN_PW);
    await page.getByRole('button', { name: '관리자 로그인' }).click();
    await page.waitForURL(/\/admin$/, { timeout: 15000 });
    const body = await page.locator('main').innerText();
    if (body.includes('활성 학생이 없어요')) throw new Error('학생 목록이 비어 있음');
    return '원장 로그인 · 학생 목록 보임';
  });

  await step('원장 새로고침 후 세션 유지', async () => {
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const body = await page.locator('main').innerText();
    return body.includes('활성 학생이 없어요') ? '✗ 새로고침 후 학생 목록 사라짐' : '학생 목록 유지';
  });

  await step('수업안 탭', async () => {
    await page.getByTestId('tab-materials').click();
    await page.getByTestId('materials-sub-guide').click();
    await page.getByText('시작 30초 시연 멘트').first().waitFor({ timeout: 10000 });
    const txt = await page.locator('main').innerText();
    return txt.includes('정답 코드') ? '수업안 + 정답 코드 보임(교사 전용)' : '수업안 보임';
  });

  await step('배정 탭', async () => {
    await page.getByTestId('materials-sub-assign').click();
    await page.getByText('배정 저장').first().waitFor({ timeout: 8000 });
    return '배정 화면 보임';
  });
}

console.log('\n--- console errors ---');
console.log(errors.length ? errors.slice(0, 12).join('\n') : '(none)');

await browser.close();
