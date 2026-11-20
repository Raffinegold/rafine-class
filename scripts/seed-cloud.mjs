/**
 * Supabase materials 시드 재적용 (2026-11-20)
 *
 *  · src/data/materialSeed.ts 의 12개 자료를 REST upsert 로 DB에 다시 넣습니다.
 *  · seed_key 기준 on conflict → 학생 화면은 새로고침하면 바로 새 내용이 보입니다.
 *  · service_role 키는 쓰지 않습니다. 원장 계정(authenticated + is_admin) 토큰만 사용합니다.
 *
 * 실행:
 *   ADMIN_ACCESS_TOKEN=<원장 JWT> node scripts/seed-cloud.mjs
 *   (JWT는 Supabase Auth 로그인으로 받은 access_token. 파일에 저장하지 마세요.)
 *
 * .env 의 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 를 읽습니다.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function env(name) {
  if (process.env[name]) return process.env[name];
  try {
    const raw = readFileSync(resolve(root, '.env'), 'utf8');
    const line = raw.split('\n').find((l) => l.trim().startsWith(`${name}=`));
    return line ? line.slice(line.indexOf('=') + 1).trim() : '';
  } catch {
    return '';
  }
}

const url = env('VITE_SUPABASE_URL');
const anon = env('VITE_SUPABASE_ANON_KEY');
const token = process.env.ADMIN_ACCESS_TOKEN || '';
if (!url || !anon) throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 필요합니다 (.env)');
if (!token) throw new Error('ADMIN_ACCESS_TOKEN (원장 access_token) 이 필요합니다');

const require = createRequire(import.meta.url);
mkdirSync(resolve(root, '.tmp'), { recursive: true });
execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['esbuild', 'src/data/materialSeed.ts', '--bundle', '--format=cjs', '--platform=node', '--outfile=.tmp/materialSeed.cjs'], {
  cwd: root,
  stdio: 'inherit',
});
const { MATERIAL_SEED } = require(resolve(root, '.tmp/materialSeed.cjs'));

const rows = MATERIAL_SEED.map((row) => ({
  seed_key: row.key,
  kind: row.kind,
  title: row.title,
  track: row.track,
  week: row.week,
  session: row.session,
  summary: row.summary,
  student_content: row.student ?? {},
  teacher_guide: row.teacher ?? null,
  answer_code: row.answer ?? null,
  ai_tip: row.aiTip ?? null,
  link_url: row.linkUrl ?? null,
  code_lang: row.codeLang ?? 'python',
  published: row.published !== false,
  sort_no: row.sort,
  updated_at: new Date().toISOString(),
}));

const res = await fetch(`${url}/rest/v1/materials?on_conflict=seed_key`, {
  method: 'POST',
  headers: {
    apikey: anon,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal',
  },
  body: JSON.stringify(rows),
});
if (!res.ok) {
  console.error('시드 적용 실패', res.status, (await res.text()).slice(0, 600));
  process.exit(1);
}

// 확인 — 교사용 필드까지 들어갔는지 (읽기는 원장 토큰)
const check = await fetch(
  `${url}/rest/v1/materials?select=seed_key,title,week,session,published,teacher_guide,answer_code&order=week,session,sort_no`,
  { headers: { apikey: anon, Authorization: `Bearer ${token}` } }
);
const saved = await check.json();
const withGuide = saved.filter((m) => m.teacher_guide).length;
const withAnswer = saved.filter((m) => m.answer_code).length;
console.log(`적용 완료: ${rows.length}건 upsert · DB ${saved.length}건 · 수업안 ${withGuide}건 · 정답 ${withAnswer}건`);
for (const m of saved) console.log(`  ${m.seed_key ?? '(직접 등록)'} · ${m.week}주 ${m.session}회차 · ${m.title}`);
