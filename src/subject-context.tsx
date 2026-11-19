import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useVocaStore } from './app-context';
import type { Student, Subject } from './types';

/**
 * 학생이 지금 보고 있는 과목 (💻 코딩 / 📚 영어).
 * - 라피네 클래스는 코딩 학원 앱이라 기본 첫 화면은 항상 💻 코딩입니다.
 * - 원장님이 TOSEL 영어 학습을 켜 준 학생만 위쪽 전환 스위치가 보입니다.
 * - 한 과목만 열려 있으면 그 과목으로 고정되고 전환 스위치가 숨겨집니다.
 * - 고른 과목은 학생별로 브라우저에 기억됩니다.
 */
const KEY_PREFIX = 'rafine-voca-subject-v2-';

/** 원장님이 따로 열어 주지 않은 학생의 기본 과목 */
export const DEFAULT_SUBJECT: Subject = 'coding';

interface SubjectCtxValue {
  subject: Subject;
  setSubject: (s: Subject) => void;
  allowed: Subject[];
  canSwitch: boolean;
}

const Ctx = createContext<SubjectCtxValue>({
  subject: 'coding',
  setSubject: () => {},
  allowed: ['coding'],
  canSwitch: false,
});

function readStored(studentId?: string): Subject | null {
  if (!studentId || typeof localStorage === 'undefined') return null;
  try {
    const v = localStorage.getItem(KEY_PREFIX + studentId);
    return v === 'english' || v === 'coding' ? v : null;
  } catch {
    return null;
  }
}

export function SubjectProvider({ student, children }: { student: Student | null; children: ReactNode }) {
  // store 가 바뀌면(원장님이 권한을 바꾸면) 학생 객체가 제자리에서 수정되므로 버전을 함께 구독합니다
  const store = useVocaStore();
  const [picked, setPicked] = useState<Subject | null>(() => readStored(student?.id));

  useEffect(() => {
    setPicked(readStored(student?.id));
  }, [student?.id]);

  const allowed = useMemo<Subject[]>(() => {
    const raw = student?.enabled_subjects ?? [DEFAULT_SUBJECT];
    // 코딩을 먼저 두어, 아직 고르지 않은 학생은 항상 코딩 화면으로 들어갑니다
    const clean = (['coding', 'english'] as Subject[]).filter((s) => raw.includes(s));
    return clean.length ? clean : [DEFAULT_SUBJECT];
    // store.version 을 의존성에 두어 권한 변경이 즉시 반영되게 합니다
  }, [student, store.version]);

  const subject: Subject = picked && allowed.includes(picked) ? picked : allowed[0];

  const setSubject = useCallback(
    (next: Subject) => {
      if (!allowed.includes(next)) return;
      setPicked(next);
      if (!student) return;
      try {
        localStorage.setItem(KEY_PREFIX + student.id, next);
      } catch {
        /* ignore */
      }
    },
    [allowed, student]
  );

  const value = useMemo<SubjectCtxValue>(
    () => ({ subject, setSubject, allowed, canSwitch: allowed.length > 1 }),
    [subject, setSubject, allowed]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSubject = () => useContext(Ctx);
