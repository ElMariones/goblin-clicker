import { describe, expect, it } from 'vitest';
import { BackgroundMusicPlayer, MUSIC_TRACKS } from './music';

describe('background soundtrack', () => {
  it('uses the eight requested elma track names in playlist order', () => {
    expect(MUSIC_TRACKS.map(({ title }) => title)).toEqual(['lmda', 'clrs', 'vmla', 'lbdc', 'ckgn', 'agls', 'plms', 'mrno']);
    expect(MUSIC_TRACKS.every(({ artist }) => artist === 'elma')).toBe(true);
  });

  it('announces every playlist advance and wraps around', () => {
    const announced: string[] = [];
    const player = new BackgroundMusicPlayer((track) => announced.push(track.title));
    for (let index = 0; index < MUSIC_TRACKS.length; index += 1) player.skip();
    expect(announced).toEqual(['clrs', 'vmla', 'lbdc', 'ckgn', 'agls', 'plms', 'mrno', 'lmda']);
  });
});
