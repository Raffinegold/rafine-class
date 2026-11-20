import { useEffect, useMemo, useState } from 'react';
import { useVocaStore } from '../../app-context';
import { useClassStore } from '../../lib/classStore';
import { asTrack, CURRICULUM, TRACK_LIST, TRACK_META, type Track } from '../../lib/curriculum';
import { materialStore, useMaterialStore } from '../../lib/materialStore';
import { cn, todayStr } from '../../lib/util';
import { Badge, Button, Card, Modal, useToast } from '../../components/ui';
import MaterialContentView from '../../components/MaterialContentView';
import type { Material, MaterialKind } from '../../types';

/**
 * 📂 수업자료 — 수업 중에 아이들과 같이 띄워 보는 학생용 자료 (2026-11-20)
 *
 *  1) 수업 중 보기 — 학생 화면과 100% 같은 화면(같은 컴포넌트)으로 미리 봅니다.
 *  2) 자료 등록·수정 — 학생 화면에 나가는 내용만 편집합니다.
 *  3) 학생 배정 — 학생마다 과정·주차·회차 숫자 + 특정 자료 추가 배정
 *
 *  선생님용 수업안(teacher_guide)·정답 코드(answer_code)는 📖 수업안 탭에서 다룹니다.
 *  두 필드는 DB(materials)에 그대로 남아 있고, 학생 RPC 결과에는 담기지 않습니다.
 */

type SubTab = 'preview' | 'list' | 'assign';

const KIND_LABEL: Record<MaterialKind, string> = {
  theory: '이론',
  code: '예제 코드',
  upgrade: '업그레이드',
  image: '그림',
  link: '링크',
};

const KIND_META: Record<string, { label: string; icon: string; tone: string }> = {
  theory: { label: '이론 · 따라 만들기', icon: '📘', tone: 'bg-emerald-50 text-emerald-700' },
  code: { label: '예제 코드', icon: '💻', tone: 'bg-sky-50 text-sky-700' },
  upgrade: { label: '업그레이드 미션', icon: '🚀', tone: 'bg-amber-50 text-amber-700' },
  image: { label: '그림 자료', icon: '🖼️', tone: 'bg-violet-50 text-violet-700' },
  link: { label: '참고 링크', icon: '🔗', tone: 'bg-slate-100 text-slate-600' },
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
  published: true,
  sortNo: 10,
};

export default function MaterialsPanel({ onGoGuides }: { onGoGuides?: () => void }) {
  const store = useVocaStore();
  const cls = useClassStore();
  const ms = useMaterialStore();
  const toast = useToast();

  const [sub, setSub] = useState<SubTab>('preview');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formOpen, setFormOpen] = useState(false);
  const [assignId, setAssignId] = useState('');
  const [track, setTrack] = useState<Track>('python');
  const [week, setWeek] = useState(1);
  const [session, setSession] = useState<1 | 2>(1);

  // 수업 중 보기
  const [previewStudentId, setPreviewStudentId] = useState('');
  const [previewTrack, setPreviewTrack] = useState<Track>('python');
  const [previewWeek, setPreviewWeek] = useState(1);
  const [previewSession, setPreviewSession] = useState<1 | 2>(1);

  // 자료 목록 필터
  const [listTrack, setListTrack] = useState<Track | 'all'>('all');

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
    if (!students.some((s) => s.id === previewStudentId)) setPreviewStudentId(students[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students]);

  const student = students.find((s) => s.id === assignId) ?? null;
  const currentAssignment =
    ms.mode === 'cloud' ? ms.assignments.find((a) => a.student_id === assignId) ?? null : materialStore.localAssignment(assignId);

  /** 학생별 배정(과정·주차·회차) — 클라우드는 목록, 로컬은 localStorage */
  const assignmentOf = (studentId: string) =>
    ms.mode === 'cloud' ? ms.assignments.find((a) => a.student_id === studentId) ?? null : materialStore.localAssignment(studentId);

  const pickStudent = (id: string) => {
    setAssignId(id);
    const a = assignmentOf(id);
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

  // 미리보기 — 학생이 바뀌면 그 학생의 배정으로 맞춥니다
  useEffect(() => {
    if (!previewStudentId) return;
    const a = assignmentOf(previewStudentId);
    const st = students.find((s) => s.id === previewStudentId);
    const profile = st ? cls.profile(st.id, st.coding_level) : null;
    setPreviewTrack(asTrack(a?.track ?? profile?.track ?? 'python'));
    setPreviewWeek(Number(a?.week ?? (st ? Math.min(cls.nextWeek(st.id), 24) : 1)));
    setPreviewSession((Number(a?.session ?? 1) === 2 ? 2 : 1) as 1 | 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewStudentId, ms.version]);

  const openEdit = (m: Material) => {
    const custom = (m.student_content?.steps ?? []).find((s) => s.title === '선생님이 올린 자료');
    setForm({
      id: m.id,
      kind: m.kind,
      title: m.title,
      track: asTrack(m.track, 'python'),
      week: m.week ?? 1,
      session: (m.session === 2 ? 2 : 1) as 1 | 2,
      summary: m.summary ?? '',
      body: custom?.note ?? '',
      aiTip: m.ai_tip ?? '',
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
    const prevSteps = existing?.student_content?.steps ?? [];
    const otherSteps = prevSteps.filter((s) => s.title !== '선생님이 올린 자료');
    const body = form.body.trim();
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
        steps: body ? [...otherSteps, { title: '선생님이 올린 자료', note: body }] : otherSteps.length ? otherSteps : undefined,
      },
      // 수업안·정답은 📖 수업안 탭에서만 바꿉니다 — 저장할 때 기존 값을 그대로 보존
      teacher_guide: existing?.teacher_guide ?? null,
      answer_code: existing?.answer_code ?? null,
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

  /* ------------------------------ 수업 중 보기 ------------------------------ */

  const previewStudent = students.find((s) => s.id === previewStudentId) ?? null;
  const previewExtras = materialStore.localExtras(previewStudentId);
  const previewList = materials
    .filter((m) => m.published !== false)
    .filter((m) => (m.track ? m.track === previewTrack : true) || previewExtras.includes(m.id))
    .filter((m) => (m.week ? m.week === previewWeek : true) || previewExtras.includes(m.id))
    .filter((m) => (m.session ? m.session === previewSession : true))
    .sort((a, b) => a.sort_no - b.sort_no);
  const previewPlan = CURRICULUM[previewTrack].find((w) => w.week === previewWeek);
  const previewMeta = TRACK_META[previewTrack];

  const listMaterials = materials
    .filter((m) => listTrack === 'all' || asTrack(m.track, 'python') === listTrack)
    .sort((a, b) => (a.week ?? 0) - (b.week ?? 0) || (a.session ?? 0) - (b.session ?? 0) || a.sort_no - b.sort_no);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[17px] font-extrabold text-slate-900">📂 수업자료 · 수업 중 함께 보는 자료</h2>
          <p className="mt-0.5 text-[11.5px] text-slate-500">
            {ms.mode === 'cloud' ? 'Supabase 실시간 연결 — 저장하면 학생 화면에 바로 반영됩니다' : '데모(로컬) 모드 — 이 브라우저에만 저장됩니다'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {onGoGuides ? (
            <Button size="sm" variant="ghost" onClick={onGoGuides} data-testid="go-guides">
              📖 수업안은 여기서
            </Button>
          ) : null}
          <Button size="sm" variant="soft" onClick={() => { setForm({ ...EMPTY_FORM }); setFormOpen(true); }}>
            + 자료 등록
          </Button>
        </div>
      </div>

      <div className="flex gap-1.5">
        {([
          ['preview', '수업 중 보기'],
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

      {/* ------------------------------ 1) 수업 중 보기 ------------------------------ */}
      {sub === 'preview' ? (
        <div className="space-y-3">
          <Card className="p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11.5px] font-extrabold text-slate-400">이 학생 화면으로</span>
              <select
                value={previewStudentId}
                onChange={(e) => setPreviewStudentId(e.target.value)}
                className="rounded-xl border border-slate-200 px-2.5 py-2 text-[12px] font-bold"
                data-testid="preview-student"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.class_name}
                  </option>
                ))}
              </select>
              <select
                value={previewTrack}
                onChange={(e) => setPreviewTrack(asTrack(e.target.value))}
                className="rounded-xl border border-slate-200 px-2.5 py-2 text-[12px] font-bold"
              >
                {TRACK_LIST.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.emoji} {t.label}
                  </option>
                ))}
              </select>
              <select
                value={previewWeek}
                onChange={(e) => setPreviewWeek(Number(e.target.value))}
                className="rounded-xl border border-slate-200 px-2.5 py-2 text-[12px] font-bold"
              >
                {CURRICULUM[previewTrack].map((w) => (
                  <option key={w.week} value={w.week}>
                    {w.week}주차
                  </option>
                ))}
              </select>
              <div className="flex gap-1">
                {([1, 2] as (1 | 2)[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setPreviewSession(s)}
                    className={cn(
                      'rounded-xl px-2.5 py-2 text-[11.5px] font-extrabold',
                      previewSession === s ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-500'
                    )}
                  >
                    {s}회차
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
              실제 학생 화면과 같은 컴포넌트로 그립니다. ‘다 봤어요’ 버튼은 미리보기에서만 숨겨져 있고, 자료 내용은 학생이 보는 것과 같습니다.
            </p>
          </Card>

          {/* 학생 화면 그대로 */}
          <div className="rounded-1xl bg-slate-50/60">
            <Card className="overflow-hidden p-0">
              <div className="bg-gradient-to-br from-brand-600 to-indigo-700 px-4 py-4 text-white">
                <p className="text-[11px] font-bold text-white/70">선생님이 배정한 과정</p>
                <p className="mt-0.5 text-[19px] font-extrabold leading-tight">
                  {previewMeta.emoji} {previewMeta.label}
                </p>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="rounded-xl bg-white/15 px-3 py-1.5 text-[13px] font-extrabold">{previewWeek}주차</span>
                  <span className={cn('rounded-xl px-3 py-1.5 text-[13px] font-extrabold', previewSession === 1 ? 'bg-white text-brand-700' : 'bg-white/15 text-white/80')}>
                    1회차 · 이론+만들기
                  </span>
                  <span className={cn('rounded-xl px-3 py-1.5 text-[13px] font-extrabold', previewSession === 2 ? 'bg-white text-brand-700' : 'bg-white/15 text-white/80')}>
                    2회차 · 마무리+업그레이드
                  </span>
                </div>
                {previewPlan ? (
                  <p className="mt-2 text-[12px] leading-relaxed text-white/80">
                    {previewPlan.title} — {previewSession === 1 ? previewPlan.goal : previewPlan.plan2}
                  </p>
                ) : null}
              </div>
            </Card>

            <p className="mt-3 text-[11.5px] font-extrabold text-slate-500">
              {previewSession === 1 ? '1회차 수업자료' : '2회차 수업자료'} · {previewList.length}개
              {previewStudent ? <span className="ml-1 font-bold text-slate-400">({previewStudent.name} 화면 미리보기)</span> : null}
            </p>

            {!previewList.length ? (
              <Card className="mt-2 p-6 text-center">
                <p className="text-3xl">📭</p>
                <p className="mt-2 text-[13.5px] font-bold text-slate-700">이 주차 자료는 아직 없어요</p>
                <p className="mt-1 text-[12px] text-slate-500">‘자료 등록·수정’에서 올리면 학생 화면에 바로 나타납니다.</p>
              </Card>
            ) : null}

            <div className="mt-2 space-y-3">
              {previewList.map((m) => {
                const kind = KIND_META[m.kind] ?? KIND_META.theory;
                return (
                  <Card key={m.id} className="p-4" data-testid="preview-material-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-extrabold', kind.tone)}>
                          {kind.icon} {kind.label}
                        </span>
                        <p className="mt-1.5 text-[15px] font-extrabold leading-snug text-slate-900">{m.title}</p>
                        {m.summary ? <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{m.summary}</p> : null}
                      </div>
                      {!m.published ? <Badge tone="slate">비공개</Badge> : null}
                    </div>
                    <div className="mt-3">
                      <MaterialContentView material={m} token={null} studentId={previewStudentId} revealAll showDone={false} />
                    </div>
                  </Card>
                );
              })}
            </div>

            <p className="mt-4 rounded-2xl bg-white px-3 py-2 text-[11px] leading-relaxed text-slate-400">
              📖 선생님용 수업안(진행표·비유·판서·코치 멘트·정답)은 이 화면에 나오지 않습니다. ‘📖 수업안’ 탭에서 확인하세요.
            </p>
          </div>
        </div>
      ) : null}

      {/* ---------------------------- 2) 자료 등록·수정 ---------------------------- */}
      {sub === 'list' ? (
        <Card className="p-3">
          <div className="flex flex-wrap items-center gap-1.5 px-1 pb-2">
            <select
              value={listTrack}
              onChange={(e) => setListTrack(e.target.value === 'all' ? 'all' : asTrack(e.target.value))}
              className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-[11.5px] font-bold"
            >
              <option value="all">전체 과정</option>
              {TRACK_LIST.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.emoji} {t.label}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-400">{listMaterials.length}개</span>
          </div>
          <div className="divide-y divide-slate-100">
            {listMaterials.map((m) => {
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
                    <p className="text-[11px] text-slate-400">
                      열람 {views.length}명 · 완료 {doneCount}명
                      {m.teacher_guide || m.answer_code ? ' · 📖 수업안 있음' : ''}
                    </p>
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
            {!listMaterials.length ? <p className="py-8 text-center text-[13px] text-slate-400">자료가 없습니다</p> : null}
          </div>
        </Card>
      ) : null}

      {/* ------------------------------ 3) 학생 배정 ------------------------------ */}
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
                {listMaterials.map((m) => {
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
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={form.id ? '수업자료 수정' : '수업자료 등록'}>
        <div className="max-h-[70vh] space-y-2.5 overflow-y-auto pr-1">
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11.5px] leading-relaxed text-slate-500">
            학생 화면에 나가는 내용만 적습니다. 선생님용 수업안·정답 코드는 저장 후 <b>📖 수업안</b> 탭에서 작성하세요.
          </p>
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
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="학생 화면에 보일 설명 (여러 줄 가능)" rows={5} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[12.5px]" />
          <input value={form.aiTip} onChange={(e) => setForm({ ...form, aiTip: e.target.value })} placeholder="AI 틈틈이 힌트 (학생에게 보임)" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[12.5px]" />
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-[12px] font-bold text-slate-600">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              학생에게 공개
            </label>
            <input
              type="number"
              value={form.sortNo}
              onChange={(e) => setForm({ ...form, sortNo: Number(e.target.value) })}
              className="ml-auto w-20 rounded-xl border border-slate-200 px-2 py-1.5 text-[12px] font-bold"
              title="정렬 순서"
            />
          </div>
          <Button className="w-full" onClick={save}>저장</Button>
          <p className="text-center text-[10.5px] text-slate-400">저장 시각 {todayStr()}</p>
        </div>
      </Modal>
    </div>
  );
}
