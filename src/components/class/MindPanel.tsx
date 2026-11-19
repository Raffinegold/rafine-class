import { useEffect, useMemo, useState } from 'react';
import type { Student } from '../../types';
import { useClassStore } from '../../lib/classStore';
import { CURRICULUM, TRACK_META } from '../../lib/curriculum';
import { KID_TRACK_RECOMMEND, fillTokens, maskText, parseMindCode } from '../../lib/mind';
import { cn } from '../../lib/util';
import { Badge, Bar, Card, SectionTitle, useToast } from '../ui';

export default function MindPanel({ student }: { student: Student }) {
  const cls = useClassStore();
  const toast = useToast();
  const profile = cls.profile(student.id, student.coding_level);
  const [draft, setDraft] = useState(profile.code);
  const [showAllWeeks, setShowAllWeeks] = useState(false);

  useEffect(() => {
    setDraft(cls.profile(student.id, student.coding_level).code);
    // 학생이 바뀌거나, 정보 수정 모달에서 코드가 바뀌면 입력값을 새로 채웁니다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id, profile.code]);

  const reading = useMemo(() => (draft.trim() ? parseMindCode(draft) : null), [draft]);
  const valid = reading && reading.ok ? reading : null;

  const onCodeChange = (value: string) => {
    const next = value.toUpperCase();
    setDraft(next);
    if (!next.trim()) {
      cls.setProfile(student.id, { code: '' });
      return;
    }
    const parsed = parseMindCode(next);
    if (parsed.ok) cls.setProfile(student.id, { code: parsed.code });
  };

  const plan = CURRICULUM[profile.track];
  const meta = TRACK_META[profile.track];
  const done = cls.doneWeeks(student.id);
  const doneSet = new Set(done);
  const nextWeek = cls.nextWeek(student.id);
  const nextPlan = plan.find((w) => w.week === nextWeek);
  const pct = Math.round((done.length / 24) * 100);

  return (
    <div className="space-y-4">
      {/* -------------------------------- 기질 코드 -------------------------------- */}
      <Card className="space-y-3">
        <SectionTitle sub="rafine-mind 검사 결과 코드를 넣으면 바로 해석해요">기질 코드 (RC-XXXX)</SectionTitle>
        <input
          data-testid="mind-code-input"
          value={draft}
          onChange={(e) => onCodeChange(e.target.value)}
          placeholder="예) RC-14E1"
          autoCapitalize="characters"
          spellCheck={false}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-center text-xl font-extrabold tracking-[0.12em] text-slate-800 outline-none focus:border-brand-400"
        />
        {draft && reading && !reading.ok ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-[12px] font-semibold text-rose-600">{reading.error}</p>
        ) : null}
        {!draft ? (
          <p className="text-[12px] leading-relaxed text-slate-400">
            코드가 없으면 기질 해석 없이 기본 리포트가 만들어져요. 상담 때 받은 코드를 그대로 넣어 주세요.
          </p>
        ) : null}

        {valid ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[10px] font-bold text-slate-400">어머니 유형 {valid.momKey}</p>
                <p className="mt-1 text-[13px] font-extrabold leading-snug text-slate-800">
                  {valid.mom.emoji} {valid.mom.name}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-slate-500">{valid.mom.short} · {maskText(valid.momAxes)}</p>
              </div>
              <div className="rounded-2xl bg-brand-50 p-3">
                <p className="text-[10px] font-bold text-brand-500">아이 유형 {valid.kidKey}</p>
                <p className="mt-1 text-[13px] font-extrabold leading-snug text-brand-800">
                  {valid.kid.emoji} {valid.kid.name}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-brand-600">{valid.kid.short} · {maskText(valid.kidAxes)}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              {valid.kidAxes.map((axis, i) => (
                <div key={axis.id} className="flex items-center gap-2 rounded-xl bg-white px-2 py-1.5 ring-1 ring-slate-100">
                  <span className="w-9 shrink-0 text-[11px] font-extrabold text-slate-500">{axis.short}</span>
                  <span className="flex-1 truncate text-[11px] text-slate-500">
                    엄마 {valid.momAxes[i].direction === 'up' ? '↑' : '↓'} {valid.momAxes[i].label}
                  </span>
                  <span className="flex-1 truncate text-right text-[11px] font-semibold text-brand-700">
                    아이 {axis.direction === 'up' ? '↑' : '↓'} {axis.label}
                  </span>
                </div>
              ))}
              <p className="pt-1 text-right text-[10px] text-slate-400">순서: 속도 · 구조 · 표현 · 민감 / ↑ 높은 쪽</p>
            </div>

            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-[12px] font-extrabold text-amber-700">부딪히는 지점</p>
              <p className="mt-1 text-[13px] leading-relaxed text-amber-900/80">{fillTokens(valid.combo.clash, student.name)}</p>
            </div>

            <div>
              <p className="text-[12px] font-extrabold text-slate-700">수업 지도 팁</p>
              <ul className="mt-1.5 space-y-1">
                {valid.combo.classGuide.map((tip) => (
                  <li key={tip} className="flex gap-2 text-[13px] leading-relaxed text-slate-600">
                    <span className="text-brand-400">✔</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Badge tone="mint">추천 {KID_TRACK_RECOMMEND[valid.kidKey]?.primary}</Badge>
              <Badge tone="slate">보조 {KID_TRACK_RECOMMEND[valid.kidKey]?.sub}</Badge>
            </div>
          </div>
        ) : null}
      </Card>

      {/* -------------------------------- 24주 진도 -------------------------------- */}
      <Card className="space-y-3">
        <SectionTitle sub={`${meta.label} · 전반 12주 기본 + 후반 12주 심화`}>24주 커리큘럼 진도</SectionTitle>

        <div className="flex items-end justify-between">
          <span className="text-2xl font-extrabold text-slate-900">
            {done.length}
            <span className="ml-0.5 text-sm font-bold text-slate-400">/24주</span>
          </span>
          <span className="text-sm font-extrabold text-brand-600">{pct}%</span>
        </div>
        <Bar ratio={done.length / 24} tone="mint" />

        {nextPlan ? (
          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 p-4 text-white">
            <p className="text-[11px] font-bold text-white/70">이번 주 할 것</p>
            <p className="mt-1 text-[15px] font-extrabold leading-snug">
              {nextPlan.week}주 · {nextPlan.title}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-white/75">{nextPlan.goal}</p>
            <button
              data-testid="week-done-toggle"
              onClick={() => {
                cls.setWeekDone(student.id, nextPlan.week, true);
                toast(`${nextPlan.week}주 완료! 진도가 올라갔어요`);
              }}
              className="mt-3 w-full rounded-2xl bg-sunny py-3 text-sm font-extrabold text-slate-900 transition active:scale-[0.98]"
            >
              이번 주 완료로 표시 (+1주)
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-emerald-50 p-4 text-center">
            <p className="text-sm font-extrabold text-emerald-700">24주 커리큘럼을 모두 마쳤어요 🎉</p>
            <p className="mt-1 text-[12px] text-emerald-700/80">다음 24주 목표를 아이와 함께 정해 주세요.</p>
          </div>
        )}

        <button
          onClick={() => setShowAllWeeks((v) => !v)}
          className="w-full rounded-xl bg-slate-50 py-2.5 text-[12px] font-bold text-slate-500 hover:bg-slate-100"
        >
          {showAllWeeks ? '주차 접기' : '주차별로 직접 체크하기'}
        </button>

        {showAllWeeks ? (
          <div className="space-y-3">
            {(['기본', '심화'] as const).map((phase) => (
              <div key={phase}>
                <p className="mb-1.5 text-[11px] font-extrabold text-slate-400">
                  {phase === '기본' ? '전반 12주 · 기본 + 미니 작품' : '후반 12주 · 심화 + 메인 작품'}
                </p>
                <div className="grid grid-cols-6 gap-1.5">
                  {plan
                    .filter((w) => w.phase === phase)
                    .map((w) => {
                      const isDone = doneSet.has(w.week);
                      return (
                        <button
                          key={w.week}
                          onClick={() => cls.toggleWeek(student.id, w.week)}
                          title={`${w.week}주 · ${w.title}`}
                          data-testid={`week-${w.week}`}
                          className={cn(
                            'flex h-10 items-center justify-center rounded-xl text-[12px] font-extrabold transition',
                            isDone
                              ? 'bg-emerald-500 text-white'
                              : w.week === nextWeek
                                ? 'bg-brand-50 text-brand-700 ring-2 ring-brand-300'
                                : 'bg-slate-100 text-slate-400'
                          )}
                        >
                          {w.week}
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
            <p className="text-[11px] leading-relaxed text-slate-400">
              초록색이 완료된 주차예요. 한 주를 끝낼 때마다 눌러 주세요.
            </p>
          </div>
        ) : null}
      </Card>

      {/* --------------------------------- 작품 --------------------------------- */}
      <WorksMini studentId={student.id} />
    </div>
  );
}

function WorksMini({ studentId }: { studentId: string }) {
  const cls = useClassStore();
  const toast = useToast();
  const works = cls.worksFor(studentId);

  return (
    <Card className="space-y-2">
      <SectionTitle sub="학생이 등록한 작품이 리포트에 들어가요">작품 보관함 {works.length}개</SectionTitle>
      {works.length === 0 ? (
        <p className="py-3 text-[13px] text-slate-400">아직 등록된 작품이 없어요. 학생 화면 ‘내 작품’에서 추가할 수 있어요.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {works.slice(0, 6).map((w) => (
            <li key={w.id} className="flex items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-slate-800">{w.title}</p>
                <p className="text-[11px] text-slate-400">
                  {w.date.replace(/-/g, '.')} · {w.tool}
                </p>
              </div>
              <button
                onClick={() => {
                  if (!window.confirm(`‘${w.title}’ 작품을 삭제할까요?`)) return;
                  cls.deleteWork(w.id);
                  toast('작품을 삭제했어요');
                }}
                className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-rose-50 hover:text-rose-500"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
