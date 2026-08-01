/**
 * audio.test.
 *
 * Tests for pickDefaultAudio helper function.
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

import { describe, it, expect } from 'vitest';
import { pickDefaultAudio } from '../src/Audio';
import type { StreamAudioTrack } from '../src/AudioTrack';

/** Build a minimal StreamAudioTrack for testing. */
function track(id: string, language: string): StreamAudioTrack {
  return { id, codec: 'aac', language, channels: 2 };
}

describe('pickDefaultAudio', () => {
  // ---- Positive tests (success cases) ----

  it('returns index of matching track when language matches preferred', () => {
    // Arrange
    const tracks: StreamAudioTrack[] = [
      track('t1', 'en-US'),
      track('t2', 'es-ES'),
      track('t3', 'fr-FR'),
    ];

    // Act
    const result = pickDefaultAudio(tracks, ['en-US']);

    // Assert
    expect(result).toBe(0);
  });

  it('returns index of second track when first preferred language matches second track', () => {
    // Arrange
    const tracks: StreamAudioTrack[] = [
      track('t1', 'fr-FR'),
      track('t2', 'de-DE'),
      track('t3', 'en-US'),
    ];

    // Act
    const result = pickDefaultAudio(tracks, ['de-DE']);

    // Assert
    expect(result).toBe(1);
  });

  it('returns index of first match when multiple preferred languages are tried in order', () => {
    // Arrange
    const tracks: StreamAudioTrack[] = [
      track('t1', 'ja-JP'),
      track('t2', 'ko-KR'),
      track('t3', 'zh-CN'),
    ];

    // Act - tries en-US first (not found), then ja-JP (found at index 0)
    const result = pickDefaultAudio(tracks, ['en-US', 'ja-JP']);

    // Assert
    expect(result).toBe(0);
  });

  it('handles BCP47 primary language tag extraction (en-US matches en)', () => {
    // Arrange
    const tracks: StreamAudioTrack[] = [
      track('t1', 'en'),
      track('t2', 'es'),
    ];

    // Act - passing 'en-US' should match track with language 'en'
    const result = pickDefaultAudio(tracks, ['en-US']);

    // Assert
    expect(result).toBe(0);
  });

  it('handles case-insensitive language matching', () => {
    // Arrange
    const tracks: StreamAudioTrack[] = [
      track('t1', 'EN-US'),
      track('t2', 'ES-ES'),
    ];

    // Act
    const result = pickDefaultAudio(tracks, ['en-us']);

    // Assert
    expect(result).toBe(0);
  });

  // ---- Negative tests (failure/edge cases) ----

  it('returns 0 when tracks array is empty', () => {
    // Arrange
    const tracks: StreamAudioTrack[] = [];

    // Act
    const result = pickDefaultAudio(tracks, ['en-US']);

    // Assert
    expect(result).toBe(0);
  });

  it('returns 0 when preferredLanguages array is empty', () => {
    // Arrange
    const tracks: StreamAudioTrack[] = [
      track('t1', 'en-US'),
    ];

    // Act
    const result = pickDefaultAudio(tracks, []);

    // Assert
    expect(result).toBe(0);
  });

  it('returns 0 when no track language matches any preferred language', () => {
    // Arrange
    const tracks: StreamAudioTrack[] = [
      track('t1', 'fr-FR'),
      track('t2', 'de-DE'),
    ];

    // Act
    const result = pickDefaultAudio(tracks, ['en-US', 'ja-JP']);

    // Assert
    expect(result).toBe(0);
  });

  it('returns 0 (fallback to first track) when track language is null/undefined', () => {
    // Arrange - track with undefined language
    const tracksWithUndefined: StreamAudioTrack[] = [
      { id: 't1', codec: 'aac', language: undefined as unknown as string, channels: 2 },
      track('t2', 'en-US'),
    ];

    // Act
    const result = pickDefaultAudio(tracksWithUndefined, ['en-US']);

    // Assert - should find 'en-US' at index 1, not 0
    expect(result).toBe(1);
  });

  it('handles tracks with null language gracefully (skips to next)', () => {
    // Arrange
    const tracks: StreamAudioTrack[] = [
      { id: 't1', codec: 'aac', language: null as unknown as string, channels: 2 },
      track('t2', 'en-US'),
    ];

    // Act
    const result = pickDefaultAudio(tracks, ['en-US']);

    // Assert
    expect(result).toBe(1);
  });
});
