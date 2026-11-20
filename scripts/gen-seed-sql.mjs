/**
 * Supabase 시드 SQL 생성기 (2026-11-20)
 *  - src/data/materialSeed.ts (파이썬 1~4주 8차시) → supabase/seed-materials.sql
 *  - src/data/seed.ts (데모 학생 5명·단어 세트/단어·상점 상품) → supabase/seed-demo.sql
 * 실행: node scripts/gen-seed-sql.mjs
 * 시드는 여러 번 돌려도 안전하도록 on conflict 를 씁니다.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
mkdirSync(resolve(root, '.tmp'), { recursive: true });

function bundle(entry, out) {
  execFileSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['esbuild', entry, '--bundle', '--format=cjs', '--platform=node', `--outfile=${out}`],
    { cwd: root, stdio: 'inherit' }
  );
  return require(out);
}

const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);

/* ------------------------------- 1) 자료실 시드 ------------------------------- */
const { MATERIAL_SEED } = bundle('src/data/materialSeed.ts', resolve(root, '.tmp/materialSeed.cjs'));

const materialRows = MATERIAL_SEED.map((row) => {
  const student = JSON.stringify(row.student ?? {});
  const teacher = row.teacher ? JSON.stringify(row.teacher) : null;
  return `  (${q(row.key)}, ${q(row.kind)}, ${q(row.title)}, ${q(row.track)}, ${row.week}, ${row.session},
   ${q(row.summary)}, $jc$${student}$jc$::jsonb, ${teacher ? `$jt$${teacher}$jt$::jsonb` : 'null'},
   ${row.answer ? `${q(row.answer)}` : 'null'}, ${q(row.aiTip ?? null)}, ${q(row.linkUrl ?? null)},
   ${q(row.codeLang ?? 'python')}, ${row.published === false ? 'false' : 'true'}, ${row.sort})`;
}).join(',\n');

const materialsSql = `-- 자동 생성: scripts/gen-seed-sql.mjs (src/data/materialSeed.ts)
-- 파이썬 1~4주차 8차시 — 학생용 내용 / 교사용 수업안 / 정답 코드가 분리되어 들어갑니다.
insert into public.materials
  (seed_key, kind, title, track, week, session, summary, student_content, teacher_guide, answer_code, ai_tip, link_url, code_lang, published, sort_no)
values
${materialRows}
on conflict (seed_key) do update set
  kind = excluded.kind,
  title = excluded.title,
  track = excluded.track,
  week = excluded.week,
  session = excluded.session,
  summary = excluded.summary,
  student_content = excluded.student_content,
  teacher_guide = excluded.teacher_guide,
  answer_code = excluded.answer_code,
  ai_tip = excluded.ai_tip,
  link_url = excluded.link_url,
  code_lang = excluded.code_lang,
  published = excluded.published,
  sort_no = excluded.sort_no,
  updated_at = now();

-- 배정이 없는 학생은 파이썬 1주차 1회차에서 시작합니다 (원장님이 화면에서 바꿀 수 있음)
`;

/* ------------------------------ 2) 데모 데이터 ------------------------------ */
const seed = bundle('src/data/seed.ts', resolve(root, '.tmp/seed.cjs'));

const students = seed.SEED_STUDENTS.map(
  (s) => `  (${q(s.name)}, ${q(s.class_name)}, ${s.grade}, ${s.level}, ${q(s.tosel_level)}, crypt(${q(s.pin)}, gen_salt('bf')), ${q(s.nickname)}, ${q(s.parent_token)}, ${q(s.coding_level)}, ${q(`{${(s.enabled_subjects ?? ['coding']).join(',')}}`)})`
).join(',\n');

const sets = seed.SEED_WORD_SETS.map(
  (set) => `  (${q(set.name)}, ${set.level}, ${set.day_index})`
).join(',\n');

const words = seed.SEED_WORDS.map((w) => {
  const set = seed.SEED_WORD_SETS.find((x) => x.id === w.set_id) ?? { level: 1, day_index: 1 };
  return `  (${set.level}, ${set.day_index}, ${q(w.word)}, ${q(w.meaning)}, ${q(w.pos ?? '')}, ${q(w.ipa ?? '')}, ${q(w.example ?? '')}, ${q(w.example_ko ?? '')}, ${w.order_no ?? 0})`;
}).join(',\n');

const shop = seed.SEED_SHOP_ITEMS.map(
  (i) => `  (${q(i.name)}, ${i.price}, ${q(i.emoji)}, ${i.sort_no ?? 0})`
).join(',\n');

const demoSQL = `-- 자동 생성: scripts/gen-seed-sql.mjs (src/data/seed.ts)
-- 실행 전용 데모 데이터: 학생 5명(앱과 같은 PIN), 단어 세트/단어, 상점 상품
-- 학생 PIN 은 앱 로그인 화면에서 쓰는 값과 같습니다. bcrypt 해시로만 저장됩니다.

insert into public.students (name, class_name, grade, level, tosel_level, pin_hash, nickname, parent_token, coding_level, enabled_subjects)
values
${students}
on conflict (parent_token) do nothing;

insert into public.word_sets (name, level, day_index)
values
${sets}
on conflict (level, day_index) do nothing;

insert into public.words (set_id, word, meaning, pos, ipa, example, example_ko, order_no)
select ws.id, v.word, v.meaning, v.pos, v.ipa, v.example, v.example_ko, v.order_no
from (values
${words}
) as v(level, day_index, word, meaning, pos, ipa, example, example_ko, order_no)
join public.word_sets ws on ws.level = v.level and ws.day_index = v.day_index
on conflict (set_id, word) do nothing;

insert into public.shop_items (name, price, emoji, sort_no)
select v.name, v.price, v.emoji, v.sort_no
from (values
${shop}
) as v(name, price, emoji, sort_no)
where not exists (select 1 from public.shop_items s where s.name = v.name);

-- 오늘의 미션 배정 (학생 레벨에 맞는 세트)
insert into public.assignments (student_id, set_id)
select s.id, ws.id
from public.students s
join public.word_sets ws on ws.level = s.level and ws.day_index = 1
on conflict (student_id, set_id) do nothing;

-- 참고 자료실 기본 배정 — 파이썬, 현재 주차는 1주차 1회차
insert into public.material_assignments (student_id, track, week, session)
select s.id, 'python', 1, 1
from public.students s
on conflict (student_id) do nothing;
`;

writeFileSync(resolve(root, 'supabase/seed-materials.sql'), materialsSql);
writeFileSync(resolve(root, 'supabase/seed-demo.sql'), demoSQL);
console.log(
  `seed-materials.sql: ${materialRows.length ? MATERIAL_SEED.length : 0}개 자료\nseed-demo.sql: 학생 ${seed.SEED_STUDENTS.length}명 · 세트 ${seed.SEED_WORD_SETS.length} · 단어 ${seed.SEED_WORDS.length}`
);
