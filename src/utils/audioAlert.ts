/**
 * Web Audio API Looping Notification Sound Synthesizer
 * Plays a pleasant, melodious completion chime in an endless loop
 * until stopped by the user upon downloading the TXT prompt file.
 */

class CompletionAudioAlert {
  private audioCtx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private intervalId: any = null;

  private initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  /**
   * Play a single melodious 4-note chime sequence:
   * Notes: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.5Hz)
   */
  private playChime() {
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const notes = [
        { freq: 523.25, time: 0.0, duration: 0.28 },
        { freq: 659.25, time: 0.16, duration: 0.28 },
        { freq: 783.99, time: 0.32, duration: 0.35 },
        { freq: 1046.5, time: 0.50, duration: 0.65 },
      ];

      notes.forEach((note) => {
        if (!this.audioCtx) return;

        // Primary tone oscillator
        const osc = this.audioCtx.createOscillator();
        // Harmonics overtone oscillator for warm bell/marimba chime timbre
        const overtone = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(note.freq * 2, now + note.time);

        const startTime = now + note.time;
        const endTime = startTime + note.duration;

        // Gentle envelope: fast attack, exponential decay
        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.22, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

        osc.connect(gainNode);
        overtone.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        osc.start(startTime);
        overtone.start(startTime);

        osc.stop(endTime);
        overtone.stop(endTime);
      });
    } catch (e) {
      console.warn('Completion chime error:', e);
    }
  }

  /**
   * Start looping the notification chime continuously every 2.4 seconds
   */
  public start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.initContext();

    // Play immediately
    this.playChime();

    // Loop endlessly every 2.4 seconds
    this.intervalId = setInterval(() => {
      if (this.isPlaying) {
        this.playChime();
      }
    }, 2400);
  }

  /**
   * Stop the looping notification chime immediately
   */
  public stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const completionAudioAlert = new CompletionAudioAlert();
