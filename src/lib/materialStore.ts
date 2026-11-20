import { useSyncExternalStore } from 'react';
import type { Material, MaterialAssignment } from '../types';
import { MATERIAL_SEED } from '../data/materialSeed';
import { asTrack, type Track } from './curriculum';
import { supabase, supabaseReady } from './supabase';
import { uid } from './util';

export const STORAGE_KEY = 'rafine-materials-v1';

interface LocalDB {
  materials: Material[];
  assignments: Record<string, MaterialAssignment>;
  /** `${studentId}:${materialId}` → 열람/완료 */
  views: Record<string, { opened_at: string | null; done_at: string | null }>;
  /** 학생별 추가 배정 자료 id */
  extras: Record<string, string[]>;
}

function seedMaterials(): Material[] {
  return MATERIAL_SEED.map((row) => ({
    id: `seed-${row.key}`,
    kind: row.kind,
    title: row.title,
    track: row.track,
    week: row.week,
    session: row.session,
    class_name: null,
    summary: row.summary,
    student_content: row.student,
    teacher_guide: row.teacher ?? null,
    answer_code: row.answer ?? null,
    ai_tip: row.aiTip ?? null,
    image_url: null,
    link_url: row.linkUrl ?? null,
    code_lang: row.codeLang ?? 'python',
    published: row.published,
    sort_no: row.sort,
    opened_at: null,
    done_at: null,
  }));
}

function emptyDB(): LocalDB {
  return { materials: seedMaterials(), assignments: {}, views: {}, extras: {} };
}

function loadLocal(): LocalDB {
  if (typeof localStorage === 'undefined') return emptyDB();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDB();
    const parsed = JSON.parse(raw) as Partial<LocalDB>;
    const seeded = emptyDB();
    // 시드 자료는 항상 최신 내용으로, 원장님이 추가한 자료는 그대로 유지
    const custom = (parsed.materials ?? []).filter((m) => !String(m.id).startsWith('seed-'));
    return {
      materials: [...seeded.materials, ...custom],
      assignments: parsed.assignments ?? {},
      views: parsed.views ?? {},
      extras: parsed.extras ?? {},
    };
  } catch {
    return emptyDB();
  }
}

export type MaterialMode = 'local' | 'cloud';


class MaterialStore {
  mode: MaterialMode = supabaseReady ? 'cloud' : 'local';
  version = 0;
  /** 화면에 그릴 자료 — 학생 모드에서는 내 배정 범위만 */
  materials: Material[] = [];
  /** 현재 학생의 배정(과정·주차·회차) */
  assignment: MaterialAssignment | null = null;
  /** 원장 화면 — 학생별 배정 목록 */
  assignments: MaterialAssignment[] = [];
  loading = false;
  error: string | null = null;

  private db: LocalDB = loadLocal();
  private listeners = new Set<() => void>();

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  getVersion = () => this.version;

  private emit() {
    this.version += 1;
    this.listeners.forEach((fn) => fn());
  }

  private persistLocal() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
    } catch {
      /* 저장 공간이 없어도 화면은 계속 동작 */
    }
  }

  /* ------------------------------- 읽기 (로컬) ------------------------------- */

  localAll(): Material[] {
    return this.db.materials.slice().sort((a, b) => a.sort_no - b.sort_no);
  }

  localAssignment(studentId: string): MaterialAssignment | null {
    return this.db.assignments[studentId] ?? null;
  }

  localView(studentId: string, materialId: string) {
    return this.db.views[`${studentId}:${materialId}`] ?? null;
  }

  localExtras(studentId: string): string[] {
    return this.db.extras[studentId] ?? [];
  }

  /* ------------------------------ 학생 — 클라우드 ----------------------------- */

  /** 학생 로그인 토큰으로 내 배정 + 자료 + 열람 기록을 받아옵니다 (교사용 필드는 서버에서 제외) */
  async loadStudentCloud(token: string) {
    if (!supabase || this.mode !== 'cloud') return;
    this.loading = true;
    this.emit();
    try {
      const { data, error } = await supabase.rpc('student_materials', { p_token: token });
      if (error) throw error;
      const bundle = data as { assignment?: MaterialAssignment; materials?: Material[] };
      this.assignment = bundle.assignment
        ? {
            student_id: '',
            track: String(bundle.assignment.track ?? 'python'),
            week: Number(bundle.assignment.week ?? 1),
            session: (Number(bundle.assignment.session ?? 1) === 2 ? 2 : 1),
          }
        : null;
      this.materials = (bundle.materials ?? []).map((m) => ({
        ...m,
        session: m.session === 2 ? 2 : m.session === 1 ? 1 : null,
        student_content: m.student_content ?? {},
        teacher_guide: null,
        answer_code: null,
      }));
      this.error = null;
    } catch (err) {
      this.error = err instanceof Error ? err.message : '자료를 불러오지 못했어요.';
      console.warn('[materials] student_materials 실패', err);
    } finally {
      this.loading = false;
      this.emit();
    }
  }

  /** “다 봤어요” 체크 — 클라우드는 RPC, 로컬은 localStorage */
  async mark(materialId: string, done: boolean, token: string | null, studentId: string) {
    if (this.mode === 'cloud' && supabase && token) {
      const { error } = await supabase.rpc('material_mark', {
        p_token: token,
        p_material_id: materialId,
        p_done: done,
      });
      if (error) {
        console.warn('[materials] material_mark 실패', error);
        return;
      }
      this.materials = this.materials.map((m) =>
        m.id === materialId
          ? { ...m, opened_at: m.opened_at ?? new Date().toISOString(), done_at: done ? new Date().toISOString() : null }
          : m
      );
      this.emit();
      return;
    }
    const k = `${studentId}:${materialId}`;
    const prev = this.db.views[k];
    this.db.views[k] = {
      opened_at: prev?.opened_at ?? new Date().toISOString(),
      done_at: done ? new Date().toISOString() : null,
    };
    this.persistLocal();
    this.materials = this.materials.map((m) =>
      m.id === materialId
        ? { ...m, opened_at: this.db.views[k].opened_at, done_at: this.db.views[k].done_at }
        : m
    );
    this.emit();
  }

  /* ------------------------------- 원장 — 클라우드 ------------------------------ */

  /** 원장 로그인 상태에서 자료·배정·열람 기록 전체를 받아옵니다 */
  async loadAdminCloud() {
    if (!supabase || this.mode !== 'cloud') return;
    this.loading = true;
    this.emit();
    try {
      const [mats, assigns, views] = await Promise.all([
        supabase.from('materials').select('*').order('week', { ascending: true }).order('session').order('sort_no'),
        supabase.from('material_assignments').select('*'),
        supabase.from('material_views').select('*'),
      ]);
      if (mats.error) throw mats.error;
      this.materials = (mats.data ?? []) as Material[];
      this.assignments = (assigns.data ?? []) as MaterialAssignment[];
      this.db.views = {};
      (views.data ?? []).forEach((v: { student_id: string; material_id: string; opened_at: string; done_at: string | null }) => {
        this.db.views[`${v.student_id}:${v.material_id}`] = { opened_at: v.opened_at, done_at: v.done_at };
      });
      this.error = null;
    } catch (err) {
      this.error = err instanceof Error ? err.message : '자료를 불러오지 못했어요.';
      console.warn('[materials] admin load 실패', err);
    } finally {
      this.loading = false;
      this.emit();
    }
  }

  async saveMaterial(patch: Material): Promise<boolean> {
    const row = {
      id: patch.id && !patch.id.startsWith('seed-') ? patch.id : undefined,
      kind: patch.kind,
      title: patch.title,
      track: patch.track || null,
      week: patch.week ?? null,
      session: patch.session ?? null,
      class_name: patch.class_name || null,
      summary: patch.summary || null,
      student_content: patch.student_content ?? {},
      teacher_guide: patch.teacher_guide ?? null,
      answer_code: patch.answer_code ?? null,
      ai_tip: patch.ai_tip ?? null,
      image_url: patch.image_url ?? null,
      link_url: patch.link_url ?? null,
      code_lang: patch.code_lang ?? 'python',
      published: patch.published,
      sort_no: patch.sort_no ?? 0,
      updated_at: new Date().toISOString(),
    };

    if (this.mode === 'cloud' && supabase) {
      const { data, error } = await supabase.from('materials').upsert(row).select().single();
      if (error) {
        console.warn('[materials] 저장 실패', error);
        this.error = error.message;
        this.emit();
        return false;
      }
      await this.loadAdminCloud();
      return Boolean(data);
    }

    const id = patch.id || row.id || uid('mat');
    const saved: Material = { ...patch, id };
    const idx = this.db.materials.findIndex((m) => m.id === id);
    if (idx >= 0) this.db.materials[idx] = saved;
    else this.db.materials = [saved, ...this.db.materials];
    this.persistLocal();
    this.materials = this.localAll();
    this.emit();
    return true;
  }

  async removeMaterial(id: string): Promise<boolean> {
    if (this.mode === 'cloud' && supabase) {
      const { error } = await supabase.from('materials').delete().eq('id', id);
      if (error) {
        this.error = error.message;
        this.emit();
        return false;
      }
      await this.loadAdminCloud();
      return true;
    }
    this.db.materials = this.db.materials.filter((m) => m.id !== id);
    this.persistLocal();
    this.materials = this.localAll();
    this.emit();
    return true;
  }

  /** 학생별 과정·주차·회차 배정 */
  async setAssignment(studentId: string, track: Track, week: number, session: 1 | 2, memo?: string): Promise<boolean> {
    const payload = {
      student_id: studentId,
      track: asTrack(track),
      week,
      session,
      memo: memo ?? null,
      updated_at: new Date().toISOString(),
    };
    if (this.mode === 'cloud' && supabase) {
      const { error } = await supabase.from('material_assignments').upsert(payload);
      if (error) {
        this.error = error.message;
        this.emit();
        console.warn('[materials] 배정 저장 실패', error);
        return false;
      }
      await this.loadAdminCloud();
      return true;
    }
    this.db.assignments[studentId] = payload;
    this.persistLocal();
    this.assignments = Object.values(this.db.assignments);
    this.emit();
    return true;
  }

  /** 특정 자료만 한 학생에게 추가 배정 / 해제 */
  async setExtra(studentId: string, materialId: string, on: boolean): Promise<boolean> {
    if (this.mode === 'cloud' && supabase) {
      if (on) {
        const { error } = await supabase
          .from('material_extra_assignments')
          .upsert({ student_id: studentId, material_id: materialId });
        if (error) {
          this.error = error.message;
          this.emit();
          return false;
        }
      } else {
        const { error } = await supabase
          .from('material_extra_assignments')
          .delete()
          .eq('student_id', studentId)
          .eq('material_id', materialId);
        if (error) {
          this.error = error.message;
          this.emit();
          return false;
        }
      }
      return true;
    }
    const cur = new Set(this.db.extras[studentId] ?? []);
    if (on) cur.add(materialId);
    else cur.delete(materialId);
    this.db.extras[studentId] = Array.from(cur);
    this.persistLocal();
    this.emit();
    return true;
  }

  viewsFor(materialId: string): { student_id: string; opened_at: string; done_at: string | null }[] {
    return Object.entries(this.db.views)
      .filter(([k]) => k.endsWith(`:${materialId}`))
      .map(([k, v]) => ({
        student_id: k.slice(0, k.lastIndexOf(':')),
        opened_at: v.opened_at ?? '',
        done_at: v.done_at,
      }));
  }

  /** 원장 화면에서 시드 자료를 그대로 다시 보여 주기 (로컬 모드) */
  reloadLocal() {
    this.materials = this.localAll();
    this.assignments = Object.values(this.db.assignments);
    this.emit();
  }
}

export const materialStore = new MaterialStore();

export function useMaterialStore() {
  useSyncExternalStore(materialStore.subscribe, materialStore.getVersion, materialStore.getVersion);
  return materialStore;
}
