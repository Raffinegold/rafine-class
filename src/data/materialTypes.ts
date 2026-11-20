import type { MaterialKind, MaterialStudentContent, MaterialTeacherGuide } from '../types';
import type { Track } from '../lib/curriculum';

/**
 * 자료실 시드 한 줄 (2026-11-20)
 *  · student → 학생 화면에 그대로 나가는 내용 (정답·수업안 없음)
 *  · teacher → 새 선생님이 2시간을 그대로 진행할 수 있는 강의안 (학생에게 안 나감)
 *  · answer  → 전체 정답 코드 (학생에게 안 나감)
 */
export interface MaterialSeedRow {
  key: string;
  kind: MaterialKind;
  title: string;
  track: Track;
  week: number;
  session: 1 | 2;
  summary: string;
  sort: number;
  published: boolean;
  student: MaterialStudentContent;
  teacher?: MaterialTeacherGuide;
  answer?: string;
  aiTip?: string;
  linkUrl?: string;
  codeLang?: string;
}
