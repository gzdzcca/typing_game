import { Howl, Howler } from "howler";

const BGM_TRACKS = ["/audio/bgm-1.mp3", "/audio/bgm-2.mp3", "/audio/bgm-3.mp3"];

const SFX_FILES = {
  correct: "/audio/se-correct.mp3",
  wrong: "/audio/se-wrong.mp3",
  complete: "/audio/se-complete.mp3",
};

class MusicManager {
  private bgm: Howl | null = null;
  private currentTrack = 0;
  private sfx: Record<string, Howl> = {};
  private _isPlaying = false;
  private _volume = 0.5;
  private initialized = false;

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Pre-load sound effects
    Object.entries(SFX_FILES).forEach(([key, src]) => {
      this.sfx[key] = new Howl({
        src: [src],
        volume: 0.6,
        preload: true,
      });
    });
  }

  private loadTrack(index: number): Howl {
    return new Howl({
      src: [BGM_TRACKS[index]],
      loop: true,
      volume: 0,
      onend: () => {
        // Auto-advance to next track (in case loop fails)
        this.nextTrack();
      },
    });
  }

  play() {
    this.init();
    if (this.bgm) {
      this.bgm.stop();
    }
    this.bgm = this.loadTrack(this.currentTrack);
    this.bgm.play();
    this.bgm.fade(0, this._volume, 1000);
    this._isPlaying = true;
  }

  pause() {
    if (this.bgm && this._isPlaying) {
      this.bgm.fade(this._volume, 0, 500);
      setTimeout(() => {
        this.bgm?.pause();
      }, 500);
      this._isPlaying = false;
    }
  }

  toggle(): boolean {
    if (this._isPlaying) {
      this.pause();
    } else {
      this.play();
    }
    return this._isPlaying;
  }

  nextTrack() {
    this.currentTrack = (this.currentTrack + 1) % BGM_TRACKS.length;
    if (this._isPlaying) {
      this.play();
    }
  }

  setVolume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.bgm) {
      this.bgm.volume(this._volume);
    }
  }

  get isPlaying() {
    return this._isPlaying;
  }

  get volume() {
    return this._volume;
  }

  // Sound effects
  playCorrect() {
    this.init();
    this.sfx.correct?.play();
  }

  playWrong() {
    this.init();
    this.sfx.wrong?.play();
  }

  playCelebration() {
    this.init();
    this.sfx.complete?.play();
  }

  // Unlock audio context (needed for iOS)
  unlock() {
    Howler.ctx?.resume();
  }
}

// Singleton
let instance: MusicManager | null = null;

export function getMusicManager(): MusicManager {
  if (!instance) {
    instance = new MusicManager();
  }
  return instance;
}
