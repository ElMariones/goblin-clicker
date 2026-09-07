import aglsUrl from './music/agls.mp3';
import ckgnUrl from './music/ckgn.mp3';
import clrsUrl from './music/clrs.mp3';
import lbdcUrl from './music/lbdc.mp3';
import lmdaUrl from './music/lmda.mp3';
import mrnoUrl from './music/mrno.mp3';
import plmsUrl from './music/plms.mp3';
import vmlaUrl from './music/vmla.mp3';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  src: string;
}

export const MUSIC_TRACKS: readonly MusicTrack[] = [
  { id: 'lmda', title: 'lmda', artist: 'elma', src: lmdaUrl },
  { id: 'clrs', title: 'clrs', artist: 'elma', src: clrsUrl },
  { id: 'vmla', title: 'vmla', artist: 'elma', src: vmlaUrl },
  { id: 'lbdc', title: 'lbdc', artist: 'elma', src: lbdcUrl },
  { id: 'ckgn', title: 'ckgn', artist: 'elma', src: ckgnUrl },
  { id: 'agls', title: 'agls', artist: 'elma', src: aglsUrl },
  { id: 'plms', title: 'plms', artist: 'elma', src: plmsUrl },
  { id: 'mrno', title: 'mrno', artist: 'elma', src: mrnoUrl },
];

function clampVolume(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

export class BackgroundMusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private index = 0;
  private volume = 0.32;
  private muted = false;
  private unlocked = false;
  private readonly onTrackChange?: (track: MusicTrack) => void;

  constructor(onTrackChange?: (track: MusicTrack) => void) {
    this.onTrackChange = onTrackChange;
  }

  private readonly unlock = () => {
    this.unlocked = true;
    this.removeUnlockListeners();
    void this.play();
  };

  private readonly onEnded = () => this.skip();

  mount() {
    if (typeof window === 'undefined' || typeof Audio === 'undefined' || this.audio) return;
    this.audio = new Audio(MUSIC_TRACKS[this.index].src);
    this.audio.preload = 'auto';
    this.audio.volume = this.volume;
    this.audio.muted = this.muted || this.volume === 0;
    this.audio.addEventListener('ended', this.onEnded);
    window.addEventListener('pointerdown', this.unlock, { capture: true });
    window.addEventListener('keydown', this.unlock, { capture: true });
  }

  setVolume(value: number) {
    this.volume = clampVolume(value);
    if (!this.audio) return;
    this.audio.volume = this.volume;
    this.audio.muted = this.muted || this.volume === 0;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.audio) this.audio.muted = muted || this.volume === 0;
  }

  skip() {
    this.index = (this.index + 1) % MUSIC_TRACKS.length;
    const track = MUSIC_TRACKS[this.index];
    this.onTrackChange?.(track);
    if (!this.audio) return;
    this.audio.src = track.src;
    this.audio.load();
    if (this.unlocked) void this.play();
  }

  destroy() {
    this.removeUnlockListeners();
    if (!this.audio) return;
    this.audio.removeEventListener('ended', this.onEnded);
    this.audio.pause();
    this.audio.src = '';
    this.audio = null;
  }

  private async play() {
    if (!this.audio) return;
    try {
      await this.audio.play();
    } catch {
      // Browsers can still reject playback until a trusted user gesture.
      // A later skip or page interaction will retry without surfacing an error.
    }
  }

  private removeUnlockListeners() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('pointerdown', this.unlock, { capture: true });
    window.removeEventListener('keydown', this.unlock, { capture: true });
  }
}
