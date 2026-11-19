import { useSubject } from '../subject-context';
import { SUBJECT_META } from '../types';
import { cn } from '../lib/util';

/**
 * 📚 영어 ↔ 💻 코딩 원터치 전환 스위치.
 * 원장님이 두 과목을 모두 열어 준 학생에게만 보입니다.
 */
export default function SubjectSwitch() {
  const { allowed, subject, setSubject, canSwitch } = useSubject();
  if (!canSwitch) return null;

  return (
    <div
      data-testid="subject-switch"
      role="tablist"
      aria-label="과목 선택"
      className="flex w-full items-center gap-1 rounded-2xl bg-slate-100 p-1"
    >
      {allowed.map((s) => {
        const active = subject === s;
        return (
          <button
            key={s}
            role="tab"
            aria-selected={active}
            data-testid={`subject-${s}`}
            onClick={() => setSubject(s)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-xl px-2 py-1.5 text-[12px] font-bold transition active:scale-[0.98]',
              active
                ? s === 'coding'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-400'
            )}
          >
            <span>{SUBJECT_META[s].icon}</span>
            {SUBJECT_META[s].short}
          </button>
        );
      })}
    </div>
  );
}
