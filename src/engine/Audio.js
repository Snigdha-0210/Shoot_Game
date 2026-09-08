// Web Audio API Procedural Sound Synthesizer for Tactical FPS
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.heartbeatOsc = null;
    this.heartbeatGain = null;
    this.heartbeatInterval = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play suppressed operative gunshot
  playSilencedShot() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // High snap (white noise burst)
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.015));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1200, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);

    // Suppressed low thump
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.07);

    oscGain.gain.setValueAtTime(0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Play loud enemy assault rifle gunshot
  playEnemyGunfire(distance = 1) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const volume = Math.max(0.05, Math.min(0.5, 1 / (1 + distance * 0.08)));

    // Sharp snap
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);

    gain.gain.setValueAtTime(volume * 0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);

    // Noise crack
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.02));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(volume * 0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
  }

  // Play Critical Headshot Kill Sound (+15)
  playHeadshotKill() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Two-tone high-tech chord chime
    [1046.5, 1318.5, 2093.0].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);

      gain.gain.setValueAtTime(0.25, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45 + i * 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.04);
      osc.stop(now + 0.5 + i * 0.04);
    });

    // Metallic helmet ping
    const ping = this.ctx.createOscillator();
    const pingGain = this.ctx.createGain();
    ping.type = 'triangle';
    ping.frequency.setValueAtTime(3200, now);
    ping.frequency.exponentialRampToValueAtTime(1600, now + 0.15);

    pingGain.gain.setValueAtTime(0.3, now);
    pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    ping.connect(pingGain);
    pingGain.connect(this.ctx.destination);
    ping.start(now);
    ping.stop(now + 0.16);
  }

  // Play Body Hit Sound (+5)
  playBodyHit() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Play Player Hurt Sound (-3 pts penalty)
  playPlayerHurt() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.18);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  // Bomb Beep Countdown
  playBombBeep(urgency = 1) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const freq = 1200 + (urgency > 2 ? 600 : 0);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Wire Cut Sound
  playWireCut(isCorrect) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Metal snip
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.01));
    }
    const snip = this.ctx.createBufferSource();
    snip.buffer = buffer;
    const snipGain = this.ctx.createGain();
    snipGain.gain.setValueAtTime(0.4, now);
    snipGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    snip.connect(snipGain);
    snipGain.connect(this.ctx.destination);
    snip.start(now);

    if (isCorrect) {
      // Affirmative electronic beep
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now + 0.05);
      osc.frequency.setValueAtTime(1320, now + 0.12);
      gain.gain.setValueAtTime(0.25, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + 0.05);
      osc.stop(now + 0.32);
    } else {
      // Error buzz
      const buzz = this.ctx.createOscillator();
      const buzzGain = this.ctx.createGain();
      buzz.type = 'sawtooth';
      buzz.frequency.setValueAtTime(120, now + 0.05);
      buzzGain.gain.setValueAtTime(0.35, now + 0.05);
      buzzGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      buzz.connect(buzzGain);
      buzzGain.connect(this.ctx.destination);
      buzz.start(now + 0.05);
      buzz.stop(now + 0.42);
    }
  }

  // Defusal Success Fanfare
  playDefuseSuccess() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0.3, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.45);
    });
  }

  // Explosion
  playExplosion() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.4));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(40, now + 1.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  // Weapon Reload
  playReload() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Mag out click
    const click1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    click1.type = 'sine';
    click1.frequency.setValueAtTime(600, now);
    g1.gain.setValueAtTime(0.2, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    click1.connect(g1);
    g1.connect(this.ctx.destination);
    click1.start(now);
    click1.stop(now + 0.06);

    // Mag in snap
    const click2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    click2.type = 'triangle';
    click2.frequency.setValueAtTime(900, now + 0.8);
    g2.gain.setValueAtTime(0.3, now + 0.8);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.88);
    click2.connect(g2);
    g2.connect(this.ctx.destination);
    click2.start(now + 0.8);
    click2.stop(now + 0.9);

    // Slide rack
    const click3 = this.ctx.createOscillator();
    const g3 = this.ctx.createGain();
    click3.type = 'sawtooth';
    click3.frequency.setValueAtTime(1400, now + 1.3);
    click3.frequency.exponentialRampToValueAtTime(400, now + 1.42);
    g3.gain.setValueAtTime(0.25, now + 1.3);
    g3.gain.exponentialRampToValueAtTime(0.001, now + 1.45);
    click3.connect(g3);
    g3.connect(this.ctx.destination);
    click3.start(now + 1.3);
    click3.stop(now + 1.46);
  }

  // Tactical Footsteps
  playStep(isCrouch = false, isSprint = false) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const volume = isCrouch ? 0.04 : (isSprint ? 0.25 : 0.12);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80 + Math.random() * 20, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.04);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Enemy Alert Shouted / Radio Tone
  playEnemyAlert() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.setValueAtTime(1000, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }
}

export const audio = new SoundEngine();
