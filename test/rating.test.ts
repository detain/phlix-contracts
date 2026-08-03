/**
 * rating.test.
 *
 * Tests for pickDisplayRating helper function.
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

import { describe, it, expect } from 'vitest';
import { pickDisplayRating, type MediaItemRatingSource } from '../src/Rating';

describe('pickDisplayRating', () => {
  // ---- Positive tests (success cases) ----

  it('returns rating_score when present and not null', () => {
    // Arrange
    const item: MediaItemRatingSource = {
      rating_score: 7.5,
      metadata_json: null,
    };

    // Act
    const result = pickDisplayRating(item);

    // Assert
    expect(result).toBe(7.5);
  });

  it('returns numeric metadata_json.rating when rating_score is absent (undefined)', () => {
    // Arrange
    const item: MediaItemRatingSource = {
      metadata_json: { rating: 6.5 },
    };

    // Act
    const result = pickDisplayRating(item);

    // Assert
    expect(result).toBe(6.5);
  });

  it('returns rating_score even when metadata_json is also present', () => {
    // Arrange - rating_score takes precedence over metadata_json.rating
    const item: MediaItemRatingSource = {
      rating_score: 8.0,
      metadata_json: { rating: 6.5 },
    };

    // Act
    const result = pickDisplayRating(item);

    // Assert
    expect(result).toBe(8.0); // rating_score wins
  });

  it('returns numeric metadata_json.rating when rating_score is null', () => {
    // Arrange - null rating_score should fall through to metadata_json
    const item: MediaItemRatingSource = {
      rating_score: null,
      metadata_json: { rating: 5.5 },
    };

    // Act
    const result = pickDisplayRating(item);

    // Assert
    expect(result).toBe(5.5);
  });

  it('handles integer rating_score correctly', () => {
    // Arrange
    const item: MediaItemRatingSource = {
      rating_score: 8,
    };

    // Act
    const result = pickDisplayRating(item);

    // Assert
    expect(result).toBe(8);
  });

  it('handles integer metadata_json.rating correctly', () => {
    // Arrange
    const item: MediaItemRatingSource = {
      metadata_json: { rating: 7 },
    };

    // Act
    const result = pickDisplayRating(item);

    // Assert
    expect(result).toBe(7);
  });

  // ---- Negative tests (failure/edge cases) ----

  it('returns null when rating_score is null and metadata_json.rating is a string (MPAA content rating)', () => {
    // Arrange - MPAA content ratings like 'PG-13', 'R' are strings, not numeric
    const item: MediaItemRatingSource = {
      rating_score: null,
      metadata_json: { rating: 'PG-13' },
    };

    // Act
    const result = pickDisplayRating(item);

    // Assert
    expect(result).toBeNull();
  });

  it('returns null when both rating_score and metadata_json are null', () => {
    // Arrange
    const item: MediaItemRatingSource = {
      rating_score: null,
      metadata_json: null,
    };

    // Act
    const result = pickDisplayRating(item);

    // Assert
    expect(result).toBeNull();
  });

  it('returns null when rating_score is undefined and metadata_json is undefined', () => {
    // Arrange
    const item: MediaItemRatingSource = {
      // rating_score omitted
      // metadata_json omitted
    };

    // Act
    const result = pickDisplayRating(item);

    // Assert
    expect(result).toBeNull();
  });

  it('returns null when metadata_json.rating is a string content rating even if rating_score is absent', () => {
    // Arrange
    const item: MediaItemRatingSource = {
      metadata_json: { rating: 'R' },
    };

    // Act
    const result = pickDisplayRating(item);

    // Assert
    expect(result).toBeNull();
  });

  it('returns null when metadata_json.rating is null', () => {
    // Arrange
    const item: MediaItemRatingSource = {
      metadata_json: { rating: null },
    };

    // Act
    const result = pickDisplayRating(item);

    // Assert
    expect(result).toBeNull();
  });

  it('skips non-numeric values in metadata_json.rating (e.g. boolean)', () => {
    // Arrange — deliberately pass a boolean to verify it is rejected at runtime.
    // Use `as unknown as` because the type intentionally excludes boolean; the
    // function itself handles this via `typeof legacy === "number"`.
    const item = {
      metadata_json: { rating: true },
    } as unknown as MediaItemRatingSource;

    // Act
    const result = pickDisplayRating(item);

    // Assert
    expect(result).toBeNull();
  });
});
