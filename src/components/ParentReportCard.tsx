import type { Student } from '../types';
import { LEVEL_META } from '../types';
import type { WeekStats } from '../lib/stats';
import { LevelPill } from './ui';
import { cn } from '../lib/util';

export default function ParentReportCard({
  student,
  stats,
  footerNote,
}: {
  student: Student;
  stats: WeekStats;
  footerNote?: string;
}) {
  const max = Math.max(1, ...stats.trend.map((t) => t.words));
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-slate-100">
      <div className="bg-gradient-to-br from-brand-600 to-indigo-700 px-5 pb-6 pt-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/15 text-sm">📚</span>
            <div>
              <p className="text-[10px] font-semibold text-white/60">라피네코딩컴퓨터학원 두정점</p>
              <p className="text-sm font-bold">주간 영단어 리포트</p>
            </div>
          </div>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold">읽기 전용</span>
        </div>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold text-white/60">{stats.weekLabel}</p>
            <p className="mt-0.5 text-2xl font-extrabold">{student.name} 학생</p>
            <p className="mt-1 flex items-center gap-2 text-[11px] text-white/75">
              <span className="rounded-full bg-white/20 px-2 py-0.5 font-bold">Level {student.level}</span>
              <span>
                {LEVEL_META[student.level].grades} · TOSEL {student.tosel_level} 대비
              </span>
            </p>
          </div>
          <span className="text-4xl">🎯</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px bg-slate-100">
        {[
          { label: '이번 주 완료', value: `${stats.wordsDone}`, unit: '단어' },
          { label: '정답률', value: `${stats.accuracy}`, unit: '%' },
          { label: '연속 완료', value: `${stats.streakDays}`, unit: '일' },
        ].map((s, i) => (
          <div key={i} className="bg-white px-2 py-4 text-center">
            <p className="text-[10px] font-semibold text-slate-400">{s.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {s.value}
              <span className="ml-0.5 text-xs font-bold text-slate-400">{s.unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs font-bold text-slate-700">요일별 완료</p>
          <div className="mt-2 flex justify-between gap-1.5">
            {['월', '화', '수', '목', '금', '토', '일'].map((d, i) => (
              <div key={d} className="flex flex-1 flex-col items-center gap-1">
                <span
                  className={cn(
                    'grid h-8 w-full place-items-center rounded-lg text-xs font-bold',
                    stats.dayDone[i] ? 'bg-brand-100 text-brand-700' : 'bg-slate-50 text-slate-300'
                  )}
                >
                  {stats.dayDone[i] ? '✓' : '·'}
                </span>
                <span className="text-[10px] text-slate-400">{d}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-slate-700">도움이 필요한 단어</p>
          {stats.focusWords.length ? (
            <ul className="mt-2 space-y-1.5">
              {stats.focusWords.slice(0, 3).map((f) => (
                <li key={f.word} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-slate-800">{f.word}</span>
                    <span className="ml-2 text-xs text-slate-500">{f.meaning}</span>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-rose-400">{f.miss}회</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              이번 주에 자주 틀린 단어가 없어요.
            </p>
          )}
        </div>

        <div>
          <p className="text-xs font-bold text-slate-700">지난 4주 흐름</p>
          <div className="mt-2 flex items-end justify-between gap-2 rounded-xl bg-slate-50 p-3">
            {stats.trend.map((t, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-slate-500">{t.words}</span>
                <div className="flex h-16 w-full items-end justify-center">
                  <div
                    className={cn('w-6 rounded-t-md', i === stats.trend.length - 1 ? 'bg-brand-500' : 'bg-brand-200')}
                    style={{ height: `${Math.max(5, (t.words / max) * 100)}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-400">{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-slate-400">
          {footerNote ??
            '정답률은 첫 응답 기준이에요. 이 링크에는 우리 아이 정보만 보이고, 다른 학생 정보와 학원 순위는 보이지 않아요.'}
        </p>
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <p className="text-[10px] text-slate-400">라피네코딩 두정점 · 무료 영어 진단 + 어휘 관리</p>
          <LevelPill level={student.level} />
        </div>
      </div>
    </div>
  );
}
