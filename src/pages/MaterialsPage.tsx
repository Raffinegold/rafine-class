import { useEffect, useMemo, useState } from 'react';
import { useSession, useVocaStore } from '../app-context';
import StudentHeader from '../components/StudentHeader';
import StudentNav from '../components/StudentNav';
import { Badge, Card, SectionTitle } from '../components/ui';
import MaterialContentView from '../components/MaterialContentView';
import { useClassStore } from '../lib/classStore';
import { asTrack, CURRICULUM, TRACK_META, type Track } from '../lib/curriculum';
import { materialStore, useMaterialStore } from '../lib/materialStore';
import { cn, PAGE_W_WIDE } from '../lib/util';

/**
 * 📂 학생 수업자료실 (2026-11-20)
 * - 원장님이 배정한 과정·주차·회차 숫자가 맨 위에 보입니다.
 * - 그 숫자를 누르면 1회차(이론+만들기) / 2회차(마무리·수정·업그레이드) 자료가 나옵니다.
 * - 선생님용 수업안과 정답 코드는 서버에서도, 화면에서도 절대 내려오지 않습니다.
 * - 본문 렌더링은 MaterialContentView 가 담당합니다(원장 '수업 중 보기'와 같은 컴포넌트).
 */

const KIND_META: Record<string, { label: string; icon: string; tone: string }> = {
  theory: { label: '이론 · 따라 만들기', icon: '📘', tone: 'bg-emerald-50 text-emerald-700' },
  code: { label: '예제 코드', icon: '💻', tone: 'bg-sky-50 text-sky-700' },
  upgrade: { label: '업그레이드 미션', icon: '🚀', tone: 'bg-amber-50 text-amber-700' },
  image: { label: '그림 자료', icon: '🖼️', tone: 'bg-violet-50 text-violet-700' },
  link: { label: '참고 링크', icon: '🔗', tone: 'bg-slate-100 text-slate-600' },
};

export default function MaterialsPage() {
  const store = useVocaStore();
  const ms = useMaterialStore();
  const cls = useClassStore();
  const { student, logout } = useSession();

  const [week, setWeek] = useState<number | null>(null);
  const [session, setSession] = useState<1 | 2>(1);

  const token = store.studentToken ?? null;
  const studentId = student?.id ?? '';

  useEffect(() => {
    if (ms.mode === 'cloud' && token) {
      void ms.loadStudentCloud(token);
    } else if (ms.mode === 'local') {
      ms.reloadLocal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms.mode, token]);

  const fallback = useMemo(() => {
    if (!student) return { track: 'python' as Track, week: 1, session: 1 as 1 | 2 };
    const profile = cls.profile(student.id, student.coding_level);
    const next = Math.min(cls.nextWeek(student.id), 24);
    return { track: profile.track, week: next, session: 1 as 1 | 2 };
  }, [student, cls, ms.version]);

  const assignTrack: Track = asTrack(ms.assignment?.track ?? materialStore.localAssignment(studentId)?.track ?? fallback.track);
  const assignWeek = Number(ms.assignment?.week ?? materialStore.localAssignment(studentId)?.week ?? fallback.week);
  const activeWeek = week ?? assignWeek;

  useEffect(() => {
    setSession((Number(ms.assignment?.session ?? 1) === 2 ? 2 : 1) as 1 | 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms.assignment?.session]);

  if (!student) return null;

  const all = ms.mode === 'cloud' ? ms.materials : ms.materials.length ? ms.materials : materialStore.localAll();
  const extras = materialStore.localExtras(student.id);
  const list = all
    .filter((m) => m.published !== false)
    .filter((m) => (m.track ? m.track === assignTrack : true) || extras.includes(m.id))
    .filter((m) => (m.week ? m.week === activeWeek : true) || extras.includes(m.id))
    .filter((m) => (m.session ? m.session === session : true))
    .sort((a, b) => a.sort_no - b.sort_no);

  const plan = CURRICULUM[assignTrack].find((w) => w.week === activeWeek);
  const meta = TRACK_META[assignTrack];

  return (
    <div className="min-h-screen bg-slate-50/60 pb-28">
      <StudentHeader
        icon="📂"
        brand="라피네 클래스"
        title="수업자료실"
        hideSubjectSwitch
        wide
        right={
          <button
            onClick={logout}
            className="whitespace-nowrap rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
          >
            나가기
          </button>
        }
      />

      <main className={cn(PAGE_W_WIDE, 'pt-4')}>
        {/* --------------------------- 배정 숫자 카드 --------------------------- */}
        <Card className="overflow-hidden p-0 md:grid md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <div className="bg-gradient-to-br from-brand-600 to-indigo-700 px-4 py-4 text-white md:px-5">
            <p className="text-[11px] font-bold text-white/70">선생님이 배정한 과정</p>
            <p className="mt-0.5 text-[20px] font-extrabold leading-tight">
              {meta.emoji} {meta.label}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span data-testid="assigned-week" className="rounded-xl bg-white/15 px-3 py-1.5 text-[13px] font-extrabold">
                {activeWeek}주차
              </span>
              <button
                data-testid="session-1"
                onClick={() => setSession(1)}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-[13px] font-extrabold transition',
                  session === 1 ? 'bg-white text-brand-700' : 'bg-white/15 text-white/80'
                )}
              >
                1회차 · 이론+만들기
              </button>
              <button
                data-testid="session-2"
                onClick={() => setSession(2)}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-[13px] font-extrabold transition',
                  session === 2 ? 'bg-white text-brand-700' : 'bg-white/15 text-white/80'
                )}
              >
                2회차 · 마무리+업그레이드
              </button>
            </div>
            {plan ? <p className="mt-2 text-[12px] leading-relaxed text-white/80">{plan.title} — {session === 1 ? plan.goal : plan.plan2}</p> : null}
          </div>

          {/* 지난 주차 다시 보기 */}
          <div className="flex gap-1 overflow-x-auto px-3 py-2.5 md:flex-wrap md:place-content-center md:content-center md:gap-1.5 md:px-4 md:overflow-visible">
            {Array.from({ length: Math.max(activeWeek, 4) }, (_, i) => i + 1).map((w) => (
              <button
                key={w}
                onClick={() => setWeek(w)}
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-bold',
                  w === activeWeek ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'
                )}
              >
                {w}주
                {w === assignWeek ? ' ·지금' : ''}
              </button>
            ))}
          </div>
        </Card>

        <div className="mt-4">
          <SectionTitle sub={session === 1 ? '개념 하나 듣고 오늘 바로 만듭니다' : '못 만든 것 마무리 → 고치기 → 한 단계 업그레이드'}>
            {session === 1 ? '1회차 수업자료' : '2회차 수업자료'} · {list.length}개
          </SectionTitle>
        </div>

        {ms.loading ? <p className="py-8 text-center text-[13px] font-bold text-slate-400">자료를 불러오는 중…</p> : null}

        {!ms.loading && list.length === 0 ? (
          <Card className="mt-2 p-6 text-center">
            <p className="text-3xl">📭</p>
            <p className="mt-2 text-[13.5px] font-bold text-slate-700">이 주차 자료는 아직 없어요</p>
            <p className="mt-1 text-[12px] text-slate-500">선생님이 자료를 올리면 바로 여기에 나타납니다.</p>
          </Card>
        ) : null}

        <div className="mt-2 grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start">
          {list.map((m) => {
            const kind = KIND_META[m.kind] ?? KIND_META.theory;
            return (
              <Card key={m.id} className="p-4" data-testid="material-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-extrabold', kind.tone)}>
                      {kind.icon} {kind.label}
                    </span>
                    <p className="mt-1.5 text-[15px] font-extrabold leading-snug text-slate-900">{m.title}</p>
                    {m.summary ? <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{m.summary}</p> : null}
                  </div>
                  {m.done_at ? <Badge tone="mint">완료</Badge> : null}
                </div>
                <div className="mt-3">
                  <MaterialContentView material={m} token={token} studentId={student.id} />
                </div>
              </Card>
            );
          })}
        </div>

        {ms.mode === 'cloud' && !token ? (
          <p className="mt-4 rounded-2xl bg-amber-50 px-3 py-2 text-[12px] font-bold text-amber-800">
            로그인 정보를 다시 확인해 주세요. 자료를 불러오려면 학생 로그인이 필요합니다.
          </p>
        ) : null}
      </main>

      <StudentNav active="materials" />
    </div>
  );
}
