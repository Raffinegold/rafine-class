import { useEffect, useMemo, useState } from 'react';
import { useSession, useVocaStore } from '../app-context';
import StudentHeader from '../components/StudentHeader';
import StudentNav from '../components/StudentNav';
import { Badge, Card, SectionTitle } from '../components/ui';
import { useClassStore } from '../lib/classStore';
import { asTrack, CURRICULUM, TRACK_META, type Track } from '../lib/curriculum';
import { materialStore, useMaterialStore } from '../lib/materialStore';
import type { Material, MaterialStudentContent } from '../types';
import { cn } from '../lib/util';

/**
 * 📂 학생 참고 자료실
 * - 원장님이 배정한 과정·주차·회차 숫자가 맨 위에 보입니다.
 * - 그 숫자를 누르면 1회차(이론+만들기) / 2회차(마무리·수정·업그레이드) 자료가 나옵니다.
 * - 선생님용 수업안과 정답 코드는 서버에서도, 화면에서도 절대 내려오지 않습니다.
 */

const KIND_META: Record<string, { label: string; icon: string; tone: string }> = {
  theory: { label: '이론 · 따라 만들기', icon: '📘', tone: 'bg-emerald-50 text-emerald-700' },
  code: { label: '예제 코드', icon: '💻', tone: 'bg-sky-50 text-sky-700' },
  upgrade: { label: '업그레이드 미션', icon: '🚀', tone: 'bg-amber-50 text-amber-700' },
  image: { label: '그림 자료', icon: '🖼️', tone: 'bg-violet-50 text-violet-700' },
  link: { label: '참고 링크', icon: '🔗', tone: 'bg-slate-100 text-slate-600' },
};

function CodeBlock({ code, lang }: { code: string; lang?: string | null }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative mt-2 overflow-hidden rounded-2xl bg-slate-900">
      <div className="flex items-center justify-between px-3 pt-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{lang || 'python'}</span>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            } catch {
              setCopied(false);
            }
          }}
          className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-slate-200 active:scale-95"
        >
          {copied ? '복사됨 ✓' : '복사'}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 pb-3 pt-1 text-[12.5px] leading-relaxed text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function HintSteps({ hints }: { hints: string[] }) {
  const [open, setOpen] = useState(0);
  if (!hints.length) return null;
  return (
    <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-3">
      <p className="text-[12px] font-extrabold text-amber-800">💡 힌트는 한 단계씩</p>
      <div className="mt-2 space-y-1.5">
        {hints.map((h, i) => {
          const shown = i < open;
          return (
            <div key={i} className="rounded-xl bg-white/80 px-3 py-2">
              {shown ? (
                <p className="text-[12.5px] leading-relaxed text-slate-700">
                  <b className="text-amber-700">{i + 1}단계.</b> {h}
                </p>
              ) : (
                <button
                  onClick={() => setOpen(i + 1)}
                  className="text-[12.5px] font-bold text-amber-700"
                  disabled={i > open}
                >
                  {i === open ? `힌트 ${i + 1} 보기` : `힌트 ${i + 1} (먼저 위를 열어 보세요)`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StudentContent({ material, token, studentId }: { material: Material; token: string | null; studentId: string }) {
  const c: MaterialStudentContent = material.student_content ?? {};
  const [showAnswer, setShowAnswer] = useState(false);
  const done = Boolean(material.done_at);

  return (
    <div className="space-y-3">
      {c.goal ? (
        <div className="rounded-2xl bg-brand-50 px-3.5 py-3">
          <p className="text-[11px] font-extrabold text-brand-700">오늘의 목표</p>
          <p className="mt-0.5 text-[13.5px] font-bold leading-relaxed text-brand-900">{c.goal}</p>
        </div>
      ) : null}

      {c.words?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {c.words.map((w) => (
            <span key={w} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-bold text-slate-600">
              {w}
            </span>
          ))}
        </div>
      ) : null}

      {c.preview ? (
        <div>
          <p className="text-[11.5px] font-extrabold text-slate-500">완성 화면 미리 보기</p>
          <CodeBlock code={c.preview} lang="출력 결과" />
        </div>
      ) : null}

      {c.conceptTitle || c.concept?.length ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          {c.conceptTitle ? <p className="text-[13px] font-extrabold text-slate-800">{c.conceptTitle}</p> : null}
          <div className="mt-2 divide-y divide-slate-100">
            {(c.concept ?? []).map((row, i) => (
              <div key={i} className="grid grid-cols-[1.1fr_1fr] gap-2 py-1.5">
                <code className="break-all text-[12px] font-bold text-brand-700">{row.code}</code>
                <span className="text-[12px] leading-relaxed text-slate-600">{row.mean}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {c.predict ? (
        <div>
          <p className="text-[11.5px] font-extrabold text-slate-500">실행 전에 결과를 먼저 적어 보세요</p>
          <CodeBlock code={c.predict.code} lang="예측해 보기" />
          <button
            onClick={() => setShowAnswer((v) => !v)}
            className="mt-2 rounded-full border border-slate-200 px-3 py-1.5 text-[11.5px] font-bold text-slate-500"
          >
            {showAnswer ? '정답 접기' : '내 예상과 비교하기'}
          </button>
          {showAnswer ? <p className="mt-2 text-[12.5px] font-bold text-emerald-700">→ {c.predict.answer}</p> : null}
        </div>
      ) : null}

      {c.steps?.length ? (
        <div className="space-y-2">
          {c.steps.map((s, i) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-white p-3">
              <p className="text-[12.5px] font-extrabold text-slate-800">
                {s.title || `${i + 1}단계`}
              </p>
              {s.note ? <p className="mt-1 text-[12.5px] leading-relaxed text-slate-600">{s.note}</p> : null}
              {s.code ? <CodeBlock code={s.code} lang={material.code_lang} /> : null}
            </div>
          ))}
        </div>
      ) : null}

      {c.mistakes?.length ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-3">
          <p className="text-[12px] font-extrabold text-rose-700">자주 나는 실수 3개</p>
          <div className="mt-2 space-y-1.5">
            {c.mistakes.map((m, i) => (
              <div key={i} className="rounded-xl bg-white/80 px-3 py-2">
                <p className="text-[12px] font-bold text-slate-800">{m.symptom}</p>
                <p className="text-[11.5px] text-slate-500">→ {m.cause}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {c.hints?.length ? <HintSteps hints={c.hints} /> : null}

      {c.missions ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          <p className="text-[12.5px] font-extrabold text-slate-800">업그레이드 미션 — 1개 이상 고르기</p>
          <div className="mt-2 space-y-1.5">
            {[
              ['기본', c.missions.basic, 'bg-slate-50 text-slate-700'],
              ['도전', c.missions.challenge, 'bg-sky-50 text-sky-800'],
              ['심화', c.missions.deep, 'bg-violet-50 text-violet-800'],
            ].map(([label, text, tone]) => (
              <div key={label} className={cn('rounded-xl px-3 py-2', tone)}>
                <p className="text-[11px] font-extrabold">{label}</p>
                <p className="text-[12.5px] leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {c.selfcheck?.length ? (
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-[12px] font-extrabold text-slate-600">셀프 체크</p>
          <ul className="mt-1.5 space-y-1">
            {c.selfcheck.map((s) => (
              <li key={s} className="flex gap-1.5 text-[12.5px] text-slate-600">
                <span className="text-emerald-500">✔</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {c.note ? (
        <p className="rounded-2xl bg-amber-50 px-3.5 py-2.5 text-[12px] font-bold leading-relaxed text-amber-800">⚠️ {c.note}</p>
      ) : null}

      {material.ai_tip ? (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3">
          <p className="text-[11px] font-extrabold text-indigo-700">🤖 AI 틈틈이</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-indigo-900">{material.ai_tip}</p>
        </div>
      ) : null}

      {material.link_url ? (
        <a
          href={material.link_url}
          target="_blank"
          rel="noreferrer"
          className="block rounded-2xl border border-slate-200 bg-white p-3 text-[12.5px] font-bold text-brand-700"
        >
          🔗 {material.link_url}
        </a>
      ) : null}

      <button
        onClick={() => materialStore.mark(material.id, !done, token, studentId)}
        className={cn(
          'mt-1 w-full rounded-2xl px-4 py-3 text-[13px] font-extrabold transition active:scale-[0.99]',
          done ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'
        )}
      >
        {done ? '✓ 다 봤어요 · 선생님께 표시됨' : '다 봤어요 (완료 표시)'}
      </button>
    </div>
  );
}

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
        title="참고 자료실"
        hideSubjectSwitch
        right={
          <button
            onClick={logout}
            className="whitespace-nowrap rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
          >
            나가기
          </button>
        }
      />

      <main className="mx-auto max-w-3xl px-4 pt-4">
        {/* --------------------------- 배정 숫자 카드 --------------------------- */}
        <Card className="overflow-hidden p-0">
          <div className="bg-gradient-to-br from-brand-600 to-indigo-700 px-4 py-4 text-white">
            <p className="text-[11px] font-bold text-white/70">선생님이 배정한 과정</p>
            <p className="mt-0.5 text-[20px] font-extrabold leading-tight">
              {meta.emoji} {meta.label}
            </p>
            <div className="mt-2.5 flex items-center gap-1.5">
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
          <div className="flex gap-1 overflow-x-auto px-3 py-2.5">
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
          <SectionTitle sub={session === 1 ? '이론 하나 듣고 오늘 바로 만듭니다' : '못 만든 것 마무리 → 고치기 → 한 단계 업그레이드'}>
            {session === 1 ? '1회차 자료' : '2회차 자료'} · {list.length}개
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

        <div className="mt-2 space-y-3">
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
                  <StudentContent material={m} token={token} studentId={student.id} />
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
