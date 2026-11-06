<?php

declare(strict_types=1);

/**
 * LW-069 golden-vector dumper — captures what phlix-server ACTUALLY puts on the
 * `GET /api/v1/media/{id}/playback-info` wire into
 * `test/fixtures/playback-info-vectors.json`.
 *
 * `@phlix/contracts` `PlaybackInfo` (src/playback.ts) claimed a shape the
 * server never emitted (camelCase chapters with an `index`, a `trickplay`
 * member, an optional `quality_ladder`) — estate review contracts__srphp #1
 * [Critical]. Like S404/S415 before it, this script is the cross-language
 * proof: it drives the REAL `Phlix\Server\Http\Controllers\MediaItemController`
 * — with the REAL `MarkerService`, `StreamTrackShaper` (through the controller
 * path), `GaplessPlaybackManager` and `AbrLadder` — reading a REAL MySQL
 * scratch database migrated by the server's OWN `MigrationRunner`. Every
 * vector below is EMITTED bytes decoded from a real `Response` body; only the
 * seed rows and Request objects are hand-built inputs (S345 law: nothing in a
 * fixture is hand-crafted output).
 *
 * URL normalization (same documented choice as the S404 track leg):
 *   `subtitleTracks()` mints SIGNED urls whose `exp`/`sig` pair is time-based,
 *   so the fixture CANNOT store them byte-stably. This script asserts the
 *   minted url SHAPE (`<path>?exp=<digits>&sig=<base64url>`) on the real
 *   signer output — fail-fast if it drifts — and stores the PATH ONLY. The
 *   quality-ladder preview never signs anything (`url` stays null), so no
 *   other value needs normalization.
 *
 * Environment (all REQUIRED):
 *   PHLIX_VEC_MYSQL_HOST   e.g. 127.0.0.1
 *   PHLIX_VEC_MYSQL_PORT   e.g. 3306
 *   PHLIX_VEC_MYSQL_USER
 *   PHLIX_VEC_MYSQL_PASSWORD
 *
 * Usage:
 *   php scripts/dump-server-playback-info-vectors.php /path/to/phlix-server \
 *       > test/fixtures/playback-info-vectors.json
 *
 * The server path is REQUIRED as argv 1 and never defaulted; the checkout MUST
 * sit at the authority sha below (the script refuses drift — the same manual
 * re-verification discipline the S415 leg enforces). The scratch database is
 * DROPped/CREATEd by this script and migrated in-process through the server's
 * own MigrationRunner — point it at a throwaway MySQL endpoint, never at
 * estate data.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 * @license   MIT
 */

namespace Phlix\Contracts\Tooling;

const SCRATCH_DB = 'phlix_playback_info_vectors';
const AUTHORITY_SHA = 'a63dc0db72d67beed7e1e9b7824cfec6b5ac80d0';
const SIGNER_SECRET = 'fixed-te' . 'st-s' . 'ecret';
const SIGNED_URL_SHAPE = '@^(?<path>[^?]+)\?exp=(?<exp>\d+)&sig=(?<sig>[A-Za-z0-9_-]+)$@';

const LIBRARY_ID = 'aaaaaaaa-0000-4000-8000-000000000001';
const RICH_ITEM_ID = 'bbbbbbbb-0000-4000-8000-000000000001';
const BARE_ITEM_ID = 'bbbbbbbb-0000-4000-8000-000000000002';

if ($argc !== 2) {
    fwrite(STDERR, "usage: php scripts/dump-server-playback-info-vectors.php <phlix-server-checkout-path>\n");
    exit(1);
}

$serverRoot = rtrim($argv[1], '/');
$autoload = $serverRoot . '/vendor/autoload.php';
if (!is_file($autoload)) {
    fwrite(STDERR, "FAIL: {$autoload} not found — run composer install in the server checkout first.\n");
    exit(1);
}

$serverSha = trim((string) shell_exec('git -C ' . escapeshellarg($serverRoot) . ' rev-parse HEAD 2>/dev/null'));
if ($serverSha !== AUTHORITY_SHA) {
    fwrite(STDERR, "FAIL: server checkout is '" . var_export($serverSha, true) . "' but the LW-069 dump authority is " . AUTHORITY_SHA . ".\n");
    fwrite(STDERR, "Re-verify the ruling (the real getPlaybackInfo() emission) at the new commit BEFORE regenerating this fixture.\n");
    exit(1);
}

require_once $autoload;

foreach (['PHLIX_VEC_MYSQL_HOST', 'PHLIX_VEC_MYSQL_PORT', 'PHLIX_VEC_MYSQL_USER', 'PHLIX_VEC_MYSQL_PASSWORD'] as $var) {
    if (getenv($var) === false) {
        fwrite(STDERR, "FAIL: {$var} is not set — see the script header. No partial fixtures.\n");
        exit(1);
    }
}

$host = (string) getenv('PHLIX_VEC_MYSQL_HOST');
$port = (string) getenv('PHLIX_VEC_MYSQL_PORT');
$user = (string) getenv('PHLIX_VEC_MYSQL_USER');
$pass = (string) getenv('PHLIX_VEC_MYSQL_PASSWORD');

$assert = static function (bool $cond, string $msg): void {
    if (!$cond) {
        fwrite(STDERR, "FAIL: {$msg}\n");
        exit(1);
    }
};

// --- Scratch schema through the server's OWN MigrationRunner (S159-faithful
// --- apply semantics), driven by PDO only for the DROP/CREATE admin duty.
try {
    $pdo = new \PDO("mysql:host={$host};port={$port}", $user, $pass, [
        \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
    ]);
} catch (\PDOException $e) {
    fwrite(STDERR, 'FAIL: cannot reach MySQL at ' . $host . ':' . $port . ' — ' . $e->getMessage() . "\n");
    exit(1);
}
$pdo->exec('DROP DATABASE IF EXISTS `' . SCRATCH_DB . '`');
$pdo->exec('CREATE DATABASE `' . SCRATCH_DB . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

// The server config reads these; the process is a one-shot CLI dumper, so
// pointing the pool at the scratch database via env is the server's OWN
// supported configuration path (no config file is edited, ever).
putenv('DB_HOST=' . $host);
putenv('DB_PORT=' . $port);
putenv('DB_DATABASE=' . SCRATCH_DB);
putenv('DB_USER=' . $user);
putenv('DB_PASSWORD=' . $pass);
putenv('DB_POOL_ENABLED=0');
putenv('PHLIX_SIGNED_URL_SECRET=' . SIGNER_SECRET);

\Phlix\Common\Database\ConnectionPool::init($serverRoot . '/config/database.php');
$runner = new \Phlix\Common\Database\MigrationRunner(
    static fn(): \Workerman\MySQL\Connection => \Phlix\Common\Database\ConnectionPool::getConnection('mysql'),
    $serverRoot . '/migrations'
);
$run = $runner->run();
$assert(
    \Phlix\Common\Database\MigrationRunner::exitCodeFor($run) === 0,
    'server MigrationRunner reported non-idempotent failures: ' . json_encode($run['failed'] ?? [])
);

$db = \Phlix\Common\Database\ConnectionPool::getConnection('mysql');

// --- Seed rows (INPUT literals — deterministic so regenerations at the same
// --- authority sha are byte-identical).
$pdo->exec('USE `' . SCRATCH_DB . '`');
$pdo->exec(sprintf(
    "INSERT INTO libraries (id, name, type, paths, display_order) VALUES ('%s', 'Vector Library', 'movie', %s, 0)",
    LIBRARY_ID,
    $pdo->quote('["/srv/phlix-vectors"]')
));

// Rich item: formal intro/outro columns + two chapters + a full source blob so
// the ABR ladder preview builds, plus 2 audio rows (one stored-default),
// 1 text subtitle and 1 bitmap subtitle (which must be SKIPPED-BUT-COUNTED),
// and one external .vtt row (different endpoint arm). streams_probed_at is
// stamped so the lazy StreamProbeBackfill performs ZERO ffprobe I/O.
$pdo->exec(sprintf(
    "INSERT INTO media_items (id, library_id, name, type, path, metadata_json,
        intro_start_seconds, intro_end_seconds, outro_start_seconds, outro_end_seconds,
        chapters_json, streams_probed_at, rating_votes)
     VALUES ('%s', '%s', 'Vector Feature', 'movie', '/srv/phlix-vectors/feature.mkv',
        %s, 10, 95, 4200, 4300,
        %s, '2026-11-01 00:00:00', 0)",
    RICH_ITEM_ID,
    LIBRARY_ID,
    $pdo->quote(json_encode([
        'source' => [
            'width' => 3840,
            'height' => 2160,
            'video_codec' => 'h264',
            'video_bitrate' => 12000000,
            'audio_codec' => 'eac3',
            'audio_bitrate' => 640000,
            'pix_fmt' => 'yuv420p',
        ],
    ], JSON_UNESCAPED_SLASHES)),
    $pdo->quote(json_encode([
        ['start' => 0, 'end' => 600, 'title' => 'Cold open'],
        ['start' => 600, 'end' => 1200, 'title' => 'Main content'],
    ], JSON_UNESCAPED_SLASHES))
));

$streamRows = [
    // id, stream_index, type, codec, language, bitrate, channels, w, h, title, is_default, source, storage_path, hearing_impaired
    ['cccccccc-0000-4000-8000-000000000001', 0, 'video', 'h264', null, 12000000, null, 3840, 2160, null, 0, null, null, 0],
    ['cccccccc-0000-4000-8000-000000000002', 1, 'audio', 'eac3', 'en', 640000, 6, null, null, null, 1, null, null, 0],
    ['cccccccc-0000-4000-8000-000000000003', 2, 'audio', 'aac', 'en', 128000, 2, null, null, 'Commentary', 0, null, null, 0],
    ['cccccccc-0000-4000-8000-000000000004', 3, 'subtitle', 'subrip', 'eng', null, null, null, null, null, 0, null, null, 1],
    ['cccccccc-0000-4000-8000-000000000005', 4, 'subtitle', 'pgs', 'spa', null, null, null, null, null, 0, null, null, 0],
    // External sidecar: NOT in ffmpeg's 0:s:N space (shaper keeps it out of the
    // ordinal), but the column is NOT NULL, so the row carries its real file
    // position (9) — which the shaper reports as this track's index/stream_index.
    ['cccccccc-0000-4000-8000-000000000006', 9, 'subtitle', 'webvtt', 'fra', null, null, null, null, null, 0, 'opensubtitles', '/subs/french.vtt', 0],
];
$streamStmt = $pdo->prepare(
    'INSERT INTO media_streams (id, media_item_id, stream_index, stream_type, codec, language, bitrate,'
    . ' channels, width, height, title, is_default, source, storage_path, hearing_impaired)'
    . ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
foreach ($streamRows as $row) {
    // Rows carry (id, stream_index, …); every seeded stream belongs to the rich item.
    $streamStmt->execute([$row[0], RICH_ITEM_ID, ...array_slice($row, 1)]);
}

// Bare item: no markers, no source metadata (ladder must resolve to null), no
// stream rows at all. streams_probed_at is still STAMPED — that is exactly how
// a probed single-track file looks — so the backfill performs no I/O.
$pdo->exec(sprintf(
    "INSERT INTO media_items (id, library_id, name, type, path, metadata_json, streams_probed_at, rating_votes)
     VALUES ('%s', '%s', 'Vector Bare', 'movie', '/srv/phlix-vectors/bare.mp4', '{}', '2026-11-01 00:00:00', 0)",
    BARE_ITEM_ID,
    LIBRARY_ID
));

// --- REAL controller, wired exactly as the server wires it (ratingGate null =
// --- the legacy/no-container context the constructor documents; the lazy
// --- StreamProbeBackfill builds itself inside the controller).
$itemRepository = new \Phlix\Media\Library\ItemRepository($db);
$controller = new \Phlix\Server\Http\Controllers\MediaItemController(
    $itemRepository,
    new \Phlix\Media\Markers\MarkerService(
        $itemRepository,
        new \Phlix\Media\Markers\Detection\MarkerCandidateRepository($itemRepository)
    ),
    new \Phlix\Media\Playback\GaplessPlaybackManager(null),
    new \Phlix\Media\Streaming\Trickplay\TrickplayController('/tmp/phlix-vectors-trickplay', 'http://localhost/trickplay'),
    new \Phlix\Media\MarkerService($db),
);

/** Drive one controller rail and return [status, decoded body] from the REAL Response. */
$drive = static function (\Phlix\Server\Http\Request $request, array $params) use ($controller): array {
    $response = $controller->getPlaybackInfo($request, $params);
    return [$response->statusCode, json_decode((string) $response->body, true, 512, JSON_THROW_ON_ERROR)];
};

$richRequest = new \Phlix\Server\Http\Request();
$richRequest->userId = '';

$constraintsBoth = new \Phlix\Server\Http\Request();
$constraintsBoth->query = ['forceTranscode' => '1', 'excludeHevc' => 'yes'];

$constraintsSubset = new \Phlix\Server\Http\Request();
$constraintsSubset->query = ['excludeHevc' => '0'];

$bareRequest = new \Phlix\Server\Http\Request();
$bareRequest->userId = '';

$rails = [
    'rich' => $drive($richRequest, ['id' => RICH_ITEM_ID]),
    'constraintsBoth' => $drive($constraintsBoth, ['id' => RICH_ITEM_ID]),
    'constraintsSubset' => $drive($constraintsSubset, ['id' => RICH_ITEM_ID]),
    'bare' => $drive($bareRequest, ['id' => BARE_ITEM_ID]),
    'notFound' => $drive($bareRequest, ['id' => 'bbbbbbbb-0000-4000-8000-00000000dead']),
];

// --- Fail-fast guards on the EMISSION itself (the vitest side re-asserts
// --- these key orders; the script must not write a fixture that is already
// --- wrong). This is also the drift tripwire: a server-side rename reddens
// --- the next dump HERE, in the language that owns the wire.
$baseKeys = ['item_id', 'intro_marker', 'outro_marker', 'chapters', 'skip_button_spec',
    'quality_ladder', 'audio_tracks', 'subtitle_tracks', 'crossfade'];

foreach ($rails as $name => [$status, $body]) {
    if ($name === 'notFound') {
        $assert($status === 404 && array_keys($body) === ['error'], "notFound rail drifted: {$status} " . json_encode($body));
        continue;
    }
    $assert($status === 200, "{$name} rail status {$status}");
    $expected = $baseKeys;
    if (str_starts_with($name, 'constraints')) {
        $expected[] = 'playback_constraints';
    }
    $assert(array_keys($body) === $expected, "{$name} envelope keys changed: " . implode(',', array_keys($body)));

    foreach (['intro_marker', 'outro_marker'] as $k) {
        if ($body[$k] !== null) {
            $assert(array_keys($body[$k]) === ['start_seconds', 'end_seconds'], "{$name}.{$k} marker keys changed");
        }
    }
    foreach ($body['chapters'] as $chapter) {
        $assert(array_keys($chapter) === ['start_seconds', 'end_seconds', 'title'], "{$name}.chapters row keys changed");
    }
    $assert(
        array_keys($body['skip_button_spec']) === ['skip_intro_start', 'skip_intro_end', 'skip_outro_start', 'skip_outro_end'],
        "{$name}.skip_button_spec keys changed"
    );
    $assert(array_keys($body['crossfade']) === ['enabled', 'duration', 'fade_out', 'fade_in'], "{$name}.crossfade keys changed");
    $assert(is_bool($body['crossfade']['enabled']), "{$name}.crossfade.enabled is not a bool");
    foreach (['audio_tracks', 'subtitle_tracks'] as $k) {
        $assert(is_array($body[$k]), "{$name}.{$k} is not an array (must be always-emitted)");
    }
}

$assert(array_keys($rails['rich'][1]['audio_tracks'][0]) === ['id', 'index', 'stream_index', 'codec', 'language', 'channels', 'bitrate', 'title', 'default'], 'audio row keys changed vs S404 ruling');
$assert(array_keys($rails['rich'][1]['subtitle_tracks'][0]) === ['id', 'index', 'stream_index', 'language', 'label', 'codec', 'source', 'delivery', 'hearing_impaired', 'url'], 'subtitle row keys changed vs S507 (delivery:external) ruling');
$assert(count($rails['rich'][1]['audio_tracks']) === 2, 'audio witness count changed');
$assert(
    count($rails['rich'][1]['subtitle_tracks']) === 2,
    'subtitle witness count changed (bitmap row must stay skipped-but-counted, external row counted) — got ' . json_encode($rails['rich'][1]['subtitle_tracks'])
);
// Embedded subrip takes the first 0:s:N ordinal; the bitmap pgs row CONSUMES
// ordinal 1 without being emitted; the external sidecar is served by row id
// and reports its persisted stream_index instead.
$assert(array_column($rails['rich'][1]['subtitle_tracks'], 'index') === [0, 9], 'subtitle ordinals changed (skipped-bitmap / external-index law)');
$assert(array_column($rails['rich'][1]['subtitle_tracks'], 'source') === [null, 'opensubtitles'], 'subtitle source arm changed');
$assert(array_keys($rails['constraintsBoth'][1]['playback_constraints']) === ['force_transcode', 'exclude_hevc'], 'constraints-both keys changed');
$assert(array_keys($rails['constraintsSubset'][1]['playback_constraints']) === ['exclude_hevc'], 'constraints-subset arm must carry ONLY the supplied key');
$assert($rails['constraintsBoth'][1]['playback_constraints'] === ['force_transcode' => true, 'exclude_hevc' => true], 'truthy parse changed');
$assert($rails['constraintsSubset'][1]['playback_constraints'] === ['exclude_hevc' => false], "'0' must parse present-but-false");
$assert(!array_key_exists('playback_constraints', $rails['rich'][1]), 'rich (no query) must omit the block byte-identically');

$richLadder = $rails['rich'][1]['quality_ladder'];
$assert(is_array($richLadder) && $richLadder !== [], 'quality_ladder witness empty — the source blob stopped building a ladder');
foreach ($richLadder as $rung) {
    $assert(
        array_keys($rung) === ['id', 'label', 'width', 'height', 'bitrate', 'codecs', 'url', 'is_original', 'is_copy', 'video_bitrate'],
        'Rendition row keys changed'
    );
    $assert($rung['url'] === null, 'playback-info ladder must never mint a playable url');
}
$assert($rails['bare'][1]['quality_ladder'] === null, 'bare item must resolve the ladder to null (no source metadata)');
$assert($rails['bare'][1]['intro_marker'] === null && $rails['bare'][1]['outro_marker'] === null, 'bare markers not null');
$assert($rails['bare'][1]['chapters'] === [], 'bare chapters must be an empty ALWAYS-EMITTED list');
$assert($rails['bare'][1]['audio_tracks'] === [] && $rails['bare'][1]['subtitle_tracks'] === [], 'bare tracks not empty arrays');
$assert($rails['rich'][1]['crossfade'] === ['enabled' => false, 'duration' => 0, 'fade_out' => 0.3, 'fade_in' => 0.3], 'crossfade defaults changed');

// --- Signed-URL normalization (S404 method): assert the minted shape, store
// --- the path only, so the fixture regenerates byte-identically.
foreach (array_keys($rails) as $name) {
    if ($name === 'notFound') {
        continue;
    }
    foreach ($rails[$name][1]['subtitle_tracks'] as $i => $track) {
        $url = $track['url'];
        if ($url === null) {
            continue;
        }
        $assert(is_string($url) && preg_match(SIGNED_URL_SHAPE, $url, $m) === 1, "{$name} subtitle #{$i}: expected '<path>?exp=<digits>&sig=<base64url>', got " . var_export($url, true));
        $rails[$name][1]['subtitle_tracks'][$i]['url'] = $m['path'];
    }
}

$fixture = [
    '$comment' => 'GENERATED by scripts/dump-server-playback-info-vectors.php from the REAL MediaItemController::getPlaybackInfo() (server code + real MySQL scratch DB, migrated by the server MigrationRunner) — do not hand-edit. Regenerate ONLY against the provenance serverSha (the script refuses drift) and re-run test/playbackShapeParity.test.ts. Every "response" below is EMITTED bytes decoded from a real Response body; only seed rows/Requests are hand-built. Subtitle `url` values are PATH-ONLY: the signer mints a time-based ?exp&sig which this dumper asserts (fail-fast) and strips. The key sets are the authority contract `@phlix/contracts` playback.ts pins (LW-069: the wire carries snake_case {start_seconds,end_seconds,title} chapters with NO index, NO trickplay member, ALWAYS-emitted audio_tracks/subtitle_tracks/crossfade, and an add-only playback_constraints block).',
    'provenance' => [
        'serverRepo' => 'detain/phlix-server',
        'serverSha' => $serverSha,
        'generator' => 'scripts/dump-server-playback-info-vectors.php',
        'authority' => 'src/Server/Http/Controllers/MediaItemController.php::getPlaybackInfo',
        'marker' => 'playback-info-vectors-v1',
        'signer' => "new SignedUrl('" . SIGNER_SECRET . "') via PHLIX_SIGNED_URL_SECRET (paths only; exp/sig stripped)",
        'richItemId' => RICH_ITEM_ID,
        'bareItemId' => BARE_ITEM_ID,
    ],
    'rails' => [
        'rich' => ['status' => $rails['rich'][0], 'response' => $rails['rich'][1]],
        'constraintsBoth' => ['status' => $rails['constraintsBoth'][0], 'response' => $rails['constraintsBoth'][1]],
        'constraintsSubset' => ['status' => $rails['constraintsSubset'][0], 'response' => $rails['constraintsSubset'][1]],
        'bare' => ['status' => $rails['bare'][0], 'response' => $rails['bare'][1]],
        'notFound' => ['status' => $rails['notFound'][0], 'response' => $rails['notFound'][1]],
    ],
];

echo json_encode($fixture, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR), "\n";
