/**
 * AURELIA HOROLOGY - Web Audio Mechanical Movement Sound Engine
 * Synthesizes authentic Swiss mechanical escapement acoustic impulses,
 * balance wheel resonance, winding clicks, and cinematic disassembly effects.
 */

class HorologyAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true; // start muted for polite browser policy
    this.volume = 0.6;
    this.lastTickTime = 0;
    this.tickToggle = false;
    this.masterGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, now, 0.05);
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (!this.ctx || this.isMuted) return;
    this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
  }

  // Synthesize an authentic Swiss mechanical escapement tick or tock
  playEscapementTick(isAlt = false) {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    // 1. Pallet jewel strike on steel escape wheel tooth (High transient click)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    const filter1 = this.ctx.createBiquadFilter();

    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(isAlt ? 3400 : 3900, now);
    filter1.Q.setValueAtTime(8, now);

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(isAlt ? 3200 : 3800, now);
    osc1.frequency.exponentialRampToValueAtTime(800, now + 0.018);

    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.linearRampToValueAtTime(0.45, now + 0.001);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(this.masterGain);

    osc1.start(now);
    osc1.stop(now + 0.025);

    // 2. Metallic Case Resonance (Damped high ping)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(isAlt ? 5200 : 5800, now);
    osc2.frequency.exponentialRampToValueAtTime(isAlt ? 4800 : 5400, now + 0.035);

    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.linearRampToValueAtTime(0.18, now + 0.0015);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    osc2.start(now);
    osc2.stop(now + 0.045);

    // 3. Transient noise click (impact of ruby pallet)
    this.playNoiseTransient(now, 0.008, isAlt ? 4000 : 4600, 0.25);
  }

  playNoiseTransient(startTime, duration, centerFreq, gainLevel) {
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(centerFreq, startTime);
    filter.Q.setValueAtTime(5, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainLevel, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start(startTime);
    whiteNoise.stop(startTime + duration);
  }

  // Winding stem / crown ratchet clicks
  playWindingClick() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400 + Math.random() * 300, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.025);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  // Cinematic whoosh for explode / assemble animation
  playExplodeSound(isExploding = true) {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    if (isExploding) {
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(1800, now + 0.8);
      filter.frequency.exponentialRampToValueAtTime(300, now + 1.4);
    } else {
      filter.frequency.setValueAtTime(1600, now);
      filter.frequency.exponentialRampToValueAtTime(350, now + 0.9);
    }

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isExploding ? 80 : 120, now);
    osc.frequency.exponentialRampToValueAtTime(isExploding ? 140 : 70, now + 1.2);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.5);
  }

  // Precision mechanical butterfly deployant clasp latch / release double-click
  playClaspClick(isOpen = true) {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    // 1. Initial pusher release snap
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(isOpen ? 2200 : 1800, now);
    osc1.frequency.exponentialRampToValueAtTime(700, now + 0.025);

    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.028);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.03);

    // 2. Secondary blade lock / spring snap (45ms delay for mechanical tactile feel)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1400, now + 0.045);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(isOpen ? 1200 : 2600, now + 0.045);
    osc2.frequency.exponentialRampToValueAtTime(300, now + 0.075);

    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.setValueAtTime(0.28, now + 0.045);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc2.connect(filter);
    filter.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.045);
    osc2.stop(now + 0.085);
  }
}

window.HorologyAudio = new HorologyAudioEngine();
