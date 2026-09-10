// Audio Service for Memora
// Uses Web Audio API for dementia-friendly gentle chimes, melodies, and sound effects
// plus HTML5 Audio and MediaRecorder for family voice recording and playback.

class AudioService {
  private ctx: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private fluteOscillators: OscillatorNode[] = [];
  private fluteGain: GainNode | null = null;
  private isMelodyPlaying: boolean = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Soft dementia-friendly tap sound
  playTapSound() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  // Gentle, uplifting success chime (Pentatonic warm chime)
  playSuccessChime() {
    try {
      const ctx = this.getContext();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (warm major chord)

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

        const startTime = ctx.currentTime + idx * 0.12;
        const duration = 0.8;

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.18, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch {
      // Ignore audio error
    }
  }

  // Reassuring encourage sound (softer, encouraging tone)
  playEncourageSound() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(392.00, ctx.currentTime); // G4
      osc.frequency.exponentialRampToValueAtTime(523.25, ctx.currentTime + 0.25); // C5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Ignore audio error
    }
  }

  // Play an audio stream/file/base64 URL
  playVoice(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stopCurrentAudio();
      try {
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;
        audio.onended = () => {
          this.currentAudio = null;
          resolve();
        };
        audio.onerror = (e) => {
          this.currentAudio = null;
          reject(e);
        };
        audio.play().catch(reject);
      } catch (err) {
        reject(err);
      }
    });
  }

  stopCurrentAudio() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.currentAudio = null;
    }
    this.stopSynthesizedMelody();
  }

  // Soothing traditional Indian / Assamese Flute Melody synthesizer (Raag Bhupali pentatonic: Sa Re Ga Pa Dha)
  playSoothingFluteReward(durationSeconds: number = 10, onEnded?: () => void) {
    this.stopCurrentAudio();
    try {
      const ctx = this.getContext();
      this.isMelodyPlaying = true;

      // Pentatonic notes in Hz (Assamese flute / folk tone)
      const scale = [293.66, 329.63, 369.99, 440.00, 493.88, 587.33, 739.99]; // D4, E4, F#4, A4, B4, D5, F#5
      const pattern = [0, 1, 2, 4, 3, 2, 1, 0, 2, 3, 5, 4, 3, 1, 0];

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.14, ctx.currentTime);
      masterGain.connect(ctx.destination);
      this.fluteGain = masterGain;

      let timeCursor = ctx.currentTime + 0.1;
      const noteLength = 0.55;

      // Loop through notes for duration
      const totalNotes = Math.floor(durationSeconds / noteLength);
      for (let i = 0; i < totalNotes; i++) {
        const noteIdx = pattern[i % pattern.length];
        const freq = scale[noteIdx];

        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        // Flute timbre: sine with gentle vibrato and soft breathiness
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, timeCursor);

        // Gentle portamento / vibrato
        osc.frequency.linearRampToValueAtTime(freq * 1.008, timeCursor + noteLength * 0.5);
        osc.frequency.linearRampToValueAtTime(freq, timeCursor + noteLength);

        // Envelope: soft attack, sustained, soft release
        noteGain.gain.setValueAtTime(0.001, timeCursor);
        noteGain.gain.linearRampToValueAtTime(0.18, timeCursor + 0.12);
        noteGain.gain.exponentialRampToValueAtTime(0.001, timeCursor + noteLength - 0.02);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(timeCursor);
        osc.stop(timeCursor + noteLength);
        this.fluteOscillators.push(osc);

        timeCursor += noteLength;
      }

      // Schedule stop
      setTimeout(() => {
        this.stopSynthesizedMelody();
        if (onEnded) onEnded();
      }, durationSeconds * 1000);

    } catch (e) {
      console.warn('Could not play synthesized flute', e);
    }
  }

  stopSynthesizedMelody() {
    this.isMelodyPlaying = false;
    this.fluteOscillators.forEach(osc => {
      try { osc.stop(); } catch { /* ignore */ }
    });
    this.fluteOscillators = [];
    if (this.fluteGain) {
      try {
        this.fluteGain.disconnect();
      } catch { /* ignore */ }
      this.fluteGain = null;
    }
  }

  isPlaying(): boolean {
    return (this.currentAudio !== null && !this.currentAudio.paused) || this.isMelodyPlaying;
  }

  // Spoken voice guidance fallback (SpeechSynthesis)
  speakText(text: string, lang: 'en' | 'as') {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85; // Slower, calmer for elderly
      utterance.pitch = 1.0;
      utterance.lang = lang === 'as' ? 'as-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore if speech synthesis is not permitted
    }
  }
}

export const audioService = new AudioService();
