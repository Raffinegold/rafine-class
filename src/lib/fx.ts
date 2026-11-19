/**
 * 2D 게임 공통 이펙트 — 파티클 폭발, 충격파, 레이저 빔, 데미지 팝업, 화면 흔들림.
 * 각 게임은 requestAnimationFrame 안에서 fx.update(dt) → fx.draw(ctx) 만 호출하면 됩니다.
 */

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  gravity: number;
  drag: number;
  shape: 'dot' | 'spark' | 'square';
  spin: number;
  angle: number;
}

export interface Popup {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  max: number;
  size: number;
  vy: number;
}

export interface Beam {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  life: number;
  max: number;
  color: string;
  width: number;
}

export interface Wave {
  x: number;
  y: number;
  r: number;
  maxR: number;
  life: number;
  max: number;
  color: string;
  width: number;
}

export interface BurstOptions {
  count?: number;
  color?: string | string[];
  speed?: number;
  spread?: number;
  angle?: number;
  size?: number;
  gravity?: number;
  life?: number;
  shape?: Particle['shape'];
  drag?: number;
}

function pick<T>(value: T | T[]): T {
  return Array.isArray(value) ? value[Math.floor(Math.random() * value.length)] : value;
}

export class Fx {
  particles: Particle[] = [];
  popups: Popup[] = [];
  beams: Beam[] = [];
  waves: Wave[] = [];
  shakeTime = 0;
  shakeDuration = 0;
  shakeMag = 0;
  flashColor = '';
  flashLife = 0;
  flashMax = 0;

  clear() {
    this.particles = [];
    this.popups = [];
    this.beams = [];
    this.waves = [];
    this.shakeTime = 0;
    this.shakeMag = 0;
    this.flashLife = 0;
    this.flashColor = '';
  }

  burst(x: number, y: number, opts: BurstOptions = {}) {
    const count = opts.count ?? 16;
    const speed = opts.speed ?? 220;
    const spread = opts.spread ?? Math.PI * 2;
    const baseAngle = opts.angle ?? 0;
    const life = opts.life ?? 0.65;
    const size = opts.size ?? 3;
    const gravity = opts.gravity ?? 420;
    const drag = opts.drag ?? 1.4;
    const shape = opts.shape ?? 'dot';
    for (let i = 0; i < count; i += 1) {
      const angle = baseAngle + (Math.random() - 0.5) * spread;
      const sp = speed * (0.35 + Math.random() * 0.9);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * sp,
        vy: Math.sin(angle) * sp,
        life,
        max: life * (0.7 + Math.random() * 0.6),
        size: size * (0.6 + Math.random() * 0.9),
        color: pick(opts.color ?? '#fde68a'),
        gravity,
        drag,
        shape,
        spin: (Math.random() - 0.5) * 12,
        angle: Math.random() * Math.PI,
      });
      this.particles[this.particles.length - 1].max = life * (0.7 + Math.random() * 0.6);
    }
    if (this.particles.length > 420) this.particles.splice(0, this.particles.length - 420);
  }

  /** 폭발 — 파티클 + 충격파 + 화면 흔들림 */
  explode(x: number, y: number, color: string | string[] = ['#fbbf24', '#f97316', '#fef3c7'], scale = 1) {
    this.burst(x, y, { count: Math.round(26 * scale), color, speed: 300 * scale, size: 3.4 * scale, life: 0.8, shape: 'spark' });
    this.burst(x, y, { count: Math.round(10 * scale), color: '#fff7ed', speed: 120 * scale, size: 2.2, life: 0.45 });
    this.wave(x, y, 70 * scale, color2(color));
    this.shake(9 * scale, 0.28);
  }

  wave(x: number, y: number, maxR = 80, color = '#fbbf24', width = 3) {
    this.waves.push({ x, y, r: 6, maxR, life: 0.5, max: 0.5, color, width });
  }

  popup(x: number, y: number, text: string, color = '#f87171', size = 22) {
    this.popups.push({ x, y, text, color, life: 1.05, max: 1.05, size, vy: -46 });
    if (this.popups.length > 24) this.popups.shift();
  }

  beam(x1: number, y1: number, x2: number, y2: number, color = '#67e8f9', width = 4) {
    this.beams.push({ x1, y1, x2, y2, color, life: 0.2, max: 0.2, width });
    if (this.beams.length > 20) this.beams.shift();
  }

  shake(mag = 8, duration = 0.25) {
    this.shakeMag = Math.max(this.shakeMag, mag);
    this.shakeTime = Math.max(this.shakeTime, duration);
    this.shakeDuration = this.shakeTime;
  }

  flash(color = 'rgba(248,113,113,0.35)', life = 0.22) {
    this.flashColor = color;
    this.flashLife = life;
    this.flashMax = life;
  }

  update(dt: number) {
    const step = Math.min(dt, 0.05);
    for (const p of this.particles) {
      p.life -= step;
      p.vy += p.gravity * step;
      p.vx -= p.vx * p.drag * step;
      p.vy -= p.vy * p.drag * 0.35 * step;
      p.x += p.vx * step;
      p.y += p.vy * step;
      p.angle += p.spin * step;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const p of this.popups) {
      p.life -= step;
      p.y += p.vy * step;
      p.vy += 24 * step;
    }
    this.popups = this.popups.filter((p) => p.life > 0);
    for (const b of this.beams) b.life -= step;
    this.beams = this.beams.filter((b) => b.life > 0);
    for (const w of this.waves) {
      w.life -= step;
      w.r += ((w.maxR - w.r) * 8 + 30) * step;
    }
    this.waves = this.waves.filter((w) => w.life > 0);
    if (this.shakeTime > 0) {
      this.shakeTime -= step;
      if (this.shakeTime <= 0) this.shakeMag = 0;
    }
    if (this.flashLife > 0) this.flashLife -= step;
  }

  /** 화면 흔들림 오프셋 (ctx.translate 에 넣습니다) */
  offset(): { x: number; y: number } {
    if (this.shakeTime <= 0) return { x: 0, y: 0 };
    const k = Math.min(1, this.shakeTime / Math.max(0.0001, this.shakeDuration));
    const m = this.shakeMag * k;
    return { x: (Math.random() - 0.5) * 2 * m, y: (Math.random() - 0.5) * 2 * m };
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    /* 레이저 */
    for (const b of this.beams) {
      const k = Math.max(0, b.life / b.max);
      ctx.globalAlpha = k;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.width * (0.6 + k);
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
      ctx.globalAlpha = k * 0.9;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, b.width * 0.35);
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    /* 충격파 */
    for (const w of this.waves) {
      const k = Math.max(0, w.life / w.max);
      ctx.globalAlpha = k * 0.8;
      ctx.strokeStyle = w.color;
      ctx.lineWidth = w.width * k;
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    /* 파티클 */
    for (const p of this.particles) {
      const k = Math.max(0, p.life / p.max);
      ctx.globalAlpha = Math.min(1, k * 1.6);
      ctx.fillStyle = p.color;
      if (p.shape === 'spark') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillRect(-p.size * 1.8, -p.size * 0.35, p.size * 3.6, p.size * 0.7);
        ctx.restore();
      } else if (p.shape === 'square') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.5 + k * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    /* 데미지 팝업 */
    for (const p of this.popups) {
      const k = Math.max(0, p.life / p.max);
      ctx.globalAlpha = Math.min(1, k * 1.8);
      ctx.font = `800 ${p.size}px "Pretendard", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(15,23,42,0.55)';
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;

    /* 화면 플래시 */
    if (this.flashLife > 0 && this.flashMax > 0) {
      ctx.globalAlpha = Math.max(0, this.flashLife / this.flashMax) * 0.9;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(-60, -60, 4000, 4000);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}

function color2(value: string | string[]): string {
  if (Array.isArray(value)) return value[0] ?? '#fbbf24';
  return value;
}

/* ------------------------------ 캔버스 유틸 ------------------------------ */

/** 캔버스를 CSS 크기 × devicePixelRatio 로 맞추고 CSS 픽셀 좌표계를 돌려줍니다 */
export function setupCanvas(canvas: HTMLCanvasElement): { ctx: CanvasRenderingContext2D; w: number; h: number } | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(2.5, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** 결정적 난수 (별밭이 매 프레임 흔들리지 않게) */
export function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Star {
  x: number;
  y: number;
  r: number;
  a: number;
  twinkle: number;
}

export function makeStars(w: number, h: number, count: number, seed = 7): Star[] {
  const rand = mulberry(seed);
  return Array.from({ length: count }, () => ({
    x: rand() * w,
    y: rand() * h * 0.75,
    r: 0.5 + rand() * 1.6,
    a: 0.25 + rand() * 0.6,
    twinkle: rand() * Math.PI * 2,
  }));
}

/** 글자 폭에 맞춘 어두운 라운드 배경 (운석 이름표) */
export function labelPlate(
  ctx: CanvasRenderingContext2D,
  text: string,
  sub: string,
  x: number,
  y: number,
  opts: { color?: string; subColor?: string; font?: number; subFont?: number; padX?: number; plate?: string; glow?: string }
) {
  const font = opts.font ?? 17;
  const subFont = opts.subFont ?? 11;
  ctx.font = `800 ${font}px "Pretendard", system-ui, sans-serif`;
  const tw = ctx.measureText(text).width;
  ctx.font = `600 ${subFont}px "Pretendard", system-ui, sans-serif`;
  const sw = sub ? ctx.measureText(sub).width : 0;
  const w = Math.max(tw, sw) + (opts.padX ?? 18) * 2;
  const h = sub ? font + subFont + 14 : font + 12;
  ctx.save();
  if (opts.glow) {
    ctx.shadowColor = opts.glow;
    ctx.shadowBlur = 14;
  }
  ctx.fillStyle = opts.plate ?? 'rgba(15,23,42,0.78)';
  roundRect(ctx, x - w / 2, y - font + 2, w, h, 10);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.textAlign = 'center';
  ctx.fillStyle = opts.color ?? '#f8fafc';
  ctx.font = `800 ${font}px "Pretendard", system-ui, sans-serif`;
  ctx.fillText(text, x, y);
  if (sub) {
    ctx.fillStyle = opts.subColor ?? 'rgba(226,232,240,0.72)';
    ctx.font = `600 ${subFont}px "Pretendard", system-ui, sans-serif`;
    ctx.fillText(sub, x, y + subFont + 4);
  }
  ctx.restore();
  return { w, h };
}

/** 하트(방어막) 그리기 */
export function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, filled: boolean, color = '#fb7185') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 16, size / 16);
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-2, 2, -9, -1, -9, -5.5);
  ctx.bezierCurveTo(-9, -9.5, -4, -11, 0, -7.5);
  ctx.bezierCurveTo(4, -11, 9, -9.5, 9, -5.5);
  ctx.bezierCurveTo(9, -1, 2, 2, 0, 5);
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fill();
  } else {
    ctx.strokeStyle = 'rgba(148,163,184,0.55)';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }
  ctx.restore();
}

/** 파동치는 별 모양 */
export function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, spin = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    if (i === 0) ctx.moveTo(Math.cos(angle) * rr, Math.sin(angle) * rr);
    else ctx.lineTo(Math.cos(angle) * rr, Math.sin(angle) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.restore();
}
