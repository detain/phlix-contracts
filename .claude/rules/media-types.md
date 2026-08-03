---
description: MediaType / AnyMediaItem invariants for the media DTO module
globs:
  - src/media.ts
  - test/types.test.ts
alwaysApply: false
---

# Media type discriminants (`src/media.ts`)

- `MediaType` is the full `media_items.type` column ENUM in schema order — 13
  members: `movie`, `series`, `season`, `episode`, `track`, `music`, `album`,
  `artist`, `video`, `audio`, `book`, `photo`, `audiobook`. It MUST track the
  server migrations (001 → 011 → 034), `MediaItemShaper::VALID_TYPES`, and the
  `type` enum in `phlix-shared/schemas/media-item.schema.json` verbatim.
- The photo kind is `photo`, never `image`. `image` is a scanner-side label for a
  file-extension set and is never emitted on the wire — do not reintroduce it
  (drifted copies relabelled real photo/book/audiobook/track rows as `"movie"`,
  phlix-server#527).
- `AnyMediaItem` = `Movie | Series | Season | Episode | OtherMediaItem` and is
  total. `OtherMediaItem` derives its discriminant via
  `Exclude<MediaType, 'movie' | 'series' | 'season' | 'episode'>`, so a new
  `MediaType` member lands there automatically — keep it derived, don't list
  members by hand.
- A `switch (item.type)` over `AnyMediaItem` cannot use a `default` typed
  `never`; narrow `default` to `OtherMediaItem` and handle it.
- `MediaType` is re-exported by `phlix-ui` and `phlix-mobile-client` from here —
  changes to the union are cross-repo and need a version bump in
  `package.json`.
