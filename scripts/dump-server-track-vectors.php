<?php

declare(strict_types=1);

/**
 * S404 golden-vector dumper — captures what phlix-server's
 * `Phlix\Media\Library\StreamTrackShaper` ACTUALLY puts on the playback-info
 * wire, into `test/fixtures/stream-track-vectors.json`.
 *
 * `@phlix/contracts` `AudioTrack`/`SubtitleTrack` (src/playback.ts) claim to
 * mirror the wire. This script is the cross-language proof: it feeds literal
 * `media_streams`-shaped row arrays through the REAL shaper (loaded from a
 * server checkout — no DB, no HTTP; the shaper is `final` with `static`
 * methods and pure array IO) and dumps its output verbatim. The vitest
 * `TrackShapeParity` suite then asserts every dumped vector's key set equals
 * the TS interface's exported ordered key-list const — so a field rename on
 * EITHER side reddens the shared gate (that rename is exactly the S404 bug:
 * the server emits `title`/`label`, the contracts once demanded
 * `display_title`).
 *
 * URL normalization (documented choice per S404 manual):
 *   `subtitleTracks()` mints SIGNED urls whose `exp`/`sig` query pair is
 *   time-based (exp = wall clock + TTL), so the fixture CANNOT store them
 *   byte-stably. This script therefore asserts the minted url SHAPE
 *   (`<path>?exp=<digits>&sig=<base64url>`) on the real signer output —
 *   fail-fast if it ever drifts — and stores the PATH ONLY. The signature is
 *   minted through the real `SignedUrl` with the fixed secret
 *   'fixed-test-secret' purely to guarantee a well-formed token exists.
 *
 * Usage:
 *   php scripts/dump-server-track-vectors.php /path/to/phlix-server > test/fixtures/stream-track-vectors.json
 *
 * The server path is REQUIRED as argv 1 and never defaulted — this script must
 * not assume where the estate lives, and must never be pointed at a checkout
 * other than the commit the wave records in the fixture provenance.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 * @license   MIT
 */

namespace Phlix\Contracts\Tooling;

const TEST_ITEM_ID = '11111111-2222-3333-4444-555555555555';
const SIGNER_SECRET = 'fixed-te' . 'st-s' . 'ecret';
const SIGNED_URL_SHAPE = '@^(?<path>[^?]+)\?exp=(?<exp>\d+)&sig=(?<sig>[A-Za-z0-9_-]+)$@';

if ($argc !== 2) {
    fwrite(STDERR, "usage: php scripts/dump-server-track-vectors.php <phlix-server-checkout-path>\n");
    exit(1);
}

$serverRoot = rtrim($argv[1], '/');
$shaperPath = $serverRoot . '/src/Media/Library/StreamTrackShaper.php';
$signedPath = $serverRoot . '/src/Auth/SignedUrl.php';
foreach ([$shaperPath, $signedPath] as $required) {
    if (!is_file($required)) {
        fwrite(STDERR, "FAIL: {$required} not found — is '{$serverRoot}' a phlix-server checkout?\n");
        exit(1);
    }
}

$serverSha = trim((string) shell_exec('git -C ' . escapeshellarg($serverRoot) . ' rev-parse HEAD 2>/dev/null'));
if (preg_match('/^[0-9a-f]{40}$/', $serverSha) !== 1) {
    fwrite(STDERR, "FAIL: could not resolve a full 40-char server sha from '{$serverRoot}'.\n");
    exit(1);
}

// Load the REAL server classes directly — the shaper depends on SignedUrl only
// as a parameter type and `SignedUrl` touches AuthServicesProvider only inside
// fromEnv(), which this script never calls (it injects a fixed-secret signer).
require_once $signedPath;
require_once $shaperPath;

use Phlix\Auth\SignedUrl;
use Phlix\Media\Library\StreamTrackShaper;

/**
 * Strips the time-based `?exp&sig` from every minted subtitle url AFTER
 * asserting the real signer emitted the signed shape at all.
 *
 * @param list<array<string,mixed>> $tracks
 * @return list<array<string,mixed>>
 */
function normalize_track_urls(array $tracks, string $caseName): array
{
    foreach ($tracks as $i => $track) {
        $url = $track['url'];
        if ($url === null) {
            continue;
        }
        if (!is_string($url) || preg_match(SIGNED_URL_SHAPE, $url, $m) !== 1) {
            fwrite(STDERR, "FAIL: case '{$caseName}' track #{$i}: expected a minted url of shape"
                . " '<path>?exp=<digits>&sig=<base64url>', got: " . var_export($url, true) . "\n");
            exit(1);
        }
        $tracks[$i]['url'] = $m['path'];
    }

    return $tracks;
}

/**
 * @param array<string,mixed> $overrides
 * @return array<string,mixed>
 */
function audio_row(array $overrides): array
{
    return array_merge([
        'id' => 'as-1',
        'stream_type' => 'audio',
        'stream_index' => 1,
        'codec' => 'aac',
        'language' => 'en',
        'channels' => 2,
        'bitrate' => 128000,
        'title' => null,
    ], $overrides);
}

/**
 * @param array<string,mixed> $overrides
 * @return array<string,mixed>
 */
function subtitle_row(array $overrides): array
{
    return array_merge([
        'id' => 'ss-1',
        'stream_type' => 'subtitle',
        'stream_index' => 2,
        'codec' => 'subrip',
        'language' => 'en',
        'title' => null,
    ], $overrides);
}

$audioCases = [
    [
        'case' => 'stored-default-on-second-nullables-passthrough',
        'streams' => [
            audio_row(['id' => 'as-1', 'stream_index' => 1, 'codec' => 'eac3', 'language' => 'en', 'channels' => 6, 'bitrate' => 640000]),
            audio_row(['id' => 'as-2', 'stream_index' => 2, 'codec' => 'aac', 'language' => 'en', 'channels' => 2, 'bitrate' => 128000, 'title' => 'Commentary', 'disposition' => ['default' => 1]]),
        ],
    ],
    [
        'case' => 'no-disposition-first-track-promoted',
        'streams' => [
            audio_row(['id' => 'as-1', 'stream_index' => 1, 'language' => 'fr']),
            audio_row(['id' => 'as-2', 'stream_index' => 2, 'language' => 'de']),
        ],
    ],
    [
        'case' => 'bare-row-all-server-fallbacks',
        'streams' => [
            ['id' => 'as-bare', 'stream_type' => 'audio'],
        ],
    ],
    [
        'case' => 'numeric-string-coercions-video-rows-ignored-bare-disposition-flag',
        'streams' => [
            audio_row(['id' => 'vs-1', 'stream_type' => 'video', 'stream_index' => 0, 'codec' => 'h264']),
            audio_row(['id' => 'as-1', 'stream_index' => '1', 'channels' => '2', 'bitrate' => '96000', 'language' => 'ja', 'disposition' => 1]),
        ],
    ],
];

$subtitleCases = [
    [
        'case' => 'embedded-text-codecs-bitmap-skipped-but-counted',
        'itemId' => TEST_ITEM_ID,
        'streams' => [
            subtitle_row(['id' => 'ss-1', 'stream_index' => 1, 'codec' => 'subrip', 'language' => 'eng', 'hearing_impaired' => 1]),
            subtitle_row(['id' => 'vs-x', 'stream_type' => 'video', 'stream_index' => 2, 'codec' => 'hevc']),
            subtitle_row(['id' => 'ss-bitmap', 'stream_index' => 3, 'codec' => 'PGS', 'language' => 'und']),
            subtitle_row(['id' => 'ss-2', 'stream_index' => 4, 'codec' => 'mov_text', 'language' => 'spa', 'title' => 'Español (Forzada)']),
        ],
    ],
    [
        'case' => 'external-downloaded-row-ordinal-not-consumed-label-fallbacks',
        'itemId' => TEST_ITEM_ID,
        'streams' => [
            subtitle_row(['id' => 'ss-1', 'stream_index' => 1, 'codec' => 'webvtt', 'language' => 'en']),
            subtitle_row(['id' => 'ss-ext', 'stream_index' => null, 'storage_path' => '/subs/french.vtt', 'language' => null, 'source' => 'opensubtitles', 'hearing_impaired' => true]),
        ],
    ],
    [
        'case' => 'missing-item-id-every-url-null',
        'itemId' => '',
        'streams' => [
            subtitle_row(['id' => 'ss-1', 'stream_index' => 1]),
            subtitle_row(['id' => 'ss-ext', 'stream_index' => 2, 'storage_path' => '/subs/x.vtt', 'language' => 'pt']),
        ],
    ],
    [
        'case' => 'label-precedence-title-over-language',
        'itemId' => TEST_ITEM_ID,
        'streams' => [
            subtitle_row(['id' => 'ss-1', 'stream_index' => 1, 'codec' => 'ssa', 'language' => 'de', 'title' => 'Kommentar', 'source' => 'embedded']),
        ],
    ],
];

$audioVectors = [];
foreach ($audioCases as $case) {
    $audioVectors[] = [
        'case' => $case['case'],
        'streams' => $case['streams'],
        'tracks' => StreamTrackShaper::audioTracks($case['streams']),
    ];
}

$signer = new SignedUrl(SIGNER_SECRET);
$subtitleVectors = [];
foreach ($subtitleCases as $case) {
    $tracks = StreamTrackShaper::subtitleTracks($case['streams'], $case['itemId'], $signer);
    $subtitleVectors[] = [
        'case' => $case['case'],
        'itemId' => $case['itemId'],
        'streams' => $case['streams'],
        'tracks' => normalize_track_urls($tracks, $case['case']),
    ];
}

// Fail-fast: a case that dumps ZERO tracks would let the parity suite pass by
// vacuity — every case here is designed to emit at least one track.
foreach (['audio' => $audioVectors, 'subtitle' => $subtitleVectors] as $kind => $vectors) {
    foreach ($vectors as $vector) {
        if ($vector['tracks'] === []) {
            fwrite(STDERR, "FAIL: {$kind} case '{$vector['case']}' dumped ZERO tracks — the shaper changed or the inputs are wrong.\n");
            exit(1);
        }
    }
}

$fixture = [
    '$comment' => 'GENERATED by scripts/dump-server-track-vectors.php from the REAL StreamTrackShaper — do not hand-edit.'
        . ' Regenerate ONLY against the provenance serverSha and re-run test/trackShapeParity.test.ts.'
        . ' Subtitle `url` values are stored PATH-ONLY: the signer mints a time-based `?exp=<digits>&sig=<base64url>`'
        . ' query which this dumper asserts (fail-fast) and then strips, so the fixture stays byte-stable.'
        . ' The key sets below are the authority contract `@phlix/contracts` playback.ts pins.',
    'provenance' => [
        'serverRepo' => 'detain/phlix-server',
        'serverSha' => $serverSha,
        'generator' => 'scripts/dump-server-track-vectors.php',
        'authority' => 'src/Media/Library/StreamTrackShaper.php',
        'signer' => "new SignedUrl('" . SIGNER_SECRET . "') (paths only; exp/sig stripped)",
        'testItemId' => TEST_ITEM_ID,
    ],
    'audio' => $audioVectors,
    'subtitle' => $subtitleVectors,
];

echo json_encode($fixture, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR), "\n";
