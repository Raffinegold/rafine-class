/**
 * 게임 효과음 — 오디오 파일 없이 WebAudio 오실레이터·노이즈로만 만듭니다.
 * 아이패드·아이폰은 첫 제스처(버튼 터치) 안에서 AudioContext 를 열어야 소리가 납니다.
 */

const MUTE_KEY = 'rafine-voca-sound-muted-v1';

let ctx: AudioContext | null = null;
let muted = readMuted();

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

function rawContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function audio(): AudioContext | null {
  if (muted) return null;
  return rawContext();
}

function tone(freq: number, durationMs: number, delayMs = 0, type: OscillatorType = 'sine', volume = 0.14) {
  const ac = audio();
  if (!ac) return;
  const start = ac.currentTime + delayMs / 1000;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(start + durationMs / 1000 + 0.02);
}

/** 주파수를 미끄러뜨리는 소리 (레이저·휘두르기·하강음) */
function sweep(from: number, to: number, durationMs: number, delayMs = 0, type: OscillatorType = 'sawtooth', volume = 0.1) {
  const ac = audio();
  if (!ac) return;
  const start = ac.currentTime + delayMs / 1000;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), start + durationMs / 1000);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(start + durationMs / 1000 + 0.02);
}

/** 폭발·타격용 노이즈 (짧은 화이트노이즈를 로우패스로 깎아 씁니다) */
function noise(durationMs: number, volume = 0.12, filterFreq = 1200, delayMs = 0) {
  const ac = audio();
  if (!ac) return;
  const start = ac.currentTime + delayMs / 1000;
  const len = Math.max(1, Math.floor((ac.sampleRate * durationMs) / 1000));
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(filterFreq, start);
  filter.frequency.exponentialRampToValueAtTime(Math.max(120, filterFreq * 0.35), start + durationMs / 1000);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(start);
}

export function isSoundMuted(): boolean {
  return muted;
}

export function setSoundMuted(next: boolean): void {
  muted = next;
  try {
    localStorage.setItem(MUTE_KEY, next ? '1' : '0');
  } catch {
    /* ignore */
  }
  if (next) {
    haltBgm();
  } else {
    tone(660, 90);
    // 음소거가 풀리면 지금 게임 화면이 원하는 BGM을 바로 이어 붙입니다.
    if (bgmWanted) launchBgm(bgmWanted);
  }
  markBgm();
}

export const sfx = {
  /* --- 공통 --- */
  flip() {
    tone(520, 70, 0, 'triangle', 0.08);
  },
  tap() {
    tone(740, 45, 0, 'triangle', 0.05);
  },
  match(combo = 1) {
    const base = 620 + Math.min(combo - 1, 4) * 80;
    tone(base, 110, 0, 'sine', 0.12);
    tone(base * 1.5, 140, 90, 'sine', 0.1);
  },
  combo(n = 2) {
    const notes = [784, 988, 1175, 1568];
    notes.slice(0, Math.min(3, n + 1)).forEach((f, i) => tone(f, 110, i * 60, 'triangle', 0.09));
  },
  miss() {
    tone(240, 150, 0, 'sawtooth', 0.07);
    tone(180, 180, 110, 'sawtooth', 0.06);
  },
  fail() {
    sweep(520, 140, 320, 0, 'sawtooth', 0.08);
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 200, i * 110, 'sine', 0.12));
  },
  reward() {
    [880, 1175].forEach((f, i) => tone(f, 140, i * 90, 'triangle', 0.1));
  },
  coin() {
    tone(988, 60, 0, 'triangle', 0.08);
    tone(1480, 100, 55, 'triangle', 0.07);
  },

  /* --- 슈팅 · 타자 디펜스 --- */
  laser() {
    sweep(1600, 320, 150, 0, 'square', 0.05);
  },
  explode() {
    noise(280, 0.16, 1600);
    sweep(420, 90, 260, 0, 'sine', 0.1);
    tone(70, 200, 20, 'sine', 0.12);
  },
  hurt() {
    sweep(320, 90, 240, 0, 'sawtooth', 0.1);
    noise(130, 0.08, 700);
  },
  alarm() {
    [0, 160].forEach((d) => tone(760, 110, d, 'square', 0.07));
  },
  charge() {
    sweep(180, 900, 280, 0, 'sine', 0.06);
  },

  /* --- 전투 --- */
  slash() {
    noise(150, 0.1, 3200);
    sweep(1800, 500, 140, 0, 'sawtooth', 0.06);
  },
  hit() {
    tone(170, 90, 0, 'square', 0.1);
    noise(90, 0.1, 900);
  },
  hurtPlayer() {
    tone(150, 180, 0, 'square', 0.09);
    sweep(240, 110, 200, 0, 'sawtooth', 0.07);
  },
  chargeUp() {
    sweep(240, 1200, 420, 0, 'sine', 0.05);
  },
  victory() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 240, i * 120, 'triangle', 0.11));
  },
  defeat() {
    [392, 330, 262, 196].forEach((f, i) => tone(f, 260, i * 150, 'sine', 0.1));
  },

  /* --- 로봇 · 퍼즐 --- */
  step() {
    tone(220, 50, 0, 'square', 0.05);
  },
  turn() {
    tone(380, 60, 0, 'triangle', 0.06);
  },
  bump() {
    tone(120, 140, 0, 'square', 0.09);
    noise(90, 0.07, 600);
  },
  goal() {
    [660, 880, 1100].forEach((f, i) => tone(f, 150, i * 90, 'triangle', 0.1));
    noise(200, 0.06, 2400, 60);
  },
  fly() {
    sweep(300, 1200, 220, 0, 'sine', 0.06);
  },

  /* --- 해킹 --- */
  key() {
    tone(420, 30, 0, 'square', 0.035);
  },
  lockOpen() {
    tone(300, 60, 0, 'square', 0.07);
    tone(760, 90, 45, 'triangle', 0.07);
    tone(1180, 130, 110, 'sine', 0.08);
  },
  grant() {
    [523, 784, 1047, 1568].forEach((f, i) => tone(f, 180, i * 100, 'square', 0.07));
  },
  trace() {
    [0, 120, 240].forEach((d) => tone(880, 80, d, 'square', 0.06));
  },
};

/* ------------------------------ 배경음악(BGM) ------------------------------ */
/**
 * 게임 배경음악 — 오디오 파일 없이 WebAudio 오실레이터만으로 만드는 작은 루프.
 * 부드러운 triangle/sine 톤과 아주 낮은 마스터 게인(0.045)이라 효과음을 가리지 않습니다.
 *  - arcade: 밝고 경쾌한 8비트풍 아르페지오 (짝맞추기·산성비·로봇·보스전 등)
 *  - cyber : 은은한 사이버 신스 (해커 침투)
 * 학생이 게임 카드를 눌러 진입하면 시작하고, 화면을 벗어나면 자동으로 멈춥니다.
 */
export type BgmMood = 'arcade' | 'cyber';

interface BgmNote {
  f: number;
  type: OscillatorType;
  g: number;
  d: number;
}

interface BgmPattern {
  stepDur: number;
  steps: BgmNote[][];
}

const BGM_LEVEL = 0.045;
const BGM_DUCK = 0.22;
const BGM_SILENT = 0.0001;

const P = {
  A2: 110,
  F2: 87.31,
  G2: 98,
  C3: 130.81,
  F3: 174.61,
  G3: 196,
  A3: 220,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392,
  A4: 440,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880,
  B5: 987.77,
  C6: 1046.5,
  D6: 1174.66,
};

const note = (f: number, g: number, d: number, type: OscillatorType = 'triangle'): BgmNote => ({ f, type, g, d });

/** 밝은 아케이드 루프 — C · Am · F · G 4마디 아르페지오 */
function buildArcade(): BgmPattern {
  const bars = [
    { mel: [P.C4, P.E4, P.G4, P.E4, P.C4, P.E4, P.G4, P.C5], bass: P.C3 },
    { mel: [P.A3, P.C4, P.E4, P.C4, P.A3, P.C4, P.E4, P.A4], bass: P.A2 },
    { mel: [P.F4, P.A4, P.C5, P.A4, P.F4, P.A4, P.C5, P.F5], bass: P.F2 },
    { mel: [P.G4, P.B4, P.D5, P.B4, P.G4, P.B4, P.D5, P.G5], bass: P.G2 },
  ];
  const steps: BgmNote[][] = [];
  for (const bar of bars) {
    bar.mel.forEach((f, i) => {
      const accent = i % 4 === 0;
      const s: BgmNote[] = [note(f, accent ? 0.52 : 0.38, 0.2)];
      if (i === 0 || i === 4) s.push(note(bar.bass, 0.6, 0.52, 'sine'));
      if (i === 7) s.push(note(f * 2, 0.12, 0.28, 'sine'));
      steps.push(s);
    });
  }
  return { stepDur: 0.22, steps };
}

/** 은은한 사이버 루프 — Am · F · C · G 패드 + 낮은 펄스 + 드문 고음 점멸 */
function buildCyber(): BgmPattern {
  const bars = [
    { pad: [P.A3, P.E4], bass: P.A2, blip: { i: 2, f: P.E5 } },
    { pad: [P.F3, P.C4], bass: P.F2, blip: { i: 5, f: P.D5 } },
    { pad: [P.C4, P.G4], bass: P.C3, blip: { i: 3, f: P.C5 } },
    { pad: [P.G3, P.D4], bass: P.G2, blip: { i: 6, f: P.B5 } },
  ];
  const steps: BgmNote[][] = [];
  for (const bar of bars) {
    for (let i = 0; i < 8; i += 1) {
      const s: BgmNote[] = [];
      if (i === 0) {
        for (const f of bar.pad) {
          s.push(note(f, 0.2, 1.9, 'sine'));
          s.push(note(f * 1.0025, 0.14, 1.9, 'sine'));
        }
        s.push(note(bar.bass, 0.55, 0.75, 'sine'));
      }
      if (i === 4) s.push(note(bar.bass, 0.38, 0.45, 'sine'));
      if (bar.blip.i === i) s.push(note(bar.blip.f, 0.14, 0.38, 'triangle'));
      steps.push(s);
    }
  }
  return { stepDur: 0.3, steps };
}

const BGM_PATTERNS: Record<BgmMood, BgmPattern> = { arcade: buildArcade(), cyber: buildCyber() };

let bgmMaster: GainNode | null = null;
let bgmTimer: number | null = null;
let bgmMood: BgmMood | null = null;
let bgmWanted: BgmMood | null = null;
let bgmStepIndex = 0;
let bgmNextTime = 0;
let bgmDucked = false;
let unlockBound = false;

function bgmGain(ac: AudioContext): GainNode {
  if (!bgmMaster) {
    bgmMaster = ac.createGain();
    bgmMaster.gain.value = BGM_SILENT;
    bgmMaster.connect(ac.destination);
  }
  return bgmMaster;
}

function bgmLevel(): number {
  return BGM_LEVEL * (bgmDucked ? BGM_DUCK : 1);
}

function bgmRamp(ac: AudioContext, value: number, seconds: number) {
  const g = bgmGain(ac);
  const now = ac.currentTime;
  const from = Math.max(BGM_SILENT, g.gain.value);
  g.gain.cancelScheduledValues(now);
  g.gain.setValueAtTime(from, now);
  g.gain.exponentialRampToValueAtTime(Math.max(BGM_SILENT, value), now + seconds);
}

/** 상태를 QA·디버깅용으로 <html data-bgm="arcade" data-bgm-ducked="1"> 에 남깁니다 */
function markBgm() {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  if (bgmMood) {
    el.dataset.bgm = bgmMood;
    el.dataset.bgmDucked = bgmDucked ? '1' : '0';
  } else {
    delete el.dataset.bgm;
    delete el.dataset.bgmDucked;
  }
}

function playBgmNote(ac: AudioContext, n: BgmNote, at: number) {
  const out = bgmGain(ac);
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = n.type;
  osc.frequency.setValueAtTime(n.f, at);
  const peak = Math.max(0.0002, n.g);
  const attack = Math.min(0.06, Math.max(0.012, n.d * 0.25));
  env.gain.setValueAtTime(BGM_SILENT, at);
  env.gain.exponentialRampToValueAtTime(peak, at + attack);
  env.gain.exponentialRampToValueAtTime(BGM_SILENT, at + n.d);
  osc.connect(env).connect(out);
  osc.start(at);
  osc.stop(at + n.d + 0.06);
}

function bgmTick() {
  if (!bgmMood || muted) return;
  const ac = rawContext();
  if (!ac) return;
  const conf = BGM_PATTERNS[bgmMood];
  const now = ac.currentTime;
  if (bgmNextTime < now + 0.02) bgmNextTime = now + 0.06;
  while (bgmNextTime < now + 0.45) {
    const step = conf.steps[bgmStepIndex % conf.steps.length];
    for (const n of step) playBgmNote(ac, n, bgmNextTime);
    bgmNextTime += conf.stepDur;
    bgmStepIndex += 1;
  }
}

function bindBgmUnlock() {
  if (unlockBound || typeof window === 'undefined') return;
  unlockBound = true;
  const onGesture = () => {
    if (!bgmWanted || muted) return;
    const ac = rawContext();
    if (!ac) return;
    if (ac.state === 'suspended') {
      void ac.resume().then(() => {
        if (bgmWanted && !muted) launchBgm(bgmWanted);
      });
    } else if (bgmTimer === null) {
      launchBgm(bgmWanted);
    }
  };
  ['pointerdown', 'touchstart', 'keydown'].forEach((t) =>
    window.addEventListener(t, onGesture, { passive: true })
  );
}

function launchBgm(mood: BgmMood) {
  if (muted) return;
  const ac = rawContext();
  if (!ac) return;
  bgmGain(ac);
  if (bgmMood === mood && bgmTimer !== null) {
    bgmRamp(ac, bgmLevel(), 0.25);
    markBgm();
    return;
  }
  if (bgmTimer !== null) window.clearInterval(bgmTimer);
  bgmMood = mood;
  bgmStepIndex = 0;
  bgmNextTime = ac.currentTime + 0.08;
  bgmRamp(ac, bgmLevel(), 0.6);
  bgmTimer = window.setInterval(bgmTick, 180);
  bgmTick();
  markBgm();
}

/** BGM을 멈춥니다. 원하는 곡(bgmWanted)은 남겨 두어 음소거 해제 시 이어 붙일 수 있게 합니다. */
function haltBgm() {
  if (bgmTimer !== null) {
    window.clearInterval(bgmTimer);
    bgmTimer = null;
  }
  if (typeof window !== 'undefined' && ctx && bgmMaster) bgmRamp(ctx, BGM_SILENT, 0.12);
  bgmMood = null;
  markBgm();
}

/** 게임 화면 진입 — 이 게임의 BGM을 켭니다 (자동재생 정책 때문에 첫 터치에서 실제로 울립니다) */
export function startBgm(mood: BgmMood = 'arcade'): void {
  bgmWanted = mood;
  bindBgmUnlock();
  launchBgm(mood);
  markBgm();
}

/** 게임 화면 이탈 — BGM을 끕니다 */
export function stopBgm(): void {
  bgmWanted = null;
  haltBgm();
}

/** 발음 재생 중에는 BGM을 더 낮춥니다(duck) */
export function duckBgm(on: boolean): void {
  if (bgmDucked === on) return;
  bgmDucked = on;
  if (bgmMood && !muted) {
    const ac = rawContext();
    if (ac) bgmRamp(ac, bgmLevel(), on ? 0.12 : 0.3);
  }
  markBgm();
}

export function currentBgm(): BgmMood | null {
  return bgmMood;
}
