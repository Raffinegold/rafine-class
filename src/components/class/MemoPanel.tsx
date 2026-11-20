import { useState } from 'react';
import type { Student } from '../../types';
import { useClassStore } from '../../lib/classStore';
import { todayStr } from '../../lib/util';
import { Button, Card, SectionTitle, useToast } from '../ui';

/** 수업 직후 10초 안에 남기는 1줄 메모 — 세 칸이면 충분합니다. */
export default function MemoPanel({ student }: { student: Student }) {
  const cls = useClassStore();
  const toast = useToast();
  const [form, setForm] = useState({ date: todayStr(), made: '', good: '', todo: '' });
  const memos = cls.memosFor(student.id);

  const save = () => {
    if (!form.made.trim() && !form.good.trim() && !form.todo.trim()) {
      toast('한 칸이라도 적어 주세요', 'err');
      return;
    }
    cls.addMemo({ student_id: student.id, ...form });
    setForm({ date: todayStr(), made: '', good: '', todo: '' });
    toast(`${student.name} 수업 메모를 저장했어요 ✍️`);
  };

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
      <Card className="space-y-3">
        <SectionTitle sub="세 칸만 채우면 월말 리포트의 재료가 됩니다">오늘 수업 1줄 메모</SectionTitle>

        <label className="flex items-center gap-2">
          <span className="w-10 shrink-0 text-[12px] font-bold text-slate-500">날짜</span>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
          />
        </label>

        <MemoField
          label="오늘 만든 것"
          testId="memo-made"
          value={form.made}
          placeholder="예) 터치하면 점수 오르는 파트"
          onChange={(v) => setForm({ ...form, made: v })}
          onEnter={save}
        />
        <MemoField
          label="잘한 점"
          testId="memo-good"
          value={form.good}
          placeholder="예) 오류를 스스로 찾아 고쳤어요"
          onChange={(v) => setForm({ ...form, good: v })}
          onEnter={save}
        />
        <MemoField
          label="보완할 점"
          testId="memo-todo"
          value={form.todo}
          placeholder="예) 저장을 자주 누르기"
          onChange={(v) => setForm({ ...form, todo: v })}
          onEnter={save}
        />

        <Button className="w-full" size="lg" onClick={save} data-testid="memo-save">
          저장
        </Button>
      </Card>

      <Card className="space-y-3">
        <SectionTitle sub={`${student.name} · 최근 ${Math.min(memos.length, 8)}개`}>지난 수업 메모</SectionTitle>
        {memos.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-slate-400">아직 메모가 없어요. 오늘 수업부터 남겨 보세요.</p>
        ) : (
          <ul className="space-y-2">
            {memos.slice(0, 8).map((m) => (
              <li key={m.id} className="rounded-2xl bg-slate-50/80 p-3.5" data-testid={`memo-item-${m.date}`}>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-slate-500">
                    {m.date.replace(/-/g, '.')}
                  </span>
                  <button
                    onClick={() => {
                      if (!window.confirm('이 메모를 삭제할까요?')) return;
                      cls.deleteMemo(m.id);
                      toast('메모를 삭제했어요');
                    }}
                    className="rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-white hover:text-rose-500"
                  >
                    삭제
                  </button>
                </div>
                <dl className="mt-2 space-y-1 text-[13px] leading-relaxed">
                  {m.made ? (
                    <div className="flex gap-2">
                      <dt className="w-[64px] shrink-0 font-bold text-slate-400">만든 것</dt>
                      <dd className="flex-1 text-slate-700">{m.made}</dd>
                    </div>
                  ) : null}
                  {m.good ? (
                    <div className="flex gap-2">
                      <dt className="w-[64px] shrink-0 font-bold text-emerald-500">잘한 점</dt>
                      <dd className="flex-1 text-slate-700">{m.good}</dd>
                    </div>
                  ) : null}
                  {m.todo ? (
                    <div className="flex gap-2">
                      <dt className="w-[64px] shrink-0 font-bold text-amber-500">보완</dt>
                      <dd className="flex-1 text-slate-700">{m.todo}</dd>
                    </div>
                  ) : null}
                </dl>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function MemoField({
  label,
  value,
  placeholder,
  onChange,
  onEnter,
  testId,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  testId: string;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-10 shrink-0 text-[12px] font-bold text-slate-500">{label}</span>
      <input
        data-testid={testId}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onEnter();
        }}
        className="w-full rounded-xl border border-slate-200 px-3 py-3 text-[14px] outline-none focus:border-brand-400"
      />
    </label>
  );
}
