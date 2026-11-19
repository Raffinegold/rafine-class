import type { Student } from '../types';
import { classStore, monthLabel, type LessonMemo, type Work } from './classStore';
import { CURRICULUM, TRACK_META, type Track } from './curriculum';
import { fillTokens, parseMindCode, type MindReading } from './mind';

/**
 * 월말 학부모 리포트 자동 합치기
 * - 그 달의 수업 1줄 메모 + 내 작품 보관함 + 기질 코드 맞춤 코멘트 + 원장 종합 소견
 * - 출결 숫자 나열이 아니라 "만든 작품 · 진행 과정 · 강점과 보완점" 중심으로 씁니다.
 */

export interface MonthlyReport {
  studentName: string;
  gradeLabel: string;
  month: string;
  monthLabel: string;
  track: Track;
  trackLabel: string;
  code: string;
  mind: MindReading | null;
  memos: LessonMemo[];
  works: Work[];
  doneCount: number;
  donePct: number;
  nextWeekNo: number;
  nextWeeks: string[];
  worksLine: string;
  processLine: string;
  temperamentLine: string;
  strengths: string[];
  improvements: string[];
  counselor: string[];
  kakaoText: string;
}

function dateLabel(ymdStr: string): string {
  const [, m, d] = ymdStr.split('-').map(Number);
  return `${m}/${d}`;
}

function gradeLabel(student: Student): string {
  const names = ['', '초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'];
  return names[student.grade] ?? `${student.grade}학년`;
}

export function buildMonthlyReport(student: Student, month: string): MonthlyReport {
  const profile = classStore.profile(student.id, student.coding_level);
  const track = profile.track;
  const trackMeta = TRACK_META[track];
  const mind = profile.code ? parseMindCode(profile.code) : null;
  const reading = mind && mind.ok ? mind : null;

  const memos = classStore.memosInMonth(student.id, month);
  const works = classStore.worksInMonth(student.id, month);
  const doneWeeks = classStore.doneWeeks(student.id);
  const donePct = Math.round((doneWeeks.length / 24) * 100);
  const nextWeekNo = classStore.nextWeek(student.id);
  const plan = CURRICULUM[track];
  const nextWeeks = plan
    .filter((w) => w.week >= nextWeekNo && w.week < nextWeekNo + 4)
    .map((w) => `${w.week}주 ${w.title}`);

  const monthName = monthLabel(month);
  const kidName = student.name;

  /* ------------------------------ 작품 문단 ------------------------------ */
  const workList = works.length
    ? works.map((w) => `‘${w.title}’(${dateLabel(w.date)}, ${w.tool})`).join(', ')
    : '';
  const worksLine = works.length
    ? `${monthName}에는 ${workList}을(를) 완성했습니다.`
    : `${monthName}에는 새 작품을 등록하지 않았고, ${trackMeta.label} 기본기를 다지는 수업을 이어 갔습니다.`;

  /* ------------------------------ 과정 문단 ------------------------------ */
  const madeCount = memos.filter((m) => m.made).length;
  const processLine = memos.length
    ? `수업 ${memos.length}회 기록 · 24주 커리큘럼 ${doneWeeks.length}주 완료(${donePct}%) · ${
        madeCount ? `‘${memos[0].made}’까지 진행` : '기본기 중심으로 진행'
      }`
    : `24주 커리큘럼 ${doneWeeks.length}주 완료(${donePct}%) · 이번 달 수업 메모는 아직 정리 전입니다`;

  /* --------------------------- 기질 맞춤 코멘트 --------------------------- */
  let temperamentLine = '';
  if (reading) {
    temperamentLine = `${reading.code} · 어머니 ${reading.mom.name} / ${kidName} ${reading.kid.name}. ${fillTokens(
      reading.combo.one,
      kidName
    )}`;
  }

  /* ------------------------------ 강점 / 보완 ----------------------------- */
  const strengths: string[] = [];
  if (reading) strengths.push(...reading.kid.strengths.slice(0, 2));
  memos.forEach((m) => {
    if (m.good) strengths.push(m.good);
  });
  if (works.length && strengths.length < 3) {
    strengths.push(`만든 작품을 끝까지 완성해 내는 힘이 자라고 있습니다 (${works[0].title}).`);
  }
  const uniqueStrengths = Array.from(new Set(strengths)).slice(0, 4);

  const improvements: string[] = [];
  memos.forEach((m) => {
    if (m.todo) improvements.push(m.todo);
  });
  if (reading) improvements.push(...reading.combo.classGuide.slice(0, 1));
  if (nextWeeks.length && improvements.length < 2) {
    improvements.push(`${nextWeeks[0]}부터 시작합니다. 한 주에 한 가지씩 끝까지 해 보는 연습을 이어 갑니다.`);
  }
  const uniqueImprovements = Array.from(new Set(improvements)).slice(0, 3);

  /* ------------------------------ 종합 소견 ------------------------------ */
  const counselor: string[] = [];
  if (reading) {
    counselor.push(
      fillTokens(reading.combo.counselor.opening, kidName).replace(/\s+/g, ' ').trim()
    );
  } else {
    counselor.push(
      `${kidName} 학생은 ${trackMeta.label} 수업에서 자기 속도로 꾸준히 쌓아 가고 있습니다.`
    );
  }
  if (works.length) {
    counselor.push(
      `이번 달에는 ${works
        .slice(0, 2)
        .map((w) => `‘${w.title}’`)
        .join(', ')}을 완성하며 만들기의 마무리까지 경험했습니다. 결과물을 끝까지 붙잡고 완성한 경험이 다음 작품의 자신감으로 이어집니다.`
    );
  } else {
    counselor.push(
      `${trackMeta.label}의 기본 개념을 손에 익히는 데 집중했습니다. 눈에 보이는 작품이 적은 달에는 다음 달 첫 작품을 조금 작게 잡아 완성 경험을 먼저 만들어 주는 것이 좋습니다.`
    );
  }
  if (memos.length) {
    counselor.push(
      `수업 기록에서 ${kidName} 학생의 강점은 ${
        uniqueStrengths[0] ?? '차분히 끝까지 시도하는 태도'
      }로 나타났고, 보완할 지점은 ${uniqueImprovements[0] ?? '한 번에 하나씩 마무리하기'}입니다.`
    );
  }
  if (nextWeeks.length) {
    counselor.push(
      `다음 달은 ${nextWeeks[0]}부터 시작합니다. 가정에서는 결과보다 ‘오늘 어디까지 했는지’를 먼저 물어봐 주시면 아이가 스스로 마무리를 말하게 됩니다.`
    );
  }
  counselor.push(
    '아이를 평가하기보다 지금의 결을 이해하고 함께 가는 것이 라피네 클래스의 방식입니다. 궁금한 점은 언제든 카톡으로 편하게 남겨 주세요.'
  );

  const report: Omit<MonthlyReport, 'kakaoText'> = {
    studentName: kidName,
    gradeLabel: gradeLabel(student),
    month,
    monthLabel: monthName,
    track,
    trackLabel: trackMeta.label,
    code: profile.code,
    mind: reading,
    memos,
    works,
    doneCount: doneWeeks.length,
    donePct,
    nextWeekNo,
    nextWeeks,
    worksLine,
    processLine,
    temperamentLine,
    strengths: uniqueStrengths,
    improvements: uniqueImprovements,
    counselor,
  };

  return { ...report, kakaoText: toKakaoText(report) };
}

function toKakaoText(r: Omit<MonthlyReport, 'kakaoText'>): string {
  const lines: string[] = [];
  lines.push(`[라피네 클래스] ${r.monthLabel} 월말 리포트`);
  lines.push(`${r.studentName} (${r.gradeLabel}) · ${r.trackLabel}`);
  if (r.code) lines.push(`기질 코드 ${r.code}`);
  lines.push('');
  lines.push(`▸ 이번 달 만든 작품`);
  if (r.works.length) {
    r.works.forEach((w) => {
      lines.push(`· ${w.title} (${dateLabel(w.date)}, ${w.tool})`);
      if (w.comment) lines.push(`  ${w.comment}`);
    });
  } else {
    lines.push(`· ${r.trackLabel} 기본기를 다지는 수업 (새 작품은 다음 달에)`);
  }
  lines.push('');
  lines.push(`▸ 진행 과정`);
  lines.push(`· 24주 중 ${r.doneCount}주 완료 (${r.donePct}%)`);
  if (r.memos.length) {
    r.memos.slice(0, 4).forEach((m) => {
      const parts = [m.made, m.good && `잘한 점: ${m.good}`].filter(Boolean);
      lines.push(`· ${dateLabel(m.date)} ${parts.join(' / ')}`);
    });
  }
  lines.push('');
  if (r.temperamentLine) {
    lines.push(`▸ 기질 맞춤 코멘트`);
    lines.push(r.temperamentLine);
    lines.push('');
  }
  lines.push(`▸ 아이의 강점`);
  r.strengths.forEach((s) => lines.push(`· ${s}`));
  lines.push('');
  lines.push(`▸ 보완할 점`);
  r.improvements.forEach((s) => lines.push(`· ${s}`));
  lines.push('');
  lines.push(`▸ 원장 종합 소견`);
  r.counselor.forEach((p) => lines.push(p));
  lines.push('');
  lines.push('— 라피네코딩컴퓨터학원 두정점 · 박종혁 원장(미술심리상담사)');
  lines.push('041-564-1101 · 카톡 상담 https://pf.kakao.com/_NPJhG');
  return lines.join('\n');
}

export { dateLabel };
