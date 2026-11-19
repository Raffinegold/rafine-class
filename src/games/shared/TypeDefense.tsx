import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Fx, drawHeart, labelPlate, makeStars, mulberry, roundRect, setupCanvas, type Star } from '../../lib/fx';
import { sfx } from '../../lib/sound';
import { cn } from '../../lib/util';

export interface RainItem {
  id: string;
  text: string;
  hint?: string;
}

export interface RainResult {
  kills: number;
  escaped: number;
  total: number;
  heartsLeft: number;
  maxHearts: number;
  shots: number;
  wrongInputs: number;
  durationMs: number;
  missedIds: string[];
  maxCombo: number;
  cleared: boolean;
}

interface Meteor {
  id: string;
  text: string;
  hint?: string;
  x: number;
  y: number;
  /** 속도·단계 배율을 곱하기 전 기본 배율 (생성 순서에 따라 조금씩 빨라짐) */
  vyRatio: number;
  sway: number;
  phase: number;
  size: number;
  hue: number;
}

type Theme = 'sky' | 'cyber';

export type SpeedKey = 'slow' | 'normal' | 'fast';

/** 낙하 속도 3단계 — 기본 낙하 속도(px/s)와 생성 주기(초)를 함께 바꿉니다. */
export const SPEEDS: Record<SpeedKey, { label: string; emoji: string; vy: number; interval: number; hint: string }> = {
  slow: { label: '느림(초등)', emoji: '🐢', vy: 17, interval: 2.2, hint: '천천히 내려와요 — 초등 저학년 추천' },
  normal: { label: '보통', emoji: '🙂', vy: 27, interval: 1.75, hint: '기본 속도예요' },
  fast: { label: '빠름', emoji: '🔥', vy: 38, interval: 1.32, hint: '쏟아져요 — 도전 모드' },
};

export const SPEED_ORDER: SpeedKey[] = ['slow', 'normal', 'fast'];

/** 단계(Wave) — 격추 수에 따라 오르고, 오를수록 낙하 속도가 빨라지고 생성 주기가 짧아집니다. */
export const WAVE_RULES = [
  { wave: 1, fromKill: 0, vy: 1, gap: 1 },
  { wave: 2, fromKill: 4, vy: 1.25, gap: 0.88 },
  { wave: 3, fromKill: 8, vy: 1.55, gap: 0.76 },
];

export const waveOfKills = (kills: number) =>
  kills >= 8 ? 3 : kills >= 4 ? 2 : 1;

/** 마지막으로 고른 속도를 게임 재시작(재도전) 때도 이어 갑니다. */
let lastSpeed: SpeedKey = 'normal';

const THEME = {
  sky: {
    accent: '#7dd3fc',
    laser: '#67e8f9',
    glow: '#38bdf8',
    explosion: ['#fde68a', '#fb923c', '#fca5a5', '#fef3c7'],
    hud: 'from-sky-500/20 to-indigo-500/10',
    ring: '#fbbf24',
  },
  cyber: {
    accent: '#c084fc',
    laser: '#22d3ee',
    glow: '#a855f7',
    explosion: ['#67e8f9', '#c084fc', '#f0abfc', '#e0f2fe'],
    hud: 'from-fuchsia-500/20 to-cyan-400/10',
    ring: '#22d3ee',
  },
};

/**
 * 타자 디펜스 — 운석(단어)이 내려오고, 입력창에 스펠링을 치면 아래 포대에서 레이저가 나가 격추합니다.
 * 영어 산성비와 코딩 키워드 디펜스가 같은 엔진을 씁니다.
 */
export default function TypeDefense({
  items,
  theme = 'sky',
  maxHearts = 5,
  onFinish,
  testIdPrefix,
  sceneLabel,
  hintLabel = '뜻',
  accentText,
  initialSpeed,
}: {
  items: RainItem[];
  theme?: Theme;
  maxHearts?: number;
  onFinish: (result: RainResult) => void;
  testIdPrefix: string;
  sceneLabel: string;
  hintLabel?: string;
  accentText?: string;
  initialSpeed?: SpeedKey;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [typed, setTyped] = useState('');
  const typedRef = useRef('');
  const [hud, setHud] = useState({ hearts: maxHearts, kills: 0, combo: 0, maxCombo: 0, escaped: 0, shots: 0, time: 0 });
  const [finished, setFinished] = useState(false);
  const [wordsOnScreen, setWordsOnScreen] = useState<string[]>([]);
  const [inputShake, setInputShake] = useState(0);
  const [speed, setSpeed] = useState<SpeedKey>(initialSpeed ?? lastSpeed);
  const speedRef = useRef<SpeedKey>(initialSpeed ?? lastSpeed);
  const [wave, setWave] = useState(1);
  const waveRef = useRef(1);

  const meteors = useRef<Meteor[]>([]);
  const queue = useRef<RainItem[]>([]);
  const fx = useRef(new Fx());
  const stars = useRef<Star[]>([]);
  const cannonTilt = useRef(0);
  const targetX = useRef<number | null>(null);
  const raf = useRef(0);
  const last = useRef(0);
  const elapsed = useRef(0);
  const spawnTimer = useRef(0);
  const hudTimer = useRef(0);
  const ended = useRef(false);
  const state = useRef({
    hearts: maxHearts,
    kills: 0,
    combo: 0,
    maxCombo: 0,
    escaped: 0,
    shots: 0,
    wrongInputs: 0,
    missed: [] as string[],
    spawned: 0,
    startedAt: 0,
  });
  const themeRef = useRef(THEME[theme]);
  themeRef.current = THEME[theme];

  const changeSpeed = useCallback((next: SpeedKey) => {
    lastSpeed = next;
    speedRef.current = next;
    setSpeed(next);
    sfx.tap();
  }, []);

  const reset = useCallback(() => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    queue.current = shuffled;
    meteors.current = [];
    fx.current.clear();
    elapsed.current = 0;
    spawnTimer.current = 0.9;
    hudTimer.current = 0;
    ended.current = false;
    waveRef.current = 1;
    setWave(1);
    state.current = {
      hearts: maxHearts,
      kills: 0,
      combo: 0,
      maxCombo: 0,
      escaped: 0,
      shots: 0,
      wrongInputs: 0,
      missed: [],
      spawned: 0,
      startedAt: performance.now(),
    };
    setHud({ hearts: maxHearts, kills: 0, combo: 0, maxCombo: 0, escaped: 0, shots: 0, time: 0 });
    typedRef.current = '';
    setTyped('');
    setFinished(false);
    setWordsOnScreen([]);
  }, [items, maxHearts]);

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const finish = useCallback(() => {
    if (ended.current) return;
    ended.current = true;
    setFinished(true);
    const s = state.current;
    sfx.win();
    window.setTimeout(() => {
      onFinish({
        kills: s.kills,
        escaped: s.escaped,
        total: items.length,
        heartsLeft: Math.max(0, s.hearts),
        maxHearts,
        shots: s.shots,
        wrongInputs: s.wrongInputs,
        durationMs: elapsed.current * 1000,
        missedIds: s.missed,
        maxCombo: s.maxCombo,
        cleared: s.hearts > 0,
      });
    }, 700);
  }, [items.length, maxHearts, onFinish]);

  /** 운석 하나를 레이저로 격추 */
  const fire = useCallback((meteor: Meteor, from: { x: number; y: number }, width: number, height: number) => {
    const t = themeRef.current;
    meteors.current = meteors.current.filter((m) => m.id !== meteor.id);
    const s = state.current;
    s.kills += 1;
    s.combo += 1;
    s.maxCombo = Math.max(s.maxCombo, s.combo);
    s.shots += 1;
    cannonTilt.current = Math.atan2(meteor.x - from.x, from.y - meteor.y);
    targetX.current = meteor.x;

    fx.current.beam(from.x, from.y, meteor.x, meteor.y, t.laser, 5);
    fx.current.burst(meteor.x, meteor.y, { count: 8, color: '#ffffff', speed: 90, size: 1.8, life: 0.25 });
    fx.current.explode(meteor.x, meteor.y, t.explosion, 1);
    fx.current.popup(meteor.x, meteor.y - 26, Math.random() > 0.72 && s.combo >= 3 ? 'COMBO!' : '+1', '#fde68a', s.combo >= 4 ? 24 : 20);
    sfx.laser();
    window.setTimeout(() => sfx.explode(), 55);
    if (s.combo >= 3) sfx.combo(s.combo);
    setHud({ hearts: s.hearts, kills: s.kills, combo: s.combo, maxCombo: s.maxCombo, escaped: s.escaped, shots: s.shots, time: Math.floor(elapsed.current) });
    setWordsOnScreen(meteors.current.map((m) => m.text));
    // 마지막 운석을 잡았고 더 나올 게 없으면 잠시 뒤 종료
    if (s.spawned >= items.length && meteors.current.length === 0) window.setTimeout(finish, 420);
    void width;
    void height;
  }, [finish, items.length]);

  /* ------------------------------ 메인 루프 ------------------------------ */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let alive = true;

    const measure = () => {
      const setup = setupCanvas(canvas);
      if (setup) stars.current = makeStars(setup.w, setup.h, 46, 21);
      return setup;
    };
    let dims = measure();

    const onResize = () => {
      dims = measure();
    };
    window.addEventListener('resize', onResize);

    const spawn = (w: number) => {
      const item = queue.current.shift();
      if (!item) return;
      const s = state.current;
      /* 4개 레인에 번갈아 떨어뜨려 이름표가 서로 겹치지 않게 합니다 */
      const lane = s.spawned % 4;
      const x = w * (0.2 + lane * 0.2) + (Math.random() - 0.5) * 18;
      s.spawned += 1;
      meteors.current.push({
        id: item.id,
        text: item.text,
        hint: item.hint,
        x,
        y: 40,
        vyRatio: 1 + Math.min(0.5, s.spawned * 0.022),
        sway: 8 + Math.random() * 16,
        phase: Math.random() * Math.PI * 2,
        size: Math.min(30, Math.max(16, 12 + item.text.length * 1.6)),
        hue: Math.random() * 40 - 20,
      });
      setWordsOnScreen(meteors.current.map((m) => m.text));
    };

    const loop = (now: number) => {
      if (!alive) return;
      if (!last.current) last.current = now;
      const dt = Math.min(0.05, (now - last.current) / 1000);
      last.current = now;
      if (ended.current) {
        /* 종료 뒤에도 마지막 폭발이 사라지도록 fx 만 갱신 */
        fx.current.update(dt);
      } else {
        elapsed.current += dt;
        spawnTimer.current += dt;
        hudTimer.current += dt;
        if (hudTimer.current > 0.4) {
          hudTimer.current = 0;
          setHud({
            hearts: state.current.hearts,
            kills: state.current.kills,
            combo: state.current.combo,
            maxCombo: state.current.maxCombo,
            escaped: state.current.escaped,
            shots: state.current.shots,
            time: Math.floor(elapsed.current),
          });
        }
        const w = dims?.w ?? 360;
        const h = dims?.h ?? 330;
        const sp = SPEEDS[speedRef.current];
        /* 단계 상승 — 격추 수 기준 (0~3 Wave 1, 4~7 Wave 2, 8~10 Wave 3) */
        const nextWave = waveOfKills(state.current.kills);
        if (nextWave !== waveRef.current) {
          const up = nextWave > waveRef.current;
          waveRef.current = nextWave;
          setWave(nextWave);
          if (up) {
            fx.current.popup(w / 2, h * 0.36, `WAVE ${nextWave}`, theme === 'cyber' ? '#c084fc' : '#fbbf24', 26);
            fx.current.flash(theme === 'cyber' ? 'rgba(168,85,247,0.18)' : 'rgba(251,191,36,0.16)', 0.35);
            sfx.combo(nextWave + 2);
          }
        }
        const wv = WAVE_RULES[waveRef.current - 1];
        const interval = Math.max(0.72, sp.interval * wv.gap - state.current.spawned * 0.03);
        if (spawnTimer.current >= interval && queue.current.length) {
          spawnTimer.current = 0;
          spawn(w);
        }
        const fallSpeed = sp.vy * wv.vy;
        for (const m of meteors.current) {
          m.y += fallSpeed * m.vyRatio * dt;
          m.phase += dt * 1.6;
        }
        const floor = h - 52;
        const hitFloor = meteors.current.filter((m) => m.y > floor);
        if (hitFloor.length) {
          meteors.current = meteors.current.filter((m) => m.y <= floor);
          for (const m of hitFloor) {
            const s = state.current;
            s.hearts -= 1;
            s.combo = 0;
            s.escaped += 1;
            s.missed.push(m.id);
            fx.current.explode(m.x, floor, ['#f87171', '#fb7185', '#fecaca'], 0.9);
            fx.current.popup(m.x, floor - 18, '방어막 -1', '#fca5a5', 18);
            fx.current.flash('rgba(244,63,94,0.28)', 0.3);
            fx.current.shake(12, 0.35);
          }
          sfx.hurt();
          setHud({
            hearts: state.current.hearts,
            kills: state.current.kills,
            combo: 0,
            maxCombo: state.current.maxCombo,
            escaped: state.current.escaped,
            shots: state.current.shots,
            time: Math.floor(elapsed.current),
          });
          setWordsOnScreen(meteors.current.map((m) => m.text));
          if (state.current.hearts <= 0) {
            fx.current.popup(w / 2, h / 2, '방어막 파괴!', '#fda4af', 26);
            window.setTimeout(finish, 600);
          }
        }
        fx.current.update(dt);
      }

      const setup = dims;
      if (setup) draw(setup.ctx, setup.w, setup.h, now / 1000);
      raf.current = requestAnimationFrame(loop);
    };

    const draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      const th = themeRef.current;
      ctx.clearRect(0, 0, w, h);
      const off = fx.current.offset();
      ctx.save();
      ctx.translate(off.x, off.y);

      /* 배경 */
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      if (theme === 'sky') {
        bg.addColorStop(0, '#0a1030');
        bg.addColorStop(0.45, '#1e1b4b');
        bg.addColorStop(0.78, '#3b2f6b');
        bg.addColorStop(1, '#1f2937');
      } else {
        bg.addColorStop(0, '#04040d');
        bg.addColorStop(0.5, '#0a0a23');
        bg.addColorStop(0.82, '#111033');
        bg.addColorStop(1, '#020617');
      }
      ctx.fillStyle = bg;
      ctx.fillRect(-30, -30, w + 60, h + 60);

      if (theme === 'sky') {
        /* 별 */
        for (const s of stars.current) {
          const a = s.a * (0.6 + 0.4 * Math.sin(t * 1.4 + s.twinkle));
          ctx.globalAlpha = a;
          ctx.fillStyle = '#e0e7ff';
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        /* 달 */
        const moon = ctx.createRadialGradient(w * 0.82, 46, 2, w * 0.82, 46, 46);
        moon.addColorStop(0, 'rgba(254,243,199,0.95)');
        moon.addColorStop(0.35, 'rgba(253,230,138,0.35)');
        moon.addColorStop(1, 'rgba(253,230,138,0)');
        ctx.fillStyle = moon;
        ctx.beginPath();
        ctx.arc(w * 0.82, 46, 46, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.arc(w * 0.82, 46, 13, 0, Math.PI * 2);
        ctx.fill();
        /* 능선 */
        ctx.fillStyle = 'rgba(30,27,75,0.9)';
        ctx.beginPath();
        ctx.moveTo(0, h - 70);
        ctx.lineTo(w * 0.18, h - 118);
        ctx.lineTo(w * 0.34, h - 78);
        ctx.lineTo(w * 0.5, h - 128);
        ctx.lineTo(w * 0.68, h - 82);
        ctx.lineTo(w * 0.84, h - 112);
        ctx.lineTo(w, h - 74);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
      } else {
        /* 사이버 그리드 */
        ctx.strokeStyle = 'rgba(139,92,246,0.22)';
        ctx.lineWidth = 1;
        const horizon = h * 0.52;
        for (let i = 0; i <= 14; i += 1) {
          const x = (w / 14) * i;
          ctx.beginPath();
          ctx.moveTo(w / 2 + (x - w / 2) * 0.18, horizon);
          ctx.lineTo(x - w * 0.25, h);
          ctx.stroke();
        }
        for (let i = 1; i <= 8; i += 1) {
          const p = i / 8;
          const y = horizon + (h - horizon) * p * p;
          ctx.globalAlpha = 0.10 + p * 0.2;
          ctx.strokeStyle = p > 0.7 ? '#22d3ee' : '#8b5cf6';
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        /* 흐르는 코드 글리프 */
        const rand = mulberry(11);
        ctx.font = '600 10px ui-monospace, monospace';
        for (let i = 0; i < 12; i += 1) {
          const gx = rand() * w;
          const speed = 18 + rand() * 30;
          const gy = ((rand() * h + t * speed) % (h + 40)) - 20;
          const glyphs = ['</>', '{ }', '01', '=>', '()', '[]', 'for', 'if'];
          ctx.globalAlpha = 0.16;
          ctx.fillStyle = i % 3 === 0 ? '#22d3ee' : '#a78bfa';
          ctx.fillText(glyphs[i % glyphs.length], gx, gy);
        }
        ctx.globalAlpha = 1;
      }

      /* 방어선 */
      const floor = h - 52;
      const lineGrad = ctx.createLinearGradient(0, 0, w, 0);
      lineGrad.addColorStop(0, 'rgba(56,189,248,0)');
      lineGrad.addColorStop(0.5, theme === 'sky' ? 'rgba(125,211,252,0.85)' : 'rgba(34,211,238,0.9)');
      lineGrad.addColorStop(1, 'rgba(56,189,248,0)');
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 2;
      ctx.shadowColor = th.laser;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, floor);
      ctx.lineTo(w, floor);
      ctx.stroke();
      ctx.shadowBlur = 0;

      /* 운석 */
      const typedLower = typedRef.current.trim().toLowerCase();
      for (const m of meteors.current) {
        const sx = m.x + Math.sin(m.phase) * m.sway;
        const targeted = typedLower.length > 0 && m.text.toLowerCase().startsWith(typedLower);
        /* 꼬리 */
        const trail = ctx.createLinearGradient(sx, m.y - 46, sx, m.y);
        trail.addColorStop(0, 'rgba(251,146,60,0)');
        trail.addColorStop(1, `hsla(${24 + m.hue}, 92%, 62%, 0.45)`);
        ctx.fillStyle = trail;
        ctx.beginPath();
        ctx.moveTo(sx - 7, m.y - 4);
        ctx.lineTo(sx + 7, m.y - 4);
        ctx.lineTo(sx + 1.5, m.y - 46);
        ctx.lineTo(sx - 1.5, m.y - 46);
        ctx.closePath();
        ctx.fill();

        /* 바위 */
        ctx.save();
        if (theme === 'cyber') {
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 16;
        }
        const rock = ctx.createRadialGradient(sx - 5, m.y - 6, 2, sx, m.y, 18);
        if (theme === 'sky') {
          rock.addColorStop(0, '#57534e');
          rock.addColorStop(0.6, '#3f3f46');
          rock.addColorStop(1, '#18181b');
        } else {
          rock.addColorStop(0, '#4c1d95');
          rock.addColorStop(0.6, '#2e1065');
          rock.addColorStop(1, '#0f0524');
        }
        ctx.fillStyle = rock;
        ctx.beginPath();
        ctx.ellipse(sx, m.y, 17, 15, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        /* 크레이터 */
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.beginPath();
        ctx.arc(sx - 5, m.y - 3, 4, 0, Math.PI * 2);
        ctx.arc(sx + 6, m.y + 4, 2.6, 0, Math.PI * 2);
        ctx.fill();
        /* 불꽃 테두리 */
        ctx.strokeStyle = theme === 'sky' ? 'rgba(251,146,60,0.7)' : 'rgba(192,132,252,0.85)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(sx, m.y, 17.5, 15.5, 0.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        /* 입력 중인 글자 강조 링 */
        if (targeted) {
          ctx.strokeStyle = th.ring;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.6 + Math.sin(t * 8) * 0.35;
          ctx.beginPath();
          ctx.arc(sx, m.y, 23, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        /* 단어 + 힌트 */
        labelPlate(ctx, m.text, m.hint ?? '', sx, m.y + 14, {
          font: 16,
          subFont: 10,
          padX: 12,
          color: targeted ? '#fde68a' : '#f8fafc',
          subColor: 'rgba(226,232,240,0.7)',
          plate: theme === 'cyber' ? 'rgba(2,6,23,0.86)' : 'rgba(15,23,42,0.8)',
          glow: targeted ? th.ring : undefined,
        });
      }

      /* 포대 */
      const cx = w / 2;
      const cy = h - 14;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-cannonTilt.current);
      const barrel = ctx.createLinearGradient(0, -46, 0, 0);
      barrel.addColorStop(0, '#e2e8f0');
      barrel.addColorStop(1, '#64748b');
      ctx.fillStyle = barrel;
      roundRect(ctx, -7, -52, 14, 52, 5);
      ctx.fill();
      ctx.fillStyle = th.laser;
      ctx.shadowColor = th.laser;
      ctx.shadowBlur = 12;
      roundRect(ctx, -4.5, -56, 9, 9, 3);
      ctx.fill();
      ctx.restore();
      ctx.shadowBlur = 0;
      /* 포대 받침 */
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(cx - 26, cy + 8);
      ctx.lineTo(cx - 18, cy - 12);
      ctx.lineTo(cx + 18, cy - 12);
      ctx.lineTo(cx + 26, cy + 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = th.accent;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(cx, cy - 8, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      /* 하트 (방어막) */
      const hearts = state.current.hearts;
      for (let i = 0; i < maxHearts; i += 1) {
        drawHeart(ctx, 14 + i * 18, h - 15, 14, i < hearts, theme === 'sky' ? '#fb7185' : '#f472b6');
      }

      fx.current.draw(ctx);
      ctx.restore();

      /* 화면 플래시는 흔들림 밖에서 */
      if (fx.current.flashLife > 0 && fx.current.flashMax > 0) {
        ctx.globalAlpha = Math.max(0, fx.current.flashLife / fx.current.flashMax) * 0.8;
        ctx.fillStyle = fx.current.flashColor;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
      }
    };

    raf.current = requestAnimationFrame(loop);
    const focus = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 260);
    return () => {
      alive = false;
      window.clearTimeout(focus);
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finish, maxHearts, theme]);

  /* ------------------------------ 입력 처리 ------------------------------ */

  const submit = (force = false) => {
    if (ended.current) return;
    const value = typed.trim().toLowerCase();
    if (!value) return;
    const list = meteors.current;
    const exact = list.filter((m) => m.text.toLowerCase() === value).sort((a, b) => b.y - a.y)[0];
    const pool = exact
      ? [exact]
      : force
        ? list.filter((m) => m.text.toLowerCase().startsWith(value)).sort((a, b) => b.y - a.y)
        : [];
    if (!pool.length) {
      if (force) {
        state.current.wrongInputs += 1;
        state.current.combo = 0;
        sfx.miss();
        setInputShake((n) => n + 1);
        setHud((h) => ({ ...h, combo: 0 }));
      }
      return;
    }
    const target = pool[0];
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    fire(target, { x: (rect?.width ?? 360) / 2, y: (rect?.height ?? 330) - 46 }, rect?.width ?? 360, rect?.height ?? 330);
    typedRef.current = '';
    setTyped('');
  };

  const onChange = (value: string) => {
    typedRef.current = value;
    setTyped(value);
    const v = value.trim().toLowerCase();
    const exact = meteors.current.find((m) => m.text.toLowerCase() === v);
    if (exact) {
      const canvas = canvasRef.current;
      const rect = canvas?.getBoundingClientRect();
      fire(exact, { x: (rect?.width ?? 360) / 2, y: (rect?.height ?? 330) - 46 }, rect?.width ?? 360, rect?.height ?? 330);
      typedRef.current = '';
      setTyped('');
    }
  };

  const comboText = hud.combo >= 3 ? `${hud.combo} COMBO` : '';

  const offscreen = useMemo(() => wordsOnScreen.join(' '), [wordsOnScreen]);

  return (
    <div className="space-y-2.5" data-testid={`${testIdPrefix}-root`} data-speed={speed} data-wave={wave}>
      {/* 속도 선택 — 게임 시작 전/진행 중 모두 바꿀 수 있고, 다음 운석부터 바로 반영됩니다 */}
      <div className="flex items-center gap-2 rounded-2xl bg-slate-900 px-2.5 py-2 ring-1 ring-white/10">
        <span className="shrink-0 text-[10.5px] font-bold text-slate-400">속도</span>
        <div className="flex flex-1 gap-1.5">
          {SPEED_ORDER.map((key) => {
            const on = speed === key;
            return (
              <button
                key={key}
                type="button"
                data-testid={`${testIdPrefix}-speed-${key}`}
                data-active={on ? '1' : '0'}
                aria-pressed={on}
                title={SPEEDS[key].hint}
                onClick={() => changeSpeed(key)}
                className={cn(
                  'flex-1 whitespace-nowrap rounded-xl px-1.5 py-1.5 text-[10.5px] font-extrabold transition active:scale-95',
                  on
                    ? 'bg-cyan-400 text-slate-950 shadow ring-1 ring-cyan-200'
                    : 'bg-slate-800 text-slate-300 ring-1 ring-white/5 hover:bg-slate-700'
                )}
              >
                <span aria-hidden>{SPEEDS[key].emoji}</span> {SPEEDS[key].label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-3xl bg-slate-950 shadow-card ring-1 ring-white/10"
        onClick={() => inputRef.current?.focus({ preventScroll: true })}
      >
        <canvas ref={canvasRef} className="block h-[318px] w-full sm:h-[350px]" data-testid={`${testIdPrefix}-canvas`} />

        {/* WAVE 배지 — 격추 수가 늘면 단계가 올라가고 낙하가 빨라져요 */}
        <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center">
          <span
            key={wave}
            data-testid={`${testIdPrefix}-wave`}
            data-wave={wave}
            className="animate-pop rounded-full bg-gradient-to-r from-amber-300 to-orange-500 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-amber-950 shadow ring-1 ring-white/40"
          >
            WAVE {wave}
            <span className="ml-0.5 text-[9px] font-bold text-amber-900/60">/3</span>
          </span>
        </div>

        {/* HUD */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
          <div className="flex flex-col gap-1">
            <span className="rounded-full bg-slate-900/70 px-2 py-0.5 text-[10px] font-bold text-white/85 ring-1 ring-white/15">
              {sceneLabel}
            </span>
            <span className="w-fit rounded-full bg-slate-900/70 px-2 py-0.5 text-[10px] font-semibold text-cyan-200 ring-1 ring-white/15" data-testid={`${testIdPrefix}-kills`}>
              🎯 {hud.kills} / {items.length}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-full bg-slate-900/70 px-2 py-0.5 text-[10px] font-semibold text-white/80 ring-1 ring-white/15">
              ⏱ {String(Math.floor(hud.time / 60)).padStart(1, '0')}:{String(Math.floor(hud.time % 60)).padStart(2, '0')}
            </span>
            {comboText ? (
              <span key={hud.combo} className="animate-pop rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-amber-950 shadow">
                🔥 {comboText}
              </span>
            ) : null}
            <span className="sr-only" data-testid={`${testIdPrefix}-hearts`}>
              하트 {hud.hearts}
            </span>
          </div>
        </div>
        <div className="sr-only" data-testid={`${testIdPrefix}-words`} data-words={offscreen}>
          {offscreen}
        </div>

        {finished ? (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/35 backdrop-blur-[1px]">
            <span className="animate-pop rounded-2xl bg-white/95 px-4 py-2 text-sm font-extrabold text-slate-800 shadow-card">
              {hud.hearts > 0 ? '방어 성공! 🎉' : '방어막 파괴 💥'}
            </span>
          </div>
        ) : null}
      </div>

      <div className={cn('relative', inputShake > 0 && 'animate-shake')} key={inputShake}>
        <input
          ref={inputRef}
          data-testid={`${testIdPrefix}-input`}
          value={typed}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit(true);
            }
          }}
          disabled={finished}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="send"
          inputMode="text"
          placeholder={accentText ?? '떨어지는 단어를 그대로 입력!'}
          className="w-full rounded-2xl border-0 bg-slate-900 px-4 py-3.5 text-center text-[17px] font-extrabold tracking-wide text-white shadow-card ring-2 ring-slate-700 outline-none placeholder:text-[12px] placeholder:font-semibold placeholder:tracking-normal placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-400"
          style={{ fontSize: 17 }}
        />
        <button
          type="button"
          data-testid={`${testIdPrefix}-fire`}
          onClick={() => submit(true)}
          disabled={finished}
          className="absolute inset-y-1 right-1 rounded-xl bg-cyan-500 px-3 text-[12px] font-extrabold text-slate-950 active:scale-95 disabled:opacity-40"
        >
          발사
        </button>
      </div>
      <p className="text-center text-[10.5px] leading-relaxed text-slate-400">
        {hintLabel}는 힌트로 보여 줘요. 철자를 다 치면 자동 발사, 엔터를 누르면 앞부분만 쳐도 가장 가까운 운석을 맞춰요.
        <br className="sm:hidden" /> 격추 4·8개마다 <span className="font-bold text-amber-300">WAVE</span>가 올라 낙하가 빨라져요.
      </p>
    </div>
  );
}
