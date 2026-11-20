import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession, useVocaStore } from '../../app-context';
import { useClassStore } from '../../lib/classStore';
import { TRACK_LIST, type Track } from '../../lib/curriculum';
import { parseMindCode } from '../../lib/mind';
import { cn } from '../../lib/util';
import { Button, Modal, useToast } from '../../components/ui';
import type { CodingLevel, Subject } from '../../types';
import MindPanel from '../../components/class/MindPanel';
import MemoPanel from '../../components/class/MemoPanel';
import ReportPanel from '../../components/class/ReportPanel';

type Step = 'mind' | 'memo' | 'report';

const STEPS: { key: Step; no: string; label: string; sub: string; icon: string }[] = [
  { key: 'mind', no: '1', label: '기질 · 진도', sub: 'RC 코드와 24주', icon: '🧠' },
  { key: 'memo', no: '2', label: '수업 메모', sub: '오늘 1줄', icon: '✍️' },
  { key: 'report', no: '3', label: '월말 리포트', sub: '한 번에 생성', icon: '📄' },
];

export default function AdminClassPage() {
  const store = useVocaStore();
  const cls = useClassStore();
  const { logout } = useSession();
  const navigate = useNavigate();

  const students = store.listStudents(true);
  const activeStudents = useMemo(() => students.filter((s) => s.active), [students]);
  const [selectedId, setSelectedId] = useState('');
  const [step, setStep] = useState<Step>('mind');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (store.mode === 'supabase') void cls.pullCloud();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.mode]);

  useEffect(() => {
    if (!activeStudents.length) return;
    if (!activeStudents.some((s) => s.id === selectedId)) setSelectedId(activeStudents[0].id);
  }, [activeStudents, selectedId]);

  const student = activeStudents.find((s) => s.id === selectedId) ?? activeStudents[0] ?? null;

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/90 backdrop-blur no-print">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-brand-600 text-base text-white shadow-soft">🎓</span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold leading-tight text-slate-400">라피네코딩 두정점 · 원장 모드</p>
                <p className="truncate text-[15px] font-extrabold leading-tight text-slate-900">라피네 클래스</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Link
                to="/admin/tools"
                className="rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:bg-slate-50"
                data-testid="admin-tools-link"
              >
                관리 도구
              </Link>
              <button
                onClick={logout}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-4">
        {/* ------------------------------ 학생 선택 ------------------------------ */}
        <section className="rounded-3xl border border-white bg-white p-4 shadow-soft no-print">
          <div className="flex items-end justify-between">
            <p className="text-[11px] font-extrabold text-slate-400">오늘 볼 학생</p>
            <div className="flex items-center gap-1.5">
              {student ? (
                <button
                  onClick={() => setEditOpen(true)}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:bg-slate-50"
                  data-testid="student-edit"
                >
                  정보 수정
                </button>
              ) : null}
              <button
                onClick={() => setAddOpen(true)}
                className="rounded-full bg-brand-50 px-3 py-1.5 text-[11px] font-extrabold text-brand-700 hover:bg-brand-100"
                data-testid="student-add"
              >
                + 새 학생
              </button>
            </div>
          </div>
          {student ? (
            <>
              <select
                data-testid="student-select"
                value={student.id}
                onChange={(e) => setSelectedId(e.target.value)}
                className="mt-2 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[17px] font-extrabold text-slate-900 outline-none focus:border-brand-400"
              >
                {activeStudents.map((s) => {
                  const p = cls.profile(s.id, s.coding_level);
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.grade}학년 · {TRACK_LIST.find((t) => t.key === p.track)?.label}
                      {p.code ? ` · ${p.code}` : ''}
                    </option>
                  );
                })}
              </select>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {(() => {
                  const p = cls.profile(student.id, student.coding_level);
                  const t = TRACK_LIST.find((x) => x.key === p.track);
                  return (
                    <>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${t?.tone ?? 'bg-slate-100 text-slate-600'}`}>
                        {t?.emoji} {t?.label}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                        24주 중 {cls.doneWeeks(student.id).length}주
                      </span>
                      {p.code ? (
                        <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold tracking-wider text-white">{p.code}</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-400">기질 코드 없음</span>
                      )}
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-[11px] font-bold',
                          student.enabled_subjects.includes('english')
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-400'
                        )}
                        data-testid="student-tosel-badge"
                      >
                        📚 TOSEL 영어 {student.enabled_subjects.includes('english') ? 'ON' : 'OFF'}
                      </span>
                    </>
                  );
                })()}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {STEPS.map((s) => (
                  <button
                    key={s.key}
                    data-testid={`step-${s.key}`}
                    onClick={() => setStep(s.key)}
                    className={cn(
                      'rounded-2xl border px-1 py-2.5 text-center transition',
                      step === s.key
                        ? 'border-brand-200 bg-brand-600 text-white shadow-soft'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    )}
                  >
                    <span
                      className={cn(
                        'mx-auto grid h-6 w-6 place-items-center rounded-full text-[11px] font-extrabold',
                        step === s.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      )}
                    >
                      {s.no}
                    </span>
                    <span className="mt-1 block text-[12px] font-extrabold leading-tight">{s.label}</span>
                    <span className={cn('mt-0.5 block text-[10px] font-semibold', step === s.key ? 'text-white/70' : 'text-slate-400')}>
                      {s.sub}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="py-4 text-center text-sm text-slate-400">활성 학생이 없어요. ‘+ 새 학생’으로 등록해 주세요.</p>
          )}
        </section>

        <div className="mt-4">
          {student ? (
            step === 'mind' ? (
              <MindPanel student={student} />
            ) : step === 'memo' ? (
              <MemoPanel student={student} />
            ) : (
              <ReportPanel student={student} onGoMemo={() => setStep('memo')} />
            )
          ) : null}
        </div>
      </main>

      <StudentModals
        addOpen={addOpen}
        closeAdd={() => setAddOpen(false)}
        editOpen={editOpen}
        closeEdit={() => setEditOpen(false)}
        student={student}
        onCreated={(id) => {
          setSelectedId(id);
          setStep('mind');
        }}
        onGoTools={() => navigate('/admin/tools')}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 학생 추가 / 수정 모달                                                       */
/* -------------------------------------------------------------------------- */

function StudentModals({
  addOpen,
  closeAdd,
  editOpen,
  closeEdit,
  student,
  onCreated,
  onGoTools,
}: {
  addOpen: boolean;
  closeAdd: () => void;
  editOpen: boolean;
  closeEdit: () => void;
  student: { id: string; name: string; grade: number; coding_level: string; enabled_subjects: Subject[] } | null;
  onCreated: (id: string) => void;
  onGoTools: () => void;
}) {
  const store = useVocaStore();
  const cls = useClassStore();
  const toast = useToast();
  const [issuedPin, setIssuedPin] = useState<{ name: string; pin: string } | null>(null);

  const [addForm, setAddForm] = useState({ name: '', grade: 3, track: 'scratch' as Track, code: '', tosel: false });
  const [editForm, setEditForm] = useState({ name: '', grade: 3, track: 'scratch' as Track, code: '', tosel: false });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!student) return;
    const p = cls.profile(student.id, student.coding_level);
    setEditForm({
      name: student.name,
      grade: student.grade,
      track: p.track,
      code: p.code,
      tosel: student.enabled_subjects.includes('english'),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id, editOpen]);

  const addCodeOk = !addForm.code.trim() || parseMindCode(addForm.code).ok;
  const editCodeOk = !editForm.code.trim() || parseMindCode(editForm.code).ok;

  const add = async () => {
    if (!addForm.name.trim()) {
      toast('이름을 적어 주세요', 'err');
      return;
    }
    if (!addCodeOk) {
      toast('기질 코드 형식을 확인해 주세요 (예: RC-14E1)', 'err');
      return;
    }
    setBusy(true);
    try {
      const codingLevel = addForm.track === 'python' ? 'C2' : addForm.track === 'roblox' ? 'C3' : addForm.track === 'unity' ? 'C4' : 'C1';
      const res = await store.addStudent({
        name: addForm.name,
        grade: Number(addForm.grade),
        class_name: '라피네 클래스',
        nickname: addForm.name,
        level: 1,
        coding_level: codingLevel as CodingLevel,
        // 기본은 코딩만 — TOSEL 영어 학습을 켠 학생만 📚 영어 토글이 보입니다
        enabled_subjects: addForm.tosel ? ['coding', 'english'] : ['coding'],
      });
      cls.setProfile(res.student.id, {
        track: addForm.track,
        code: addForm.code.trim().toUpperCase(),
      });
      setIssuedPin({ name: res.student.name, pin: res.pin });
      closeAdd();
      setAddForm({ name: '', grade: 3, track: 'scratch', code: '', tosel: false });
      onCreated(res.student.id);
    } catch (err) {
      toast(err instanceof Error ? err.message : '학생 등록에 실패했어요', 'err');
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = () => {
    if (!student) return;
    if (!editForm.name.trim()) {
      toast('이름을 적어 주세요', 'err');
      return;
    }
    if (!editCodeOk) {
      toast('기질 코드 형식을 확인해 주세요 (예: RC-14E1)', 'err');
      return;
    }
    store.updateStudentBasic(student.id, { name: editForm.name, grade: Number(editForm.grade) });
    store.setStudentSubjects(student.id, editForm.tosel ? ['coding', 'english'] : ['coding']);
    cls.setProfile(student.id, { track: editForm.track, code: editForm.code.trim().toUpperCase() });
    toast('학생 정보를 저장했어요');
    closeEdit();
  };

  return (
    <>
      <Modal
        open={addOpen}
        onClose={closeAdd}
        title="새 학생 등록"
        footer={
          <>
            <Button variant="ghost" onClick={closeAdd}>
              취소
            </Button>
            <Button onClick={add} disabled={busy} data-testid="student-add-save">
              {busy ? '등록 중…' : '등록'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-[1.4fr_0.8fr] gap-3">
            <label className="block">
              <span className="text-xs font-bold text-slate-500">이름</span>
              <input
                data-testid="student-add-name"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="예) 김하늘"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-[15px] outline-none focus:border-brand-400"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-500">학년</span>
              <input
                type="number"
                min={1}
                max={12}
                value={addForm.grade}
                onChange={(e) => setAddForm({ ...addForm, grade: Number(e.target.value) })}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-3 text-[15px] outline-none focus:border-brand-400"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-bold text-slate-500">수강 트랙</span>
            <select
              value={addForm.track}
              onChange={(e) => setAddForm({ ...addForm, track: e.target.value as Track })}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-[15px] outline-none focus:border-brand-400"
            >
              {TRACK_LIST.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.emoji} {t.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            data-testid="student-add-tosel"
            onClick={() => setAddForm({ ...addForm, tosel: !addForm.tosel })}
            className={cn(
              'flex w-full items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left transition',
              addForm.tosel ? 'border-brand-200 bg-brand-50' : 'border-slate-200 bg-white'
            )}
          >
            <span>
              <span className="block text-[13px] font-bold text-slate-700">📚 TOSEL 영어 학습도 함께 쓰기</span>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">
                기본은 코딩만이에요. 영어 단어 학습을 같이 하는 학생만 켜 주세요.
              </span>
            </span>
            <span
              className={cn('relative h-6 w-11 shrink-0 rounded-full transition', addForm.tosel ? 'bg-brand-600' : 'bg-slate-200')}
              aria-hidden
            >
              <span
                className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
                  addForm.tosel ? 'left-[22px]' : 'left-0.5'
                )}
              />
            </span>
          </button>

          <label className="block">
            <span className="text-xs font-bold text-slate-500">기질 코드 RC-XXXX (선택)</span>
            <input
              value={addForm.code}
              onChange={(e) => setAddForm({ ...addForm, code: e.target.value.toUpperCase() })}
              placeholder="예) RC-14E1"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-[15px] tracking-wider outline-none focus:border-brand-400"
            />
            {!addCodeOk ? <span className="mt-1 block text-[11px] font-semibold text-rose-500">형식을 확인해 주세요 (예: RC-14E1)</span> : null}
          </label>
          <p className="text-[11px] leading-relaxed text-slate-400">
            등록하면 학생 PIN이 발급됩니다. 영어 레벨·코딩 레벨은 ‘관리 도구’에서 더 자세히 설정할 수 있어요.
            <button onClick={onGoTools} className="ml-2 font-bold text-brand-600 underline">
              관리 도구 열기
            </button>
          </p>
        </div>
      </Modal>

      <Modal
        open={editOpen}
        onClose={closeEdit}
        title="학생 정보 수정"
        footer={
          <>
            <Button variant="ghost" onClick={closeEdit}>
              취소
            </Button>
            <Button onClick={saveEdit} data-testid="student-edit-save">
              저장
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-[1.4fr_0.8fr] gap-3">
            <label className="block">
              <span className="text-xs font-bold text-slate-500">이름</span>
              <input
                data-testid="student-edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-[15px] outline-none focus:border-brand-400"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-500">학년</span>
              <input
                type="number"
                min={1}
                max={12}
                value={editForm.grade}
                onChange={(e) => setEditForm({ ...editForm, grade: Number(e.target.value) })}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-3 text-[15px] outline-none focus:border-brand-400"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-bold text-slate-500">수강 트랙</span>
            <select
              value={editForm.track}
              onChange={(e) => setEditForm({ ...editForm, track: e.target.value as Track })}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-[15px] outline-none focus:border-brand-400"
            >
              {TRACK_LIST.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.emoji} {t.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            data-testid="student-edit-tosel"
            onClick={() => setEditForm({ ...editForm, tosel: !editForm.tosel })}
            className={cn(
              'flex w-full items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left transition',
              editForm.tosel ? 'border-brand-200 bg-brand-50' : 'border-slate-200 bg-white'
            )}
          >
            <span>
              <span className="block text-[13px] font-bold text-slate-700">📚 TOSEL 영어 학습 사용</span>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">
                {editForm.tosel
                  ? '학생 화면 위에 📚 영어 / 💻 코딩 전환이 보입니다 (첫 화면은 코딩).'
                  : '코딩 화면만 보입니다. 켜면 영어 단어 학습과 영어 게임이 함께 열려요.'}
              </span>
            </span>
            <span
              className={cn('relative h-6 w-11 shrink-0 rounded-full transition', editForm.tosel ? 'bg-brand-600' : 'bg-slate-200')}
              aria-hidden
            >
              <span
                className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
                  editForm.tosel ? 'left-[22px]' : 'left-0.5'
                )}
              />
            </span>
          </button>

          <label className="block">
            <span className="text-xs font-bold text-slate-500">기질 코드 RC-XXXX</span>
            <input
              data-testid="student-edit-code"
              value={editForm.code}
              onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
              placeholder="예) RC-14E1"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-[15px] tracking-wider outline-none focus:border-brand-400"
            />
            {!editCodeOk ? <span className="mt-1 block text-[11px] font-semibold text-rose-500">형식을 확인해 주세요 (예: RC-14E1)</span> : null}
          </label>
        </div>
      </Modal>

      <Modal open={!!issuedPin} onClose={() => setIssuedPin(null)} title="학생 PIN 발급 완료">
        {issuedPin ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-slate-500">{issuedPin.name} 학생의 로그인 PIN이에요.</p>
            <p className="rounded-2xl bg-brand-50 py-4 text-3xl font-extrabold tracking-[0.3em] text-brand-700">
              {issuedPin.pin}
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              PIN은 지금 한 번만 보여 드려요. 종이에 적어 학생에게 전달해 주세요.
            </p>
            <Button className="w-full" onClick={() => setIssuedPin(null)}>
              확인
            </Button>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
