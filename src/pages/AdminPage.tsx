import { useMemo, useState } from 'react';
import { useSession, useVocaStore } from '../app-context';
import { Badge, Bar, Button, Card, LevelPill, Modal, SectionTitle, useToast } from '../components/ui';
import ParentReportCard from '../components/ParentReportCard';
import { parseWordCsv } from '../lib/csv';
import { buildClassMessage, buildParentMessage, copyText, reportUrl } from '../lib/report';
import { computeOverview, computeWeekStats } from '../lib/stats';
import { LEVEL_META, LEVEL_TO_TOSEL, TOSEL_TO_LEVEL, CODING_LEVELS, CODING_LEVEL_META, type CodingLevel, type Level, type RedemptionRequest, type ShopItem, type Student, type Subject, type ToselLevel } from '../types';
import { CODING_GAME_META } from '../lib/coding';
import { cn, formatKoTimestamp, pct, todayStr, weekStartStr } from '../lib/util';

type Tab = 'dash' | 'students' | 'words' | 'levels' | 'coding' | 'shop' | 'report';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'dash', label: '대시보드', icon: '📊' },
  { key: 'students', label: '학생', icon: '🧑‍🎓' },
  { key: 'words', label: '단어장', icon: '📖' },
  { key: 'levels', label: '레벨 배정', icon: '🎚️' },
  { key: 'coding', label: '코딩', icon: '💻' },
  { key: 'shop', label: '상점·교환', icon: '🎁' },
  { key: 'report', label: '금요일 리포트', icon: '💬' },
];

/** 수강 과목 선택 3가지 (원장님 화면) */
const SUBJECT_CHOICES: { key: 'english' | 'coding' | 'both'; label: string; value: Subject[] }[] = [
  { key: 'english', label: '영어만', value: ['english'] },
  { key: 'coding', label: '코딩만', value: ['coding'] },
  { key: 'both', label: '영어 + 코딩', value: ['english', 'coding'] },
];

function subjectKeyOf(list: Subject[] | undefined): 'english' | 'coding' | 'both' {
  const hasEn = !!list?.includes('english');
  const hasCo = !!list?.includes('coding');
  return hasEn && hasCo ? 'both' : hasCo ? 'coding' : 'english';
}

function download(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function AdminPage() {
  const store = useVocaStore();
  const { logout } = useSession();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('dash');

  const students = store.listStudents(true);
  const active = students.filter((s) => s.active);

  return (
    <div className="min-h-screen pb-safe">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-brand-600 text-base text-white shadow-soft">📚</span>
            <div>
              <p className="text-[11px] font-semibold text-slate-400">라피네코딩 두정점 · 관리자</p>
              <p className="text-sm font-bold leading-tight text-slate-900">라피네 클래스 · 영어 &amp; 코딩</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge tone={store.mode === 'supabase' ? 'mint' : 'slate'}>
              <span className={cn('h-1.5 w-1.5 rounded-full', store.mode === 'supabase' ? 'bg-emerald-500' : 'bg-slate-400')} />
              {store.mode === 'supabase' ? '실시간 연결' : '데모 모드'}
            </Badge>
            <button
              onClick={() => {
                download(`rafine_students_backup_${todayStr()}.csv`, store.backupStudentsCsv());
                toast('학생 명단을 CSV로 내려받았어요');
              }}
              className="hidden rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 sm:inline"
            >
              백업
            </button>
            <button
              onClick={() => {
                logout();
              }}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"
            >
              나가기
            </button>
          </div>
        </div>
        <div className="mx-auto hidden max-w-6xl gap-1 px-4 pb-2 md:flex">
          {TABS.map((t) => (
            <button
              key={t.key}
              data-testid={`tab-${t.key}`}
              onClick={() => setTab(t.key)}
              className={cn(
                'rounded-xl px-3.5 py-2 text-sm font-semibold transition',
                tab === t.key ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50'
              )}
            >
              <span className="mr-1.5">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-4 md:pb-10">
        {tab === 'dash' ? <Dashboard onGo={setTab} /> : null}
        {tab === 'students' ? <StudentsTab /> : null}
        {tab === 'words' ? <WordsTab /> : null}
        {tab === 'levels' ? <LevelsTab /> : null}
        {tab === 'coding' ? <CodingAdminTab /> : null}
        {tab === 'shop' ? <ShopAdminTab /> : null}
        {tab === 'report' ? <ReportTab /> : null}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white bg-white/95 backdrop-blur md:hidden">
        <div className="flex items-stretch justify-around px-1 pb-safe pt-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              data-testid={`tabm-${t.key}`}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-semibold',
                tab === t.key ? 'text-brand-700' : 'text-slate-400'
              )}
            >
              <span className="text-base">{t.icon}</span>
              <span className="whitespace-nowrap">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

/* --------------------------------- 대시보드 -------------------------------- */

function Dashboard({ onGo }: { onGo: (t: Tab) => void }) {
  const store = useVocaStore();
  const overview = computeOverview();
  const active = store.listStudents();
  const logs = store
    .allLogs()
    .slice()
    .sort((a, b) => b.answered_at.localeCompare(a.answered_at))
    .slice(0, 8);

  const headcount = Math.max(1, overview.todayTotal);
  const kpis = [
    {
      label: '이번 주 완료 단어',
      value: overview.weekWords,
      unit: '개',
      tone: 'brand' as const,
      ratio: Math.min(1, overview.weekWords / Math.max(1, headcount * 12 * 5)),
    },
    { label: '오늘 접속', value: overview.activeToday, unit: `/${overview.todayTotal}명`, tone: 'sky' as const, ratio: overview.activeToday / headcount },
    { label: '오늘 미션 완료', value: overview.todayCompleted, unit: `/${overview.todayTotal}명`, tone: 'mint' as const, ratio: overview.todayCompleted / headcount },
    { label: '학원 정답률', value: overview.accuracy, unit: '%', tone: 'sun' as const, ratio: overview.accuracy / 100 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">이번 주 학원 현황</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {formatKoTimestamp(new Date().toISOString())} 기준 · {weekStartStr()} 주간
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="soft" onClick={() => onGo('levels')}>
            레벨 배정
          </Button>
          <Button size="sm" onClick={() => onGo('report')}>
            금요일 요약 복사
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <p className="text-[11px] font-semibold text-slate-400">{k.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {k.value}
              <span className="ml-1 text-xs font-bold text-slate-400">{k.unit}</span>
            </p>
            <div className="mt-2">
              <Bar ratio={k.ratio} tone={k.tone === 'sun' ? 'sun' : k.tone === 'mint' ? 'mint' : 'brand'} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <SectionTitle sub="오늘 배정을 80% 이상 풀면 완료">미완료 학생</SectionTitle>
          <ul className="mt-3 space-y-2">
            {overview.incomplete.length === 0 ? (
              <li className="rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-700">
                오늘 전원 완료했어요! 🎉
              </li>
            ) : (
              overview.incomplete.map(({ student, lastSeen }) => (
                <li key={student.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-xs font-bold text-slate-500">
                    {student.name.slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800">{student.name}</p>
                    <p className="text-[11px] text-slate-500">
                      마지막 접속 {formatKoTimestamp(lastSeen)}
                    </p>
                  </div>
                  <LevelPill level={student.level} />
                </li>
              ))
            )}
          </ul>
          <p className="mt-3 text-[11px] text-slate-400">학생이 완료하면 Supabase Realtime으로 이 화면이 새로고침 없이 갱신됩니다.</p>
        </Card>

        <Card>
          <SectionTitle sub="첫 응답 기준">반별 정답률</SectionTitle>
          <div className="mt-3 space-y-3">
            {overview.classAccuracy.map((c) => (
              <div key={c.className}>
                <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>
                    {c.className} <span className="text-slate-400">({c.students}명)</span>
                  </span>
                  <span className="text-slate-800">{c.accuracy}%</span>
                </div>
                <Bar ratio={c.accuracy / 100} tone={c.accuracy >= 85 ? 'mint' : 'brand'} />
              </div>
            ))}
            {overview.classAccuracy.length === 0 ? <p className="text-sm text-slate-400">학생을 먼저 추가해 주세요.</p> : null}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <SectionTitle sub="최근 8건">실시간 학습 기록</SectionTitle>
          <ul className="mt-3 divide-y divide-slate-100">
            {logs.map((l) => {
              const st = store.getStudent(l.student_id);
              const w = store.wordById(l.word_id);
              return (
                <li key={l.id} className="flex items-center gap-3 py-2">
                  <span className={cn('grid h-7 w-7 place-items-center rounded-lg text-xs', l.is_correct ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500')}>
                    {l.is_correct ? '✓' : '✕'}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                    <span className="font-semibold">{st?.name ?? '학생'}</span> · {w?.word ?? '단어'}{' '}
                    <span className="text-[11px] text-slate-400">
                      {l.mode === 'card' ? '카드' : l.mode === 'choice' ? '4지선다' : '스펠링'}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-slate-400">{formatKoTimestamp(l.answered_at)}</span>
                </li>
              );
            })}
            {logs.length === 0 ? <li className="py-6 text-center text-sm text-slate-400">아직 학습 기록이 없어요.</li> : null}
          </ul>
        </Card>

        <Card>
          <SectionTitle sub="재원생 기준">레벨 분포</SectionTitle>
          <div className="mt-3 space-y-2">
            {([1, 2, 3, 4, 5] as Level[]).map((lv) => {
              const count = active.filter((s) => s.level === lv).length;
              return (
                <div key={lv} className="flex items-center gap-2">
                  <LevelPill level={lv} />
                  <div className="flex-1">
                    <Bar ratio={active.length ? count / active.length : 0} />
                  </div>
                  <span className="w-6 text-right text-xs font-bold text-slate-500">{count}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 rounded-xl bg-brand-50 px-3 py-2 text-[11px] leading-relaxed text-brand-700">
            진단 결과(Pre-Starter~High Junior)를 고르면 레벨 배정 탭에서 한 번에 바꿀 수 있어요.
          </p>
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------- 학생 ---------------------------------- */

function StudentsTab() {
  const store = useVocaStore();
  const toast = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', grade: 3, class_name: '초등A', nickname: '' });
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<{ student: Student; pin: string } | null>(null);
  const [query, setQuery] = useState('');

  const students = store
    .listStudents(true)
    .filter((s) => !query || s.name.includes(query) || s.class_name.includes(query));

  const submit = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      const res = await store.addStudent({
        name: form.name,
        grade: Number(form.grade),
        class_name: form.class_name,
        nickname: form.nickname || form.name,
        level: 1,
      });
      setIssued(res);
      setAddOpen(false);
      setForm({ name: '', grade: 3, class_name: '초등A', nickname: '' });
    } catch (err) {
      toast(err instanceof Error ? err.message : '학생 추가에 실패했어요', 'err');
    } finally {
      setBusy(false);
    }
  };

  const reissue = async (st: Student) => {
    try {
      const pin = await store.resetPin(st.id);
      setIssued({ student: st, pin });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'PIN 재발급에 실패했어요', 'err');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">학생 관리</h1>
          <p className="mt-0.5 text-sm text-slate-500">재원생 {students.filter((s) => s.active).length}명 · 비활성 {students.filter((s) => !s.active).length}명</p>
        </div>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름·반 검색"
            className="w-36 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          <Button size="sm" onClick={() => setAddOpen(true)}>
            + 학생 추가
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto thin-scroll">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">이름</th>
                <th className="px-3 py-3 font-semibold">반 · 학년</th>
                <th className="px-3 py-3 font-semibold">영어 레벨</th>
                <th className="px-3 py-3 font-semibold">수강 과목</th>
                <th className="px-3 py-3 font-semibold">코딩 레벨</th>
                <th className="px-3 py-3 font-semibold">닉네임</th>
                <th className="px-3 py-3 font-semibold">마지막 접속</th>
                <th className="px-3 py-3 text-right font-semibold">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((st) => (
                <tr key={st.id} className={cn(!st.active && 'opacity-50')}>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-800">{st.name}</p>
                    <p className="text-[11px] text-slate-400">가입 {formatKoTimestamp(st.created_at)}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {st.class_name} · {LEVEL_META[st.level].grades}
                  </td>
                  <td className="px-3 py-3">
                    <LevelPill level={st.level} />
                    <span className="ml-1.5 text-[10px] text-slate-400">{st.tosel_level}</span>
                  </td>
                  <td className="px-3 py-3">
                    {/* 원장님이 학생별로 영어·코딩 탭을 열어 주는 선택 */}
                    <select
                      data-testid={`admin-student-subjects-${st.id}`}
                      value={subjectKeyOf(st.enabled_subjects)}
                      onChange={(e) => {
                        const choice = SUBJECT_CHOICES.find((c) => c.key === e.target.value);
                        if (!choice) return;
                        store.setStudentSubjects(st.id, choice.value);
                        toast(`${st.name} 학생 수강 과목 · ${choice.label}`);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 outline-none focus:border-brand-400"
                    >
                      {SUBJECT_CHOICES.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      data-testid={`admin-student-coding-level-${st.id}`}
                      value={st.coding_level}
                      onChange={(e) => {
                        store.setStudentCodingLevel(st.id, e.target.value as CodingLevel);
                        toast(`${st.name} 학생 코딩 레벨 · ${e.target.value}`);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 outline-none focus:border-brand-400"
                    >
                      {CODING_LEVELS.map((lv) => (
                        <option key={lv} value={lv}>
                          {lv} · {CODING_LEVEL_META[lv].desc.split(' · ')[0]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{st.nickname}</td>
                  <td className="px-3 py-3 text-[12px] text-slate-500">{formatKoTimestamp(st.last_seen_at)}</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => reissue(st)}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        PIN 재발급
                      </button>
                      <button
                        onClick={() => store.setStudentActive(st.id, !st.active)}
                        className={cn(
                          'rounded-lg px-2 py-1 text-[11px] font-semibold',
                          st.active ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        )}
                      >
                        {st.active ? '비활성화' : '다시 활성'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-[11px] leading-relaxed text-slate-400">
        PIN은 평문으로 저장하지 않고 해시로 보관해요. 화면에 나온 PIN은 발급 직후 한 번만 보여 드립니다. 학생에게 종이로 전달하세요.
      </p>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="학생 추가"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              취소
            </Button>
            <Button onClick={submit} disabled={busy || !form.name.trim()}>
              추가하고 PIN 발급
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="text-xs font-semibold text-slate-500">이름</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="예) 김서연"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-400"
            />
          </label>
          <label>
            <span className="text-xs font-semibold text-slate-500">학년</span>
            <select
              value={form.grade}
              onChange={(e) => setForm({ ...form, grade: Number(e.target.value) })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-brand-400"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={g}>
                  {g <= 6 ? `초${g}` : g <= 9 ? `중${g - 6}` : `고${g - 9}`}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold text-slate-500">반</span>
            <input
              value={form.class_name}
              onChange={(e) => setForm({ ...form, class_name: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-400"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs font-semibold text-slate-500">닉네임 (랭킹에 표시 · 선택)</span>
            <input
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              placeholder="예) 별빛서연"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-400"
            />
          </label>
        </div>
        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
          추가하면 4자리 PIN이 자동 발급되고 Level 1로 시작해요. 진단 결과에 따라 레벨 배정 탭에서 바로 바꿀 수 있습니다.
        </p>
      </Modal>

      <Modal open={!!issued} onClose={() => setIssued(null)} title="PIN 발급 완료">
        {issued ? (
          <div className="text-center">
            <p className="text-sm text-slate-500">{issued.student.name} 학생의 PIN</p>
            <p className="mt-3 rounded-2xl bg-brand-50 py-5 text-5xl font-extrabold tracking-[0.35em] text-brand-700">
              {issued.pin}
            </p>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
              지금 화면을 닫으면 다시 볼 수 없어요. 종이에 적어 학생에게 전달해 주세요.
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={async () => {
                  const ok = await copyText(`${issued.student.name} PIN ${issued.pin}`);
                  toast(ok ? 'PIN을 복사했어요' : '복사에 실패했어요', ok ? 'ok' : 'err');
                }}
              >
                복사
              </Button>
              <Button className="flex-1" onClick={() => setIssued(null)}>
                확인
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

/* ---------------------------------- 단어장 --------------------------------- */

const SAMPLE_CSV = `word,meaning,pos,example,example_ko,order_no
confident,자신감 있는,adj,I feel confident before the demo.,나는 시연 전에 자신감이 있어요.,1
repeat,반복하다,v,Repeat the word three times.,그 단어를 세 번 반복하세요.,2
curious,호기심 많은,adj,She is curious about robots.,그녀는 로봇에 호기심이 많아요.,3`;

function WordsTab() {
  const store = useVocaStore();
  const toast = useToast();
  const [level, setLevel] = useState<Level>(3);
  const [day, setDay] = useState(3);
  const [text, setText] = useState('');
  const parsed = useMemo(() => parseWordCsv(text), [text]);
  const validRows = parsed.rows.filter((r) => r.errors.length === 0);

  const counts = ([1, 2, 3, 4, 5] as Level[]).map((lv) => ({
    level: lv,
    words: store.wordsForLevel(lv).length,
    sets: store.listWordSets(lv).length,
  }));

  const save = () => {
    if (!validRows.length) return;
    const res = store.addWordsFromCsv(level, day, validRows);
    toast(`Level ${level} Day ${String(day).padStart(2, '0')}에 ${res.added}단어를 추가했어요`);
    setText('');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">단어장 · CSV 업로드</h1>
        <p className="mt-0.5 text-sm text-slate-500">엑셀에서 CSV UTF-8(BOM)로 저장하면 한글이 깨지지 않아요.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        {counts.map((c) => (
          <Card key={c.level} className="p-3">
            <div className="flex items-center justify-between">
              <LevelPill level={c.level} />
              <span className="text-xs font-bold text-slate-700">{c.words}단어</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">{c.sets}세트 · 목표 {LEVEL_META[c.level].cumulative.toLocaleString()}단어</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle sub="헤더: word,meaning,pos,example,example_ko,order_no">업로드할 CSV</SectionTitle>
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              value={level}
              onChange={(e) => setLevel(Number(e.target.value) as Level)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-brand-400"
            >
              {([1, 2, 3, 4, 5] as Level[]).map((lv) => (
                <option key={lv} value={lv}>
                  Level {lv} ({LEVEL_META[lv].grades})
                </option>
              ))}
            </select>
            <select
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-brand-400"
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Day {String(d).padStart(2, '0')}
                </option>
              ))}
            </select>
            <label className="cursor-pointer rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50">
              파일 선택
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const content = await file.text();
                  setText(content);
                  toast(`${file.name}을 불러왔어요`);
                }}
              />
            </label>
            <button
              onClick={() => download('rafine_words_template.csv', '\uFEFF' + SAMPLE_CSV)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
            >
              양식 내려받기
            </button>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={SAMPLE_CSV}
            rows={9}
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 font-mono text-[12px] leading-relaxed outline-none focus:border-brand-400 focus:bg-white"
          />

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <Badge tone="mint">정상 {parsed.okCount}행</Badge>
            <Badge tone="rose">오류 {parsed.rows.length - parsed.okCount}행</Badge>
            {parsed.missingHeader.length ? <Badge tone="sun">헤더 누락: {parsed.missingHeader.join(', ')}</Badge> : null}
            <span className="flex-1" />
            <Button size="sm" onClick={save} disabled={!validRows.length}>
              미리보기 확인 후 저장
            </Button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
            빈 칸·중복·영단어 오타 의심 행은 저장에서 제외돼요. 저장 후에도 기존 단어는 그대로 남습니다.
          </p>
        </Card>

        <Card>
          <SectionTitle sub="최대 10행 미리보기">검증 결과</SectionTitle>
          {parsed.rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">CSV를 붙여넣으면 여기에서 바로 검사해 드려요.</p>
          ) : (
            <div className="mt-3 overflow-x-auto thin-scroll">
              <table className="w-full min-w-[520px] text-left text-[12px]">
                <thead className="text-[10px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-2 py-2">행</th>
                    <th className="px-2 py-2">단어</th>
                    <th className="px-2 py-2">뜻</th>
                    <th className="px-2 py-2">품사</th>
                    <th className="px-2 py-2">예문</th>
                    <th className="px-2 py-2">검사</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsed.rows.slice(0, 10).map((r) => (
                    <tr key={r.line} className={cn(r.errors.length ? 'bg-rose-50/60' : '')}>
                      <td className="px-2 py-2 text-slate-400">{r.line}</td>
                      <td className="px-2 py-2 font-semibold text-slate-800">{r.word || '—'}</td>
                      <td className="px-2 py-2 text-slate-600">{r.meaning || '—'}</td>
                      <td className="px-2 py-2 text-slate-500">{r.pos}</td>
                      <td className="max-w-[160px] truncate px-2 py-2 text-slate-500">{r.example}</td>
                      <td className="px-2 py-2">
                        {r.errors.length ? (
                          <span className="text-rose-600">{r.errors.join(' / ')}</span>
                        ) : (
                          <span className="text-emerald-600">정상</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                download(`rafine_words_L${level}.csv`, store.wordsCsv(level));
                toast(`Level ${level} 단어장을 CSV로 내려받았어요`);
              }}
              className="text-[11px] font-semibold text-brand-600 hover:underline"
            >
              Level {level} 현재 단어장 CSV로 내려받기
            </button>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle sub="트랙별 세트">현재 단어 세트</SectionTitle>
        <div className="mt-3 flex flex-wrap gap-2">
          {store.listWordSets().map((s) => (
            <span key={s.id} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
              {s.name} · {store.words.filter((w) => w.set_id === s.id).length}단어
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* -------------------------------- 레벨 배정 -------------------------------- */

function LevelsTab() {
  const store = useVocaStore();
  const toast = useToast();
  const students = store.listStudents();
  const [draft, setDraft] = useState<Record<string, ToselLevel>>({});
  const history = store.listLevelHistory().slice(0, 8);

  const assign = (st: Student, tosel: ToselLevel) => {
    const level = TOSEL_TO_LEVEL[tosel];
    store.setStudentLevel(st.id, level);
    toast(`${st.name} 학생을 Level ${level} (${tosel} 대비)로 배정했어요`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">레벨 배정</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          친구 원장님의 무료 진단 결과를 고르면 앱 트랙이 자동으로 정해집니다. 배정 이력이 남아요.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">학생</th>
                  <th className="px-3 py-3 font-semibold">현재</th>
                  <th className="px-3 py-3 font-semibold">진단 결과</th>
                  <th className="px-3 py-3 text-right font-semibold">배정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => {
                  const value = draft[st.id] ?? st.tosel_level;
                  const targetLevel = TOSEL_TO_LEVEL[value as ToselLevel];
                  const changed = targetLevel !== st.level;
                  return (
                    <tr key={st.id}>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{st.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {st.class_name} · {st.nickname}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <LevelPill level={st.level} />
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={value}
                          onChange={(e) => setDraft({ ...draft, [st.id]: e.target.value as ToselLevel })}
                          className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-brand-400"
                        >
                          {(['Pre-Starter', 'Starter', 'Basic', 'Junior', 'High Junior'] as ToselLevel[]).map((t) => (
                            <option key={t} value={t}>
                              {t} → L{TOSEL_TO_LEVEL[t]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Button size="sm" variant={changed ? 'primary' : 'ghost'} disabled={!changed} onClick={() => assign(st, value as ToselLevel)}>
                          {changed ? '배정' : '배정됨'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionTitle sub="진단 결과와 앱 트랙">TOSEL 대응표</SectionTitle>
            <ul className="mt-3 space-y-2 text-xs">
              {(['Pre-Starter', 'Starter', 'Basic', 'Junior', 'High Junior'] as ToselLevel[]).map((t) => {
                const lv = TOSEL_TO_LEVEL[t];
                return (
                  <li key={t} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                    <span className="w-24 font-bold text-slate-700">{t}</span>
                    <span className="text-slate-400">→</span>
                    <LevelPill level={lv} />
                    <span className="ml-auto text-slate-500">{LEVEL_META[lv].grades}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
              표기는 Level 1~5로 통일합니다. 공식 TOSEL 교재와 혼동되지 않도록 「토셀 대비」 대신 「TOSEL ○○ 대비」로만 표기해요.
            </p>
          </Card>

          <Card>
            <SectionTitle sub="최근 변경">배정 이력</SectionTitle>
            <ul className="mt-3 space-y-2">
              {history.length === 0 ? <li className="text-sm text-slate-400">아직 변경 이력이 없어요.</li> : null}
              {history.map((h) => {
                const st = store.getStudent(h.student_id);
                return (
                  <li key={h.id} className="rounded-xl bg-slate-50 px-3 py-2 text-xs">
                    <span className="font-bold text-slate-700">{st?.name ?? '학생'}</span>{' '}
                    <span className="text-slate-500">
                      {h.from_level ? `L${h.from_level} → ` : ''}L{h.to_level} ({h.tosel_level})
                    </span>
                    <span className="ml-1 text-slate-400">· {formatKoTimestamp(h.changed_at)}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ 코딩 (레벨 · 과목 권한) ------------------------------ */

function CodingAdminTab() {
  const store = useVocaStore();
  const toast = useToast();
  const overview = store.codingOverview();
  const recent = store.allCodingSessions().slice(0, 6);
  const codingStudents = overview.filter((o) => o.student.enabled_subjects.includes('coding'));
  const playingToday = codingStudents.filter((o) => o.gameRounds > 0).length;
  const openWrong = overview.reduce((sum, o) => sum + o.wrongOpen, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">코딩 학습 현황</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          학생별 코딩 레벨(C1~C4)과 수강 과목(영어·코딩 탭)을 여기서 바로 바꿀 수 있어요. 바꾼 즉시 학생 화면에 적용됩니다.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-[11px] font-semibold text-slate-400">코딩 수강생</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900" data-testid="admin-coding-students">
            {codingStudents.length}명
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold text-slate-400">오늘 게임 플레이</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{playingToday}명</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold text-slate-400">코딩 오답 대기</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{openWrong}개</p>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto thin-scroll">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">학생</th>
                <th className="px-3 py-3 font-semibold">수강 과목</th>
                <th className="px-3 py-3 font-semibold">코딩 레벨</th>
                <th className="px-3 py-3 font-semibold">푼 문제</th>
                <th className="px-3 py-3 font-semibold">정답률</th>
                <th className="px-3 py-3 font-semibold">오답 대기</th>
                <th className="px-3 py-3 font-semibold">게임</th>
                <th className="px-3 py-3 text-right font-semibold">오늘 적립</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {overview.map((row) => (
                <tr key={row.student.id} data-testid={`admin-coding-row-${row.student.id}`} className={cn(!row.student.active && 'opacity-50')}>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-800">{row.student.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {row.student.class_name} · {row.lastPlayedAt ? `최근 ${formatKoTimestamp(row.lastPlayedAt)}` : '플레이 전'}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      data-testid={`admin-subjects-${row.student.id}`}
                      value={subjectKeyOf(row.student.enabled_subjects)}
                      onChange={(e) => {
                        const choice = SUBJECT_CHOICES.find((c) => c.key === e.target.value);
                        if (!choice) return;
                        store.setStudentSubjects(row.student.id, choice.value);
                        toast(`${row.student.name} 학생 수강 과목 · ${choice.label}`);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 outline-none focus:border-brand-400"
                    >
                      {SUBJECT_CHOICES.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      data-testid={`admin-coding-level-${row.student.id}`}
                      value={row.student.coding_level}
                      onChange={(e) => {
                        store.setStudentCodingLevel(row.student.id, e.target.value as CodingLevel);
                        toast(`${row.student.name} 학생 코딩 레벨 · ${e.target.value}`);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 outline-none focus:border-brand-400"
                    >
                      {CODING_LEVELS.map((lv) => (
                        <option key={lv} value={lv}>
                          {lv} · {CODING_LEVEL_META[lv].desc.split(' · ')[0]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3 text-slate-600 tabular-nums">{row.solved}개</td>
                  <td className="px-3 py-3 text-slate-600 tabular-nums">{row.answered ? `${row.accuracy}%` : '—'}</td>
                  <td className="px-3 py-3">
                    <span className={cn('text-[11px] font-bold', row.wrongOpen ? 'text-rose-400' : 'text-slate-400')}>
                      {row.wrongOpen}개
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-600 tabular-nums">{row.gameRounds}판</td>
                  <td className="px-3 py-3 text-right font-bold text-amber-700 tabular-nums">{row.cashToday}원</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle sub="최근 판 기록">코딩 게임 기록</SectionTitle>
          <ul className="mt-3 space-y-1.5">
            {recent.length === 0 ? <li className="text-sm text-slate-400">아직 플레이 기록이 없어요.</li> : null}
            {recent.map((s) => (
              <li key={s.id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs">
                <span>{CODING_GAME_META[s.game].icon}</span>
                <span className="font-bold text-slate-700">{store.getStudent(s.student_id)?.name ?? '학생'}</span>
                <span className="flex-1 text-slate-500">{CODING_GAME_META[s.game].label}</span>
                <span className="text-slate-500 tabular-nums">
                  {s.score}/{s.total}
                </span>
                <span className="font-bold text-amber-700">+{s.cash_earned}원</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle sub="라피네코딩 수업 순서">4단계 커리큘럼</SectionTitle>
          <ul className="mt-3 space-y-2 text-xs">
            {CODING_LEVELS.map((lv) => (
              <li key={lv} className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="flex items-center gap-2">
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', CODING_LEVEL_META[lv].badge)}>{lv}</span>
                  <span className="font-bold text-slate-700">{CODING_LEVEL_META[lv].desc}</span>
                  <span className="ml-auto text-[10px] text-slate-400">{CODING_LEVEL_META[lv].grades}</span>
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
            수강 과목을 「영어만」·「코딩만」으로 바꾸면 학생 하단 탭에서 다른 과목이 사라지고, 「영어 + 코딩」이면 상단에 전환
            스위치가 보입니다. 캐시 지갑은 두 과목이 함께 써서 하루 상한을 나눠 씁니다.
          </p>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------ 상점 · 교환 관리 ------------------------------ */

const STATUS_META: Record<RedemptionRequest['status'], { text: string; cls: string }> = {
  pending: { text: '신청 대기', cls: 'bg-amber-100 text-amber-700' },
  sent: { text: '발송 완료', cls: 'bg-emerald-100 text-emerald-700' },
  canceled: { text: '취소·환불', cls: 'bg-slate-100 text-slate-500' },
};

function ShopAdminTab() {
  const store = useVocaStore();
  const toast = useToast();
  const [limitDraft, setLimitDraft] = useState(String(store.cashDailyLimit()));
  const [itemModal, setItemModal] = useState<{ mode: 'add' | 'edit'; item?: ShopItem } | null>(null);
  const [form, setForm] = useState({ name: '', price: '', emoji: '🎁' });
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  const items = store.listShopItems(true);
  const allRequests = store.listRedemptions();
  const pending = allRequests.filter((r) => r.status === 'pending');
  const requests = filter === 'pending' ? pending : allRequests;
  const overview = store.cashOverview();
  const totalBalance = overview.reduce((sum, o) => sum + o.balance, 0);
  const todayPaid = overview.reduce((sum, o) => sum + o.earnedToday, 0);
  const sentThisWeek = allRequests.filter((r) => r.status === 'sent').length;

  const saveLimit = () => {
    const value = Number(limitDraft);
    if (!Number.isFinite(value) || value < 0) {
      toast('0원 이상의 숫자를 넣어 주세요', 'err');
      return;
    }
    store.setCashDailyLimit(value);
    setLimitDraft(String(store.cashDailyLimit()));
    toast(`하루 적립 상한을 ${store.cashDailyLimit()}원으로 바꿨어요`);
  };

  const openAdd = () => {
    setForm({ name: '', price: '', emoji: '🎁' });
    setItemModal({ mode: 'add' });
  };

  const openEdit = (item: ShopItem) => {
    setForm({ name: item.name, price: String(item.price), emoji: item.emoji });
    setItemModal({ mode: 'edit', item });
  };

  const saveItem = () => {
    const price = Number(form.price);
    if (!form.name.trim()) {
      toast('상품명을 입력해 주세요', 'err');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      toast('가격은 1원 이상이어야 해요', 'err');
      return;
    }
    try {
      if (itemModal?.mode === 'edit' && itemModal.item) {
        store.updateShopItem(itemModal.item.id, { name: form.name, price, emoji: form.emoji });
        toast(`${form.name.trim()} 상품을 수정했어요`);
      } else {
        store.addShopItem({ name: form.name, price, emoji: form.emoji });
        toast(`${form.name.trim()} 상품을 추가했어요`);
      }
      setItemModal(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : '저장에 실패했어요', 'err');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">상점 · 교환 관리</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            짝맞추기 게임 보상은 하루 상한까지만 쌓여요. 신청이 들어오면 발송 완료 또는 취소(환불)로 정리해 주세요.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="soft" data-testid="admin-shop-add" onClick={openAdd}>
            + 상품 추가
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-[11px] font-semibold text-slate-400">교환 대기</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900" data-testid="admin-pending-count">
            {pending.length}
            <span className="ml-1 text-xs font-bold text-slate-400">건</span>
          </p>
          <p className="mt-1 text-[11px] text-slate-400">학생 화면 ’신청 대기’와 같은 값</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold text-slate-400">오늘 지급한 캐시</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {todayPaid.toLocaleString()}
            <span className="ml-1 text-xs font-bold text-slate-400">원</span>
          </p>
          <p className="mt-1 text-[11px] text-slate-400">상한 {store.cashDailyLimit()}원 × 학생 수 이내</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold text-slate-400">학생 보유 캐시 합계</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {totalBalance.toLocaleString()}
            <span className="ml-1 text-xs font-bold text-slate-400">원</span>
          </p>
          <p className="mt-1 text-[11px] text-slate-400">미교환 잔액 (부채 성격)</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold text-slate-400">발송 완료 누계</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {sentThisWeek}
            <span className="ml-1 text-xs font-bold text-slate-400">건</span>
          </p>
          <p className="mt-1 text-[11px] text-slate-400">전체 기간 기준</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <SectionTitle sub="학생 1인 · 하루 기준">일일 캐시 적립 상한</SectionTitle>
          <div className="mt-3 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                data-testid="admin-cash-limit"
                type="number"
                min={0}
                step={10}
                value={limitDraft}
                onChange={(e) => setLimitDraft(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-8 text-right text-lg font-bold text-slate-900 outline-none focus:border-brand-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">원</span>
            </div>
            <Button data-testid="admin-cash-limit-save" onClick={saveLimit} disabled={Number(limitDraft) === store.cashDailyLimit()}>
              저장
            </Button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
            기본 50원. 상한을 채운 학생은 ’연습 모드’로 계속 플레이할 수 있고 캐시는 더 쌓이지 않아요. 이미 모은 잔액은 그대로 남습니다.
          </p>
          <div className="mt-3 space-y-2">
            {overview.map(({ student, balance, earnedToday }) => (
              <div key={student.id} className="rounded-xl bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-bold text-slate-700">{student.name}</span>
                  <span className="shrink-0 text-[11px] font-semibold text-slate-500">
                    오늘 {earnedToday}/{store.cashDailyLimit()}원 · 보유 {balance.toLocaleString()}원
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white">
                  <div
                    className={cn('h-full rounded-full', earnedToday >= store.cashDailyLimit() ? 'bg-amber-400' : 'bg-brand-400')}
                    style={{ width: `${store.cashDailyLimit() > 0 ? Math.min(100, (earnedToday / store.cashDailyLimit()) * 100) : 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-2">
            <SectionTitle sub="신청 즉시 캐시가 차감되고, 취소하면 돌아옵니다">교환 신청 목록</SectionTitle>
            <div className="flex gap-1.5">
              {(
                [
                  ['pending', `대기 ${pending.length}`],
                  ['all', `전체 ${allRequests.length}`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                    filter === key ? 'bg-brand-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">학생</th>
                  <th className="px-3 py-2.5 font-semibold">상품</th>
                  <th className="px-3 py-2.5 font-semibold">금액</th>
                  <th className="px-3 py-2.5 font-semibold">신청</th>
                  <th className="px-3 py-2.5 font-semibold">상태</th>
                  <th className="px-3 py-2.5 text-right font-semibold">처리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => {
                  const st = store.getStudent(r.student_id);
                  const meta = STATUS_META[r.status];
                  return (
                    <tr key={r.id} data-testid={`admin-redeem-row-${r.id}`}>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{st?.name ?? '학생'}</p>
                        <p className="text-[11px] text-slate-400">{st?.class_name ?? '—'}</p>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{r.item_name}</td>
                      <td className="px-3 py-3 font-semibold text-slate-800">{r.price.toLocaleString()}원</td>
                      <td className="px-3 py-3 text-[12px] text-slate-500">{formatKoTimestamp(r.requested_at)}</td>
                      <td className="px-3 py-3">
                        <span className={cn('rounded-full px-2 py-1 text-[11px] font-bold', meta.cls)}>{meta.text}</span>
                        {r.handled_at ? (
                          <p className="mt-0.5 text-[10px] text-slate-400">{formatKoTimestamp(r.handled_at)}</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            data-testid={`admin-redeem-send-${r.id}`}
                            disabled={r.status !== 'pending'}
                            onClick={() => {
                              store.markRedemptionSent(r.id);
                              toast(`${st?.name ?? '학생'} · ${r.item_name} 발송 완료로 표시했어요`);
                            }}
                            className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-30"
                          >
                            발송 완료
                          </button>
                          <button
                            data-testid={`admin-redeem-cancel-${r.id}`}
                            disabled={r.status !== 'pending'}
                            onClick={() => {
                              store.cancelRedemption(r.id);
                              toast(`${r.price.toLocaleString()}원을 ${st?.name ?? '학생'}에게 돌려줬어요`);
                            }}
                            className="rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-30"
                          >
                            취소(환불)
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                      {filter === 'pending' ? '교환 대기 중인 신청이 없어요.' : '아직 교환 신청이 없어요.'}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-2">
          <SectionTitle sub="학생 상점에 보이는 순서·가격입니다">상점 상품 관리</SectionTitle>
          <Button size="sm" variant="soft" onClick={openAdd}>
            + 상품 추가
          </Button>
        </div>
        <div className="overflow-x-auto thin-scroll">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-2.5 font-semibold">상품</th>
                <th className="px-3 py-2.5 font-semibold">가격</th>
                <th className="px-3 py-2.5 font-semibold">노출</th>
                <th className="px-3 py-2.5 text-right font-semibold">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} data-testid={`admin-item-row-${item.id}`} className={cn(!item.active && 'opacity-50')}>
                  <td className="px-4 py-3">
                    <p className="flex items-center gap-2 font-bold text-slate-800">
                      <span className="text-lg">{item.emoji}</span>
                      {item.name}
                    </p>
                  </td>
                  <td className="px-3 py-3 font-semibold text-slate-700">{item.price.toLocaleString()}원</td>
                  <td className="px-3 py-3">
                    <button
                      data-testid={`admin-item-toggle-${item.id}`}
                      onClick={() => store.updateShopItem(item.id, { active: !item.active })}
                      className={cn(
                        'rounded-lg px-2 py-1 text-[11px] font-semibold',
                        item.active ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      )}
                    >
                      {item.active ? '판매 중' : '숨김'}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        data-testid={`admin-item-edit-${item.id}`}
                        onClick={() => openEdit(item)}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        수정
                      </button>
                      <button
                        data-testid={`admin-item-delete-${item.id}`}
                        onClick={() => {
                          store.deleteShopItem(item.id);
                          toast(`${item.name} 상품을 삭제했어요`);
                        }}
                        className="rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-100"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                    상품이 없어요. ’상품 추가’로 첫 상품을 만들어 주세요.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p className="p-4 pt-2 text-[11px] leading-relaxed text-slate-400">
          상품을 삭제해도 지난 신청 내역은 신청 당시 이름·금액으로 남아요. 판매를 잠시 멈추려면 ’판매 중’을 눌러 숨김으로 바꾸세요.
        </p>
      </Card>

      <Modal
        open={!!itemModal}
        onClose={() => setItemModal(null)}
        title={itemModal?.mode === 'edit' ? '상품 수정' : '상품 추가'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setItemModal(null)}>
              취소
            </Button>
            <Button data-testid="admin-item-save" onClick={saveItem}>
              저장
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <label>
            <span className="text-xs font-semibold text-slate-500">상품명</span>
            <input
              data-testid="admin-item-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="예) 츄파춥스"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-400"
            />
          </label>
          <div className="grid grid-cols-[1fr_100px] gap-3">
            <label>
              <span className="text-xs font-semibold text-slate-500">가격 (원)</span>
              <input
                data-testid="admin-item-price"
                type="number"
                min={1}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="300"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-400"
              />
            </label>
            <label>
              <span className="text-xs font-semibold text-slate-500">아이콘</span>
              <input
                data-testid="admin-item-emoji"
                value={form.emoji}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                maxLength={4}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-center text-lg outline-none focus:border-brand-400"
              />
            </label>
          </div>
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
            학생은 하루 50원씩 모아서 교환해요. 츄파춥스(300원)는 약 6일, 3,000원 금액권은 약 60일치입니다.
          </p>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------ 금요일 리포트 ------------------------------ */

function ReportTab() {
  const store = useVocaStore();
  const toast = useToast();
  const [className, setClassName] = useState('전체');
  const [preview, setPreview] = useState<Student | null>(null);
  const students = store.listStudents();
  const classes = ['전체', ...new Set(students.map((s) => s.class_name))];
  const target = students.filter((s) => className === '전체' || s.class_name === className);
  const entries = target.map((student) => ({ student, stats: computeWeekStats(student) }));

  const copyOne = async (student: Student) => {
    const stats = computeWeekStats(student);
    const message = buildParentMessage(student, stats);
    const ok = await copyText(message);
    store.saveReport({
      student_id: student.id,
      week_start: weekStartStr(),
      words_done: stats.wordsDone,
      accuracy: stats.accuracy,
      streak_days: stats.streakDays,
      message,
      opened_at: null,
    });
    toast(ok ? '복사됐어요. 카카오톡에 붙여넣으세요' : '복사에 실패했어요', ok ? 'ok' : 'err');
  };

  const copyAll = async () => {
    const message = buildClassMessage(entries);
    const ok = await copyText(message);
    entries.forEach(({ student, stats }) =>
      store.saveReport({
        student_id: student.id,
        week_start: weekStartStr(),
        words_done: stats.wordsDone,
        accuracy: stats.accuracy,
        streak_days: stats.streakDays,
        message: buildParentMessage(student, stats),
        opened_at: null,
      })
    );
    toast(ok ? `${entries.length}명 요약을 복사했어요. 카톡에 붙여넣으세요` : '복사에 실패했어요', ok ? 'ok' : 'err');
  };

  const previewStats = preview ? computeWeekStats(preview) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">금요일 학부모 요약</h1>
          <p className="mt-0.5 text-sm text-slate-500">복사해서 카카오톡에 붙여넣기만 하면 돼요. 자동 발송은 하지 않습니다.</p>
        </div>
        <Button data-testid="copy-all" size="sm" onClick={copyAll} disabled={!entries.length}>
          {className === '전체' ? '전체 복사' : `${className} 전체 복사`}
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {classes.map((c) => (
          <button
            key={c}
            onClick={() => setClassName(c)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-semibold transition',
              className === c ? 'bg-brand-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {entries.map(({ student, stats }) => (
          <Card key={student.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  {student.name}
                  <LevelPill level={student.level} />
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {student.class_name} · {stats.wordsDone}단어 · 정답률 {stats.accuracy}% · {stats.streakDays}일 연속
                </p>
              </div>
              <span className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-400">{student.nickname}</span>
            </div>
            <pre className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-3 font-sans text-[11.5px] leading-relaxed text-slate-600">
              {buildParentMessage(student, stats)}
            </pre>
            <div className="flex gap-2">
              <Button data-testid="copy-one" size="sm" className="flex-1" onClick={() => copyOne(student)}>
                복사
              </Button>
              <Button data-testid="preview-report" size="sm" variant="ghost" className="flex-1" onClick={() => setPreview(student)}>
                리포트 미리보기
              </Button>
            </div>
          </Card>
        ))}
        {entries.length === 0 ? (
          <Card>
            <p className="py-8 text-center text-sm text-slate-400">이 반에는 학생이 없습니다.</p>
          </Card>
        ) : null}
      </div>

      <Card>
        <SectionTitle sub="복사 후 안내">이렇게 보내 주세요</SectionTitle>
        <ol className="mt-3 space-y-1.5 text-xs leading-relaxed text-slate-500">
          <li>1. 학생별 「복사」 → 카카오톡 학부모 채팅방에 붙여넣기 (학생 1명당 3초)</li>
          <li>2. 반 전체는 3~4장 분량이라 반을 나눠 복사하는 걸 권장해요</li>
          <li>3. 문구는 쉼표·슬래시·줄바꿈만 사용해 카톡에서 걸러지지 않게 했어요</li>
          <li>4. 링크를 누르면 학부모는 우리 아이 리포트만 볼 수 있어요 (로그인 없음)</li>
        </ol>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => { download(`rafine_weekly_${weekStartStr()}.csv`, store.backupStudentsCsv()); toast('학생 명단 백업을 내려받았어요'); }}>
            학생 명단 백업
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (entries[0]) {
                const url = reportUrl(entries[0].student);
                copyText(url).then((ok) => toast(ok ? '리포트 링크를 복사했어요' : '복사 실패', ok ? 'ok' : 'err'));
              }
            }}
          >
            첫 학생 리포트 링크 복사
          </Button>
        </div>
      </Card>

      <p className="text-[11px] leading-relaxed text-slate-400">
        정답률은 첫 응답 기준입니다. 재시도를 포함하면 숫자가 의미를 잃기 때문이에요. 이번 주 누적 {pct(
          entries.reduce((sum, e) => sum + e.stats.correct, 0),
          Math.max(1, entries.reduce((sum, e) => sum + e.stats.answered, 0))
        )}% (문항 기준).
      </p>

      <Modal open={!!preview} onClose={() => setPreview(null)} title="학부모 리포트 미리보기" wide>
        {preview && previewStats ? <ParentReportCard student={preview} stats={previewStats} /> : null}
      </Modal>
    </div>
  );
}
