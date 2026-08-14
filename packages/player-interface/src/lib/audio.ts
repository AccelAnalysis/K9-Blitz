import type { AudioCue } from "../model.js";

export interface AudioSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  effectsVolume?: number;
  musicVolume?: number;
}

export class GameAudioController {
  private effects = new Set<HTMLAudioElement>();
  private music: HTMLAudioElement | undefined;
  private cueUrls: Partial<Record<AudioCue, string>>;
  private musicUrl: string | undefined;

  constructor(cueUrls: Partial<Record<AudioCue, string>> = {}, musicUrl?: string) {
    this.cueUrls = cueUrls;
    this.musicUrl = musicUrl;
  }

  configure(cueUrls: Partial<Record<AudioCue, string>>, musicUrl?: string): void {
    this.stopAll();
    this.cueUrls = cueUrls;
    this.musicUrl = musicUrl;
  }

  playCue(cue: AudioCue, settings: AudioSettings): void {
    if (!settings.soundEnabled) return;
    const url = this.cueUrls[cue];
    if (!url) return;

    const audio = new Audio(url);
    audio.volume = clampVolume(settings.effectsVolume ?? 0.8);
    this.effects.add(audio);
    audio.addEventListener("ended", () => this.effects.delete(audio), { once: true });
    void audio.play().catch(() => this.effects.delete(audio));
  }

  syncMusic(settings: AudioSettings): void {
    if (!settings.musicEnabled || !this.musicUrl) {
      this.stopMusic();
      return;
    }

    if (!this.music) {
      this.music = new Audio(this.musicUrl);
      this.music.loop = true;
    }
    this.music.volume = clampVolume(settings.musicVolume ?? 0.35);
    void this.music.play().catch(() => undefined);
  }

  stopMusic(): void {
    if (!this.music) return;
    this.music.pause();
    this.music.currentTime = 0;
    this.music = undefined;
  }

  stopAll(): void {
    for (const effect of this.effects) {
      effect.pause();
      effect.currentTime = 0;
    }
    this.effects.clear();
    this.stopMusic();
  }
}

function clampVolume(volume: number): number {
  return Math.min(1, Math.max(0, volume));
}
