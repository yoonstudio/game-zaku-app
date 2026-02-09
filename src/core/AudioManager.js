/**
 * Audio Manager
 * Handles background music and sound effects using Web Audio API
 */

export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.isPlaying = false;
    this.currentMusic = null;

    // Initialize on first user interaction
    this.initialized = false;
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  init() {
    if (this.initialized) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Master gain
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.audioContext.destination);

      // Music gain
      this.musicGain = this.audioContext.createGain();
      this.musicGain.gain.value = 0.3;
      this.musicGain.connect(this.masterGain);

      // SFX gain
      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.gain.value = 0.6;
      this.sfxGain.connect(this.masterGain);

      this.initialized = true;
      console.log('[AudioManager] Initialized');
    } catch (e) {
      console.warn('[AudioManager] Failed to initialize:', e);
    }
  }

  /**
   * Play Gundam-style theme music (synthesized)
   */
  playGundamTheme() {
    if (!this.initialized) this.init();
    if (!this.audioContext || this.isPlaying) return;

    this.isPlaying = true;

    // Gundam theme melody notes (simplified "Tobe! Gundam" / "Fly! Gundam" style)
    // Using frequencies for a heroic march-like melody
    const tempo = 140; // BPM
    const beatDuration = 60 / tempo;

    const melody = [
      // Intro fanfare
      { note: 'E4', duration: 0.5 },
      { note: 'E4', duration: 0.25 },
      { note: 'F4', duration: 0.25 },
      { note: 'G4', duration: 0.5 },
      { note: 'G4', duration: 0.25 },
      { note: 'A4', duration: 0.25 },
      { note: 'B4', duration: 1 },
      { note: null, duration: 0.25 },

      // Main theme
      { note: 'E4', duration: 0.5 },
      { note: 'G4', duration: 0.5 },
      { note: 'B4', duration: 0.5 },
      { note: 'A4', duration: 0.5 },
      { note: 'G4', duration: 1 },
      { note: null, duration: 0.25 },

      { note: 'A4', duration: 0.5 },
      { note: 'G4', duration: 0.5 },
      { note: 'E4', duration: 0.5 },
      { note: 'D4', duration: 0.5 },
      { note: 'E4', duration: 1 },
      { note: null, duration: 0.25 },

      // Heroic rise
      { note: 'E4', duration: 0.25 },
      { note: 'E4', duration: 0.25 },
      { note: 'G4', duration: 0.5 },
      { note: 'A4', duration: 0.5 },
      { note: 'B4', duration: 0.5 },
      { note: 'C5', duration: 1 },
      { note: null, duration: 0.25 },

      { note: 'B4', duration: 0.5 },
      { note: 'A4', duration: 0.5 },
      { note: 'G4', duration: 0.5 },
      { note: 'E4', duration: 0.5 },
      { note: 'G4', duration: 1.5 },
      { note: null, duration: 0.5 },
    ];

    // Note to frequency mapping
    const noteFreq = {
      'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
      'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
      'C5': 523.25, 'D5': 587.33, 'E5': 659.25,
    };

    const playMelody = () => {
      if (!this.isPlaying) return;

      let time = this.audioContext.currentTime;

      melody.forEach(({ note, duration }) => {
        if (note && noteFreq[note]) {
          this.playNote(noteFreq[note], time, duration * beatDuration, 'square');
          // Add bass harmony
          this.playNote(noteFreq[note] / 2, time, duration * beatDuration, 'sawtooth', 0.15);
        }
        time += duration * beatDuration;
      });

      // Add drums
      let drumTime = this.audioContext.currentTime;
      const totalDuration = melody.reduce((sum, n) => sum + n.duration, 0) * beatDuration;

      for (let t = 0; t < totalDuration; t += beatDuration) {
        this.playDrum(drumTime + t, 'kick');
        if (t % (beatDuration * 2) === beatDuration) {
          this.playDrum(drumTime + t, 'snare');
        }
      }

      // Loop the music
      const loopDuration = totalDuration * 1000;
      this.currentMusic = setTimeout(() => playMelody(), loopDuration);
    };

    playMelody();
    console.log('[AudioManager] Playing Gundam theme');
  }

  /**
   * Play a single note
   */
  playNote(frequency, startTime, duration, waveType = 'square', volume = 0.2) {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = waveType;
    osc.frequency.value = frequency;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gain.gain.setValueAtTime(volume, startTime + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  /**
   * Play drum sound
   */
  playDrum(time, type = 'kick') {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    if (type === 'kick') {
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
      osc.type = 'sine';
    } else if (type === 'snare') {
      // Noise-based snare
      const bufferSize = this.audioContext.sampleRate * 0.1;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.audioContext.createBufferSource();
      noise.buffer = buffer;

      const noiseGain = this.audioContext.createGain();
      noiseGain.gain.setValueAtTime(0.2, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1000;

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.musicGain);
      noise.start(time);
      noise.stop(time + 0.1);
      return;
    }

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  /**
   * Play explosion sound effect
   */
  playExplosion(intensity = 1) {
    if (!this.initialized) this.init();
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;

    // Low frequency boom
    const boom = this.audioContext.createOscillator();
    const boomGain = this.audioContext.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(100 * intensity, now);
    boom.frequency.exponentialRampToValueAtTime(20, now + 0.3);
    boomGain.gain.setValueAtTime(0.5, now);
    boomGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    boom.connect(boomGain);
    boomGain.connect(this.sfxGain);
    boom.start(now);
    boom.stop(now + 0.4);

    // Noise burst
    const bufferSize = this.audioContext.sampleRate * 0.3;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 8);
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.4 * intensity, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.3);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + 0.3);
  }

  /**
   * Stop music
   */
  stopMusic() {
    this.isPlaying = false;
    if (this.currentMusic) {
      clearTimeout(this.currentMusic);
      this.currentMusic = null;
    }
  }

  /**
   * Set master volume
   */
  setMasterVolume(value) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, value));
    }
  }

  /**
   * Set music volume
   */
  setMusicVolume(value) {
    if (this.musicGain) {
      this.musicGain.gain.value = Math.max(0, Math.min(1, value));
    }
  }

  /**
   * Set SFX volume
   */
  setSfxVolume(value) {
    if (this.sfxGain) {
      this.sfxGain.gain.value = Math.max(0, Math.min(1, value));
    }
  }
}
