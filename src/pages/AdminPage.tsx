import { useEffect, useMemo, useState } from 'react';
import { useSession, useVocaStore } from '../app-context';
import { Badge, Button, Card, LevelPill, Modal, SectionTitle, useToast } from '../components/ui';
import { parseWordCsv } from '../lib/csv';
import { copyText } from '../lib/report';
import MaterialsPanel from './admin/MaterialsPanel';
import TeacherGuidesPanel from './admin/TeacherGuidesPanel';
import AdminNav from '../components/AdminNav';
import { LEVEL_META, CODING_LEVELS, CODING_LEVEL_META, type CodingLevel, type Level, type RedemptionRequest, type ShopItem, type Student, type Subject } from '../types';
import { cn, formatKoTimestamp, todayStr } from '../lib/util';

type Tab = 'students' | 'words' | 'shop' | 'materials' | 'guides';

/**
 * 관리 도구는 학생 계정·PIN · 단어장 · 상점 상품 + **수업자료 / 수업안** 다섯 탭입니다.
 *  · 📂 수업자료 = 수업 중에 아이들과 같이 띄워 보는 학생용 자료 (등록·수정·배정·미리보기)
 *  · 📖 수업안   = 선생님만 보는 강의 가이드 (진행표·비유·판서·코치 멘트·정답 코드)
 */
const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'students', label: '학생 · PIN', icon: '🧑‍🎓' },
  { key: 'words', label: '단어장', icon: '📚' },
  { key: 'shop', label: '상점 상품', icon: '🎁' },
  { key: 'materials', label: '수업자료', icon: '📂' },
  { key: 'guides', label: '수업안', icon: '📖' },
];

/** 수강 과목 선택 3가지 (원장님 화면) — 코딩이 기본, TOSEL 영어는 따로 켭니다 */
const SUBJECT_CHOICES: { key: 'english' | 'coding' | 'both'; label: string; value: Subject[] }[] = [
  { key: 'coding', label: '코딩만', value: ['coding'] },
  { key: 'both', label: '코딩 + TOSEL', value: ['coding', 'english'] },
  { key: 'english', label: 'TOSEL만', value: ['english'] },
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

/** ?debug=1 일 때만 보이는 연결 진단 (토큰·개인정보 없음) */
function DebugPanel() {
  const store = useVocaStore();
  const [info, setInfo] = useState<string>('');
  useEffect(() => {
    void store.debugSnapshot().then((snap) => setInfo(JSON.stringify(snap, null, 1)));
  }, [store]);
  if (!new URLSearchParams(window.location.search).get('debug')) return null;
  return (
    <pre className="mx-4 mt-3 overflow-x-auto rounded-2xl bg-slate-900 p-3 text-[10.5px] leading-relaxed text-emerald-200">
      {info}
    </pre>
  );
}

export default function AdminPage() {
  const store = useVocaStore();
  const { logout } = useSession();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('students');

  const students = store.listStudents(true);
  const active = students.filter((s) => s.active);

  return (
    <div className="min-h-screen pb-safe">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3 md:max-w-6xl md:px-6 lg:max-w-7xl 2xl:max-w-[1500px]">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-brand-600 text-base text-white shadow-soft">📚</span>
            <div>
              <p className="text-[11px] font-semibold text-slate-400">라피네코딩 두정점 · 관리자</p>
              <p className="text-sm font-bold leading-tight text-slate-900">라피네 클래스 · 관리 도구</p>
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
        <div className="mx-auto w-full max-w-3xl px-4 pb-2 md:max-w-6xl md:px-6 lg:max-w-7xl 2xl:max-w-[1500px]">
          <AdminNav active="tools" />
        </div>
        <div className="mx-auto hidden w-full max-w-3xl gap-1 px-4 pb-2 md:flex md:max-w-6xl md:px-6 lg:max-w-7xl 2xl:max-w-[1500px]">
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

      <DebugPanel />
      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4 md:max-w-6xl md:px-6 md:pb-10 lg:max-w-7xl 2xl:max-w-[1500px]">
        {tab === 'students' ? <StudentsTab /> : null}
        {tab === 'words' ? <WordsTab /> : null}
        {tab === 'shop' ? <ShopAdminTab /> : null}
        {tab === 'materials' ? <MaterialsPanel onGoGuides={() => setTab('guides')} /> : null}
        {tab === 'guides' ? <TeacherGuidesPanel /> : null}
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

/* ---------------------------------- 학생 ---------------------------------- */

function StudentsTab() {
  const store = useVocaStore();
  const toast = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', grade: 3, class_name: '초등A', nickname: '', tosel: false });
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
        // 코딩 학원 기본값은 ‘코딩만’ — TOSEL 영어는 이 스위치로 함께 켭니다
        enabled_subjects: form.tosel ? ['coding', 'english'] : ['coding'],
      });
      setIssued(res);
      setAddOpen(false);
      setForm({ name: '', grade: 3, class_name: '초등A', nickname: '', tosel: false });
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
          <h1 className="text-xl font-extrabold text-slate-900">학생 계정 · PIN</h1>
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
                <th className="px-3 py-3 font-semibold">TOSEL 영어</th>
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
                    {/* 영어 레벨 배정 (예전 ‘레벨 배정’ 탭 기능을 여기로 합쳤습니다) */}
                    <select
                      data-testid={`admin-student-level-${st.id}`}
                      value={st.level}
                      onChange={(e) => {
                        store.setStudentLevel(st.id, Number(e.target.value) as Level);
                        toast(`${st.name} 학생 영어 레벨 · L${e.target.value}`);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 outline-none focus:border-brand-400"
                    >
                      {([1, 2, 3, 4, 5] as Level[]).map((lv) => (
                        <option key={lv} value={lv}>
                          L{lv} · {LEVEL_META[lv].tosel}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    {/* TOSEL 영어 학습 사용 — 켜면 학생 화면 위에 📚 영어 / 💻 코딩 토글이 생깁니다 */}
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
          <button
            type="button"
            data-testid="admin-add-tosel"
            onClick={() => setForm({ ...form, tosel: !form.tosel })}
            className={cn(
              'sm:col-span-2 flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition',
              form.tosel ? 'border-brand-200 bg-brand-50' : 'border-slate-200 bg-white'
            )}
          >
            <span>
              <span className="block text-[12.5px] font-bold text-slate-700">📚 TOSEL 영어 학습도 함께 쓰기</span>
              <span className="mt-0.5 block text-[11px] text-slate-500">
                켜면 학생 화면 위에 영어 전환이 생겨요. 기본은 코딩만입니다.
              </span>
            </span>
            <span
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition',
                form.tosel ? 'bg-brand-600' : 'bg-slate-200'
              )}
              aria-hidden
            >
              <span
                className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
                  form.tosel ? 'left-[22px]' : 'left-0.5'
                )}
              />
            </span>
          </button>
        </div>
        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
          추가하면 4자리 PIN이 자동 발급되고 코딩 C1 · 영어 Level 1로 시작해요. 영어 레벨·코딩 레벨은 아래 표에서 바로 바꿀 수 있습니다.
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
