import { useEffect, useMemo, useState } from 'react';
import { useVocaStore } from '../../app-context';
import { useClassStore } from '../../lib/classStore';
import { asTrack, CURRICULUM, TRACK_LIST, TRACK_META, type Track } from '../../lib/curriculum';
import { materialStore, useMaterialStore } from '../../lib/materialStore';
import { cn, todayStr } from '../../lib/util';
import { Badge, Button, Card, Modal, useToast } from '../../components/ui';
import type { Material, MaterialKind } from '../../types';

/**
 * 📂 원장님 자료실 관리 (2026-11-20)
 * 1) 수업안 뷰 — 새 선생님이 수업 전에 읽으면 바로 강의할 수 있는 화면
 * 2) 자료 등록/수정 — 학생 화면에 나갈 내용 / 교사용 수업안 / 정답 코드를 분리해서 저장
 * 3) 배정 — 학생마다 과정·주차·회차 숫자 + 특정 자료 추가 배정
 * 정답 코드와 수업안은 학생 RPC 결과에 담기지 않습니다(서버에서 분리).
 */

type SubTab = 'guide' | 'list' | 'assign';

const KIND_LABEL: Record<MaterialKind, string> = {
  theory: '이론',
  code: '예제 코드',
  upgrade: '업그레이드',
  image: '그림',
  link: '링크',
};

const EMPTY_FORM = {
  id: '',
  kind: 'theory' as MaterialKind,
  title: '',
  track: 'python' as Track,
  week: 1,
  session: 1 as 1 | 2,
  summary: '',
  body: '',
  aiTip: '',
  answer: '',
  teacherNote: '',
  published: true,
  sortNo: 10,
};

export default function MaterialsPanel() {
  const store = useVocaStore();
  const cls = useClassStore();
  const ms = useMaterialStore();
  const toast = useToast();

  const [sub, setSub] = useState<SubTab>('guide');
  const [guideId, setGuideId] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formOpen, setFormOpen] = useState(false);
  const [assignId, setAssignId] = useState('');
  const [track, setTrack] = useState<Track>('python');
  const [week, setWeek] = useState(1);
  const [session, setSession] = useState<1 | 2>(1);

  const students = useMemo(() => store.listStudents(true), [store, ms.version]);
  const materials = ms.mode === 'cloud' ? ms.materials : ms.materials.length ? ms.materials : materialStore.localAll();

  useEffect(() => {
    if (ms.mode === 'cloud') void ms.loadAdminCloud();
    else ms.reloadLocal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!students.length) return;
    if (!students.some((s) => s.id === assignId)) setAssignId(students[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students]);

  useEffect(() => {
    if (!materials.length) return;
    if (!materials.some((m) => m.id === guideId)) setGuideId(materials[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materials]);

  const student = students.find((s) => s.id === assignId) ?? null;
  const currentAssignment =
    ms.mode === 'cloud'
      ? ms.assignments.find((a) => a.student_id === assignId) ?? null
      : materialStore.localAssignment(assignId);

  const guide = materials.find((m) => m.id === guideId) ?? null;

  const pickStudent = (id: string) => {
    setAssignId(id);
    const a = ms.mode === 'cloud' ? ms.assignments.find((x) => x.student_id === id) : materialStore.localAssignment(id);
    const st = students.find((s) => s.id === id);
    const profile = st ? cls.profile(st.id, st.coding_level) : null;
    setTrack(asTrack(a?.track ?? profile?.track ?? 'python'));
    setWeek(Number(a?.week ?? (st ? Math.min(cls.nextWeek(st.id), 24) : 1)));
    setSession((Number(a?.session ?? 1) === 2 ? 2 : 1) as 1 | 2);
  };

  useEffect(() => {
    if (assignId) pickStudent(assignId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignId]);

  const openEdit = (m: Material) => {
    const body = (m.student_content?.steps ?? []).map((s) => `${s.title}\n${s.note ?? ''}`).join('\n\n');
    setForm({
      id: m.id,
      kind: m.kind,
      title: m.title,
      track: asTrack(m.track, 'python'),
      week: m.week ?? 1,
      session: (m.session === 2 ? 2 : 1) as 1 | 2,
      summary: m.summary ?? '',
      body,
      aiTip: m.ai_tip ?? '',
      answer: m.answer_code ?? '',
      teacherNote: (m.teacher_guide?.tips ?? []).join('\n'),
      published: m.published,
      sortNo: m.sort_no ?? 10,
    });
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast('제목을 적어 주세요');
      return;
    }
    const existing = materials.find((m) => m.id === form.id);
    const payload: Material = {
      id: form.id || `mat-${Date.now()}`,
      kind: form.kind,
      title: form.title.trim(),
      track: form.track,
      week: form.week,
      session: form.session,
      class_name: existing?.class_name ?? null,
      summary: form.summary.trim(),
      student_content: {
        ...(existing?.student_content ?? {}),
        goal: form.summary.trim() || existing?.student_content?.goal,
        steps: form.body.trim()
          ? [{ title: '선생님이 올린 자료', note: form.body.trim() }]
          : existing?.student_content?.steps,
      },
      teacher_guide: {
        ...(existing?.teacher_guide ?? {}),
        tips: form.teacherNote.trim() ? form.teacherNote.split('\n').filter(Boolean) : existing?.teacher_guide?.tips ?? [],
      },
      answer_code: form.answer.trim() || null,
      ai_tip: form.aiTip.trim() || null,
      image_url: existing?.image_url ?? null,
      link_url: existing?.link_url ?? null,
      code_lang: existing?.code_lang ?? 'python',
      published: form.published,
      sort_no: Number(form.sortNo) || 10,
    };
    const ok = await ms.saveMaterial(payload);
    toast(ok ? '저장했어요. 학생 화면에 바로 반영됩니다' : '저장에 실패했어요');
    if (ok) setFormOpen(false);
  };

  const remove = async (m: Material) => {
    if (!window.confirm(`"${m.title}" 자료를 삭제할까요?`)) return;
    const ok = await ms.removeMaterial(m.id);
    toast(ok ? '삭제했어요' : '삭제에 실패했어요');
  };

  const saveAssignment = async () => {
    if (!student) return;
    const ok = await ms.setAssignment(student.id, track, week, session);
    toast(ok ? `${student.name} · ${TRACK_META[track].label} ${week}주차 ${session}회차로 배정했어요` : '배정 저장에 실패했어요');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-[17px] font-extrabold text-slate-900">📂 자료실 · 수업안</h2>
          <p className="mt-0.5 text-[11.5px] text-slate-500">
            {ms.mode === 'cloud' ? 'Supabase 실시간 연결 — 저장하면 학생 화면에 바로 반영됩니다' : '데모(로컬) 모드 — 이 브라우저에만 저장됩니다'}
          </p>
        </div>
        <Button size="sm" variant="soft" onClick={() => { setForm({ ...EMPTY_FORM }); setFormOpen(true); }}>
          + 자료 등록
        </Button>
      </div>

      <div className="flex gap-1.5">
        {([
          ['guide', '수업안 보기'],
          ['list', '자료 등록·수정'],
          ['assign', '학생 배정'],
        ] as [SubTab, string][]).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setSub(k)}
            data-testid={`materials-sub-${k}`}
            className={cn(
              'rounded-xl px-3 py-2 text-[12px] font-extrabold',
              sub === k ? 'bg-brand-600 text-white' : 'bg-white text-slate-500 border border-slate-200'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ------------------------------ 수업안 뷰 ------------------------------ */}
      {sub === 'guide' ? (
        <div className="grid gap-3 md:grid-cols-[260px_1fr]">
          <Card className="max-h-[520px] overflow-y-auto p-2">
            {materials.map((m) => (
              <button
                key={m.id}
                onClick={() => setGuideId(m.id)}
                className={cn(
                  'mb-1 w-full rounded-xl px-2.5 py-2 text-left transition',
                  guideId === m.id ? 'bg-brand-50' : 'hover:bg-slate-50'
                )}
              >
                <p className="text-[11px] font-bold text-slate-400">
                  {m.track ? TRACK_META[asTrack(m.track)].label : '전체'} · {m.week ?? '-'}주 {m.session ?? '-'}회차
                </p>
                <p className="truncate text-[12.5px] font-extrabold text-slate-800">{m.title}</p>
                {!m.published ? <span className="text-[10px] font-bold text-rose-500">비공개</span> : null}
              </button>
            ))}
          </Card>

          <Card className="p-4">
            {!guide ? (
              <p className="py-10 text-center text-[13px] text-slate-400">자료를 선택해 주세요</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-bold text-slate-400">
                    {guide.track ? TRACK_META[asTrack(guide.track)].label : '전체 트랙'} · {guide.week ?? '-'}주차 {guide.session ?? '-'}회차 · {KIND_LABEL[guide.kind]}
                  </p>
                  <h3 className="text-[16px] font-extrabold text-slate-900">{guide.title}</h3>
                  {guide.summary ? <p className="mt-1 text-[12.5px] text-slate-600">{guide.summary}</p> : null}
                </div>

                <div className="rounded-2xl bg-slate-900 p-3">
                  <p className="text-[10.5px] font-bold uppercase text-slate-400">① 시작 30초 시연 멘트</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-slate-100">
                    {guide.teacher_guide?.demo ?? '수업안이 아직 없습니다. 자료 수정에서 추가해 주세요.'}
                  </p>
                </div>

                {guide.teacher_guide?.analogy ? (
                  <div className="rounded-2xl bg-amber-50 p-3">
                    <p className="text-[10.5px] font-extrabold text-amber-700">② 핵심 비유</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-amber-900">{guide.teacher_guide.analogy}</p>
                  </div>
                ) : null}

                {guide.teacher_guide?.board?.length ? (
                  <div className="rounded-2xl border border-slate-100 p-3">
                    <p className="text-[10.5px] font-extrabold text-slate-500">③ 설명 순서 · 판서</p>
                    <div className="mt-1.5 space-y-1">
                      {guide.teacher_guide.board.map((b, i) => (
                        <div key={i} className="grid grid-cols-[1fr_1fr] gap-2 rounded-lg bg-slate-50 px-2 py-1.5">
                          <p className="text-[12px] text-slate-700">{b.say}</p>
                          <p className="text-[11.5px] font-bold text-brand-700">{b.write}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {guide.teacher_guide?.ai?.length ? (
                  <div className="rounded-2xl bg-indigo-50 p-3">
                    <p className="text-[10.5px] font-extrabold text-indigo-700">④ AI 틈틈이 코칭</p>
                    <div className="mt-1.5 space-y-1.5">
                      {guide.teacher_guide.ai.map((a, i) => (
                        <div key={i} className="rounded-xl bg-white/70 px-2.5 py-2">
                          <p className="text-[11.5px] font-extrabold text-indigo-800">{a.when} · {a.what}</p>
                          {a.prompt ? <p className="mt-0.5 text-[11.5px] text-slate-600">“{a.prompt}”</p> : null}
                          {a.rule ? <p className="text-[11px] font-bold text-rose-600">{a.rule}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {guide.teacher_guide?.errors?.length ? (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3">
                    <p className="text-[10.5px] font-extrabold text-rose-700">⑤ 자주 나는 에러 · 코치 멘트</p>
                    <div className="mt-1.5 space-y-1.5">
                      {guide.teacher_guide.errors.map((e, i) => (
                        <div key={i} className="rounded-xl bg-white/80 px-2.5 py-2">
                          <p className="text-[11.5px] font-bold text-slate-800">{e.symptom}</p>
                          <p className="text-[11px] text-slate-500">원인: {e.cause}</p>
                          <p className="text-[11.5px] font-bold text-brand-700">코치: {e.coach}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {guide.teacher_guide?.tips?.length ? (
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[10.5px] font-extrabold text-slate-500">⑥ 운영 팁</p>
                    {guide.teacher_guide.tips.map((t, i) => (
                      <p key={i} className="mt-1 text-[12px] leading-relaxed text-slate-600">· {t}</p>
                    ))}
                  </div>
                ) : null}

                <div>
                  <p className="text-[10.5px] font-extrabold text-rose-600">⑦ 정답 코드 — 학생 화면에는 나가지 않습니다</p>
                  <pre className="mt-1 overflow-x-auto rounded-2xl bg-slate-900 p-3 text-[12px] leading-relaxed text-emerald-200">
                    <code>{guide.answer_code ?? '# 정답 코드가 아직 없습니다'}</code>
                  </pre>
                </div>
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {/* ---------------------------- 자료 등록·수정 ---------------------------- */}
      {sub === 'list' ? (
        <Card className="p-3">
          <div className="divide-y divide-slate-100">
            {materials.map((m) => {
              const views = materialStore.viewsFor(m.id);
              const doneCount = views.filter((v) => v.done_at).length;
              return (
                <div key={m.id} className="flex items-center gap-2 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-400">
                      {m.track ? TRACK_META[asTrack(m.track)].label : '전체'} · {m.week ?? '-'}주 {m.session ?? '-'}회차 · {KIND_LABEL[m.kind]}
                      {m.published ? '' : ' · 비공개'}
                    </p>
                    <p className="truncate text-[13px] font-extrabold text-slate-800">{m.title}</p>
                    <p className="text-[11px] text-slate-400">열람 {views.length}명 · 완료 {doneCount}명</p>
                  </div>
                  <button onClick={() => openEdit(m)} className="rounded-xl bg-slate-100 px-2.5 py-1.5 text-[11.5px] font-bold text-slate-600">
                    수정
                  </button>
                  <button onClick={() => remove(m)} className="rounded-xl bg-rose-50 px-2.5 py-1.5 text-[11.5px] font-bold text-rose-600">
                    삭제
                  </button>
                </div>
              );
            })}
            {!materials.length ? <p className="py-8 text-center text-[13px] text-slate-400">자료가 없습니다</p> : null}
          </div>
        </Card>
      ) : null}

      {/* ------------------------------ 학생 배정 ------------------------------ */}
      {sub === 'assign' ? (
        <div className="grid gap-3 md:grid-cols-[220px_1fr]">
          <Card className="max-h-[420px] overflow-y-auto p-2">
            {students.map((s) => (
              <button
                key={s.id}
                onClick={() => pickStudent(s.id)}
                className={cn('mb-1 w-full rounded-xl px-2.5 py-2 text-left text-[12.5px] font-extrabold', assignId === s.id ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50')}
              >
                {s.name}
                <span className="ml-1 text-[10px] font-bold text-slate-400">{s.class_name}</span>
              </button>
            ))}
          </Card>

          <div className="space-y-3">
            <Card className="p-4">
              <p className="text-[13px] font-extrabold text-slate-800">{student?.name ?? '학생'} 배정</p>
              <p className="mt-0.5 text-[11.5px] text-slate-500">
                지금 배정: {currentAssignment ? `${TRACK_META[asTrack(currentAssignment.track)].label} · ${currentAssignment.week ?? '-'}주차 ${currentAssignment.session ?? '-'}회차` : '아직 없음'}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <select
                  value={track}
                  onChange={(e) => setTrack(asTrack(e.target.value))}
                  className="rounded-xl border border-slate-200 px-2.5 py-2 text-[12px] font-bold"
                >
                  {TRACK_LIST.map((t) => (
                    <option key={t.key} value={t.key}>{t.emoji} {t.label}</option>
                  ))}
                </select>
                <select
                  value={week}
                  onChange={(e) => setWeek(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 px-2.5 py-2 text-[12px] font-bold"
                >
                  {CURRICULUM[track].map((w) => (
                    <option key={w.week} value={w.week}>{w.week}주차</option>
                  ))}
                </select>
                <select
                  value={session}
                  onChange={(e) => setSession(Number(e.target.value) === 2 ? 2 : 1)}
                  className="rounded-xl border border-slate-200 px-2.5 py-2 text-[12px] font-bold"
                >
                  <option value={1}>1회차</option>
                  <option value={2}>2회차</option>
                </select>
                <Button size="sm" onClick={saveAssignment}>배정 저장</Button>
              </div>
              {(() => {
                const plan = CURRICULUM[track].find((w) => w.week === week);
                return plan ? (
                  <div className="mt-2 rounded-2xl bg-slate-50 px-3 py-2">
                    <p className="text-[11.5px] font-extrabold text-slate-700">{plan.title}</p>
                    <p className="text-[11.5px] text-slate-500">1회차 · {plan.goal}</p>
                    <p className="text-[11.5px] text-slate-500">2회차 · {plan.plan2}</p>
                  </div>
                ) : null;
              })()}
            </Card>

            <Card className="p-4">
              <p className="text-[13px] font-extrabold text-slate-800">이 학생에게만 추가 배정</p>
              <p className="mt-0.5 text-[11.5px] text-slate-500">반 공통 자료와 별개로 붙입니다.</p>
              <div className="mt-2 max-h-[260px] space-y-1 overflow-y-auto">
                {materials.map((m) => {
                  const on = materialStore.localExtras(student?.id ?? '').includes(m.id);
                  return (
                    <label key={m.id} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={(e) => student && materialStore.setExtra(student.id, m.id, e.target.checked)}
                      />
                      <span className="min-w-0 flex-1 truncate text-[12px] text-slate-700">
                        {m.week ?? '-'}주 {m.session ?? '-'}회차 · {m.title}
                      </span>
                      {on ? <Badge tone="mint">배정됨</Badge> : null}
                    </label>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {/* -------------------------------- 등록 폼 -------------------------------- */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={form.id ? '자료 수정' : '자료 등록'}>
        <div className="space-y-2.5">
          <div className="flex gap-1.5">
            <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as MaterialKind })} className="flex-1 rounded-xl border border-slate-200 px-2 py-2 text-[12px] font-bold">
              {(Object.keys(KIND_LABEL) as MaterialKind[]).map((k) => (
                <option key={k} value={k}>{KIND_LABEL[k]}</option>
              ))}
            </select>
            <select value={form.track} onChange={(e) => setForm({ ...form, track: asTrack(e.target.value) })} className="flex-1 rounded-xl border border-slate-200 px-2 py-2 text-[12px] font-bold">
              {TRACK_LIST.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-1.5">
            <select value={form.week} onChange={(e) => setForm({ ...form, week: Number(e.target.value) })} className="flex-1 rounded-xl border border-slate-200 px-2 py-2 text-[12px] font-bold">
              {CURRICULUM[form.track].map((w) => (
                <option key={w.week} value={w.week}>{w.week}주차</option>
              ))}
            </select>
            <select value={form.session} onChange={(e) => setForm({ ...form, session: Number(e.target.value) === 2 ? 2 : 1 })} className="flex-1 rounded-xl border border-slate-200 px-2 py-2 text-[12px] font-bold">
              <option value={1}>1회차</option>
              <option value={2}>2회차</option>
            </select>
          </div>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="제목" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] font-bold" />
          <input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="오늘의 목표 (한 줄)" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[12.5px]" />
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="학생 화면에 보일 설명 (여러 줄 가능)" rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[12.5px]" />
          <input value={form.aiTip} onChange={(e) => setForm({ ...form, aiTip: e.target.value })} placeholder="AI 틈틈이 힌트 (학생에게 보임)" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[12.5px]" />
          <textarea value={form.teacherNote} onChange={(e) => setForm({ ...form, teacherNote: e.target.value })} placeholder="교사용 수업안 메모 (학생에게 안 보임)" rows={3} className="w-full rounded-xl border border-rose-200 bg-rose-50/40 px-3 py-2 text-[12.5px]" />
          <textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="정답 코드 (학생에게 절대 안 보임)" rows={3} className="w-full rounded-xl border border-rose-200 bg-rose-50/40 px-3 py-2 font-mono text-[12px]" />
          <label className="flex items-center gap-2 text-[12px] font-bold text-slate-600">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            학생에게 공개
          </label>
          <Button className="w-full" onClick={save}>저장</Button>
          <p className="text-center text-[10.5px] text-slate-400">저장 시각 {todayStr()}</p>
        </div>
      </Modal>
    </div>
  );
}
