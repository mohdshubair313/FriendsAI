"use client";

class SoundService {
  private static instance: SoundService;
  private audioContext: AudioContext | null = null;

  private constructor() {}

  public static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }

  private initContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
  }

  public playClick() {
    this.initContext();
    const osc = this.audioContext!.createOscillator();
    const gain = this.audioContext!.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, this.audioContext!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, this.audioContext!.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, this.audioContext!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.audioContext!.destination);

    osc.start();
    osc.stop(this.audioContext!.currentTime + 0.1);
  }

  public playWhoosh() {
    this.initContext();
    const osc = this.audioContext!.createOscillator();
    const gain = this.audioContext!.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(220, this.audioContext!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.audioContext!.currentTime + 0.2);

    gain.gain.setValueAtTime(0.05, this.audioContext!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.audioContext!.destination);

    osc.start();
    osc.stop(this.audioContext!.currentTime + 0.2);
  }
}

export const sounds = SoundService.getInstance();
