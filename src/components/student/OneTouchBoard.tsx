import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Material, Student } from '../../types';
import { CURRICULUM, TRACK_META } from '../../lib/curriculum';
import { completeLesson, loadToday, type TodayBundle, type TodayMission } from '../../lib/onetouch';
import { temperamentMeta, type TemperamentMeta } from '../../lib/temperament';
import { cn, todayStr } from '../../lib/util';
import { useToast } from '../ui';

const KIND_META: Record<TodayMission['kind'], { label: string; icon: string; chip: string }> = {
  homework: { label: '오늘의 숙제', icon: '✏️', chip: 'bg-amber-100 text-amber-700' },
  problem: { label: '기질 맞춤 문제', icon: '🧠', chip: 'bg-brand-100 text-brand-700' },
  tip: { label: '추가 이론 팁', icon: '💡', chip: 'bg-emerald-100 text-emerald-700' },
};

/**
 * 학생 로그인 직후 첫 화면의 '오늘의 원터치'
 *  ① 오늘 기본 이론(전원 공통) → ② 내 기질 맞춤 숙제·문제·팁 → ③ 오늘 수업 완료 체크
 */
export default function OneTouchBoard({
  student,
  token,
  materials,
  fallback,
}: {
  student: Student;
  token: string | null;
  materials: Material[];
  fallback: { track: string; week: number; session: 1 | 2 };
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const [bundle, setBundle] = useState<TodayBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;
    if (!token) return () => undefined;
    loadToday(token)
      .then((data) => {
        if (alive) {
          setBundle(data);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, [token, refreshKey]);

  const dateStr = bundle?.server_date ?? todayStr();
  const readKey = `rafine-onetouch-read-v1:${student.id}:${dateStr}`;
  const [read, setRead] = useState<{ theory: boolean; mission: boolean }>(() => {
    try {
      const raw = localStorage.getItem(readKey);
      return raw ? { theory: false, mission: false, ...(JSON.parse(raw) as object) } : { theory: false, mission: false };
    } catch {
      return { theory: false, mission: false };
    }
  });

  const markRead = (key: 'theory' | 'mission') => {
    const next = { ...read, [key]: !read[key] };
    setRead(next);
    try {
      localStorage.setItem(readKey, JSON.stringify(next));
    } catch {
      /* 저장 실패해도 화면은 계속 */
    }
  };

  const week = bundle?.assignment.week ?? fallback.week;
  const session = bundle?.assignment.session ?? fallback.session;
  const track = bundle?.assignment.track ?? fallback.track;
  const trackMeta = TRACK_META[track as keyof typeof TRACK_META] ?? TRACK_META.python;
  const weekPlan = CURRICULUM[track as keyof typeof CURRICULUM]?.find((w) => w.week === week);

  const theory = useMemo(
    () =>
      materials.find(
        (m) => m.kind === 'theory' && m.week === week && m.session === session && (!m.track || m.track === track)
      ) ?? materials.find((m) => m.kind === 'theory' && m.week === week && (!m.track || m.track === track)),
    [materials, week, session, track]
  );
  const words = (theory?.student_content?.words ?? []).slice(0, 4);

  const temper: TemperamentMeta | null = temperamentMeta(bundle?.student.temperament_type ?? null);
  const missions = bundle?.missions ?? [];
  const byKind = (kind: TodayMission['kind']) => missions.find((m) => m.kind === kind);
  const done = !!bundle?.completion.done;
  const doneAt = bundle?.completion.done_at
    ? new Date(bundle.completion.done_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : null;
  const progress = bundle?.progress ?? [];

  const stepsDone = [read.theory, read.mission, done].filter(Boolean).length;

  const toggleDone = async () => {
    if (!token || busy) return;
    setBusy(true);
    const next = !done;
    try {
      const res = await completeLesson(token, next);
      setBundle((prev) =>
        prev ? { ...prev, completion: { done: res.done, done_at: res.done_at } } : prev
      );
      toast(next ? '오늘 수업 완료! 선생님 화면에 바로 보여요 🎉' : '완료 체크를 풀었어요');
    } catch (err) {
      toast(err instanceof Error ? err.message : '완료 체크를 저장하지 못했어요', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className="overflow-hidden rounded-3xl border border-white bg-white shadow-soft"
      data-testid="onetouch"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-gradient-to-r from-brand-50/80 via-white to-white px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-brand-600 text-base text-white">⚡</span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[15px] font-extrabold leading-tight text-slate-900">
              오늘의 원터치
              <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {week}주차 · {session}회차
              </span>
            </p>
            <p className="mt-0.5 truncate text-[11.5px] font-semibold text-slate-500">
              이번 주 배정 · {trackMeta.emoji} {trackMeta.label} · {weekPlan?.title ?? '오늘 수업'} · {dateStr.replace(/-/g, '.')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {temper ? (
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold', temper.chip)}>
              {temper.emoji} {temper.name}
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">기질 미설정</span>
          )}
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-bold',
              done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            )}
            data-testid="onetouch-progress"
          >
            {stepsDone}/3
          </span>
        </div>
      </header>

      <div className="grid gap-3 p-3 sm:p-4 lg:grid-cols-[1.02fr_1.18fr_0.8fr] lg:items-start">
        {/* ---------------------------- ① 오늘 기본 이론 ---------------------------- */}
        <article className={cn('flex flex-col rounded-2xl border border-slate-100 p-3.5', read.theory ? 'bg-emerald-50/40' : 'bg-slate-50/60')}>
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[12px] font-extrabold text-slate-700">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-900 text-[10px] text-white">1</span>
              오늘 기본 이론
            </p>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">전원 공통</span>
          </div>

          <p className="mt-2 text-[15px] font-extrabold leading-snug text-slate-900">
            {theory?.title ?? `${week}주차 ${session}회차 수업`}
          </p>
          <p className="mt-1 line-clamp-4 text-[12.5px] leading-relaxed text-slate-600">
            {theory?.student_content?.goal ?? weekPlan?.goal ?? '오늘 배우는 내용을 수업자료에서 확인해요.'}
          </p>

          {words.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {words.map((w) => (
                <span key={w} className="rounded-full bg-white px-2 py-0.5 text-[10.5px] font-bold text-brand-700 ring-1 ring-brand-100">
                  {w}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-auto flex flex-col gap-1.5 pt-3">
            <button
              type="button"
              onClick={() => navigate('/materials')}
              data-testid="onetouch-theory-link"
              className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2 text-[12px] font-bold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-50"
            >
              <span>📂 수업자료에서 자세히 보기</span>
              <span aria-hidden>›</span>
            </button>
            <button
              type="button"
              onClick={() => markRead('theory')}
              aria-pressed={read.theory}
              data-testid="onetouch-theory-read"
              className={cn(
                'flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold transition',
                read.theory ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'
              )}
            >
              {read.theory ? '✓ 이론 확인 완료' : '이론 확인했어요'}
            </button>
          </div>
        </article>

        {/* ---------------------------- ② 기질 맞춤 ---------------------------- */}
        <article className={cn('flex flex-col rounded-2xl border p-3.5', temper ? cn('border-transparent ring-1', temper.ring, temper.soft) : 'border-dashed border-slate-200 bg-white')}>
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[12px] font-extrabold text-slate-700">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-900 text-[10px] text-white">2</span>
              내 기질 맞춤
            </p>
            {temper ? (
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', temper.chip)}>
                {temper.emoji} {temper.name}
              </span>
            ) : null}
          </div>

          {error ? (
            <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[12px] font-semibold text-rose-600">{error}</p>
          ) : !temper ? (
            <div className="mt-3 flex flex-1 flex-col">
              <p className="text-[13px] font-bold text-slate-800">기질을 알면 오늘 문제가 달라져요</p>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                선생님이 기질 검사 결과를 넣어 주면, 내게 맞는 숙제·문제·팁이 여기에 바로 나옵니다.
                아직이라면 아래에서 검사할 수 있어요.
              </p>
              <a
                href="https://raffinegold.github.io/rafine-mind/"
                target="_blank"
                rel="noreferrer"
                className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-[12px] font-bold text-white hover:bg-brand-700"
              >
                🧠 기질 검사 하러 가기
              </a>
            </div>
          ) : (
            <>
              <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600">{temper.lens}</p>
              <div className="mt-2 space-y-2">
                {(['homework', 'problem', 'tip'] as const).map((kind) => (
                  <MissionBlock key={kind} kind={kind} mission={byKind(kind)} />
                ))}
                {!missions.length ? (
                  <p className="rounded-xl bg-white/80 px-3 py-2 text-[11.5px] leading-relaxed text-slate-500">
                    {TRACK_META[track as keyof typeof TRACK_META]?.label ?? track} 트랙의 맞춤 미션은 준비 중이에요. 기본 이론과 완료 체크는 그대로 쓸 수 있어요.
                  </p>
                ) : null}
              </div>
              <div className="mt-auto pt-2">
                <button
                  type="button"
                  onClick={() => markRead('mission')}
                  aria-pressed={read.mission}
                  data-testid="onetouch-mission-read"
                  className={cn(
                    'flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold transition',
                    read.mission ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'
                  )}
                >
                  {read.mission ? '✓ 맞춤 숙제·문제 확인 완료' : '숙제·문제 확인했어요'}
                </button>
              </div>
            </>
          )}
        </article>

        {/* ---------------------------- ③ 오늘 수업 완료 ---------------------------- */}
        <article
          className={cn(
            'flex flex-col rounded-2xl border p-3.5 transition',
            done ? 'border-emerald-200 bg-emerald-50/70' : 'border-slate-100 bg-slate-900 text-white'
          )}
        >
          <p className={cn('flex items-center gap-1.5 text-[12px] font-extrabold', done ? 'text-emerald-800' : 'text-white/80')}>
            <span className={cn('grid h-5 w-5 place-items-center rounded-full text-[10px]', done ? 'bg-emerald-600 text-white' : 'bg-white text-slate-900')}>3</span>
            오늘 수업 완료
          </p>

          <p className={cn('mt-2 text-[15px] font-extrabold leading-snug', done ? 'text-emerald-900' : 'text-white')}>
            {done ? '오늘 수업 끝! 🎉' : '다 했으면 여기를 눌러요'}
          </p>
          <p className={cn('mt-1 text-[12px] leading-relaxed', done ? 'text-emerald-700' : 'text-white/70')}>
            {done
              ? `${doneAt ?? ''}에 체크했어요. 선생님 화면에 바로 보여요.`
              : '누르는 순간 선생님 화면의 오늘 현황에 표시됩니다.'}
          </p>

          <button
            type="button"
            onClick={toggleDone}
            disabled={busy || !token}
            data-testid="onetouch-complete"
            aria-pressed={done}
            className={cn(
              'mt-3 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-[15px] font-extrabold transition active:scale-[0.98] disabled:opacity-60',
              done ? 'bg-white text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50' : 'bg-sunny text-slate-900 hover:brightness-105'
            )}
          >
            <span className={cn('grid h-6 w-6 place-items-center rounded-full text-[13px]', done ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-sunny')}>
              {done ? '✓' : '○'}
            </span>
            {busy ? '저장 중…' : done ? '완료 취소하기' : '오늘 수업 완료!'}
          </button>

          <div className="mt-auto pt-3">
            <div className="flex items-center justify-between text-[10.5px] font-bold">
              <span className={done ? 'text-emerald-700' : 'text-white/60'}>24주 진도</span>
              <span className={done ? 'text-emerald-800' : 'text-white/80'}>{progress.length}/24주</span>
            </div>
            <div className="mt-1 flex items-center gap-[2px]" aria-hidden>
              {Array.from({ length: 24 }, (_, i) => i + 1).map((w) => (
                <span
                  key={w}
                  className={cn(
                    'h-1.5 flex-1 rounded-full',
                    progress.includes(w) ? 'bg-emerald-400' : done ? 'bg-emerald-100' : 'bg-white/20'
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setRefreshKey((n) => n + 1)}
              className={cn('mt-2 text-[10.5px] font-semibold underline-offset-2 hover:underline', done ? 'text-emerald-600' : 'text-white/50')}
            >
              새로고침
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}

/* ------------------------------ 미션 한 칸 ------------------------------ */

function MissionBlock({ kind, mission }: { kind: TodayMission['kind']; mission?: TodayMission }) {
  const meta = KIND_META[kind];
  const [openHint, setOpenHint] = useState(false);
  const [openAnswer, setOpenAnswer] = useState(false);

  if (!mission) {
    return (
      <div className="rounded-xl bg-white/70 px-3 py-2 ring-1 ring-slate-100">
        <p className="text-[11px] font-bold text-slate-400">
          {meta.icon} {meta.label}
        </p>
        <p className="mt-0.5 text-[11.5px] text-slate-400">아직 없어요.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-slate-100" data-testid={`mission-${kind}`}>
      <div className="flex items-center gap-1.5">
        <span className={cn('rounded-full px-1.5 py-0.5 text-[9.5px] font-extrabold', meta.chip)}>
          {meta.icon} {meta.label}
        </span>
      </div>
      <p className="mt-1 text-[12.5px] font-extrabold leading-snug text-slate-900">{mission.title}</p>
      <p className="mt-1 whitespace-pre-line text-[11.5px] leading-relaxed text-slate-600">{mission.body}</p>

      {(mission.hint || mission.answer) && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {mission.hint ? (
            <button
              type="button"
              onClick={() => setOpenHint((v) => !v)}
              aria-expanded={openHint}
              className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 hover:bg-amber-100"
            >
              {openHint ? '힌트 접기' : '힌트 보기'}
            </button>
          ) : null}
          {mission.answer ? (
            <button
              type="button"
              onClick={() => setOpenAnswer((v) => !v)}
              aria-expanded={openAnswer}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 hover:bg-slate-200"
            >
              {openAnswer ? '정답 접기' : '정답 확인'}
            </button>
          ) : null}
        </div>
      )}
      {openHint && mission.hint ? (
        <p className="mt-1 rounded-lg bg-amber-50 px-2 py-1.5 text-[11px] leading-relaxed text-amber-900">💡 {mission.hint}</p>
      ) : null}
      {openAnswer && mission.answer ? (
        <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-900 px-2 py-1.5 text-[11px] leading-relaxed text-slate-100 thin-scroll">
          <code>{mission.answer}</code>
        </pre>
      ) : null}
    </div>
  );
}
