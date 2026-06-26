import { describe, it, expect } from 'vitest';
import type {
  MediaItem,
  MediaItemsResponse,
  Library,
  UserData,
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
      poster_srcset: 'https://img/p_w342.jpg 342w, https://img/p_w500.jpg 500w',
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
        { start_seconds: 0, end_seconds: 600, title: 'Cold open' },
        // `title` key is always present but may be null (server emits it verbatim).
        { start_seconds: 600, end_seconds: 1200, title: null },
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
    expect(pb.chapters[1].title).toBeNull();
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
