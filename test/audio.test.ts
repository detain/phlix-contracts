/**
 * audio.test.
 *
 * Tests for pickDefaultAudio helper function.
 *
 * S404: the helper is typed against the playback-info WIRE `AudioTrack`
 * (StreamTrackShaper shape) — the fixtures below carry that full shape (an
 * honest fixture is a full server row, not a hand-trimmed one).
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

import { describe, it, expect } from 'vitest';
import { pickDefaultAudio } from '../src/Audio';
import type { AudioTrack } from '../src/playback';

/** Build a full wire-shaped AudioTrack (StreamTrackShaper::audioTracks row). */
function track(id: string, language: string, index = 0): AudioTrack {
  return {
    id,
    index,
    stream_index: index + 1,
    codec: 'aac',
    language,
    channels: 2,
    bitrate: 128000,
    title: null,
    default: index === 0,
  };
}

describe('pickDefaultAudio', () => {
  // ---- Positive tests (success cases) ----

  it('returns index of matching track when language matches preferred', () => {
    // Arrange
    const tracks: AudioTrack[] = [
      track('t1', 'en-US', 0),
      track('t2', 'es-ES', 1),
      track('t3', 'fr-FR', 2),
    ];

    // Act
    const result = pickDefaultAudio(tracks, ['en-US']);

    // Assert
    expect(result).toBe(0);
  });

  it('returns index of second track when first preferred language matches second track', () => {
    // Arrange
    const tracks: AudioTrack[] = [
      track('t1', 'fr-FR', 0),
      track('t2', 'de-DE', 1),
      track('t3', 'en-US', 2),
    ];

    // Act
    const result = pickDefaultAudio(tracks, ['de-DE']);

    // Assert
    expect(result).toBe(1);
  });

  it('returns index of first match when multiple preferred languages are tried in order', () => {
    // Arrange
    const tracks: AudioTrack[] = [
      track('t1', 'ja-JP', 0),
      track('t2', 'ko-KR', 1),
      track('t3', 'zh-CN', 2),
    ];

    // Act - tries en-US first (not found), then ja-JP (found at index 0)
    const result = pickDefaultAudio(tracks, ['en-US', 'ja-JP']);

    // Assert
    expect(result).toBe(0);
  });

  it('handles BCP47 primary language tag extraction (en-US matches en)', () => {
    // Arrange
    const tracks: AudioTrack[] = [
      track('t1', 'en', 0),
      track('t2', 'es', 1),
    ];

    // Act - passing 'en-US' should match track with language 'en'
    const result = pickDefaultAudio(tracks, ['en-US']);

    // Assert
    expect(result).toBe(0);
  });

  it('handles case-insensitive language matching', () => {
    // Arrange
    const tracks: AudioTrack[] = [
      track('t1', 'EN-US', 0),
      track('t2', 'ES-ES', 1),
    ];

    // Act
    const result = pickDefaultAudio(tracks, ['en-us']);

    // Assert
    expect(result).toBe(0);
  });

  // ---- Negative tests (failure/edge cases) ----

  it('returns 0 when tracks array is empty', () => {
    // Arrange
    const tracks: AudioTrack[] = [];

    // Act
    const result = pickDefaultAudio(tracks, ['en-US']);

    // Assert
    expect(result).toBe(0);
  });

  it('returns 0 when preferredLanguages array is empty', () => {
    // Arrange
    const tracks: AudioTrack[] = [
      track('t1', 'en-US'),
    ];

    // Act
    const result = pickDefaultAudio(tracks, []);

    // Assert
    expect(result).toBe(0);
  });

  it('returns 0 when no track language matches any preferred language', () => {
    // Arrange
    const tracks: AudioTrack[] = [
      track('t1', 'fr-FR', 0),
      track('t2', 'de-DE', 1),
    ];

    // Act
    const result = pickDefaultAudio(tracks, ['en-US', 'ja-JP']);

    // Assert
    expect(result).toBe(0);
  });

  it('skips a track whose language is runtime-null (typed `string`, but JS can lie)', () => {
    // Arrange - track with undefined language (the server coerces 'und', so
    // this state is off-contract; the helper must not crash on it).
    const holes = track('t1', 'und', 0);
    delete (holes as Partial<AudioTrack>).language;
    const tracks: AudioTrack[] = [holes, track('t2', 'en-US', 1)];

    // Act
    const result = pickDefaultAudio(tracks, ['en-US']);

    // Assert - should find 'en-US' at index 1, not 0
    expect(result).toBe(1);
  });

  it('handles tracks with null language gracefully (skips to next)', () => {
    // Arrange
    const tracks: AudioTrack[] = [
      { ...track('t1', 'und', 0), language: null as unknown as string },
      track('t2', 'en-US', 1),
    ];

    // Act
    const result = pickDefaultAudio(tracks, ['en-US']);

    // Assert
    expect(result).toBe(1);
  });
});
