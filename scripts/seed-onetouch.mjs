/**
 * 원터치화 1단계 시드 적용 (2026-11-26)
 *
 *  · src/data/onetouchSeed.ts → 기질별 미션 96건 · 대회 8건 · IT뉴스 5건
 *  · 데모 학생 5명의 기질(students.temperament_type)은 '비어 있을 때만' 채웁니다.
 *    (실제 검사 결과를 덮어쓰지 않습니다.)
 *  · service_role 키는 쓰지 않습니다. 원장 계정(authenticated + is_admin) 토큰만 씁니다.
 *
 * 실행:
 *   ADMIN_ACCESS_TOKEN=<원장 access_token> node scripts/seed-onetouch.mjs
 *   (토큰은 Supabase Auth 로그인으로 받은 값. 파일에 저장하지 마세요.)
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

const HEADERS = {
  apikey: anon,
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates,return=minimal',
};

const require = createRequire(import.meta.url);
mkdirSync(resolve(root, '.tmp'), { recursive: true });
execFileSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['esbuild', 'src/data/onetouchSeed.ts', '--bundle', '--format=cjs', '--platform=node', '--outfile=.tmp/onetouchSeed.cjs'],
  { cwd: root, stdio: 'inherit' }
);
const seed = require(resolve(root, '.tmp/onetouchSeed.cjs'));

async function upsert(table, onConflict, rows, label) {
  if (!rows.length) return;
  const res = await fetch(`${url}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    console.error(`${label} 실패`, res.status, (await res.text()).slice(0, 600));
    process.exit(1);
  }
  console.log(`${label}: ${rows.length}건 upsert`);
}

/* 1) 기질별 미션 96건 */
await upsert(
  'temperament_missions',
  'track,week,session,temperament,kind',
  seed.MISSION_SEED.map((m) => ({
    track: m.track,
    week: m.week,
    session: m.session,
    temperament: m.temperament,
    kind: m.kind,
    title: m.title,
    body: m.body,
    hint: m.hint ?? null,
    answer: m.answer ?? null,
    sort_no: m.kind === 'homework' ? 10 : m.kind === 'problem' ? 20 : 30,
    published: true,
    updated_at: new Date().toISOString(),
  })),
  '기질별 미션'
);

/* 2) 대회 */
await upsert(
  'competitions',
  'seed_key',
  seed.COMPETITION_SEED.map((c) => ({ ...c, visible: true, updated_at: new Date().toISOString() })),
  '대회'
);

/* 3) IT뉴스 */
await upsert('it_news', 'seed_key', seed.NEWS_SEED.map((n) => ({ ...n, visible: true })), 'IT뉴스');

/* 4) 데모 학생 기질 — 비어 있는 학생만 (아이 유형 K1~K4 → 4기질) */
const KID_TO_TEMPER = { 1: 'CHALLENGER', 2: 'CREATOR', 3: 'SYSTEMATIC', 4: 'EXPLORER' };
const DEMO_STUDENTS = [
  { name: '김서연', code: 'RC-14E1', track: 'python' },
  { name: '박준우', code: 'RC-22F6', track: 'roblox' },
  { name: '이하은', code: 'RC-31E2', track: 'scratch' },
  { name: '최민준', code: 'RC-43A8', track: 'unity' },
  { name: '정유진', code: 'RC-12B4', track: 'scratch' },
];
const studentsRes = await fetch(
  `${url}/rest/v1/students?select=id,name,temperament_type&active=eq.true`,
  { headers: { apikey: anon, Authorization: `Bearer ${token}` } }
);
const students = await studentsRes.json();
const profilesRes = await fetch(`${url}/rest/v1/class_profiles?select=student_id,code`, {
  headers: { apikey: anon, Authorization: `Bearer ${token}` },
});
const profiles = await profilesRes.json();
const codeByStudent = new Map(profiles.map((p) => [p.student_id, p.code || '']));

let filled = 0;
for (const s of students) {
  if (s.temperament_type) continue;
  const demo = DEMO_STUDENTS.find((d) => d.name === s.name);
  const code = codeByStudent.get(s.id) || demo?.code || '';
  const m = /^RC-([1-4])([1-4])[0-9A-F]{2}$/i.exec(code);
  if (!m) continue;
  const temper = KID_TO_TEMPER[m[2]];
  if (!temper) continue;
  const patch = await fetch(`${url}/rest/v1/students?id=eq.${s.id}`, {
    method: 'PATCH',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
    body: JSON.stringify({ temperament_type: temper, temperament_code: code.toUpperCase(), temperament_updated_at: new Date().toISOString() }),
  });
  if (patch.ok) {
    filled += 1;
    console.log(`  ${s.name} · ${code} → ${temper}`);
  } else {
    console.warn(`  ${s.name} 기질 채우기 실패`, patch.status);
  }
}
console.log(`데모 학생 기질 채움: ${filled}명 (이미 값이 있던 학생은 그대로)`);

/* 4-1) 데모 학생 수강 트랙(class_profiles)이 없으면 만들어 둡니다 — 있으면 건드리지 않음 */
const existing = new Set(profiles.map((p) => p.student_id));
const newProfiles = students
  .map((s) => {
    const demo = DEMO_STUDENTS.find((d) => d.name === s.name);
    if (!demo || existing.has(s.id)) return null;
    return { student_id: s.id, track: demo.track, code: demo.code, updated_at: new Date().toISOString() };
  })
  .filter(Boolean);
if (newProfiles.length) {
  const res = await fetch(`${url}/rest/v1/class_profiles`, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify(newProfiles),
  });
  console.log(`데모 수강 트랙: ${res.ok ? newProfiles.length + '건 생성' : '실패 ' + res.status}`);
}

/* 5) 확인 */
const countRes = await fetch(`${url}/rest/v1/temperament_missions?select=id`, {
  headers: { apikey: anon, Authorization: `Bearer ${token}`, Prefer: 'count=exact', Range: '0-0' },
});
console.log('미션 테이블 응답:', countRes.status);
