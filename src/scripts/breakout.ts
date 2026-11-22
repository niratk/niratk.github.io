interface CharBlock {
  el: HTMLSpanElement;
  char: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  points: number;
  alive: boolean;
}

interface TextReplacement {
  parent: Node;
  originalNode: Text;
  insertedNodes: Node[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  vRot: number;
}

interface FloatingScore {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  large?: boolean;
}

interface TrailPoint {
  x: number;
  y: number;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  speed: number;
  trail: TrailPoint[];
  pierceTimer: number;
  boostTimer: number;
  lastSmashId: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  life: number;
  maxLife: number;
}

type ThrustState = 'idle' | 'up' | 'return';

type PowerUpType = 'add3' | 'double' | 'wide' | 'guard' | 'pierce';

interface PowerUpItem {
  type: PowerUpType;
  x: number; // center x
  y: number; // center y
  w: number;
  h: number;
  vy: number;
  age: number;
}

interface PowerUpSpec {
  type: PowerUpType;
  label: string;
  toast: string;
  bg: string;
  border: string;
  weight: number;
}

interface ClipBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

type GamePhase = 'ready' | 'playing' | 'paused' | 'gameover' | 'clear' | 'empty';

const INITIAL_LIVES = 3;
const HUD_HEIGHT = 64;
const PADDLE_BOTTOM_OFFSET = 46;
const PADDLE_HEIGHT = 12;
const PADDLE_TOP_CLEARANCE = 44;
const PADDLE_GUARD_CLEARANCE = 10;
const BLOCK_ZONE_BOTTOM_MARGIN = 44;
const COMBO_DURATION = 3.5; // seconds before combo expires
const COMBO_WARN_TIME = 1.0; // seconds remaining to show warning state
const CHARGE_MAX_TIME = 0.85; // seconds to reach 100% power charge
const CHARGE_MIN_RATIO = 0.16; // minimum charge ratio to trigger smash thrust
const CHARGE_PULL_DOWN = 10; // px paddle sinks while fully charged
const THRUST_UP_DURATION = 0.075; // seconds to snap upward past base position
const THRUST_RETURN_DURATION = 0.17; // seconds to settle back to base position
const THRUST_PEAK_MIN = 10; // px above base position at minimum charge
const THRUST_PEAK_MAX = 22; // px above base position at full charge
const SMASH_WINDOW_DURATION = 0.2; // seconds after release during which paddle hits trigger smash
const SMASH_SPEED_MIN_MULT = 1.4; // speed multiplier at minimum charge
const SMASH_SPEED_MAX_MULT = 1.9; // speed multiplier at full charge
const SMASH_PIERCE_MIN_DURATION = 0.55; // seconds of short pierce at minimum charge
const SMASH_PIERCE_MAX_DURATION = 1.55; // seconds of short pierce at full charge
const SMASH_BOOST_MIN_DURATION = 0.65; // seconds of high speed at minimum charge
const SMASH_BOOST_MAX_DURATION = 1.65; // seconds of high speed at full charge
const CLEAR_LIFE_BONUS = 500;
const BEST_SCORE_KEY = 'text-breakout-best-score';
const MUTE_KEY = 'text-breakout-muted';

const MAX_BALLS = 40;
const MAX_FALLING_ITEMS = 6;
const WIDE_DURATION = 12; // seconds
const PIERCE_DURATION = 8; // seconds
const WIDE_MULTIPLIER = 1.65;
const GUARD_LINE_BOTTOM_OFFSET = 10;
const ITEM_WIDTH = 66;
const ITEM_HEIGHT = 24;
const ITEM_FALL_SPEED = 165;

const POWERUP_SPECS: Record<PowerUpType, PowerUpSpec> = {
  add3: {
    type: 'add3',
    label: '+3',
    toast: '球数 +3!',
    bg: '#0891b2',
    border: '#67e8f9',
    weight: 28,
  },
  double: {
    type: 'double',
    label: '×2',
    toast: '球数 ×2!',
    bg: '#7c3aed',
    border: '#c4b5fd',
    weight: 8,
  },
  wide: {
    type: 'wide',
    label: 'ワイド',
    toast: 'ワイドパドル!',
    bg: '#059669',
    border: '#6ee7b7',
    weight: 28,
  },
  guard: {
    type: 'guard',
    label: 'ガード',
    toast: '落下ガード +1!',
    bg: '#2563eb',
    border: '#93c5fd',
    weight: 28,
  },
  pierce: {
    type: 'pierce',
    label: '貫通',
    toast: '貫通弾!',
    bg: '#ea580c',
    border: '#fdba74',
    weight: 8,
  },
};

const POWERUP_LIST: PowerUpSpec[] = Object.values(POWERUP_SPECS);
const POWERUP_TOTAL_WEIGHT = POWERUP_LIST.reduce((sum, s) => sum + s.weight, 0);

const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEMPLATE',
  'TEXTAREA',
  'INPUT',
  'SELECT',
  'OPTION',
  'SVG',
  'MATH',
  'IFRAME',
  'CANVAS',
  'AUDIO',
  'VIDEO',
]);

const PENTATONIC_FREQS = [
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.0, // A5
  1046.5, // C6
  1174.66, // D6
  1318.51, // E6
  1567.98, // G6
  1760.0, // A6
];

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage errors
  }
}

function segmentGraphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

function pickRandomPowerUp(): PowerUpType {
  let r = Math.random() * POWERUP_TOTAL_WEIGHT;
  for (const spec of POWERUP_LIST) {
    r -= spec.weight;
    if (r <= 0) return spec.type;
  }
  return 'add3';
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted: boolean;
  private lastBrickAt = 0;
  private lastWallAt = 0;
  private lastPaddleAt = 0;

  constructor() {
    this.muted = readStorage(MUTE_KEY) === 'true';
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    writeStorage(MUTE_KEY, String(this.muted));
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private tone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = 'triangle',
    gainPeak = 0.08,
    delay = 0,
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  public playLaunch(): void {
    this.tone(330, 520, 0.09, 'triangle', 0.07);
  }

  public playWall(): void {
    const now = performance.now();
    if (now - this.lastWallAt < 40) return;
    this.lastWallAt = now;
    this.tone(210, 180, 0.05, 'sine', 0.05);
  }

  public playPaddle(): void {
    const now = performance.now();
    if (now - this.lastPaddleAt < 45) return;
    this.lastPaddleAt = now;
    this.tone(300, 420, 0.08, 'triangle', 0.08);
  }

  public playBrick(combo: number): void {
    const now = performance.now();
    if (now - this.lastBrickAt < 35) return;
    this.lastBrickAt = now;
    const idx = Math.min(Math.max(0, combo - 1), PENTATONIC_FREQS.length - 1);
    const freq = PENTATONIC_FREQS[idx];
    this.tone(freq, freq * 1.12, 0.09, 'triangle', 0.075);
  }

  public playPowerup(): void {
    this.tone(587.33, 659.25, 0.08, 'triangle', 0.075, 0);
    this.tone(880, 1046.5, 0.11, 'triangle', 0.075, 0.065);
  }

  public playGuardBounce(): void {
    this.tone(440, 680, 0.14, 'sine', 0.09, 0);
    this.tone(660, 880, 0.12, 'triangle', 0.06, 0.05);
  }

  public playChargeReady(): void {
    this.tone(783.99, 1046.5, 0.09, 'sine', 0.05, 0);
    this.tone(1046.5, 1318.51, 0.1, 'triangle', 0.045, 0.05);
  }

  public playThrustRelease(power: number): void {
    const startFreq = 210 + power * 70;
    const endFreq = 390 + power * 180;
    this.tone(startFreq, endFreq, 0.07, 'triangle', 0.055 + power * 0.025);
  }

  public playSmashHit(power: number): void {
    this.tone(220, 680 + power * 260, 0.13, 'triangle', 0.095 + power * 0.025, 0);
    this.tone(520, 1040 + power * 320, 0.14, 'sine', 0.075, 0.025);
  }

  public playMiss(): void {
    this.tone(240, 110, 0.25, 'sawtooth', 0.06);
  }

  public playGameOver(): void {
    this.tone(260, 220, 0.14, 'triangle', 0.07, 0);
    this.tone(220, 175, 0.16, 'triangle', 0.07, 0.13);
    this.tone(175, 130, 0.28, 'triangle', 0.07, 0.28);
  }

  public playClear(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      this.tone(f, f * 1.02, 0.18, 'triangle', 0.08, i * 0.09);
    });
  }

  public dispose(): void {
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}

class TextBreakoutGame {
  private active = false;
  private phase: GamePhase = 'ready';

  private score = 0;
  private bestScore = 0;
  private isNewBest = false;
  private lives = INITIAL_LIVES;
  private combo = 0;
  private comboTimer = 0;
  private maxCombo = 0;
  private totalBlocks = 0;
  private destroyedBlocks = 0;

  private blocks: CharBlock[] = [];
  private replacements: TextReplacement[] = [];
  private particles: Particle[] = [];
  private shockwaves: Shockwave[] = [];
  private floatingScores: FloatingScore[] = [];
  private balls: Ball[] = [];
  private items: PowerUpItem[] = [];

  // Active power-up states
  private wideTimer = 0;
  private pierceTimer = 0;
  private guardCount = 0;
  private guardFlash = 0;

  private width = 0;
  private height = 0;
  private dpr = 1;

  private paddle = {
    x: 0,
    y: 0,
    prevEffectiveY: 0,
    w: 120,
    baseW: 120,
    h: PADDLE_HEIGHT,
    bounceOffset: 0,
    charging: false,
    chargeLevel: 0,
    chargeFullNotified: false,
    animOffsetY: 0,
    shakeX: 0,
    thrustState: 'idle' as ThrustState,
    thrustTimer: 0,
    thrustStartY: 0,
    thrustPeakY: 0,
    smashWindowTimer: 0,
    smashPower: 0,
  };

  private smashReleaseId = 0;

  private chargeInput = {
    space: false,
    pointer: false,
  };

  private ballRadius = 7;
  private baseBallSpeed = 440;
  private launchAngle = 0.35;

  private keys = {
    left: false,
    right: false,
    up: false,
    down: false,
  };

  private scanTime = 0;
  private missFlash = 0;
  private elapsedTime = 0;
  private rafId: number | null = null;
  private lastTimestamp = 0;

  private lockedScrollX = 0;
  private lockedScrollY = 0;
  private prevHtmlPaddingRight = '';

  private sound = new SoundEngine();

  // UI DOM elements
  private rootEl: HTMLDivElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private scoreEl: HTMLElement | null = null;
  private comboEl: HTMLElement | null = null;
  private comboTimeEl: HTMLElement | null = null;
  private comboBarEl: HTMLElement | null = null;
  private lastComboVisualState = '';
  private lastComboTimeText = '';
  private bestEl: HTMLElement | null = null;
  private livesEl: HTMLElement | null = null;
  private blocksEl: HTMLElement | null = null;
  private muteBtn: HTMLButtonElement | null = null;
  private pauseBtn: HTMLButtonElement | null = null;
  private hintEl: HTMLElement | null = null;
  private modalEl: HTMLElement | null = null;

  // Active effects bar elements
  private wideBadgeEl: HTMLElement | null = null;
  private wideTimeEl: HTMLElement | null = null;
  private wideBarEl: HTMLElement | null = null;
  private pierceBadgeEl: HTMLElement | null = null;
  private pierceTimeEl: HTMLElement | null = null;
  private pierceBarEl: HTMLElement | null = null;
  private guardBadgeEl: HTMLElement | null = null;
  private guardCountEl: HTMLElement | null = null;
  private ballsBadgeEl: HTMLElement | null = null;
  private ballsCountEl: HTMLElement | null = null;

  private onStateChange?: (active: boolean) => void;

  constructor(onStateChange?: (active: boolean) => void) {
    this.onStateChange = onStateChange;
    const savedBest = Number(readStorage(BEST_SCORE_KEY) ?? '0');
    this.bestScore = Number.isFinite(savedBest) && savedBest > 0 ? savedBest : 0;
  }

  public isActive(): boolean {
    return this.active;
  }

  public toggle(): void {
    if (this.active) {
      this.stop();
    } else {
      this.start();
    }
  }

  private lockScroll(): void {
    this.lockedScrollX = window.scrollX;
    this.lockedScrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    this.prevHtmlPaddingRight = document.documentElement.style.paddingRight;
    if (scrollbarWidth > 0) {
      document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.documentElement.dataset.breakoutActive = 'true';
  }

  private unlockScroll(): void {
    delete document.documentElement.dataset.breakoutActive;
    document.documentElement.style.paddingRight = this.prevHtmlPaddingRight;
    window.scrollTo({
      left: this.lockedScrollX,
      top: this.lockedScrollY,
      behavior: 'instant' as ScrollBehavior,
    });
  }

  public start(): void {
    if (this.active) return;
    this.active = true;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    this.lockScroll();
    this.onStateChange?.(true);

    this.updateViewportMetrics();
    this.buildUI();
    this.attachEvents();
    this.collectBlocks();
    this.resetGameState();

    this.lastTimestamp = performance.now();
    this.loop(this.lastTimestamp);
  }

  public stop(): void {
    if (!this.active) return;
    this.active = false;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.detachEvents();
    this.restoreDOM();
    this.rootEl?.remove();
    this.rootEl = null;
    this.canvas = null;
    this.ctx = null;
    this.blocks = [];
    this.particles = [];
    this.shockwaves = [];
    this.floatingScores = [];
    this.balls = [];
    this.items = [];
    this.wideTimer = 0;
    this.pierceTimer = 0;
    this.guardCount = 0;
    this.guardFlash = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.lastComboVisualState = '';
    this.lastComboTimeText = '';
    this.resetChargeState();
    this.paddle.x = 0;
    this.paddle.y = 0;
    this.paddle.prevEffectiveY = 0;
    this.keys.left = false;
    this.keys.right = false;
    this.keys.up = false;
    this.keys.down = false;
    this.unlockScroll();

    this.onStateChange?.(false);
  }

  private resetChargeState(): void {
    this.chargeInput.space = false;
    this.chargeInput.pointer = false;
    this.paddle.charging = false;
    this.paddle.chargeLevel = 0;
    this.paddle.chargeFullNotified = false;
    this.paddle.animOffsetY = 0;
    this.paddle.shakeX = 0;
    this.paddle.thrustState = 'idle';
    this.paddle.thrustTimer = 0;
    this.paddle.thrustStartY = 0;
    this.paddle.thrustPeakY = 0;
    this.paddle.smashWindowTimer = 0;
    this.paddle.smashPower = 0;
  }

  private isChargeHeld(): boolean {
    return this.chargeInput.space || this.chargeInput.pointer;
  }

  private beginChargeIfIdle(): void {
    if (this.phase !== 'playing') return;
    if (!this.paddle.charging) {
      this.paddle.charging = true;
      this.paddle.chargeLevel = 0;
      this.paddle.chargeFullNotified = false;
      this.paddle.thrustState = 'idle';
      this.paddle.thrustTimer = 0;
      this.paddle.smashWindowTimer = 0;
    }
  }

  private maybeReleaseCharge(): void {
    if (this.isChargeHeld()) return;
    if (!this.paddle.charging) return;

    const power = this.paddle.chargeLevel;
    this.paddle.charging = false;
    this.paddle.chargeLevel = 0;
    this.paddle.chargeFullNotified = false;
    this.paddle.shakeX = 0;

    if (this.phase === 'playing' && power >= CHARGE_MIN_RATIO) {
      const normalized = clamp((power - CHARGE_MIN_RATIO) / (1 - CHARGE_MIN_RATIO), 0, 1);
      this.paddle.thrustState = 'up';
      this.paddle.thrustTimer = 0;
      this.paddle.thrustStartY = this.paddle.animOffsetY;
      this.paddle.thrustPeakY = -(
        THRUST_PEAK_MIN +
        (THRUST_PEAK_MAX - THRUST_PEAK_MIN) * normalized
      );
      this.paddle.smashPower = normalized;
      this.paddle.smashWindowTimer = SMASH_WINDOW_DURATION;
      this.smashReleaseId += 1;
      this.sound.playThrustRelease(normalized);
    } else if (Math.abs(this.paddle.animOffsetY) > 0.25) {
      this.paddle.thrustState = 'return';
      this.paddle.thrustTimer = 0;
      this.paddle.thrustStartY = this.paddle.animOffsetY;
      this.paddle.smashWindowTimer = 0;
    } else {
      this.paddle.thrustState = 'idle';
      this.paddle.animOffsetY = 0;
      this.paddle.smashWindowTimer = 0;
    }
  }

  private getTargetPaddleWidth(): number {
    if (this.wideTimer > 0) {
      return Math.min(this.width - 32, this.paddle.baseW * WIDE_MULTIPLIER);
    }
    return this.paddle.baseW;
  }

  private getDefaultPaddleY(): number {
    return this.height - PADDLE_BOTTOM_OFFSET;
  }

  private getPaddleMaxY(): number {
    return Math.max(
      HUD_HEIGHT + 16,
      this.height - GUARD_LINE_BOTTOM_OFFSET - PADDLE_HEIGHT - PADDLE_GUARD_CLEARANCE,
    );
  }

  private getPaddleMinY(): number {
    return Math.min(this.getPaddleMaxY(), HUD_HEIGHT + PADDLE_TOP_CLEARANCE);
  }

  private getEffectivePaddleY(): number {
    const minY = HUD_HEIGHT + 16;
    const maxY = Math.max(minY, this.height - GUARD_LINE_BOTTOM_OFFSET - PADDLE_HEIGHT - 2);
    return clamp(this.paddle.y + this.paddle.animOffsetY, minY, maxY);
  }

  private updateViewportMetrics(): void {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.paddle.baseW = clamp(this.width * 0.14, 88, 136);
    this.paddle.w = this.getTargetPaddleWidth();
    this.paddle.h = PADDLE_HEIGHT;

    const minY = this.getPaddleMinY();
    const maxY = this.getPaddleMaxY();
    if (this.paddle.y === 0) {
      this.paddle.y = clamp(this.getDefaultPaddleY(), minY, maxY);
      this.paddle.prevEffectiveY = this.getEffectivePaddleY();
    } else {
      this.paddle.y = clamp(this.paddle.y, minY, maxY);
      this.paddle.prevEffectiveY = clamp(
        this.paddle.prevEffectiveY,
        HUD_HEIGHT + 16,
        Math.max(HUD_HEIGHT + 16, this.height - GUARD_LINE_BOTTOM_OFFSET - PADDLE_HEIGHT - 2),
      );
    }

    if (this.paddle.x === 0) {
      this.paddle.x = (this.width - this.paddle.w) / 2;
    } else {
      this.paddle.x = clamp(this.paddle.x, 8, this.width - this.paddle.w - 8);
    }

    this.ballRadius = this.width < 640 ? 6 : 7;
    this.baseBallSpeed = clamp(this.height * 0.56, 380, 520);
    for (const ball of this.balls) {
      ball.r = this.ballRadius;
    }

    if (this.canvas && this.ctx) {
      this.canvas.width = Math.round(this.width * this.dpr);
      this.canvas.height = Math.round(this.height * this.dpr);
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
  }

  private getBlockZoneBottom(): number {
    return this.getDefaultPaddleY() - BLOCK_ZONE_BOTTOM_MARGIN;
  }

  private getCurrentTargetBallSpeed(): number {
    const progress = this.totalBlocks > 0 ? this.destroyedBlocks / this.totalBlocks : 0;
    return this.baseBallSpeed * (1 + progress * 0.35);
  }

  private getEffectiveClipBox(el: Element): ClipBox {
    let left = 0;
    let top = HUD_HEIGHT + 4;
    let right = this.width;
    let bottom = this.getBlockZoneBottom();

    let cur: Element | null = el;
    while (cur && cur !== document.body && cur !== document.documentElement) {
      const style = window.getComputedStyle(cur);
      const ovX = style.overflowX;
      const ovY = style.overflowY;
      const clipsX = ovX === 'hidden' || ovX === 'clip' || ovX === 'scroll' || ovX === 'auto';
      const clipsY = ovY === 'hidden' || ovY === 'clip' || ovY === 'scroll' || ovY === 'auto';
      if (clipsX || clipsY) {
        const r = cur.getBoundingClientRect();
        if (clipsX) {
          left = Math.max(left, r.left);
          right = Math.min(right, r.right);
        }
        if (clipsY) {
          top = Math.max(top, r.top);
          bottom = Math.min(bottom, r.bottom);
        }
      }
      cur = cur.parentElement;
    }

    return { left, top, right, bottom };
  }

  private isElementVisible(el: Element): boolean {
    let cur: Element | null = el;
    while (cur && cur !== document.documentElement) {
      if (SKIP_TAGS.has(cur.tagName)) return false;
      if (
        cur.hasAttribute('data-breakout-ui') ||
        cur.classList.contains('katex-mathml') ||
        cur.classList.contains('sr-only')
      ) {
        return false;
      }
      const style = window.getComputedStyle(cur);
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        parseFloat(style.opacity) === 0
      ) {
        return false;
      }
      cur = cur.parentElement;
    }
    return true;
  }

  private collectBlocks(): void {
    this.restoreDOM();
    this.blocks = [];

    const roots: Element[] = [];
    const main = document.querySelector('main');
    const footer = document.querySelector('footer');
    if (main) roots.push(main);
    if (footer) roots.push(footer);
    if (roots.length === 0) roots.push(document.body);

    const playTop = HUD_HEIGHT + 4;
    const playBottom = this.getBlockZoneBottom();

    const candidateTextNodes: { node: Text; parent: Element; clip: ClipBox }[] = [];
    const range = document.createRange();

    for (const root of roots) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let current: Node | null;
      while ((current = walker.nextNode())) {
        const textNode = current as Text;
        const raw = textNode.nodeValue;
        if (!raw || !/\S/.test(raw)) continue;

        const parent = textNode.parentElement;
        if (!parent || !this.isElementVisible(parent)) continue;

        range.selectNodeContents(textNode);
        const rect = range.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) continue;
        if (
          rect.bottom < playTop ||
          rect.top > playBottom ||
          rect.right < 0 ||
          rect.left > this.width
        ) {
          continue;
        }

        const clip = this.getEffectiveClipBox(parent);
        if (clip.right <= clip.left || clip.bottom <= clip.top) continue;

        candidateTextNodes.push({ node: textNode, parent, clip });
      }
    }

    // Pass 1: Wrap each non-whitespace grapheme in a lightweight span (batch DOM writes)
    const pendingSpans: {
      span: HTMLSpanElement;
      char: string;
      color: string;
      points: number;
      clip: ClipBox;
    }[] = [];

    for (const item of candidateTextNodes) {
      const { node, parent, clip } = item;
      const text = node.nodeValue ?? '';
      const segments = segmentGraphemes(text);
      if (segments.length === 0) continue;

      const style = window.getComputedStyle(parent);
      const color = style.color || '#71717a';
      const fontSize = parseFloat(style.fontSize) || 16;
      const fontWeight = parseInt(style.fontWeight, 10) || 400;
      let points = 10;
      if (fontSize >= 28) {
        points = 30;
      } else if (fontSize >= 18 || fontWeight >= 600) {
        points = 20;
      }

      const frag = document.createDocumentFragment();
      const insertedNodes: Node[] = [];
      let whitespaceBuf = '';

      const flushWhitespace = () => {
        if (!whitespaceBuf) return;
        const ws = document.createTextNode(whitespaceBuf);
        frag.appendChild(ws);
        insertedNodes.push(ws);
        whitespaceBuf = '';
      };

      for (const seg of segments) {
        if (/^\s+$/.test(seg)) {
          whitespaceBuf += seg;
        } else {
          flushWhitespace();
          const span = document.createElement('span');
          span.setAttribute('data-breakout-char', '');
          span.textContent = seg;
          frag.appendChild(span);
          insertedNodes.push(span);
          pendingSpans.push({ span, char: seg, color, points, clip });
        }
      }
      flushWhitespace();

      if (node.parentNode) {
        const parentNode = node.parentNode;
        const parentDisplay = style.display;
        const needsSingleContainer =
          parentDisplay === 'flex' ||
          parentDisplay === 'inline-flex' ||
          parentDisplay === 'grid' ||
          parentDisplay === 'inline-grid';

        if (needsSingleContainer) {
          const wrapper = document.createElement('span');
          wrapper.setAttribute('data-breakout-wrap', '');
          wrapper.appendChild(frag);
          parentNode.replaceChild(wrapper, node);
          this.replacements.push({
            parent: parentNode,
            originalNode: node,
            insertedNodes: [wrapper],
          });
        } else {
          parentNode.replaceChild(frag, node);
          this.replacements.push({
            parent: parentNode,
            originalNode: node,
            insertedNodes,
          });
        }
      }
    }

    // Pass 2: Read all bounding rects in a single layout pass
    for (const item of pendingSpans) {
      const rect = item.span.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;

      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      if (
        cx < item.clip.left ||
        cx > item.clip.right ||
        cy < item.clip.top ||
        cy > item.clip.bottom
      ) {
        continue;
      }

      const minHitW = Math.max(rect.width, 6);
      const minHitH = Math.max(rect.height, 8);
      const x = rect.left - (minHitW - rect.width) / 2;
      const y = rect.top - (minHitH - rect.height) / 2;

      this.blocks.push({
        el: item.span,
        char: item.char,
        x,
        y,
        w: minHitW,
        h: minHitH,
        color: item.color,
        points: item.points,
        alive: true,
      });
    }

    this.totalBlocks = this.blocks.length;
    this.destroyedBlocks = 0;
  }

  private remeasureBlocks(): void {
    for (const b of this.blocks) {
      if (!b.alive) continue;
      const rect = b.el.getBoundingClientRect();
      const minHitW = Math.max(rect.width, 6);
      const minHitH = Math.max(rect.height, 8);
      b.x = rect.left - (minHitW - rect.width) / 2;
      b.y = rect.top - (minHitH - rect.height) / 2;
      b.w = minHitW;
      b.h = minHitH;
    }
  }

  private restoreDOM(): void {
    for (let i = this.replacements.length - 1; i >= 0; i--) {
      const rep = this.replacements[i];
      const first = rep.insertedNodes[0];
      if (first && first.parentNode === rep.parent) {
        rep.parent.insertBefore(rep.originalNode, first);
      }
      for (const n of rep.insertedNodes) {
        if (n.parentNode === rep.parent) {
          rep.parent.removeChild(n);
        }
      }
    }
    this.replacements = [];
  }

  private clearActivePowerUps(): void {
    this.wideTimer = 0;
    this.pierceTimer = 0;
    this.guardCount = 0;
    this.guardFlash = 0;
    this.items = [];
    this.paddle.w = this.paddle.baseW;
    this.paddle.x = clamp(this.paddle.x, 8, this.width - this.paddle.w - 8);
  }

  private resetGameState(): void {
    for (const b of this.blocks) {
      b.alive = true;
      b.el.style.visibility = '';
    }
    this.destroyedBlocks = 0;
    this.score = 0;
    this.isNewBest = false;
    this.lives = INITIAL_LIVES;
    this.combo = 0;
    this.comboTimer = 0;
    this.lastComboVisualState = '';
    this.lastComboTimeText = '';
    this.maxCombo = 0;
    this.particles = [];
    this.shockwaves = [];
    this.floatingScores = [];
    this.scanTime = 0.55;
    this.missFlash = 0;
    this.elapsedTime = 0;

    this.clearActivePowerUps();
    this.resetChargeState();
    this.paddle.w = this.paddle.baseW;
    this.paddle.x = (this.width - this.paddle.w) / 2;
    this.paddle.y = clamp(this.getDefaultPaddleY(), this.getPaddleMinY(), this.getPaddleMaxY());
    this.paddle.prevEffectiveY = this.paddle.y;
    this.paddle.bounceOffset = 0;

    if (this.totalBlocks === 0) {
      this.balls = [];
      this.phase = 'empty';
    } else {
      this.phase = 'ready';
      this.resetBallOnPaddle();
    }

    this.updateHUD();
    this.updateEffectsUI();
    this.updateOverlayState();
  }

  private createBall(x: number, y: number, vx: number, vy: number, speed: number): Ball {
    return {
      x,
      y,
      vx,
      vy,
      r: this.ballRadius,
      speed,
      trail: [],
      pierceTimer: 0,
      boostTimer: 0,
      lastSmashId: 0,
    };
  }

  private resetBallOnPaddle(): void {
    const dir = Math.random() < 0.5 ? -1 : 1;
    this.launchAngle = dir * (0.24 + Math.random() * 0.24);
    const speed = this.getCurrentTargetBallSpeed();
    this.balls = [
      this.createBall(
        this.paddle.x + this.paddle.w / 2,
        this.paddle.y - this.ballRadius - 1,
        0,
        0,
        speed,
      ),
    ];
    this.updateEffectsUI();
  }

  private launchBall(): void {
    if (this.phase !== 'ready' || this.balls.length === 0) return;
    this.phase = 'playing';
    this.paddle.prevEffectiveY = this.getEffectivePaddleY();
    const ball = this.balls[0];
    ball.speed = this.getCurrentTargetBallSpeed();
    ball.vx = Math.sin(this.launchAngle) * ball.speed;
    ball.vy = -Math.cos(this.launchAngle) * ball.speed;
    this.sound.playLaunch();
    this.updateOverlayState();
  }

  private togglePause(): void {
    if (this.phase === 'playing') {
      this.phase = 'paused';
      this.resetChargeState();
      this.updateOverlayState();
      this.updateHUD();
    } else if (this.phase === 'paused') {
      this.phase = 'playing';
      this.paddle.prevEffectiveY = this.getEffectivePaddleY();
      this.lastTimestamp = performance.now();
      this.updateOverlayState();
      this.updateHUD();
    }
  }

  private addScore(points: number): void {
    this.score += points;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.isNewBest = true;
      writeStorage(BEST_SCORE_KEY, String(this.bestScore));
    }
  }

  private maybeDropItem(block: CharBlock): void {
    if (this.items.length >= MAX_FALLING_ITEMS) return;
    // Scale drop probability smoothly so both short pages and long blog posts feel balanced
    const dropRate = clamp(7 / Math.max(1, this.totalBlocks), 0.042, 0.12);
    if (Math.random() > dropRate) return;

    const type = pickRandomPowerUp();
    const x = clamp(block.x + block.w / 2, ITEM_WIDTH / 2 + 8, this.width - ITEM_WIDTH / 2 - 8);
    const y = block.y + block.h / 2;
    this.items.push({
      type,
      x,
      y,
      w: ITEM_WIDTH,
      h: ITEM_HEIGHT,
      vy: ITEM_FALL_SPEED,
      age: 0,
    });
  }

  private applyPowerUp(type: PowerUpType): void {
    const spec = POWERUP_SPECS[type];
    const targetSpeed = this.getCurrentTargetBallSpeed();

    if (type === 'add3') {
      const anchor =
        this.balls.find((b) => b.y < this.paddle.y - 8) ??
        this.balls[0] ?? {
          x: this.paddle.x + this.paddle.w / 2,
          y: this.paddle.y - this.ballRadius - 4,
        };
      const angles = [-0.58, 0.08, 0.58];
      let added = 0;
      for (const baseAngle of angles) {
        if (this.balls.length >= MAX_BALLS) break;
        const angle = baseAngle + (Math.random() - 0.5) * 0.14;
        const bx = clamp(anchor.x, this.ballRadius + 4, this.width - this.ballRadius - 4);
        const by = clamp(anchor.y, HUD_HEIGHT + this.ballRadius + 4, this.paddle.y - this.ballRadius - 4);
        const b = this.createBall(
          bx,
          by,
          Math.sin(angle) * targetSpeed,
          -Math.cos(angle) * targetSpeed,
          targetSpeed,
        );
        this.enforceMinVerticalVelocity(b);
        this.balls.push(b);
        added++;
      }
      if (added < 3) {
        this.addScore((3 - added) * 50);
      }
    } else if (type === 'double') {
      const snapshot = [...this.balls];
      let overflow = 0;
      for (const orig of snapshot) {
        if (this.balls.length >= MAX_BALLS) {
          overflow++;
          continue;
        }
        const curAngle = Math.atan2(orig.vy, orig.vx);
        const spread = 0.28;
        const speed = Math.max(orig.speed, targetSpeed);

        // Nudge original slightly one way and spawn clone the other way so paths split cleanly
        const origNewAngle = curAngle - 0.1;
        orig.vx = Math.cos(origNewAngle) * speed;
        orig.vy = Math.sin(origNewAngle) * speed;
        orig.speed = speed;
        this.enforceMinVerticalVelocity(orig);

        const cloneAngle = curAngle + spread;
        const clone = this.createBall(
          orig.x,
          orig.y,
          Math.cos(cloneAngle) * speed,
          Math.sin(cloneAngle) * speed,
          speed,
        );
        this.enforceMinVerticalVelocity(clone);
        this.balls.push(clone);
      }
      if (overflow > 0) {
        this.addScore(overflow * 50);
      }
    } else if (type === 'wide') {
      this.wideTimer = WIDE_DURATION;
    } else if (type === 'guard') {
      this.guardCount += 1;
    } else if (type === 'pierce') {
      this.pierceTimer = PIERCE_DURATION;
    }

    this.sound.playPowerup();
    this.spawnBurstParticles(this.paddle.x + this.paddle.w / 2, this.paddle.y, spec.bg, 12);
    this.floatingScores.push({
      x: this.paddle.x + this.paddle.w / 2,
      y: this.paddle.y - 16,
      text: spec.toast,
      color: spec.bg,
      life: 1.05,
      maxLife: 1.05,
      large: true,
    });
    this.updateHUD();
    this.updateEffectsUI();
  }

  private buildUI(): void {
    const root = document.createElement('div');
    root.setAttribute('data-breakout-ui', 'root');
    root.className = 'fixed inset-0 z-[55] select-none';

    // Canvas
    const canvas = document.createElement('canvas');
    canvas.setAttribute('data-breakout-ui', 'canvas');
    canvas.className = 'fixed inset-0 z-[55] block touch-none';
    root.appendChild(canvas);

    // HUD Bar (matches site header height: h-16 / 64px)
    const hud = document.createElement('div');
    hud.setAttribute('data-breakout-ui', 'hud');
    hud.setAttribute('role', 'region');
    hud.setAttribute('aria-label', 'Breakout game HUD');
    hud.className =
      'fixed top-0 inset-x-0 z-[60] h-16 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/90';

    hud.innerHTML = `
      <div class="mx-auto flex h-full max-w-4xl items-center justify-between gap-2 px-3 sm:px-6">
        <div class="flex items-center gap-2.5 sm:gap-5 min-w-0">
          <div class="flex flex-col leading-tight">
            <span class="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">Score</span>
            <span data-bo-score class="font-mono text-base font-bold tabular-nums text-zinc-950 sm:text-lg dark:text-zinc-50">0</span>
          </div>

          <div class="flex w-16 flex-col leading-tight sm:w-24">
            <span class="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">Combo</span>
            <div class="mt-0.5 flex items-baseline justify-between gap-1">
              <span data-bo-combo class="font-mono text-sm font-bold leading-none tabular-nums text-zinc-400 dark:text-zinc-600">0x</span>
              <span data-bo-combo-time class="font-mono text-[10px] leading-none tabular-nums text-zinc-500 dark:text-zinc-400"></span>
            </div>
            <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-800">
              <div data-bo-combo-bar class="h-full w-full origin-left rounded-full bg-zinc-900 dark:bg-zinc-100" style="transform: scaleX(0)"></div>
            </div>
          </div>

          <div class="hidden flex-col leading-tight sm:flex">
            <span class="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">Best</span>
            <span data-bo-best class="font-mono text-sm font-medium tabular-nums text-zinc-600 dark:text-zinc-400">0</span>
          </div>

          <div class="flex flex-col leading-tight">
            <span class="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">Lives</span>
            <div data-bo-lives class="mt-0.5 flex items-center gap-1" aria-live="polite"></div>
          </div>

          <div class="hidden flex-col leading-tight md:flex">
            <span class="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">Blocks</span>
            <span data-bo-blocks class="font-mono text-sm font-medium tabular-nums text-zinc-600 dark:text-zinc-400">0 / 0</span>
          </div>
        </div>

        <div class="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            data-bo-mute
            title="効果音切替"
            aria-label="効果音のオン・オフを切り替え"
            class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 sm:h-9 sm:w-9 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          ></button>
          <button
            type="button"
            data-bo-pause
            title="一時停止 / 再開 (P)"
            aria-label="一時停止または再開"
            class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 sm:h-9 sm:w-9 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          ></button>
          <button
            type="button"
            data-bo-restart
            title="リスタート (R)"
            aria-label="リスタート"
            class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 sm:h-9 sm:w-9 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
          </button>
          <button
            type="button"
            data-bo-exit
            title="終了 (Esc)"
            aria-label="ブロック崩しを終了"
            class="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg bg-zinc-950 px-2.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 sm:h-9 sm:px-3 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            <span>Exit</span>
            <kbd class="hidden font-mono text-[10px] opacity-60 sm:inline">Esc</kbd>
          </button>
        </div>
      </div>
    `;
    root.appendChild(hud);

    // Active effects bar (floating right below HUD)
    const effectsBar = document.createElement('div');
    effectsBar.setAttribute('data-breakout-ui', 'effects');
    effectsBar.className =
      'pointer-events-none fixed top-[72px] inset-x-0 z-[60] flex flex-wrap items-center justify-center gap-2 px-4';
    effectsBar.innerHTML = `
      <div data-bo-eff-wide class="hidden relative overflow-hidden rounded-lg border border-emerald-500/40 bg-white/90 px-2.5 pt-1 pb-2 shadow-sm backdrop-blur-md dark:border-emerald-400/40 dark:bg-zinc-900/90">
        <div class="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
          <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12h14"></path>
            <path d="m8 9-3 3 3 3"></path>
            <path d="m16 9 3 3-3 3"></path>
          </svg>
          <span>ワイド</span>
          <span data-bo-eff-wide-time class="font-mono tabular-nums">12.0s</span>
        </div>
        <div class="absolute inset-x-0 bottom-0 h-1 bg-emerald-500/20">
          <div data-bo-eff-wide-bar class="h-full w-full origin-left bg-emerald-500 dark:bg-emerald-400"></div>
        </div>
      </div>

      <div data-bo-eff-pierce class="hidden relative overflow-hidden rounded-lg border border-orange-500/40 bg-white/90 px-2.5 pt-1 pb-2 shadow-sm backdrop-blur-md dark:border-orange-400/40 dark:bg-zinc-900/90">
        <div class="flex items-center gap-1.5 text-[11px] font-semibold text-orange-700 dark:text-orange-300">
          <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m6 17 5-5-5-5"></path>
            <path d="m13 17 5-5-5-5"></path>
          </svg>
          <span>貫通弾</span>
          <span data-bo-eff-pierce-time class="font-mono tabular-nums">8.0s</span>
        </div>
        <div class="absolute inset-x-0 bottom-0 h-1 bg-orange-500/20">
          <div data-bo-eff-pierce-bar class="h-full w-full origin-left bg-orange-500 dark:bg-orange-400"></div>
        </div>
      </div>

      <div data-bo-eff-guard class="hidden rounded-lg border border-blue-500/40 bg-white/90 px-2.5 py-1 shadow-sm backdrop-blur-md dark:border-blue-400/40 dark:bg-zinc-900/90">
        <div class="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
          <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
          </svg>
          <span>ガード</span>
          <span data-bo-eff-guard-count class="font-mono tabular-nums">×1</span>
        </div>
      </div>

      <div data-bo-eff-balls class="hidden rounded-lg border border-cyan-500/40 bg-white/90 px-2.5 py-1 shadow-sm backdrop-blur-md dark:border-cyan-400/40 dark:bg-zinc-900/90">
        <div class="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
          <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="8" cy="14" r="4"></circle>
            <circle cx="16" cy="14" r="4"></circle>
            <circle cx="12" cy="8" r="4"></circle>
          </svg>
          <span>球数</span>
          <span data-bo-eff-balls-count class="font-mono tabular-nums">2</span>
        </div>
      </div>
    `;
    root.appendChild(effectsBar);

    // Ready hint pill
    const hint = document.createElement('div');
    hint.setAttribute('data-breakout-ui', 'hint');
    hint.className =
      'pointer-events-none fixed bottom-28 left-1/2 z-[60] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-full border border-zinc-200/90 bg-white/90 px-4 py-1.5 text-center text-xs font-medium text-zinc-700 shadow-sm backdrop-blur-md transition-opacity dark:border-zinc-700/90 dark:bg-zinc-900/90 dark:text-zinc-300';
    hint.textContent =
      'クリック / Space で発射 · 長押し＆離すでパワーショット · マウス / ↑↓←→ で移動';
    root.appendChild(hint);

    // Center modal for Paused / Game Over / Stage Clear / Empty
    const modal = document.createElement('div');
    modal.setAttribute('data-breakout-ui', 'modal');
    modal.className =
      'pointer-events-none fixed inset-0 z-[65] hidden items-center justify-center px-4';
    root.appendChild(modal);

    document.body.appendChild(root);

    this.rootEl = root;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scoreEl = hud.querySelector('[data-bo-score]');
    this.comboEl = hud.querySelector('[data-bo-combo]');
    this.comboTimeEl = hud.querySelector('[data-bo-combo-time]');
    this.comboBarEl = hud.querySelector('[data-bo-combo-bar]');
    this.bestEl = hud.querySelector('[data-bo-best]');
    this.livesEl = hud.querySelector('[data-bo-lives]');
    this.blocksEl = hud.querySelector('[data-bo-blocks]');
    this.muteBtn = hud.querySelector('[data-bo-mute]');
    this.pauseBtn = hud.querySelector('[data-bo-pause]');
    this.hintEl = hint;
    this.modalEl = modal;

    this.wideBadgeEl = effectsBar.querySelector('[data-bo-eff-wide]');
    this.wideTimeEl = effectsBar.querySelector('[data-bo-eff-wide-time]');
    this.wideBarEl = effectsBar.querySelector('[data-bo-eff-wide-bar]');
    this.pierceBadgeEl = effectsBar.querySelector('[data-bo-eff-pierce]');
    this.pierceTimeEl = effectsBar.querySelector('[data-bo-eff-pierce-time]');
    this.pierceBarEl = effectsBar.querySelector('[data-bo-eff-pierce-bar]');
    this.guardBadgeEl = effectsBar.querySelector('[data-bo-eff-guard]');
    this.guardCountEl = effectsBar.querySelector('[data-bo-eff-guard-count]');
    this.ballsBadgeEl = effectsBar.querySelector('[data-bo-eff-balls]');
    this.ballsCountEl = effectsBar.querySelector('[data-bo-eff-balls-count]');

    const restartBtn = hud.querySelector<HTMLButtonElement>('[data-bo-restart]');
    const exitBtn = hud.querySelector<HTMLButtonElement>('[data-bo-exit]');

    this.muteBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sound.toggleMute();
      this.renderMuteIcon();
    });

    this.pauseBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePause();
    });

    restartBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.resetGameState();
    });

    exitBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.stop();
    });

    this.updateViewportMetrics();
    this.renderMuteIcon();
    this.renderPauseIcon();
  }

  private renderMuteIcon(): void {
    if (!this.muteBtn) return;
    this.muteBtn.setAttribute('aria-pressed', String(this.sound.muted));
    if (this.sound.muted) {
      this.muteBtn.innerHTML = `
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M11 5 6 9H2v6h4l5 4V5Z"></path>
          <line x1="22" x2="16" y1="9" y2="15"></line>
          <line x1="16" x2="22" y1="9" y2="15"></line>
        </svg>
      `;
    } else {
      this.muteBtn.innerHTML = `
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M11 5 6 9H2v6h4l5 4V5Z"></path>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        </svg>
      `;
    }
  }

  private renderPauseIcon(): void {
    if (!this.pauseBtn) return;
    const isPaused = this.phase === 'paused';
    this.pauseBtn.setAttribute('aria-pressed', String(isPaused));
    if (isPaused) {
      this.pauseBtn.innerHTML = `
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polygon points="6 3 20 12 6 21 6 3"></polygon>
        </svg>
      `;
    } else {
      this.pauseBtn.innerHTML = `
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
      `;
    }
  }

  private updateEffectsUI(): void {
    // Wide paddle timer
    if (this.wideBadgeEl && this.wideTimeEl && this.wideBarEl) {
      if (this.wideTimer > 0) {
        this.wideBadgeEl.classList.remove('hidden');
        this.wideBadgeEl.classList.toggle('animate-pulse', this.wideTimer <= 2.5);
        this.wideTimeEl.textContent = `${this.wideTimer.toFixed(1)}s`;
        const ratio = clamp(this.wideTimer / WIDE_DURATION, 0, 1);
        this.wideBarEl.style.transform = `scaleX(${ratio})`;
      } else {
        this.wideBadgeEl.classList.add('hidden');
        this.wideBadgeEl.classList.remove('animate-pulse');
      }
    }

    // Pierce ball timer
    if (this.pierceBadgeEl && this.pierceTimeEl && this.pierceBarEl) {
      if (this.pierceTimer > 0) {
        this.pierceBadgeEl.classList.remove('hidden');
        this.pierceBadgeEl.classList.toggle('animate-pulse', this.pierceTimer <= 2.5);
        this.pierceTimeEl.textContent = `${this.pierceTimer.toFixed(1)}s`;
        const ratio = clamp(this.pierceTimer / PIERCE_DURATION, 0, 1);
        this.pierceBarEl.style.transform = `scaleX(${ratio})`;
      } else {
        this.pierceBadgeEl.classList.add('hidden');
        this.pierceBadgeEl.classList.remove('animate-pulse');
      }
    }

    // Guard count
    if (this.guardBadgeEl && this.guardCountEl) {
      if (this.guardCount > 0) {
        this.guardBadgeEl.classList.remove('hidden');
        this.guardCountEl.textContent = `×${this.guardCount}`;
      } else {
        this.guardBadgeEl.classList.add('hidden');
      }
    }

    // Multi-ball count (shown when 2+ balls are active, no timer)
    if (this.ballsBadgeEl && this.ballsCountEl) {
      if (this.balls.length >= 2) {
        this.ballsBadgeEl.classList.remove('hidden');
        this.ballsCountEl.textContent = `${this.balls.length}`;
      } else {
        this.ballsBadgeEl.classList.add('hidden');
      }
    }
  }

  private updateComboUI(): void {
    if (!this.comboEl || !this.comboBarEl) return;

    const isActive = this.combo > 0 && this.comboTimer > 0;
    const ratio = isActive ? clamp(this.comboTimer / COMBO_DURATION, 0, 1) : 0;
    const isWarn = isActive && this.comboTimer <= COMBO_WARN_TIME;

    const comboText = `${this.combo}x`;
    if (this.comboEl.textContent !== comboText) {
      this.comboEl.textContent = comboText;
    }

    const timeText = isActive ? `${this.comboTimer.toFixed(1)}s` : '';
    if (this.comboTimeEl && this.lastComboTimeText !== timeText) {
      this.lastComboTimeText = timeText;
      this.comboTimeEl.textContent = timeText;
    }

    this.comboBarEl.style.transform = `scaleX(${ratio})`;

    const visualState = !isActive
      ? 'idle'
      : isWarn
        ? 'warn'
        : this.combo >= 8
          ? 'tier3'
          : this.combo >= 4
            ? 'tier2'
            : 'tier1';

    if (this.lastComboVisualState !== visualState) {
      this.lastComboVisualState = visualState;

      if (visualState === 'idle') {
        this.comboEl.className =
          'font-mono text-sm font-bold leading-none tabular-nums text-zinc-400 dark:text-zinc-600';
        this.comboBarEl.className =
          'h-full w-full origin-left rounded-full bg-zinc-900 dark:bg-zinc-100';
      } else if (visualState === 'warn') {
        this.comboEl.className =
          'font-mono text-sm font-bold leading-none tabular-nums text-rose-600 dark:text-rose-400';
        this.comboBarEl.className =
          'h-full w-full origin-left rounded-full bg-rose-500 animate-pulse dark:bg-rose-400';
      } else if (visualState === 'tier3') {
        this.comboEl.className =
          'font-mono text-sm font-bold leading-none tabular-nums text-amber-600 dark:text-amber-400';
        this.comboBarEl.className =
          'h-full w-full origin-left rounded-full bg-amber-500 dark:bg-amber-400';
      } else if (visualState === 'tier2') {
        this.comboEl.className =
          'font-mono text-sm font-bold leading-none tabular-nums text-blue-600 dark:text-blue-400';
        this.comboBarEl.className =
          'h-full w-full origin-left rounded-full bg-blue-500 dark:bg-blue-400';
      } else {
        this.comboEl.className =
          'font-mono text-sm font-bold leading-none tabular-nums text-zinc-950 dark:text-zinc-50';
        this.comboBarEl.className =
          'h-full w-full origin-left rounded-full bg-zinc-900 dark:bg-zinc-100';
      }
    }
  }

  private updateHUD(): void {
    if (this.scoreEl) {
      this.scoreEl.textContent = this.score.toLocaleString();
    }
    if (this.bestEl) {
      this.bestEl.textContent = this.bestScore.toLocaleString();
    }
    this.updateComboUI();
    if (this.livesEl) {
      this.livesEl.setAttribute('aria-label', `残機 ${this.lives} / ${INITIAL_LIVES}`);
      const hearts: string[] = [];
      for (let i = 0; i < INITIAL_LIVES; i++) {
        const alive = i < this.lives;
        hearts.push(`
          <svg
            class="h-4 w-4 transition-all ${
              alive
                ? 'text-rose-500 scale-100 dark:text-rose-400'
                : 'text-zinc-300 scale-90 dark:text-zinc-700'
            }"
            viewBox="0 0 24 24"
            fill="${alive ? 'currentColor' : 'none'}"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
          </svg>
        `);
      }
      this.livesEl.innerHTML = hearts.join('');
    }
    if (this.blocksEl) {
      const remaining = Math.max(0, this.totalBlocks - this.destroyedBlocks);
      this.blocksEl.textContent = `${remaining} / ${this.totalBlocks}`;
    }
    this.renderPauseIcon();
  }

  private updateOverlayState(): void {
    if (this.hintEl) {
      if (this.phase === 'ready') {
        this.hintEl.classList.remove('hidden');
      } else {
        this.hintEl.classList.add('hidden');
      }
    }

    if (!this.modalEl) return;

    if (this.phase === 'ready' || this.phase === 'playing') {
      this.modalEl.classList.add('hidden');
      this.modalEl.classList.remove('flex');
      this.modalEl.innerHTML = '';
      return;
    }

    this.modalEl.classList.remove('hidden');
    this.modalEl.classList.add('flex');

    const rate =
      this.totalBlocks > 0
        ? Math.round((this.destroyedBlocks / this.totalBlocks) * 100)
        : 0;

    if (this.phase === 'paused') {
      this.modalEl.innerHTML = `
        <div class="pointer-events-auto w-full max-w-sm rounded-2xl border border-zinc-200 bg-white/95 p-6 text-center shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
          <p class="font-mono text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">Paused</p>
          <h2 class="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">一時停止中</h2>
          <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            残り文字ブロック: <span class="font-mono font-semibold text-zinc-900 dark:text-zinc-100">${this.totalBlocks - this.destroyedBlocks}</span> / ${this.totalBlocks}
          </p>
          <div class="mt-6 flex items-center justify-center gap-2.5">
            <button type="button" data-bo-modal-resume class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200">
              再開する
            </button>
            <button type="button" data-bo-modal-retry class="inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
              リスタート
            </button>
            <button type="button" data-bo-modal-exit class="inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800">
              終了
            </button>
          </div>
        </div>
      `;
    } else if (this.phase === 'gameover' || this.phase === 'clear') {
      const isClear = this.phase === 'clear';
      const bonus = isClear ? this.lives * CLEAR_LIFE_BONUS : 0;
      this.modalEl.innerHTML = `
        <div class="pointer-events-auto w-full max-w-sm rounded-2xl border border-zinc-200 bg-white/95 p-6 text-center shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
          <p class="font-mono text-xs font-semibold tracking-wider uppercase ${
            isClear ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }">${isClear ? 'Stage Clear' : 'Game Over'}</p>
          <h2 class="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            ${isClear ? '全文字ブロック破壊！' : 'ゲームオーバー'}
          </h2>
          ${
            this.isNewBest
              ? `<span class="mt-2 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">NEW BEST!</span>`
              : ''
          }
          <div class="mt-5 grid grid-cols-3 gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
            <div>
              <p class="text-[10px] font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">Score</p>
              <p class="mt-0.5 font-mono text-base font-bold tabular-nums text-zinc-950 dark:text-zinc-50">${this.score.toLocaleString()}</p>
            </div>
            <div>
              <p class="text-[10px] font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">Cleared</p>
              <p class="mt-0.5 font-mono text-base font-bold tabular-nums text-zinc-950 dark:text-zinc-50">${rate}%</p>
            </div>
            <div>
              <p class="text-[10px] font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">Max Combo</p>
              <p class="mt-0.5 font-mono text-base font-bold tabular-nums text-zinc-950 dark:text-zinc-50">${this.maxCombo}x</p>
            </div>
          </div>
          ${
            isClear && bonus > 0
              ? `<p class="mt-2.5 font-mono text-xs text-emerald-600 dark:text-emerald-400">残機ボーナス +${bonus.toLocaleString()} pt 込み</p>`
              : `<p class="mt-2.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">破壊した文字: ${this.destroyedBlocks} / ${this.totalBlocks} · Best: ${this.bestScore.toLocaleString()}</p>`
          }
          <div class="mt-6 flex items-center justify-center gap-2.5">
            <button type="button" data-bo-modal-retry class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200">
              もう一度遊ぶ
            </button>
            <button type="button" data-bo-modal-exit class="inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800">
              ページに戻る
            </button>
          </div>
        </div>
      `;
    } else if (this.phase === 'empty') {
      this.modalEl.innerHTML = `
        <div class="pointer-events-auto w-full max-w-sm rounded-2xl border border-zinc-200 bg-white/95 p-6 text-center shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
          <p class="font-mono text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">No Blocks</p>
          <h2 class="mt-1 text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">文字が見つかりません</h2>
          <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            現在の表示範囲にブロック化できる文字がありませんでした。文章が見える位置にスクロールしてもう一度お試しください。
          </p>
          <div class="mt-6 flex items-center justify-center gap-2.5">
            <button type="button" data-bo-modal-top class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200">
              先頭で開始
            </button>
            <button type="button" data-bo-modal-exit class="inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800">
              閉じる
            </button>
          </div>
        </div>
      `;
    }

    this.modalEl
      .querySelector('[data-bo-modal-resume]')
      ?.addEventListener('click', () => this.togglePause());
    this.modalEl
      .querySelector('[data-bo-modal-retry]')
      ?.addEventListener('click', () => this.resetGameState());
    this.modalEl
      .querySelector('[data-bo-modal-exit]')
      ?.addEventListener('click', () => this.stop());
    this.modalEl.querySelector('[data-bo-modal-top]')?.addEventListener('click', () => {
      this.unlockScroll();
      window.scrollTo({ left: 0, top: 0, behavior: 'instant' as ScrollBehavior });
      this.lockScroll();
      this.updateViewportMetrics();
      this.collectBlocks();
      this.resetGameState();
    });
  }

  private movePaddleToClient(clientX: number, clientY: number, pointerType: string): void {
    const targetX = clientX - this.paddle.w / 2;
    const touchOffsetY = pointerType === 'touch' ? 32 : 0;
    const targetY = clientY - touchOffsetY - this.paddle.h / 2;
    this.paddle.x = clamp(targetX, 8, this.width - this.paddle.w - 8);
    this.paddle.y = clamp(targetY, this.getPaddleMinY(), this.getPaddleMaxY());
    if (this.phase === 'ready' && this.balls[0]) {
      this.balls[0].x = this.paddle.x + this.paddle.w / 2;
      this.balls[0].y = this.paddle.y - this.balls[0].r - 1;
    }
  }

  private handlePointerMove = (e: PointerEvent): void => {
    if (!this.active) return;
    if (this.phase !== 'ready' && this.phase !== 'playing') return;
    if (e.clientY <= HUD_HEIGHT) return;
    this.movePaddleToClient(e.clientX, e.clientY, e.pointerType);
  };

  private handleCanvasPointerDown = (e: PointerEvent): void => {
    if (!this.active) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (e.clientY <= HUD_HEIGHT) return;
    this.movePaddleToClient(e.clientX, e.clientY, e.pointerType);
    if (this.phase === 'ready' && this.balls[0]) {
      this.launchBall();
    } else if (this.phase === 'playing') {
      this.chargeInput.pointer = true;
      this.beginChargeIfIdle();
    }
  };

  private handlePointerUp = (e: PointerEvent): void => {
    if (!this.active) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (this.chargeInput.pointer) {
      this.chargeInput.pointer = false;
      this.maybeReleaseCharge();
    }
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.active) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      this.stop();
      return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      this.keys.left = true;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      this.keys.right = true;
    } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      e.preventDefault();
      this.keys.up = true;
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      e.preventDefault();
      this.keys.down = true;
    } else if (e.key === ' ') {
      e.preventDefault();
      if (this.phase === 'ready') {
        this.launchBall();
      } else if (this.phase === 'playing') {
        if (!e.repeat && !this.chargeInput.space) {
          this.chargeInput.space = true;
          this.beginChargeIfIdle();
        }
      } else if (this.phase === 'paused') {
        this.togglePause();
      } else if (this.phase === 'gameover' || this.phase === 'clear') {
        this.resetGameState();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.phase === 'ready') {
        this.launchBall();
      } else if (this.phase === 'playing' || this.phase === 'paused') {
        this.togglePause();
      } else if (this.phase === 'gameover' || this.phase === 'clear') {
        this.resetGameState();
      }
    } else if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      if (this.phase === 'playing' || this.phase === 'paused') {
        this.togglePause();
      }
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      if (this.totalBlocks > 0) {
        this.resetGameState();
      }
    } else if (
      e.key === 'PageUp' ||
      e.key === 'PageDown' ||
      e.key === 'Home' ||
      e.key === 'End'
    ) {
      e.preventDefault();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      this.keys.left = false;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      this.keys.right = false;
    } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      this.keys.up = false;
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      this.keys.down = false;
    } else if (e.key === ' ') {
      if (this.chargeInput.space) {
        this.chargeInput.space = false;
        this.maybeReleaseCharge();
      }
    }
  };

  private handleBlur = (): void => {
    this.keys.left = false;
    this.keys.right = false;
    this.keys.up = false;
    this.keys.down = false;
    this.resetChargeState();
  };

  private handleWheel = (e: WheelEvent): void => {
    if (this.active) {
      e.preventDefault();
    }
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (this.active) {
      e.preventDefault();
    }
  };

  private handleMouseDown = (e: MouseEvent): void => {
    // Prevent middle-click autoscroll
    if (this.active && e.button === 1) {
      e.preventDefault();
    }
  };

  private handleScroll = (): void => {
    if (!this.active) return;
    if (window.scrollX !== this.lockedScrollX || window.scrollY !== this.lockedScrollY) {
      window.scrollTo({
        left: this.lockedScrollX,
        top: this.lockedScrollY,
        behavior: 'instant' as ScrollBehavior,
      });
    }
    this.remeasureBlocks();
  };

  private handleResize = (): void => {
    if (!this.active) return;
    this.updateViewportMetrics();
    this.remeasureBlocks();
    if (this.phase === 'ready' && this.balls[0]) {
      this.balls[0].x = this.paddle.x + this.paddle.w / 2;
      this.balls[0].y = this.paddle.y - this.balls[0].r - 1;
    }
  };

  private attachEvents(): void {
    window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
    this.canvas?.addEventListener('pointerdown', this.handleCanvasPointerDown);
    window.addEventListener('pointerup', this.handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', this.handlePointerUp, { passive: true });
    window.addEventListener('mousedown', this.handleMouseDown, { passive: false, capture: true });
    window.addEventListener('keydown', this.handleKeyDown, { passive: false, capture: true });
    window.addEventListener('keyup', this.handleKeyUp, { capture: true });
    window.addEventListener('wheel', this.handleWheel, { passive: false, capture: true });
    window.addEventListener('touchmove', this.handleTouchMove, { passive: false, capture: true });
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('blur', this.handleBlur);
  }

  private detachEvents(): void {
    window.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas?.removeEventListener('pointerdown', this.handleCanvasPointerDown);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
    window.removeEventListener('mousedown', this.handleMouseDown, { capture: true });
    window.removeEventListener('keydown', this.handleKeyDown, { capture: true });
    window.removeEventListener('keyup', this.handleKeyUp, { capture: true });
    window.removeEventListener('wheel', this.handleWheel, { capture: true });
    window.removeEventListener('touchmove', this.handleTouchMove, { capture: true });
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('blur', this.handleBlur);
  }

  private spawnShockwave(x: number, y: number, color: string, maxRadius: number): void {
    this.shockwaves.push({
      x,
      y,
      radius: 8,
      maxRadius,
      color,
      life: 0.28,
      maxLife: 0.28,
    });
  }

  private spawnSmashParticles(x: number, y: number, power: number): void {
    const count = Math.round(12 + power * 10);
    const colors = ['#f97316', '#f59e0b', '#fbbf24', '#fed7aa'];
    for (let i = 0; i < count; i++) {
      const spread = -Math.PI * (0.1 + Math.random() * 0.8);
      const speed = 150 + power * 180 + Math.random() * 140;
      const maxLife = 0.28 + Math.random() * 0.28;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y,
        vx: Math.cos(spread) * speed,
        vy: Math.sin(spread) * speed - 40,
        size: 3 + Math.random() * 3.5,
        color: colors[i % colors.length],
        alpha: 1,
        life: maxLife,
        maxLife,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 14,
      });
    }
  }

  private spawnBurstParticles(x: number, y: number, color: string, count = 10): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 80 + Math.random() * 170;
      const maxLife = 0.35 + Math.random() * 0.3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        size: 3 + Math.random() * 3.5,
        color,
        alpha: 1,
        life: maxLife,
        maxLife,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 10,
      });
    }
  }

  private spawnParticles(block: CharBlock, count = 7): void {
    const cx = block.x + block.w / 2;
    const cy = block.y + block.h / 2;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
      const speed = 70 + Math.random() * 170;
      const maxLife = 0.35 + Math.random() * 0.3;
      this.particles.push({
        x: cx + (Math.random() - 0.5) * block.w * 0.5,
        y: cy + (Math.random() - 0.5) * block.h * 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        size: 2.5 + Math.random() * 3.5,
        color: block.color,
        alpha: 1,
        life: maxLife,
        maxLife,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 10,
      });
    }
  }

  private spawnCelebration(): void {
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
    for (let i = 0; i < 60; i++) {
      const x = this.width * (0.2 + Math.random() * 0.6);
      const y = this.height * (0.25 + Math.random() * 0.35);
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 260;
      const maxLife = 0.8 + Math.random() * 0.7;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 120,
        size: 3.5 + Math.random() * 4.5,
        color: colors[i % colors.length],
        alpha: 1,
        life: maxLife,
        maxLife,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 12,
      });
    }
  }

  private destroyBlock(block: CharBlock): void {
    block.alive = false;
    block.el.style.visibility = 'hidden';
    this.destroyedBlocks += 1;
    this.combo += 1;
    this.comboTimer = COMBO_DURATION;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    const mult = 1 + Math.min(this.combo - 1, 10) * 0.2;
    const earned = Math.round(block.points * mult);
    this.addScore(earned);

    // Gentle speed ramp across all active balls as blocks are cleared
    const targetSpeed = this.getCurrentTargetBallSpeed();
    for (const ball of this.balls) {
      if (targetSpeed > ball.speed) {
        const ratio = targetSpeed / Math.max(1, ball.speed);
        ball.speed = targetSpeed;
        ball.vx *= ratio;
        ball.vy *= ratio;
      }
    }

    this.spawnParticles(block);
    this.floatingScores.push({
      x: block.x + block.w / 2,
      y: block.y,
      text: `+${earned}`,
      color: block.color,
      life: 0.65,
      maxLife: 0.65,
    });

    this.maybeDropItem(block);
    this.sound.playBrick(this.combo);
    this.updateHUD();
  }

  private enforceMinVerticalVelocity(ball: Ball): void {
    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed < 1) return;
    const minVy = speed * 0.24;
    if (Math.abs(ball.vy) < minVy) {
      const signY = ball.vy >= 0 ? 1 : -1;
      const signX = ball.vx >= 0 ? 1 : -1;
      ball.vy = signY * minVy;
      ball.vx = signX * Math.sqrt(Math.max(0, speed * speed - minVy * minVy));
    }
  }

  private stepPhysics(dt: number): void {
    this.elapsedTime += dt;

    if (this.scanTime > 0) {
      this.scanTime = Math.max(0, this.scanTime - dt);
    }
    if (this.missFlash > 0) {
      this.missFlash = Math.max(0, this.missFlash - dt * 2.4);
    }
    if (this.guardFlash > 0) {
      this.guardFlash = Math.max(0, this.guardFlash - dt * 2.6);
    }
    if (this.paddle.bounceOffset > 0.01) {
      this.paddle.bounceOffset *= Math.pow(0.001, dt);
    } else {
      this.paddle.bounceOffset = 0;
    }

    // Smoothly interpolate paddle width when wide power-up toggles
    const targetPaddleW = this.getTargetPaddleWidth();
    if (Math.abs(this.paddle.w - targetPaddleW) > 0.25) {
      const centerX = this.paddle.x + this.paddle.w / 2;
      const factor = 1 - Math.exp(-14 * dt);
      this.paddle.w += (targetPaddleW - this.paddle.w) * factor;
      this.paddle.x = clamp(centerX - this.paddle.w / 2, 8, this.width - this.paddle.w - 8);
    } else {
      this.paddle.w = targetPaddleW;
    }

    // Update particles & floating scores even during clear/gameover
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += 460 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;
      p.alpha = clamp(p.life / p.maxLife, 0, 1);
    }

    for (let i = this.floatingScores.length - 1; i >= 0; i--) {
      const f = this.floatingScores[i];
      f.life -= dt;
      if (f.life <= 0) {
        this.floatingScores.splice(i, 1);
        continue;
      }
      f.y -= 38 * dt;
    }

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= dt;
      if (sw.life <= 0) {
        this.shockwaves.splice(i, 1);
        continue;
      }
      const progress = 1 - sw.life / sw.maxLife;
      sw.radius = 8 + (sw.maxRadius - 8) * (1 - Math.pow(1 - progress, 3));
    }

    // Keyboard paddle movement (horizontal + vertical)
    if (this.phase === 'ready' || this.phase === 'playing') {
      let moveX = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
      let moveY = (this.keys.down ? 1 : 0) - (this.keys.up ? 1 : 0);
      if (moveX !== 0 || moveY !== 0) {
        if (moveX !== 0 && moveY !== 0) {
          moveX *= Math.SQRT1_2;
          moveY *= Math.SQRT1_2;
        }
        const paddleSpeedX = Math.max(540, this.width * 0.65);
        const paddleSpeedY = Math.max(440, this.height * 0.58);
        this.paddle.x = clamp(
          this.paddle.x + moveX * paddleSpeedX * dt,
          8,
          this.width - this.paddle.w - 8,
        );
        this.paddle.y = clamp(
          this.paddle.y + moveY * paddleSpeedY * dt,
          this.getPaddleMinY(),
          this.getPaddleMaxY(),
        );
      }
    }

    if (this.phase === 'ready') {
      if (this.balls[0]) {
        this.balls[0].x = this.paddle.x + this.paddle.w / 2;
        this.balls[0].y = this.paddle.y - this.balls[0].r - 1;
      }
      this.paddle.prevEffectiveY = this.getEffectivePaddleY();
      return;
    }

    if (this.phase !== 'playing') {
      this.paddle.prevEffectiveY = this.getEffectivePaddleY();
      return;
    }

    // Update paddle charge & release thrust animation
    if (this.paddle.charging) {
      this.paddle.chargeLevel = Math.min(1, this.paddle.chargeLevel + dt / CHARGE_MAX_TIME);
      if (this.paddle.chargeLevel >= 1 && !this.paddle.chargeFullNotified) {
        this.paddle.chargeFullNotified = true;
        this.sound.playChargeReady();
      }
      const targetPull = this.paddle.chargeLevel * CHARGE_PULL_DOWN;
      const pullEase = 1 - Math.exp(-16 * dt);
      this.paddle.animOffsetY += (targetPull - this.paddle.animOffsetY) * pullEase;
      const shakeAmp =
        (0.5 + 1.9 * this.paddle.chargeLevel) * Math.min(1, this.paddle.chargeLevel * 2.5);
      this.paddle.shakeX =
        (Math.sin(this.elapsedTime * 68) * 0.65 + Math.sin(this.elapsedTime * 113) * 0.35) *
        shakeAmp;
    } else if (this.paddle.thrustState === 'up') {
      this.paddle.thrustTimer += dt;
      const t = clamp(this.paddle.thrustTimer / THRUST_UP_DURATION, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      this.paddle.animOffsetY =
        this.paddle.thrustStartY + (this.paddle.thrustPeakY - this.paddle.thrustStartY) * eased;
      this.paddle.shakeX = 0;
      if (t >= 1) {
        this.paddle.thrustState = 'return';
        this.paddle.thrustTimer = 0;
        this.paddle.thrustStartY = this.paddle.animOffsetY;
      }
    } else if (this.paddle.thrustState === 'return') {
      this.paddle.thrustTimer += dt;
      const t = clamp(this.paddle.thrustTimer / THRUST_RETURN_DURATION, 0, 1);
      const eased = 1 - Math.pow(1 - t, 2.4);
      this.paddle.animOffsetY = this.paddle.thrustStartY * (1 - eased);
      this.paddle.shakeX = 0;
      if (t >= 1) {
        this.paddle.thrustState = 'idle';
        this.paddle.animOffsetY = 0;
      }
    } else {
      this.paddle.animOffsetY = 0;
      this.paddle.shakeX = 0;
    }

    if (this.paddle.smashWindowTimer > 0) {
      this.paddle.smashWindowTimer = Math.max(0, this.paddle.smashWindowTimer - dt);
    }

    const paddleStartY = this.paddle.prevEffectiveY;
    const paddleEndY = this.getEffectivePaddleY();
    const paddleDy = paddleEndY - paddleStartY;
    const paddleVy = dt > 0 ? paddleDy / dt : 0;

    // Tick combo timer
    if (this.combo > 0) {
      this.comboTimer = Math.max(0, this.comboTimer - dt);
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.comboTimer = 0;
      }
      this.updateComboUI();
    }

    // Tick timed power-ups
    let timersChanged = false;
    if (this.wideTimer > 0) {
      this.wideTimer = Math.max(0, this.wideTimer - dt);
      timersChanged = true;
    }
    if (this.pierceTimer > 0) {
      this.pierceTimer = Math.max(0, this.pierceTimer - dt);
      timersChanged = true;
    }
    if (timersChanged) {
      this.updateEffectsUI();
    }

    // Update falling power-up items
    const paddleSweepTop = Math.min(paddleStartY, paddleEndY);
    const paddleSweepBottom = Math.max(paddleStartY, paddleEndY) + this.paddle.h;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.age += dt;
      item.y += item.vy * dt;

      // Check catch with paddle (swept vertically to prevent fast-move tunneling)
      const itemLeft = item.x - item.w / 2;
      const itemRight = item.x + item.w / 2;
      const itemTop = item.y - item.h / 2;
      const itemBottom = item.y + item.h / 2;

      if (
        itemRight >= this.paddle.x - 4 &&
        itemLeft <= this.paddle.x + this.paddle.w + 4 &&
        itemBottom >= paddleSweepTop - 2 &&
        itemTop <= paddleSweepBottom + 6
      ) {
        this.items.splice(i, 1);
        this.applyPowerUp(item.type);
        continue;
      }

      if (itemTop > this.height + 16) {
        this.items.splice(i, 1);
      }
    }

    // Update each active ball
    const isGlobalPiercing = this.pierceTimer > 0;
    const targetBallSpeed = this.getCurrentTargetBallSpeed();
    const guardY = this.height - GUARD_LINE_BOTTOM_OFFSET;
    let ballsChanged = false;

    for (let bIdx = this.balls.length - 1; bIdx >= 0; bIdx--) {
      const ball = this.balls[bIdx];

      // Tick per-ball smash pierce & speed boost timers
      if (ball.pierceTimer > 0) {
        ball.pierceTimer = Math.max(0, ball.pierceTimer - dt);
      }
      if (ball.boostTimer > 0) {
        ball.boostTimer = Math.max(0, ball.boostTimer - dt);
      } else if (ball.speed > targetBallSpeed + 0.5) {
        const newSpeed =
          targetBallSpeed + (ball.speed - targetBallSpeed) * Math.exp(-4.5 * dt);
        const scale = newSpeed / Math.max(1, ball.speed);
        ball.speed = newSpeed;
        ball.vx *= scale;
        ball.vy *= scale;
      }

      // Record trail
      ball.trail.push({ x: ball.x, y: ball.y });
      const maxTrail = isGlobalPiercing || ball.pierceTimer > 0 || ball.boostTimer > 0 ? 15 : 9;
      while (ball.trail.length > maxTrail) {
        ball.trail.shift();
      }

      // Sub-stepped movement to prevent tunneling through small characters or fast vertical paddle sweeps
      const moveDist = Math.hypot(ball.vx * dt, ball.vy * dt);
      const maxMove = Math.max(moveDist, Math.abs(paddleDy));
      const steps = Math.max(1, Math.min(28, Math.ceil(maxMove / (ball.r * 0.45))));
      const stepDt = dt / steps;
      let ballRemoved = false;

      for (let s = 0; s < steps; s++) {
        const prevBallY = ball.y;
        const prevSubPaddleY = paddleStartY + paddleDy * (s / steps);
        const subPaddleY = paddleStartY + paddleDy * ((s + 1) / steps);

        ball.x += ball.vx * stepDt;
        ball.y += ball.vy * stepDt;

        // Wall collisions
        if (ball.x - ball.r <= 0) {
          ball.x = ball.r;
          ball.vx = Math.abs(ball.vx);
          this.sound.playWall();
        } else if (ball.x + ball.r >= this.width) {
          ball.x = this.width - ball.r;
          ball.vx = -Math.abs(ball.vx);
          this.sound.playWall();
        }

        if (ball.y - ball.r <= HUD_HEIGHT) {
          ball.y = HUD_HEIGHT + ball.r;
          ball.vy = Math.abs(ball.vy);
          this.sound.playWall();
        }

        // Paddle collision (supports vertical movement, swept thrust & charge smash without breaking combo)
        const withinPaddleX =
          ball.x + ball.r >= this.paddle.x && ball.x - ball.r <= this.paddle.x + this.paddle.w;
        if (withinPaddleX) {
          const minSubY = Math.min(prevSubPaddleY, subPaddleY);
          const maxSubBottom = Math.max(prevSubPaddleY, subPaddleY) + this.paddle.h;
          const fallingHit =
            ball.vy > 0 &&
            ball.y + ball.r >= minSubY &&
            ball.y - ball.r <= maxSubBottom &&
            prevBallY <= prevSubPaddleY + this.paddle.h;
          const risingPaddleHit =
            ball.vy <= 0 &&
            paddleVy < 0 &&
            ball.vy - paddleVy > 0 &&
            ball.y + ball.r >= subPaddleY &&
            ball.y - ball.r <= prevSubPaddleY + this.paddle.h &&
            prevBallY <= prevSubPaddleY + this.paddle.h * 0.5;

          if (fallingHit || risingPaddleHit) {
            const paddleCenter = this.paddle.x + this.paddle.w / 2;
            const hitPos = clamp((ball.x - paddleCenter) / (this.paddle.w / 2), -1, 1);
            const bounceAngle = hitPos * (Math.PI * 0.36);

            const isSmashHit =
              this.paddle.smashWindowTimer > 0 && ball.lastSmashId !== this.smashReleaseId;

            if (isSmashHit) {
              const power = this.paddle.smashPower;
              const boostMult =
                SMASH_SPEED_MIN_MULT + (SMASH_SPEED_MAX_MULT - SMASH_SPEED_MIN_MULT) * power;
              const smashSpeed = targetBallSpeed * boostMult;
              const pierceDur =
                SMASH_PIERCE_MIN_DURATION +
                (SMASH_PIERCE_MAX_DURATION - SMASH_PIERCE_MIN_DURATION) * power;
              const boostDur =
                SMASH_BOOST_MIN_DURATION +
                (SMASH_BOOST_MAX_DURATION - SMASH_BOOST_MIN_DURATION) * power;

              ball.speed = Math.max(ball.speed, smashSpeed);
              ball.pierceTimer = Math.max(ball.pierceTimer, pierceDur);
              ball.boostTimer = Math.max(ball.boostTimer, boostDur);
              ball.lastSmashId = this.smashReleaseId;

              ball.vx = Math.sin(bounceAngle) * ball.speed;
              ball.vy = -Math.cos(bounceAngle) * ball.speed;
              ball.y = subPaddleY - ball.r - 0.5;
              this.paddle.bounceOffset = 2;

              this.spawnShockwave(
                ball.x,
                subPaddleY,
                power >= 0.85 ? '#f97316' : '#f59e0b',
                56 + power * 42,
              );
              this.spawnSmashParticles(ball.x, subPaddleY, power);
              this.floatingScores.push({
                x: clamp(ball.x, 56, this.width - 56),
                y: subPaddleY - 18,
                text: power >= 0.85 ? 'MAX SMASH!' : 'SMASH!',
                color: power >= 0.85 ? '#ea580c' : '#d97706',
                life: 0.9,
                maxLife: 0.9,
                large: true,
              });
              this.sound.playSmashHit(power);
            } else {
              ball.vx = Math.sin(bounceAngle) * ball.speed;
              ball.vy = -Math.cos(bounceAngle) * ball.speed;
              ball.y = subPaddleY - ball.r - 0.5;
              this.paddle.bounceOffset = 4;
              this.sound.playPaddle();
            }
          }
        }

        // Guard barrier collision (saves ball from falling once per charge)
        if (this.guardCount > 0 && ball.vy > 0 && ball.y + ball.r >= guardY) {
          ball.y = guardY - ball.r - 0.5;
          ball.vy = -Math.abs(ball.vy);
          this.enforceMinVerticalVelocity(ball);
          this.guardCount -= 1;
          this.guardFlash = 1;
          this.spawnBurstParticles(ball.x, guardY, '#3b82f6', 14);
          this.floatingScores.push({
            x: clamp(ball.x, 48, this.width - 48),
            y: guardY - 14,
            text: 'GUARD!',
            color: '#2563eb',
            life: 0.85,
            maxLife: 0.85,
            large: true,
          });
          this.sound.playGuardBounce();
          this.updateEffectsUI();
        }

        // Block collisions
        let primaryHit: { block: CharBlock; dx: number; dy: number; distSq: number } | null =
          null;
        const hitBlocks: CharBlock[] = [];
        const rSq = ball.r * ball.r;

        for (let i = 0; i < this.blocks.length; i++) {
          const b = this.blocks[i];
          if (!b.alive) continue;

          if (
            ball.x + ball.r < b.x ||
            ball.x - ball.r > b.x + b.w ||
            ball.y + ball.r < b.y ||
            ball.y - ball.r > b.y + b.h
          ) {
            continue;
          }

          const closestX = clamp(ball.x, b.x, b.x + b.w);
          const closestY = clamp(ball.y, b.y, b.y + b.h);
          const dx = ball.x - closestX;
          const dy = ball.y - closestY;
          const distSq = dx * dx + dy * dy;

          if (distSq <= rSq) {
            hitBlocks.push(b);
            if (!primaryHit || distSq < primaryHit.distSq) {
              primaryHit = { block: b, dx, dy, distSq };
            }
          }
        }

        if (primaryHit) {
          // Pierce balls (global power-up OR short smash pierce) pass straight through blocks
          const ballIsPiercing = isGlobalPiercing || ball.pierceTimer > 0;
          if (!ballIsPiercing) {
            const { block, dx, dy } = primaryHit;
            if (dx === 0 && dy === 0) {
              const penLeft = ball.x - block.x;
              const penRight = block.x + block.w - ball.x;
              const penTop = ball.y - block.y;
              const penBottom = block.y + block.h - ball.y;
              const minPenX = Math.min(penLeft, penRight);
              const minPenY = Math.min(penTop, penBottom);
              if (minPenX < minPenY) {
                ball.vx = penLeft < penRight ? -Math.abs(ball.vx) : Math.abs(ball.vx);
              } else {
                ball.vy = penTop < penBottom ? -Math.abs(ball.vy) : Math.abs(ball.vy);
              }
            } else if (Math.abs(dx) > Math.abs(dy)) {
              ball.vx = dx > 0 ? Math.abs(ball.vx) : -Math.abs(ball.vx);
            } else {
              ball.vy = dy > 0 ? Math.abs(ball.vy) : -Math.abs(ball.vy);
            }
            this.enforceMinVerticalVelocity(ball);
          }

          for (const hb of hitBlocks) {
            this.destroyBlock(hb);
          }

          if (this.destroyedBlocks >= this.totalBlocks) {
            const bonus = this.lives * CLEAR_LIFE_BONUS;
            this.addScore(bonus);
            this.phase = 'clear';
            this.items = [];
            this.resetChargeState();
            this.paddle.prevEffectiveY = this.getEffectivePaddleY();
            this.spawnCelebration();
            this.sound.playClear();
            this.updateHUD();
            this.updateEffectsUI();
            this.updateOverlayState();
            return;
          }
        }

        // Bottom out for this individual ball
        if (ball.y - ball.r > this.height) {
          this.balls.splice(bIdx, 1);
          ballsChanged = true;
          ballRemoved = true;
          break;
        }
      }

      if (ballRemoved) continue;
    }

    if (ballsChanged) {
      this.updateEffectsUI();
    }

    // Lose a life / Game over ONLY when ALL balls have fallen
    if (this.balls.length === 0) {
      this.lives -= 1;
      this.combo = 0;
      this.comboTimer = 0;
      this.missFlash = 1;
      this.clearActivePowerUps();
      this.resetChargeState();
      this.paddle.y = clamp(this.getDefaultPaddleY(), this.getPaddleMinY(), this.getPaddleMaxY());
      this.paddle.prevEffectiveY = this.paddle.y;
      this.updateHUD();
      this.updateEffectsUI();

      if (this.lives <= 0) {
        this.phase = 'gameover';
        this.sound.playGameOver();
        this.updateOverlayState();
      } else {
        this.phase = 'ready';
        this.sound.playMiss();
        this.resetBallOnPaddle();
        this.updateOverlayState();
      }
      return;
    }

    this.paddle.prevEffectiveY = this.getEffectivePaddleY();
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ): void {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  private drawPowerUpItem(ctx: CanvasRenderingContext2D, item: PowerUpItem): void {
    const spec = POWERUP_SPECS[item.type];
    const left = item.x - item.w / 2;
    const top = item.y - item.h / 2;
    const r = item.h / 2;

    ctx.save();

    // Soft glow & shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.24)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;

    // Capsule body
    ctx.fillStyle = spec.bg;
    this.drawRoundedRect(ctx, left, top, item.w, item.h, r);
    ctx.fill();

    // Crisp colored rim
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = spec.border;
    ctx.lineWidth = 1.5;
    this.drawRoundedRect(ctx, left + 0.75, top + 0.75, item.w - 1.5, item.h - 1.5, r - 0.75);
    ctx.stroke();

    // Subtle top sheen
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    this.drawRoundedRect(ctx, left + 4, top + 2, item.w - 8, item.h * 0.36, 4);
    ctx.fill();

    // Left icon representing the effect
    const iconX = left + 13;
    const iconY = item.y;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (item.type === 'add3') {
      // Cluster of 3 mini balls
      ctx.beginPath();
      ctx.arc(iconX, iconY - 3, 2.3, 0, Math.PI * 2);
      ctx.arc(iconX - 3.2, iconY + 2.6, 2.3, 0, Math.PI * 2);
      ctx.arc(iconX + 3.2, iconY + 2.6, 2.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.type === 'double') {
      // Overlapping twin balls
      ctx.beginPath();
      ctx.arc(iconX - 2.6, iconY, 3.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = spec.bg;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(iconX + 2.6, iconY, 3.3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();
    } else if (item.type === 'wide') {
      // Double-headed horizontal arrow
      ctx.beginPath();
      ctx.moveTo(iconX - 5.5, iconY);
      ctx.lineTo(iconX + 5.5, iconY);
      ctx.moveTo(iconX - 2.8, iconY - 2.8);
      ctx.lineTo(iconX - 5.5, iconY);
      ctx.lineTo(iconX - 2.8, iconY + 2.8);
      ctx.moveTo(iconX + 2.8, iconY - 2.8);
      ctx.lineTo(iconX + 5.5, iconY);
      ctx.lineTo(iconX + 2.8, iconY + 2.8);
      ctx.stroke();
    } else if (item.type === 'guard') {
      // Shield silhouette
      ctx.beginPath();
      ctx.moveTo(iconX, iconY - 5.5);
      ctx.lineTo(iconX + 4.8, iconY - 3.4);
      ctx.lineTo(iconX + 4.4, iconY + 1.2);
      ctx.quadraticCurveTo(iconX + 3.4, iconY + 4.6, iconX, iconY + 6);
      ctx.quadraticCurveTo(iconX - 3.4, iconY + 4.6, iconX - 4.4, iconY + 1.2);
      ctx.lineTo(iconX - 4.8, iconY - 3.4);
      ctx.closePath();
      ctx.stroke();
    } else if (item.type === 'pierce') {
      // Double chevron piercing arrow >>
      ctx.beginPath();
      ctx.moveTo(iconX - 4.5, iconY - 3.6);
      ctx.lineTo(iconX - 0.8, iconY);
      ctx.lineTo(iconX - 4.5, iconY + 3.6);
      ctx.moveTo(iconX + 0.5, iconY - 3.6);
      ctx.lineTo(iconX + 4.2, iconY);
      ctx.lineTo(iconX + 0.5, iconY + 3.6);
      ctx.stroke();
    }

    // Label text on right side of capsule
    ctx.fillStyle = '#ffffff';
    ctx.font =
      item.type === 'add3' || item.type === 'double'
        ? '700 12px "JetBrains Mono", ui-monospace, monospace'
        : '700 10.5px "Inter", "Noto Sans JP", ui-sans-serif, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(spec.label, left + 42, item.y + 0.5);

    ctx.restore();
  }

  private render(): void {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, this.width, this.height);

    const isDark = document.documentElement.classList.contains('dark');
    const primaryColor = isDark ? '#fafafa' : '#09090b';
    const isPiercing = this.pierceTimer > 0;
    const isWide = this.wideTimer > 0;
    const wideEndingSoon = isWide && this.wideTimer <= 2.5;
    const pierceEndingSoon = isPiercing && this.pierceTimer <= 2.5;
    const blinkPhase = Math.sin(this.elapsedTime * 16) > 0;

    const blockZoneBottom = this.getBlockZoneBottom();

    // Opening scan effect: briefly highlight detected character blocks
    if (this.scanTime > 0 && this.blocks.length > 0) {
      const progress = 1 - this.scanTime / 0.55;
      const scanY = HUD_HEIGHT + progress * (blockZoneBottom - HUD_HEIGHT);
      const band = 90;

      ctx.save();
      for (const b of this.blocks) {
        if (!b.alive) continue;
        const dist = Math.abs(b.y + b.h / 2 - scanY);
        if (dist < band) {
          const alpha = (1 - dist / band) * 0.35;
          ctx.strokeStyle = isDark
            ? `rgba(250, 250, 250, ${alpha})`
            : `rgba(24, 24, 27, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(b.x, b.y, b.w, b.h);
        }
      }
      ctx.restore();
    }

    // Block hit-zone boundary line (characters above this line are breakable blocks)
    if (this.phase !== 'empty') {
      const lineY = Math.round(blockZoneBottom) + 0.5;
      ctx.save();

      // Subtle tint below the boundary to distinguish the paddle area
      const zoneGrad = ctx.createLinearGradient(0, lineY, 0, this.height);
      if (isDark) {
        zoneGrad.addColorStop(0, 'rgba(250, 250, 250, 0.04)');
        zoneGrad.addColorStop(1, 'rgba(250, 250, 250, 0.01)');
      } else {
        zoneGrad.addColorStop(0, 'rgba(24, 24, 27, 0.04)');
        zoneGrad.addColorStop(1, 'rgba(24, 24, 27, 0.01)');
      }
      ctx.fillStyle = zoneGrad;
      ctx.fillRect(0, lineY, this.width, this.height - lineY);

      // Dashed boundary line
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = isDark ? 'rgba(250, 250, 250, 0.28)' : 'rgba(24, 24, 27, 0.24)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(this.width, lineY);
      ctx.stroke();

      // Boundary label
      ctx.setLineDash([]);
      ctx.font = '500 10px "Inter", "Noto Sans JP", ui-sans-serif, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = isDark ? 'rgba(250, 250, 250, 0.48)' : 'rgba(24, 24, 27, 0.45)';
      ctx.fillText('▲ ここまでブロック判定', this.width - 14, lineY - 5);

      ctx.restore();
    }

    // Guard barrier at bottom of viewport when active
    if (this.guardCount > 0 && this.phase !== 'empty') {
      const guardY = this.height - GUARD_LINE_BOTTOM_OFFSET;
      const pulse = 0.72 + 0.28 * Math.sin(this.elapsedTime * 5);
      ctx.save();

      const glowGrad = ctx.createLinearGradient(0, guardY - 18, 0, this.height);
      glowGrad.addColorStop(0, 'rgba(59, 130, 246, 0)');
      glowGrad.addColorStop(1, `rgba(59, 130, 246, ${0.22 * pulse})`);
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, guardY - 18, this.width, this.height - (guardY - 18));

      ctx.shadowColor = 'rgba(59, 130, 246, 0.75)';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = `rgba(59, 130, 246, ${0.85 * pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, guardY);
      ctx.lineTo(this.width, guardY);
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(191, 219, 254, 0.85)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, guardY);
      ctx.lineTo(this.width, guardY);
      ctx.stroke();

      ctx.restore();
    }

    // Guard bounce flash
    if (this.guardFlash > 0) {
      const grad = ctx.createLinearGradient(0, this.height - 90, 0, this.height);
      grad.addColorStop(0, 'rgba(59, 130, 246, 0)');
      grad.addColorStop(1, `rgba(59, 130, 246, ${this.guardFlash * 0.35})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, this.height - 90, this.width, 90);
    }

    // Miss flash at bottom edge
    if (this.missFlash > 0) {
      const grad = ctx.createLinearGradient(0, this.height - 140, 0, this.height);
      grad.addColorStop(0, 'rgba(244, 63, 94, 0)');
      grad.addColorStop(1, `rgba(244, 63, 94, ${this.missFlash * 0.35})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, this.height - 140, this.width, 140);
    }

    // Falling power-up items
    for (const item of this.items) {
      this.drawPowerUpItem(ctx, item);
    }

    // Aiming guide in READY state
    if (this.phase === 'ready' && this.balls[0]) {
      const b = this.balls[0];
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = isDark ? 'rgba(250, 250, 250, 0.3)' : 'rgba(24, 24, 27, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(
        b.x + Math.sin(this.launchAngle) * 76,
        b.y - Math.cos(this.launchAngle) * 76,
      );
      ctx.stroke();
      ctx.restore();
    }

    // Shockwaves (from charge smash hits)
    for (const sw of this.shockwaves) {
      const alpha = clamp(sw.life / sw.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha * 0.65;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 1.5 + alpha * 2.5;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Ball trails
    const baseComboColor =
      this.combo >= 8 ? '#f59e0b' : this.combo >= 4 ? '#3b82f6' : isDark ? '#fafafa' : '#18181b';

    if (this.phase === 'playing' || this.phase === 'paused') {
      for (const ball of this.balls) {
        const ballIsPiercing = isPiercing || ball.pierceTimer > 0;
        const ballIsBoosted = ball.boostTimer > 0;
        const ballEndingSoon = isPiercing
          ? pierceEndingSoon
          : ball.pierceTimer > 0 && ball.pierceTimer <= 0.35;
        const ballColor = ballIsPiercing
          ? ballEndingSoon && !blinkPhase
            ? '#fbbf24'
            : '#f97316'
          : ballIsBoosted
            ? '#f59e0b'
            : baseComboColor;

        for (let i = 0; i < ball.trail.length; i++) {
          const pt = ball.trail[i];
          const ratio = (i + 1) / (ball.trail.length + 1);
          ctx.save();
          ctx.globalAlpha = ratio * (ballIsPiercing || ballIsBoosted ? 0.36 : 0.2);
          ctx.fillStyle = ballColor;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, ball.r * (0.45 + ratio * 0.5), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // Paddle
    if (this.phase !== 'empty') {
      const px = clamp(this.paddle.x + this.paddle.shakeX, 4, this.width - this.paddle.w - 4);
      const py = this.getEffectivePaddleY() + this.paddle.bounceOffset;
      const charge = this.paddle.chargeLevel;
      const isCharging = this.paddle.charging && charge > 0;
      const isThrustUp = this.paddle.thrustState === 'up';
      const isSmashActive = this.paddle.smashWindowTimer > 0;

      ctx.save();

      // Subtle upward motion afterimage during rapid release thrust
      if (isThrustUp) {
        const startY = clamp(
          this.paddle.y + this.paddle.thrustStartY,
          HUD_HEIGHT + 16,
          this.height - GUARD_LINE_BOTTOM_OFFSET - PADDLE_HEIGHT - 2,
        );
        const streakH = Math.max(0, startY - py);
        if (streakH > 1) {
          const trailGrad = ctx.createLinearGradient(0, py, 0, startY + this.paddle.h);
          trailGrad.addColorStop(0, 'rgba(249, 115, 22, 0.32)');
          trailGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
          ctx.fillStyle = trailGrad;
          this.drawRoundedRect(ctx, px, py, this.paddle.w, streakH + this.paddle.h, 6);
          ctx.fill();
        }
      }

      ctx.shadowColor =
        isCharging || isSmashActive
          ? `rgba(249, 115, 22, ${isSmashActive ? 0.65 : 0.28 + charge * 0.5})`
          : isWide
            ? 'rgba(16, 185, 129, 0.35)'
            : isDark
              ? 'rgba(0, 0, 0, 0.5)'
              : 'rgba(0, 0, 0, 0.16)';
      ctx.shadowBlur = isCharging || isSmashActive ? 14 + charge * 10 : isWide ? 14 : 10;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = primaryColor;
      this.drawRoundedRect(ctx, px, py, this.paddle.w, this.paddle.h, 6);
      ctx.fill();

      ctx.shadowColor = 'transparent';

      // Wide paddle emerald accents on both ends
      if (isWide && (!wideEndingSoon || blinkPhase)) {
        ctx.fillStyle = '#10b981';
        this.drawRoundedRect(ctx, px + 2, py + 2, 12, this.paddle.h - 4, 4);
        ctx.fill();
        this.drawRoundedRect(
          ctx,
          px + this.paddle.w - 14,
          py + 2,
          12,
          this.paddle.h - 4,
          4,
        );
        ctx.fill();
      }

      // Charge power fill expanding from center outward while holding Space / Left Click
      if (isCharging) {
        const innerMaxW = Math.max(0, this.paddle.w - 6);
        const fillW = Math.max(8, innerMaxW * charge);
        const fillX = px + (this.paddle.w - fillW) / 2;
        const chargeGrad = ctx.createLinearGradient(fillX, py, fillX + fillW, py);
        if (charge >= 0.99) {
          chargeGrad.addColorStop(0, '#f97316');
          chargeGrad.addColorStop(0.5, '#fde047');
          chargeGrad.addColorStop(1, '#f97316');
        } else {
          chargeGrad.addColorStop(0, '#f59e0b');
          chargeGrad.addColorStop(0.5, '#fb923c');
          chargeGrad.addColorStop(1, '#f59e0b');
        }
        ctx.fillStyle = chargeGrad;
        this.drawRoundedRect(ctx, fillX, py + 2.5, fillW, this.paddle.h - 5, 3.5);
        ctx.fill();

        // Full charge pulsing outer rim
        if (charge >= 0.99) {
          ctx.strokeStyle = blinkPhase
            ? 'rgba(253, 224, 71, 0.95)'
            : 'rgba(249, 115, 22, 0.95)';
          ctx.lineWidth = 1.75;
          this.drawRoundedRect(ctx, px - 1, py - 1, this.paddle.w + 2, this.paddle.h + 2, 7);
          ctx.stroke();
        }
      } else if (isSmashActive) {
        // Bright strike highlight along top edge during the active smash release window
        const flashAlpha = clamp(this.paddle.smashWindowTimer / SMASH_WINDOW_DURATION, 0, 1);
        ctx.fillStyle = `rgba(251, 146, 60, ${0.45 + flashAlpha * 0.5})`;
        this.drawRoundedRect(ctx, px + 2, py + 1.5, this.paddle.w - 4, 4, 2);
        ctx.fill();
      }

      // Subtle center notch on paddle
      ctx.fillStyle = isDark ? 'rgba(9, 9, 11, 0.35)' : 'rgba(255, 255, 255, 0.45)';
      this.drawRoundedRect(ctx, px + this.paddle.w / 2 - 12, py + 4, 24, 4, 2);
      ctx.fill();

      // Companion combo timer gauge right below the paddle for peripheral awareness
      if (this.combo > 0 && this.comboTimer > 0) {
        const comboRatio = clamp(this.comboTimer / COMBO_DURATION, 0, 1);
        const barW = Math.min(this.paddle.w - 8, 96);
        const barH = 3;
        const barX = px + (this.paddle.w - barW) / 2;
        const barY = py + this.paddle.h + 4;
        const isComboWarn = this.comboTimer <= COMBO_WARN_TIME;
        const barColor = isComboWarn
          ? blinkPhase
            ? '#f43f5e'
            : '#fb7185'
          : this.combo >= 8
            ? '#f59e0b'
            : this.combo >= 4
              ? '#3b82f6'
              : isDark
                ? '#e4e4e7'
                : '#27272a';

        ctx.fillStyle = isDark ? 'rgba(250, 250, 250, 0.14)' : 'rgba(24, 24, 27, 0.12)';
        this.drawRoundedRect(ctx, barX, barY, barW, barH, barH / 2);
        ctx.fill();

        const fillW = barW * comboRatio;
        if (fillW > 0.5) {
          ctx.fillStyle = barColor;
          this.drawRoundedRect(ctx, barX, barY, Math.max(barH, fillW), barH, barH / 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // Balls
    if (this.phase === 'ready' || this.phase === 'playing' || this.phase === 'paused') {
      for (const ball of this.balls) {
        const ballIsPiercing = isPiercing || ball.pierceTimer > 0;
        const ballIsBoosted = ball.boostTimer > 0;
        const ballEndingSoon = isPiercing
          ? pierceEndingSoon
          : ball.pierceTimer > 0 && ball.pierceTimer <= 0.35;
        const ballColor = ballIsPiercing
          ? ballEndingSoon && !blinkPhase
            ? '#fbbf24'
            : '#f97316'
          : ballIsBoosted
            ? '#f59e0b'
            : baseComboColor;

        ctx.save();
        ctx.shadowColor = ballIsPiercing
          ? 'rgba(249, 115, 22, 0.75)'
          : ballIsBoosted
            ? 'rgba(245, 158, 11, 0.65)'
            : isDark
              ? 'rgba(250, 250, 250, 0.35)'
              : 'rgba(9, 9, 11, 0.22)';
        ctx.shadowBlur = ballIsPiercing ? 15 : ballIsBoosted ? 12 : 10;
        ctx.fillStyle = ballColor;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fill();

        // Piercing outer aura ring
        if (ballIsPiercing) {
          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = 'rgba(254, 215, 170, 0.85)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.r + 1.5, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Specular dot
        ctx.shadowColor = 'transparent';
        ctx.fillStyle =
          ballIsPiercing || ballIsBoosted
            ? 'rgba(255, 255, 255, 0.85)'
            : isDark
              ? 'rgba(9, 9, 11, 0.25)'
              : 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(
          ball.x - ball.r * 0.28,
          ball.y - ball.r * 0.28,
          ball.r * 0.28,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.restore();
      }
    }

    // Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }

    // Floating scores & power-up toasts
    for (const f of this.floatingScores) {
      ctx.save();
      ctx.globalAlpha = clamp(f.life / f.maxLife, 0, 1);
      ctx.font = f.large
        ? '700 13px "Inter", "Noto Sans JP", ui-sans-serif, sans-serif'
        : '600 11px "JetBrains Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
  }

  private loop = (now: number): void => {
    if (!this.active) return;
    const dt = Math.min((now - this.lastTimestamp) / 1000, 0.05);
    this.lastTimestamp = now;

    this.stepPhysics(dt);
    this.render();

    this.rafId = requestAnimationFrame(this.loop);
  };
}

let gameInstance: TextBreakoutGame | null = null;

export function initBreakoutToggle(buttonId: string): void {
  const btn = document.getElementById(buttonId);
  if (!btn) return;

  const syncAria = (active: boolean) => {
    btn.setAttribute('aria-pressed', String(active));
  };

  if (!gameInstance) {
    gameInstance = new TextBreakoutGame((active) => {
      syncAria(active);
    });
  }

  syncAria(gameInstance.isActive());

  btn.addEventListener('click', () => {
    gameInstance?.toggle();
  });
}
