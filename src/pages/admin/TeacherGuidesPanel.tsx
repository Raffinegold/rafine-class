import { useEffect, useMemo, useState } from 'react';
import { useMaterialStore } from '../../lib/materialStore';
import { asTrack, CURRICULUM, TRACK_LIST, TRACK_META, type Track } from '../../lib/curriculum';
import { cn } from '../../lib/util';
import { Badge, Button, Card, Modal, useToast } from '../../components/ui';
import type { Material, MaterialTeacherGuide } from '../../types';

/**
 * 📖 수업안 — 선생님 전용 강의 가이드 (2026-11-20)
 *
 *  · 새 선생님이 수업 전에 펼쳐서 그대로 2시간을 진행할 수 있는 화면입니다.
 *  · 과정 · 주차 · 회차를 고르면 그 차시의 수업안이 나옵니다.
 *  · 2시간 시간대별 진행 → 시연 멘트 → 비유 → 판서 → AI 코칭 → 에러 → 자주 묻는 질문 → 팁 → 전체 정답 코드
 *  · 학생 배정·학생용 자료 목록은 여기에 없습니다(그건 📂 수업자료 탭).
 *  · teacher_guide · answer_code 는 학생 RPC 결과에 담기지 않습니다(서버에서 분리).
 */

const EMPTY_GUIDE: MaterialTeacherGuide = {};

function linesOf(items: string[] | undefined): string {
  return (items ?? []).join('\n');
}

function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** "a | b | c" — c 에 | 가 더 있으면 뒤를 합칩니다 */
function splitRow(line: string, max: number): string[] {
  const parts = line.split('|').map((s) => s.trim());
  if (parts.length <= max) return parts;
  return [...parts.slice(0, max - 1), parts.slice(max - 1).join(' | ')];
}

export default function TeacherGuidesPanel() {
  const ms = useMaterialStore();
  const toast = useToast();

  const [track, setTrack] = useState<Track>('python');
  const [week, setWeek] = useState(1);
  const [session, setSession] = useState<1 | 2>(1);
  const [guideId, setGuideId] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  const materials = ms.mode === 'cloud' ? ms.materials : ms.materials;

  useEffect(() => {
    if (ms.mode === 'cloud') void ms.loadAdminCloud();
    else ms.reloadLocal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weekMaterials = useMemo(
    () =>
      materials
        .filter((m) => asTrack(m.track, 'python') === track && (m.week ?? 0) === week && (m.session ?? 0) === session)
        .sort((a, b) => a.sort_no - b.sort_no),
    [materials, track, week, session]
  );

  useEffect(() => {
    if (!weekMaterials.length) {
      setGuideId('');
      return;
    }
    if (!weekMaterials.some((m) => m.id === guideId)) {
      const withGuide = weekMaterials.find((m) => m.teacher_guide || m.answer_code);
      setGuideId((withGuide ?? weekMaterials[0]).id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekMaterials]);

  const guide = weekMaterials.find((m) => m.id === guideId) ?? null;
  const plan = CURRICULUM[track].find((w) => w.week === week);
  const withGuideCount = weekMaterials.filter((m) => m.teacher_guide || m.answer_code).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[17px] font-extrabold text-slate-900">📖 수업안 · 선생님 전용</h2>
          <p className="mt-0.5 text-[11.5px] text-slate-500">
            수업 전에 이 화면만 읽으면 2시간을 그대로 진행할 수 있습니다 · 학생 화면에는 나가지 않습니다
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge tone={ms.mode === 'cloud' ? 'mint' : 'slate'}>{ms.mode === 'cloud' ? '실시간 연결' : '데모(로컬)'}</Badge>
          {guide ? (
            <Button size="sm" variant="soft" onClick={() => setEditOpen(true)} data-testid="guide-edit">
              수업안 편집
            </Button>
          ) : null}
        </div>
      </div>

      {/* 과정 · 주차 · 회차 */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <select
            value={track}
            onChange={(e) => setTrack(asTrack(e.target.value))}
            className="rounded-xl border border-slate-200 px-2.5 py-2 text-[12px] font-bold"
            data-testid="guide-track"
          >
            {TRACK_LIST.map((t) => (
              <option key={t.key} value={t.key}>
                {t.emoji} {t.label}
              </option>
            ))}
          </select>
          <select
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            className="rounded-xl border border-slate-200 px-2.5 py-2 text-[12px] font-bold"
            data-testid="guide-week"
          >
            {CURRICULUM[track].map((w) => (
              <option key={w.week} value={w.week}>
                {w.week}주차{w.milestone ? ' ★' : ''}
              </option>
            ))}
          </select>
          <div className="flex gap-1">
            {([1, 2] as (1 | 2)[]).map((s) => (
              <button
                key={s}
                onClick={() => setSession(s)}
                data-testid={`guide-session-${s}`}
                className={cn(
                  'rounded-xl px-3 py-2 text-[12px] font-extrabold',
                  session === s ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-500'
                )}
              >
                {s}회차
              </button>
            ))}
          </div>
        </div>
        {plan ? (
          <p className="mt-2 rounded-2xl bg-slate-50 px-3 py-2 text-[12px] leading-relaxed text-slate-600">
            <b className="text-slate-800">{plan.title}</b> · {session === 1 ? plan.goal : plan.plan2}
            <span className="ml-1 text-slate-400">— AI 틈틈이: {plan.ai}</span>
          </p>
        ) : null}
      </Card>

      <div className="grid gap-3 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] lg:gap-4">
        {/* 이 차시 자료 목록 */}
        <Card className="max-h-[560px] overflow-y-auto p-2 lg:sticky lg:top-[92px] lg:max-h-[calc(100vh-120px)]">
          <p className="px-1.5 pb-1 text-[10.5px] font-extrabold uppercase text-slate-400">
            이 차시 자료 {weekMaterials.length}개 · 수업안 {withGuideCount}개
          </p>
          {weekMaterials.map((m) => (
            <button
              key={m.id}
              onClick={() => setGuideId(m.id)}
              data-testid={`guide-item-${m.id}`}
              className={cn(
                'mb-1 w-full rounded-xl px-2.5 py-2 text-left transition',
                guideId === m.id ? 'bg-brand-50' : 'hover:bg-slate-50'
              )}
            >
              <p className="flex items-center gap-1 text-[10.5px] font-bold text-slate-400">
                {TRACK_META[asTrack(m.track)].short} · {m.week ?? '-'}주 {m.session ?? '-'}회차
                {m.teacher_guide ? <span className="rounded-full bg-indigo-50 px-1.5 text-[9.5px] text-indigo-600">수업안</span> : null}
              </p>
              <p className="truncate text-[12.5px] font-extrabold text-slate-800">{m.title}</p>
            </button>
          ))}
          {!weekMaterials.length ? <p className="px-2 py-6 text-center text-[12px] text-slate-400">이 차시에 자료가 없습니다</p> : null}
        </Card>

        {/* 수업안 본문 */}
        <div className="space-y-3">
          {!guide ? (
            <Card className="p-8 text-center">
              <p className="text-3xl">📖</p>
              <p className="mt-2 text-[13.5px] font-bold text-slate-700">이 차시에 등록된 자료가 없어요</p>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                📂 수업자료 탭에서 자료를 먼저 등록하면, 여기서 수업안을 채울 수 있습니다.
              </p>
            </Card>
          ) : (
            <>
              <Card className="p-4">
                <p className="text-[11px] font-bold text-slate-400">
                  {TRACK_META[asTrack(guide.track)].label} · {guide.week ?? '-'}주차 {guide.session ?? '-'}회차
                </p>
                <h3 className="text-[16px] font-extrabold text-slate-900">{guide.title}</h3>
                {guide.summary ? <p className="mt-1 text-[12.5px] text-slate-600">{guide.summary}</p> : null}
                {guide.student_content?.goal ? (
                  <p className="mt-2 rounded-xl bg-brand-50 px-3 py-2 text-[12px] font-bold text-brand-800">
                    이 수업이 끝나면 — {guide.student_content.goal}
                  </p>
                ) : null}
                {guide.student_content?.preview ? (
                  <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-900 px-3 py-2 text-[11.5px] leading-relaxed text-emerald-200">
                    {guide.student_content.preview}
                  </pre>
                ) : null}
              </Card>

              {/* 2시간 진행표 */}
              <Card className="p-4">
                <p className="text-[13px] font-extrabold text-slate-800">⏱ 2시간 진행표</p>
                <p className="mt-0.5 text-[11.5px] text-slate-500">시계를 보며 이 순서대로. 시간이 밀기면 '필수' 표시만 남기세요.</p>
                {guide.teacher_guide?.timeline?.length ? (
                  <div className="mt-2 overflow-hidden rounded-2xl border border-slate-100">
                    {guide.teacher_guide.timeline.map((t, i) => (
                      <div key={i} className={cn('grid grid-cols-[72px_1fr] gap-2 px-3 py-2', i % 2 ? 'bg-slate-50/60' : 'bg-white')}>
                        <p className="text-[11.5px] font-extrabold text-brand-700">{t.min}</p>
                        <div>
                          <p className="text-[12.5px] font-extrabold text-slate-800">{t.title}</p>
                          <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-600">{t.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 rounded-xl bg-slate-50 px-3 py-3 text-[12px] text-slate-400">
                    진행표가 아직 없습니다. ‘수업안 편집’에서 시간대별로 추가해 주세요.
                  </p>
                )}
              </Card>

              <div className="grid gap-3 md:grid-cols-2">
                <Card className="p-4">
                  <p className="text-[10.5px] font-bold uppercase text-slate-400">① 시작 30초 시연 멘트</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-slate-700">
                    {guide.teacher_guide?.demo ?? '수업안이 아직 없습니다. ‘수업안 편집’으로 추가해 주세요.'}
                  </p>
                </Card>
                {guide.teacher_guide?.analogy ? (
                  <Card className="border-amber-100 bg-amber-50/60 p-4">
                    <p className="text-[10.5px] font-extrabold text-amber-700">② 핵심 비유</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-amber-900">{guide.teacher_guide.analogy}</p>
                  </Card>
                ) : null}
              </div>

              {guide.teacher_guide?.board?.length ? (
                <Card className="p-4">
                  <p className="text-[12.5px] font-extrabold text-slate-800">③ 설명 순서 · 판서</p>
                  <div className="mt-2 space-y-1">
                    {guide.teacher_guide.board.map((b, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr] gap-2 rounded-lg bg-slate-50 px-2 py-1.5">
                        <p className="text-[12px] text-slate-700">
                          <span className="mr-1 font-bold text-slate-400">{i + 1}.</span>
                          {b.say}
                        </p>
                        <p className="text-[11.5px] font-bold text-brand-700">{b.write}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}

              {guide.teacher_guide?.ai?.length ? (
                <Card className="border-indigo-100 bg-indigo-50/50 p-4">
                  <p className="text-[12.5px] font-extrabold text-indigo-700">④ AI 틈틈이 — 언제, 무엇을, 어떻게</p>
                  <div className="mt-2 space-y-1.5">
                    {guide.teacher_guide.ai.map((a, i) => (
                      <div key={i} className="rounded-xl bg-white/80 px-3 py-2">
                        <p className="text-[12px] font-extrabold text-indigo-800">
                          {a.when} · {a.what}
                        </p>
                        {a.prompt ? <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-600">“{a.prompt}”</p> : null}
                        {a.rule ? <p className="text-[11px] font-bold text-rose-600">규칙: {a.rule}</p> : null}
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}

              {guide.teacher_guide?.errors?.length ? (
                <Card className="border-rose-100 bg-rose-50/50 p-4">
                  <p className="text-[12.5px] font-extrabold text-rose-700">⑤ 자주 나는 에러 · 코치 멘트</p>
                  <div className="mt-2 space-y-1.5">
                    {guide.teacher_guide.errors.map((e, i) => (
                      <div key={i} className="rounded-xl bg-white/85 px-3 py-2">
                        <p className="text-[12px] font-bold text-slate-800">{e.symptom}</p>
                        <p className="text-[11px] text-slate-500">원인: {e.cause}</p>
                        <p className="text-[11.5px] font-bold text-brand-700">코치: {e.coach}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}

              {guide.teacher_guide?.qa?.length ? (
                <Card className="p-4">
                  <p className="text-[12.5px] font-extrabold text-slate-800">⑥ 학생이 자주 묻는 질문 · 코치 멘트</p>
                  <div className="mt-2 space-y-1.5">
                    {guide.teacher_guide.qa.map((q, i) => (
                      <div key={i} className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-[12px] font-extrabold text-slate-800">Q. {q.q}</p>
                        <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-600">A. {q.a}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}

              {guide.teacher_guide?.tips?.length ? (
                <Card className="p-4">
                  <p className="text-[12px] font-extrabold text-slate-600">⑦ 운영 팁</p>
                  {guide.teacher_guide.tips.map((t, i) => (
                    <p key={i} className="mt-1 text-[12px] leading-relaxed text-slate-600">
                      · {t}
                    </p>
                  ))}
                </Card>
              ) : null}

              <Card className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-extrabold text-rose-600">⑧ 전체 정답 코드 — 학생 화면에는 나가지 않습니다</p>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(guide.answer_code ?? '');
                        toast('정답 코드를 복사했어요');
                      } catch {
                        toast('복사에 실패했어요');
                      }
                    }}
                    className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-500"
                  >
                    복사
                  </button>
                </div>
                <pre className="mt-2 overflow-x-auto rounded-2xl bg-slate-900 p-3 text-[12px] leading-relaxed text-emerald-200">
                  <code>{guide.answer_code ?? '# 정답 코드가 아직 없습니다 — 수업안 편집에서 작성'}</code>
                </pre>
              </Card>
            </>
          )}
        </div>
      </div>

      {guide ? <GuideEditor material={guide} open={editOpen} onClose={() => setEditOpen(false)} /> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 수업안 편집 — 선생님 전용 칸만 (학생용 내용은 건드리지 않습니다)           */
/* -------------------------------------------------------------------------- */

function GuideEditor({ material, open, onClose }: { material: Material; open: boolean; onClose: () => void }) {
  const ms = useMaterialStore();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    demo: '',
    analogy: '',
    timeline: '',
    board: '',
    ai: '',
    errors: '',
    qa: '',
    tips: '',
    answer: '',
  });

  useEffect(() => {
    if (!open) return;
    const g = material.teacher_guide ?? EMPTY_GUIDE;
    setForm({
      demo: g.demo ?? '',
      analogy: g.analogy ?? '',
      timeline: linesOf((g.timeline ?? []).map((t) => `${t.min} | ${t.title} | ${t.detail}`)),
      board: linesOf((g.board ?? []).map((b) => `${b.say} | ${b.write}`)),
      ai: linesOf((g.ai ?? []).map((a) => `${a.when} | ${a.what} | ${a.prompt ?? ''} | ${a.rule ?? ''}`)),
      errors: linesOf((g.errors ?? []).map((e) => `${e.symptom} | ${e.cause} | ${e.coach}`)),
      qa: linesOf((g.qa ?? []).map((q) => `${q.q} | ${q.a}`)),
      tips: linesOf(g.tips ?? []),
      answer: material.answer_code ?? '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, material.id]);

  const save = async () => {
    const guide: MaterialTeacherGuide = {
      demo: form.demo.trim() || undefined,
      analogy: form.analogy.trim() || undefined,
      timeline: splitLines(form.timeline).map((line) => {
        const [min, title, detail] = splitRow(line, 3);
        return { min: min ?? '', title: title ?? '', detail: detail ?? '' };
      }),
      board: splitLines(form.board).map((line) => {
        const [say, write] = splitRow(line, 2);
        return { say: say ?? '', write: write ?? '' };
      }),
      ai: splitLines(form.ai).map((line) => {
        const [when, what, prompt, rule] = splitRow(line, 4);
        return { when: when ?? '', what: what ?? '', prompt: prompt || undefined, rule: rule || undefined };
      }),
      errors: splitLines(form.errors).map((line) => {
        const [symptom, cause, coach] = splitRow(line, 3);
        return { symptom: symptom ?? '', cause: cause ?? '', coach: coach ?? '' };
      }),
      qa: splitLines(form.qa).map((line) => {
        const [q, a] = splitRow(line, 2);
        return { q: q ?? '', a: a ?? '' };
      }),
      tips: splitLines(form.tips),
    };
    setBusy(true);
    const ok = await ms.saveMaterial({
      ...material,
      teacher_guide: guide,
      answer_code: form.answer.trim() || null,
    });
    setBusy(false);
    toast(ok ? '수업안을 저장했어요' : '저장에 실패했어요');
    if (ok) onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="수업안 편집 — 선생님 전용">
      <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
        <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11.5px] leading-relaxed text-slate-500">
          학생용 자료(개념·예제·실습·미션)는 이 칸에서 바뀌지 않습니다. 📂 수업자료 탭에서 수정하세요.
          <br />
          한 줄에 하나씩, 항목은 <b>|</b> 로 나눕니다.
        </p>
        <label className="block">
          <span className="text-[11.5px] font-bold text-slate-500">① 30초 시연 멘트</span>
          <textarea
            value={form.demo}
            onChange={(e) => setForm({ ...form, demo: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-[12.5px]"
          />
        </label>
        <label className="block">
          <span className="text-[11.5px] font-bold text-slate-500">② 핵심 비유</span>
          <textarea
            value={form.analogy}
            onChange={(e) => setForm({ ...form, analogy: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-[12.5px]"
          />
        </label>
        <label className="block">
          <span className="text-[11.5px] font-bold text-slate-500">⏱ 2시간 진행표 — 시간 | 제목 | 내용</span>
          <textarea
            value={form.timeline}
            onChange={(e) => setForm({ ...form, timeline: e.target.value })}
            rows={8}
            placeholder="0~10 | 도입 | 완성 화면 먼저 보여 주기"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-[11.5px]"
          />
        </label>
        <label className="block">
          <span className="text-[11.5px] font-bold text-slate-500">③ 판서 — 말할 것 | 칠판에 쓸 것</span>
          <textarea
            value={form.board}
            onChange={(e) => setForm({ ...form, board: e.target.value })}
            rows={6}
            placeholder="컴퓨터는 기억을 어디에 둘까요? | [ ] 빈 상자 1개"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-[11.5px]"
          />
        </label>
        <label className="block">
          <span className="text-[11.5px] font-bold text-slate-500">④ AI 코칭 — 언제 | 무엇 | 프롬프트 | 규칙</span>
          <textarea
            value={form.ai}
            onChange={(e) => setForm({ ...form, ai: e.target.value })}
            rows={4}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-[11.5px]"
          />
        </label>
        <label className="block">
          <span className="text-[11.5px] font-bold text-slate-500">⑤ 에러 — 증상 | 원인 | 코치 멘트</span>
          <textarea
            value={form.errors}
            onChange={(e) => setForm({ ...form, errors: e.target.value })}
            rows={5}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-[11.5px]"
          />
        </label>
        <label className="block">
          <span className="text-[11.5px] font-bold text-slate-500">⑥ 자주 묻는 질문 — 질문 | 코치 멘트</span>
          <textarea
            value={form.qa}
            onChange={(e) => setForm({ ...form, qa: e.target.value })}
            rows={5}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-[11.5px]"
          />
        </label>
        <label className="block">
          <span className="text-[11.5px] font-bold text-slate-500">⑦ 운영 팁 (한 줄에 하나)</span>
          <textarea
            value={form.tips}
            onChange={(e) => setForm({ ...form, tips: e.target.value })}
            rows={4}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-[12.5px]"
          />
        </label>
        <label className="block">
          <span className="text-[11.5px] font-bold text-rose-600">⑧ 전체 정답 코드 (학생에게 절대 안 보임)</span>
          <textarea
            value={form.answer}
            onChange={(e) => setForm({ ...form, answer: e.target.value })}
            rows={8}
            className="mt-1 w-full rounded-xl border border-rose-200 bg-rose-50/40 px-3 py-2 font-mono text-[12px]"
          />
        </label>
        <Button className="w-full" onClick={save} disabled={busy} data-testid="guide-save">
          {busy ? '저장 중…' : '수업안 저장'}
        </Button>
      </div>
    </Modal>
  );
}
