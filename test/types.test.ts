/**
 * types.test.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

import { describe, it, expect } from 'vitest';
import type {
  ContentRating,
  MediaItem,
  MediaItemUserData,
  MediaItemsResponse,
  PagedMediaItemsResponse,
  Library,
  LibrariesResponse,
  LibraryResponse,
  UserData,
  AnyMediaItem,
  Movie,
  Series,
  Season,
  Episode,
} from '../src/media';
import type { PlaybackInfo, StreamInfo } from '../src/playback';
import type { HeartbeatDto, ServerInfoDto } from '../src/hub';
import type { LibraryQuery, ServerSettings } from '../src/library';
import type { JwtClaims, AuthResult } from '../src/auth';

// Type-level smoke: these literals must satisfy the exported interfaces at
// compile time (the suite fails to typecheck if a field name/type drifts).
describe('type-level construction smoke', () => {
  it('constructs a full snake_case MediaItem with detail extras', () => {
    const item: MediaItem = {
      id: 'a1',
      name: 'Blade Runner',
      type: 'movie',
      sort_title: 'Blade Runner',
      parent_id: null,
      season_number: null,
      episode_number: null,
      episode_title: null,
      path: '/media/blade.mkv',
      poster_url: 'https://img/p.jpg',
      // SV-3.4: the server now emits a LOCAL artwork srcset (its own sized
      // variants served from /api/v1/artwork/{id}?size=…), not a TMDB CDN srcset.
      poster_srcset:
        '/api/v1/artwork/a1?size=w185 185w, /api/v1/artwork/a1?size=w342 342w, ' +
        '/api/v1/artwork/a1?size=w500 500w, /api/v1/artwork/a1?size=w780 780w',
      genres: ['Sci-Fi'],
      year: 1982,
      rating: 'R',
      runtime: 117,
      duration: 7020,
      overview: 'A blade runner.',
      actors: ['Harrison Ford'],
      director: 'Ridley Scott',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-02T00:00:00Z',
      cast: [{ name: 'Harrison Ford', role: 'Deckard', profile_url: null }],
      crew: [{ name: 'Ridley Scott', job: 'Director', profile_url: null }],
      production_companies: [{ name: 'Warner Bros.', logo_url: null, origin_country: 'US' }],
      studio: 'Warner Bros.',
      // Phase C detail-only extras.
      trailer_url: 'https://www.youtube.com/watch?v=abcd1234',
      trailer_key: 'abcd1234',
      trailer_site: 'YouTube',
      logo_url: '/api/v1/artwork/a1?size=logo',
      streams: [
        {
          id: 's1',
          media_item_id: 'a1',
          stream_index: 0,
          stream_type: 'video',
          codec: 'h264',
          language: null,
          bitrate: 8_000_000,
          width: 1920,
          height: 1080,
        },
      ],
      stream_url: '/media/a1/stream?exp=1&sig=x',
    };
    expect(item.id).toBe('a1');
    expect(item.actors).toEqual(['Harrison Ford']);
    expect(item.cast?.[0].role).toBe('Deckard');
    expect(item.sort_title).toBe('Blade Runner');
    expect(item.duration).toBe(7020);
    expect(item.poster_srcset).toContain('342w');
    // Local artwork route, not a TMDB CDN URL (SV-3.4).
    expect(item.poster_srcset).toContain('/api/v1/artwork/');
    // Phase C detail-only extras.
    expect(item.trailer_key).toBe('abcd1234');
    expect(item.trailer_site).toBe('YouTube');
    expect(item.logo_url).toContain('size=logo');
  });

  it('accepts both the film and TV content-rating scales (Phase C)', () => {
    // MPAA film scale PLUS the US TV Parental Guidelines scale. `NR` is
    // normalized to `UNRATED` server-side and is not part of the union.
    const ratings: ContentRating[] = [
      'G',
      'PG',
      'PG-13',
      'R',
      'NC-17',
      'X',
      'UNRATED',
      'TV-Y',
      'TV-Y7',
      'TV-G',
      'TV-PG',
      'TV-14',
      'TV-MA',
    ];
    const items: MediaItem[] = ratings.map((rating, i) => ({
      id: `r${i}`,
      name: `Item ${rating}`,
      type: 'movie',
      rating,
    }));
    expect(items).toHaveLength(13);
    expect(items.map((it) => it.rating)).toContain('TV-MA');
    expect(items.map((it) => it.rating)).toContain('UNRATED');
  });

  it('constructs an episode with a detail-only still_url (Phase C)', () => {
    const episode: Episode = {
      id: 'ep-still',
      name: 'Pilot',
      type: 'episode',
      season_number: 1,
      episode_number: 1,
      still_url: '/api/v1/artwork/ep-still?size=still',
    };
    expect(episode.still_url).toContain('size=still');

    // still_url is optional/nullable — absent or null are both valid.
    const noStill: Episode = {
      id: 'ep-nostill',
      name: 'No Still',
      type: 'episode',
      season_number: 1,
      episode_number: 2,
      still_url: null,
    };
    expect(noStill.still_url).toBeNull();
  });

  it('allows a poster_srcset/duration null when unprobed', () => {
    // Both are nullable per the shaper (non-TMDB poster / not yet probed).
    const item: MediaItem = {
      id: 'b2',
      name: 'Unprobed',
      type: 'movie',
      sort_title: 'Unprobed',
      poster_srcset: null,
      duration: null,
    };
    expect(item.poster_srcset).toBeNull();
    expect(item.duration).toBeNull();
  });

  it('constructs a detail item with a user_data block (B2)', () => {
    const ud: MediaItemUserData = { favorite: true, rating: 7 };
    const item: MediaItem = {
      id: 'd1',
      name: 'Favorited',
      type: 'movie',
      user_data: ud,
    };
    expect(item.user_data?.favorite).toBe(true);
    expect(item.user_data?.rating).toBe(7);
  });

  it('allows a null user_data when unauthenticated (B2)', () => {
    const item: MediaItem = {
      id: 'd2',
      name: 'Anon',
      type: 'movie',
      user_data: null,
    };
    expect(item.user_data).toBeNull();
  });

  it('constructs the library list/detail envelopes (B3)', () => {
    const list: LibrariesResponse = {
      libraries: [{ id: 'l1', name: 'Movies', type: 'movie', item_count: 3 }],
    };
    const detail: LibraryResponse = {
      // single-library detail omits item_count
      library: { id: 'l1', name: 'Movies', type: 'movie' },
    };
    expect(list.libraries[0].item_count).toBe(3);
    expect(detail.library.id).toBe('l1');
  });

  it('constructs a PagedMediaItemsResponse with required counters (B6)', () => {
    // /api/v1/media always carries total/limit/offset; a paged value also
    // satisfies the looser MediaItemsResponse base.
    const paged: PagedMediaItemsResponse = {
      items: [{ id: 'x', name: 'X', type: 'movie' }],
      total: 42,
      limit: 50,
      offset: 0,
    };
    const base: MediaItemsResponse = paged;
    // A bare { items } surface (getLibraryItems omits total) still satisfies the base.
    const bare: MediaItemsResponse = { items: [], limit: 50, offset: 0 };
    expect(paged.total).toBe(42);
    expect(base.items.length).toBe(1);
    expect(bare.total).toBeUndefined();
  });

  it('narrows AnyMediaItem exhaustively on the type discriminant (F4)', () => {
    // A function over the union that returns on each `type`. The `never`-typed
    // default branch makes the compiler enforce exhaustiveness: adding a member
    // to AnyMediaItem without a case here would be a typecheck error.
    function describeItem(item: AnyMediaItem): string {
      switch (item.type) {
        case 'movie': {
          const m: Movie = item;
          return `movie:${m.name}`;
        }
        case 'series': {
          const s: Series = item;
          return `series:${s.name}`;
        }
        case 'season': {
          const s: Season = item;
          // season_number is narrowed to number | null on Season.
          return `season:${s.season_number ?? '?'}`;
        }
        case 'episode': {
          const e: Episode = item;
          return `episode:S${e.season_number ?? '?'}E${e.episode_number ?? '?'}`;
        }
        default: {
          const _exhaustive: never = item;
          return _exhaustive;
        }
      }
    }

    const movie: Movie = { id: 'm1', name: 'Blade Runner', type: 'movie' };
    const series: Series = { id: 's1', name: 'Foundation', type: 'series' };
    const season: Season = { id: 'se1', name: 'Season 1', type: 'season', season_number: 1 };
    const episode: Episode = {
      id: 'ep1',
      name: 'Pilot',
      type: 'episode',
      season_number: 1,
      episode_number: 1,
    };

    expect(describeItem(movie)).toBe('movie:Blade Runner');
    expect(describeItem(series)).toBe('series:Foundation');
    expect(describeItem(season)).toBe('season:1');
    expect(describeItem(episode)).toBe('episode:S1E1');
  });

  it('AnyMediaItem members inherit MediaItem.user_data (F4 + B2)', () => {
    // Union members carry the merged base fields, including the detail-only
    // per-user block added in B2.
    const movie: AnyMediaItem = {
      id: 'm2',
      name: 'Favorited',
      type: 'movie',
      user_data: { favorite: true, rating: 9 },
    };
    expect(movie.user_data?.rating).toBe(9);
  });

  it('constructs the supporting REST shapes', () => {
    const resp: MediaItemsResponse = {
      items: [{ id: 'x', name: 'X', type: 'series' }],
      total: 1,
      limit: 50,
      offset: 0,
    };
    const lib: Library = { id: 'l1', name: 'Movies', type: 'movie', item_count: 3 };
    const ud: UserData = { resume_position_ticks: 600_000_000, played: false };
    const stream: StreamInfo = {
      url: 'http://s/x.mp4',
      protocol: 'http',
      container: 'mp4',
      size: 1,
      bitrate: 1,
      duration_seconds: 1,
    };
    expect(resp.items.length).toBe(1);
    expect(lib.type).toBe('movie');
    expect(ud.played).toBe(false);
    expect(stream.protocol).toBe('http');
  });

  it('constructs the marker PlaybackInfo with null markers', () => {
    const pb: PlaybackInfo = {
      item_id: 'a1',
      intro_marker: { start_seconds: 0, end_seconds: 30 },
      outro_marker: null,
      chapters: [
        { index: 0, startSeconds: 0, endSeconds: 600, title: 'Cold open' },
        { index: 1, startSeconds: 600, endSeconds: 1200, title: 'Main content' },
      ],
      skip_button_spec: {
        skip_intro_start: 0,
        skip_intro_end: 30,
        skip_outro_start: null,
        skip_outro_end: null,
      },
    };
    expect(pb.outro_marker).toBeNull();
    expect(pb.skip_button_spec.skip_intro_end).toBe(30);
    expect(pb.chapters?.[1]?.title).toBe('Main content');
  });

  it('constructs camelCase hub DTOs', () => {
    const hb: HeartbeatDto = {
      serverId: 's1',
      version: '0.1.0',
      timestamp: 1,
      uptimeSeconds: 1,
      activeSessions: 0,
      activeTranscodes: 0,
      hostnameCandidates: ['nas.local'],
      libraries: [{ library_id: 'l1', library_name: 'Movies' }],
    };
    const info: ServerInfoDto = {
      serverId: 's1',
      userId: 'u1',
      serverName: 'NAS',
      version: '0.1.0',
      lastSeenAt: null,
      status: 'online',
      hostnameCandidates: [],
      relayActive: false,
      libraryCount: null,
    };
    expect(hb.libraries[0].library_id).toBe('l1');
    expect(info.relayActive).toBe(false);
  });

  it('constructs query + settings + jwt + auth shapes', () => {
    const q: LibraryQuery = {
      search: 'foo',
      genres: ['Action'],
      yearFrom: 2000,
      ratings: ['PG-13'],
      companies: ['A24'],
      sort: 'year',
      order: 'desc',
      limit: 20,
      offset: 0,
      topLevel: true,
    };
    const s: ServerSettings = { 'auth.signup_mode': 'approval', 'hwaccel.enabled': true };
    const claims: JwtClaims = {
      iss: 'phlix',
      aud: 'client',
      sub: 'u1',
      iat: 1,
      exp: 2,
      type: 'access',
      scope: ['library:read'],
    };
    const auth: AuthResult = {
      token: 't',
      session_id: 'sess',
      user: { id: 'u1', name: 'Alice', email: 'a@b.c' },
    };
    expect(q.sort).toBe('year');
    expect(s['auth.signup_mode']).toBe('approval');
    expect(claims.scope).toContain('library:read');
    expect(auth.user.name).toBe('Alice');
  });
});
