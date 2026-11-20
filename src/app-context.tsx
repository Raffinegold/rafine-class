import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { store } from './lib/store';
import { todayStr } from './lib/util';
import type { Session, Student } from './types';

export function useVocaStore() {
  useSyncExternalStore(store.subscribe, store.getVersion, store.getVersion);
  return store;
}

const SESSION_KEY = 'rafine-voca-session-v1';

interface SessionCtx {
  session: Session | null;
  student: Student | null;
  loginStudent: (studentId: string) => void;
  loginAdmin: () => void;
  logout: () => void;
}

const Ctx = createContext<SessionCtx>({
  session: null,
  student: null,
  loginStudent: () => {},
  loginAdmin: () => {},
  logout: () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const version = useSyncExternalStore(store.subscribe, store.getVersion, store.getVersion);
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  });

  const persist = useCallback((s: Session | null) => {
    setSession(s);
    try {
      if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const loginStudent = useCallback(
    (studentId: string) => {
      const st = store.getStudent(studentId);
      if (!st) return;
      persist({ role: 'student', studentId, name: st.name });
    },
    [persist]
  );

  const loginAdmin = useCallback(() => persist({ role: 'admin' }), [persist]);
  const logout = useCallback(() => {
    // 학생 토큰도 함께 지웁니다 — 다음 학생 화면에 이전 학생 자료가 이어지지 않게
    store.clearStudentToken();
    persist(null);
  }, [persist]);

  const student = useMemo(() => {
    if (session?.role !== 'student' || !session.studentId) return null;
    return store.getStudent(session.studentId) ?? null;
  }, [session, version]);

  const value = useMemo(
    () => ({ session, student, loginStudent, loginAdmin, logout }),
    [session, student, loginStudent, loginAdmin, logout]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);

/** 그날 배정을 80% 이상 풀었는지 (완료 = 스트릭 1일) */
export function useTodayDone(student: Student | null) {
  const version = useSyncExternalStore(store.subscribe, store.getVersion, store.getVersion);
  return useMemo(() => {
    if (!student) return false;
    const p = store.progressFor(student.id).find((x) => x.date === todayStr());
    return !!p && p.target > 0 && p.answered >= Math.ceil(p.target * 0.8);
  }, [student, version]);
}
