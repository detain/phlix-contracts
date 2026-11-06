<?php

declare(strict_types=1);

/**
 * LW-065 golden-vector dumper — captures what phlix-server ACTUALLY emits for
 * the per-profile stream-limit / active-stream DTOs into
 * `test/fixtures/stream-session-vectors.json`.
 *
 * `@phlix/contracts` `ProfileStreamLimit` / `ActiveStream` (src/streaming.ts)
 * mirrored a camelCase shape the server never put on the wire — estate review
 * contracts__srphp #8 [Info]: the live DTOs are snake_case
 * (`StreamSessionService::getActiveStreamsForProfile()` +
 * `ProfileStreamLimit::toArray()`), `profile_id` is a UUID STRING not a
 * number, `last_heartbeat_at` was missing entirely, and the datetimes are
 * MySQL DATETIME strings (`YYYY-MM-DD HH:MM:SS`), not ISO-8601. This script is
 * the same cross-language proof as the LW-069 playback-info leg (S404/S415
 * method): the REAL `Phlix\Access\StreamSessionService` reading a REAL MySQL
 * scratch database migrated by the server's OWN `MigrationRunner`. Every
 * vector below is the exact array the service hands
 * `StreamLimitController` (which embeds it verbatim as `{ stream_limits }` /
 * `{ active_streams, count }` — controller wiring asserted by
 * test/streamSessionShapeParity.test.ts prose).
 *
 * Environment (all REQUIRED):
 *   PHLIX_VEC_MYSQL_HOST / PHLIX_VEC_MYSQL_PORT / PHLIX_VEC_MYSQL_USER / PHLIX_VEC_MYSQL_PASSWORD
 *
 * Usage:
 *   php scripts/dump-server-stream-session-vectors.php /path/to/phlix-server \
 *       > test/fixtures/stream-session-vectors.json
 *
 * The server checkout MUST sit at the authority sha below (drift refused);
 * the scratch database is DROPped/CREATEd and migrated in-process — point at
 * a throwaway MySQL endpoint, never estate data.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 * @license   MIT
 */

namespace Phlix\Contracts\Tooling;

const SCRATCH_DB = 'phlix_stream_session_vectors';
const AUTHORITY_SHA = 'a63dc0db72d67beed7e1e9b7824cfec6b5ac80d0';

const PROFILE_CONFIGURED = 'dddddddd-0000-4000-8000-000000000001';
const PROFILE_FALLBACK = 'dddddddd-0000-4000-8000-000000000002';
const PROFILE_EMPTY = 'dddddddd-0000-4000-8000-000000000003';

if ($argc !== 2) {
    fwrite(STDERR, "usage: php scripts/dump-server-stream-session-vectors.php <phlix-server-checkout-path>\n");
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
    fwrite(STDERR, "FAIL: server checkout is '" . var_export($serverSha, true) . "' but the LW-065 dump authority is " . AUTHORITY_SHA . ".\n");
    fwrite(STDERR, "Re-verify the ruling (the real StreamSessionService DTO emissions) at the new commit BEFORE regenerating this fixture.\n");
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

putenv('DB_HOST=' . $host);
putenv('DB_PORT=' . $port);
putenv('DB_DATABASE=' . SCRATCH_DB);
putenv('DB_USER=' . $user);
putenv('DB_PASSWORD=' . $pass);
putenv('DB_POOL_ENABLED=0');

\Phlix\Common\Database\ConnectionPool::init($serverRoot . '/config/database.php');
$runner = new \Phlix\Common\Database\MigrationRunner(
    static fn(): \Workerman\MySQL\Connection => \Phlix\Common\Database\ConnectionPool::getConnection('mysql'),
    $serverRoot . '/migrations'
);
$assert(
    \Phlix\Common\Database\MigrationRunner::exitCodeFor($runner->run()) === 0,
    'server MigrationRunner reported non-idempotent failures'
);

$db = \Phlix\Common\Database\ConnectionPool::getConnection('mysql');

$pdo->exec('USE `' . SCRATCH_DB . '`');

// Seed INPUT rows (deterministic datetimes so regenerations are byte-identical).
// `active_streams`/`profile_stream_limits` carry no FKs (migration 063), so no
// profile row is needed — the profile_id column is a bare char(36).
$pdo->exec(sprintf(
    "INSERT INTO profile_stream_limits (profile_id, max_concurrent_streams, max_total_bandwidth_kbps)
     VALUES ('%s', 3, 25000)",
    PROFILE_CONFIGURED
));
$streamRows = [
    // device, session, started_at, last_heartbeat_at, stream_type — started_at
    // deliberately ASCENDING so the ORDER BY started_at DESC re-arms them into
    // the opposite order (an order witness, not an insertion accident).
    ['pixel-tv', 'ses-early', '2026-11-01 08:00:00', '2026-11-01 08:12:34', 'direct'],
    ['bedroom-display', 'ses-mid', '2026-11-01 09:00:00', '2026-11-01 09:30:00', 'transcode'],
    ['phone-app', 'ses-late', '2026-11-01 10:00:00', '2026-11-01 10:45:01', 'relay'],
];
$streamStmt = $pdo->prepare(
    'INSERT INTO active_streams (profile_id, device_id, session_id, started_at, last_heartbeat_at, stream_type)'
    . ' VALUES (?, ?, ?, ?, ?, ?)'
);
foreach ($streamRows as $row) {
    $streamStmt->execute([PROFILE_CONFIGURED, ...$row]);
}
// Scope witness: another profile's stream must NEVER leak into the list.
$streamStmt->execute([PROFILE_FALLBACK, 'other-device', 'ses-other', '2026-11-01 07:00:00', '2026-11-01 07:00:00', 'direct']);

// Settings repo NULL — the documented no-container degrade: every profile
// WITHOUT an explicit limit row runs on DEFAULT_CONCURRENT_STREAMS.
$service = new \Phlix\Access\StreamSessionService($db);

$configured = $service->getStreamLimit(PROFILE_CONFIGURED)->toArray();
$fallback = $service->getStreamLimit(PROFILE_FALLBACK)->toArray();
$active = $service->getActiveStreamsForProfile(PROFILE_CONFIGURED);
$activeEmpty = $service->getActiveStreamsForProfile(PROFILE_EMPTY);

// --- Fail-fast emission guards (drift tripwire in the wire's own language).
$assert(array_keys($configured) === ['profile_id', 'max_concurrent_streams', 'max_total_bandwidth_kbps'], 'ProfileStreamLimit keys changed');
$assert($configured === ['profile_id' => PROFILE_CONFIGURED, 'max_concurrent_streams' => 3, 'max_total_bandwidth_kbps' => 25000], 'configured limit values changed: ' . json_encode($configured));
$assert($fallback === ['profile_id' => PROFILE_FALLBACK, 'max_concurrent_streams' => 1, 'max_total_bandwidth_kbps' => null], 'fallback limit must be the shipped default with null bandwidth: ' . json_encode($fallback));
$assert(count($active) === 3, 'active witness count changed (scope leak?): ' . json_encode($active));
$assert(array_keys($active[0]) === ['id', 'profile_id', 'device_id', 'session_id', 'started_at', 'last_heartbeat_at', 'stream_type'], 'ActiveStream keys changed');
$assert(array_column($active, 'session_id') === ['ses-late', 'ses-mid', 'ses-early'], 'ORDER BY started_at DESC law changed');
$assert(array_column($active, 'stream_type') === ['relay', 'transcode', 'direct'], 'stream_type ENUM passthrough changed');
foreach ($active as $row) {
    $assert(is_int($row['id']), 'ActiveStream id must be int: ' . var_export($row['id'], true));
    $assert($row['profile_id'] === PROFILE_CONFIGURED, 'profile_id must be the UUID string (no scope leak)');
    foreach (['started_at', 'last_heartbeat_at'] as $k) {
        $assert(
            preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', (string) $row[$k]) === 1,
            "ActiveStream {$k} is not a MySQL DATETIME string: " . var_export($row[$k], true)
        );
    }
}
$assert($activeEmpty === [], 'no-stream profile must yield an empty list');

$fixture = [
    '$comment' => 'GENERATED by scripts/dump-server-stream-session-vectors.php from the REAL Phlix\Access\StreamSessionService (server code + real MySQL scratch DB, migrated by the server MigrationRunner) — do not hand-edit. Regenerate ONLY against the provenance serverSha (the script refuses drift) and re-run test/streamSessionShapeParity.test.ts. These are the EXACT arrays StreamLimitController embeds as { stream_limits } / { active_streams, count } (GET /api/v1/[admin/]profiles/{profileId}/stream-limits + .../active-streams). LW-065: the wire is snake_case with a UUID-string profile_id, a MySQL DATETIME (YYYY-MM-DD HH:MM:SS) last_heartbeat_at the old mirror lacked, and an int id — the previous camelCase/number/ISO-8601 claims were fiction. active_streams carries NO FK and rows here are hand-seeded INPUTS; ids are AUTO_INCREMENT and therefore NOT pinned by value (identity only).',
    'provenance' => [
        'serverRepo' => 'detain/phlix-server',
        'serverSha' => $serverSha,
        'generator' => 'scripts/dump-server-stream-session-vectors.php',
        'authority' => 'src/Access/StreamSessionService.php (getStreamLimit/toArray + getActiveStreamsForProfile)',
        'marker' => 'stream-session-vectors-v1',
    ],
    'streamLimitKeys' => array_keys($configured),
    'activeStreamKeys' => array_keys($active[0]),
    'rails' => [
        'configured' => $configured,
        'fallback' => $fallback,
        'active' => $active,
        'activeEmpty' => $activeEmpty,
    ],
];

echo json_encode($fixture, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR), "\n";
