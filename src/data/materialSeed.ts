import type { MaterialSeedRow } from './materialTypes';
import { W01 } from './materials/w01';
import { W02 } from './materials/w02';
import { W03 } from './materials/w03';
import { W04 } from './materials/w04';

/**
 * 참고 자료실 시드 — 파이썬 1~4주차 8차시 (2026-11-20 보강)
 *
 * 원칙
 *  · 1회차 = 개념 1개 + 따라 만들기 3개(기초 → 변형 → 실전) + 미니 실습 3~4문제
 *  · 2회차 = 망가뜨린 코드 3개(문법·실행·논리) 고치기 + 업그레이드 미션 3단계
 *  · 선생님용 수업안(teacher) = 2시간 시간대별 진행 + 판서 + 자주 막히는 질문 + AI 타이밍 + 전체 정답
 *  · 학생 화면에는 힌트까지만. 정답 코드(answer)와 수업안(teacher)은 서버에서도 분리됩니다.
 *
 * 파일 나누기: 주차별 내용이 길어져 src/data/materials/w01~w04.ts 로 나눴습니다.
 * scripts/gen-seed-sql.mjs 가 이 파일을 번들해 supabase/seed-materials.sql 을 만듭니다.
 */

export type { MaterialSeedRow } from './materialTypes';

export const MATERIAL_SEED: MaterialSeedRow[] = [...W01, ...W02, ...W03, ...W04];
