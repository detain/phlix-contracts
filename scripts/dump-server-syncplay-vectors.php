<?php

declare(strict_types=1);

/**
 * S415 golden-vector dumper — captures what phlix-server ACTUALLY puts on the
 * SyncPlay REST wire into `test/fixtures/syncplay-envelope-vectors.json`.
 *
 * `@phlix/contracts` `SyncPlay.ts` claims to mirror the wire. This script is
 * the cross-language proof (the S404 method, applied to the SyncPlay rails):
 * it drives the REAL `Phlix\Server\Http\Controllers\SyncPlayController` —
 * with the REAL in-memory `SyncPlayManager` and the REAL
 * `SyncPlaySnapshotService` reading a REAL MySQL scratch database — and dumps
 * every response body verbatim, plus one hand-built `GroupState` (2 members,
 * a queue entry, playback state) through the REAL `getState()`. The vitest
 * `SyncPlayShapeParity` suite then asserts every dumped vector's key list
 * equals the TS interface's exported ordered key const — EXACTLY and IN
 * ORDER — so a key rename on either side reddens one shared gate (that rename
 * is exactly the S415 bug class: contracts once claimed list-row keys on the
 * full state and shipped seven types the server never emitted).
 *
 * Read rails (GET /groups, GET /groups/{id}) are ONLY emittable through
 * `syncplay_snapshots` DB rows — the mapping lives inside `listGroups()`
 * behind `$db->query(...)` with no seam. Per the s279b manual the venue
 * provides a real MySQL; this script therefore requires credentials, seeds a
 * SCRATCH DATABASE of its own name via the server's OWN migration file
 * (migrations/042_syncplay_snapshots.sql), publishes state through the real
 * `publishGroup()`, and reads it back through the real controller. Nothing is
 * hand-built: every vector in the fixture is an emitted artefact (S345 law).
 *
 * Environment (all REQUIRED):
 *   PHLIX_VEC_MYSQL_HOST   e.g. 127.0.0.1
 *   PHLIX_VEC_MYSQL_PORT   e.g. 3306
 *   PHLIX_VEC_MYSQL_USER
 *   PHLIX_VEC_MYSQL_PASSWORD
 *
 * Usage:
 *   php scripts/dump-server-syncplay-vectors.php /path/to/phlix-server \
 *       > test/fixtures/syncplay-envelope-vectors.json
 *
 * The server path is REQUIRED as argv 1 and never defaulted. The scratch
 * database name is a fixed literal and is DROPped/CREATEd by this script —
 * point it at a throwaway MySQL endpoint, never at estate data.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 * @license   MIT
 */

namespace Phlix\Contracts\Tooling;

const SCRATCH_DB = 'phlix_s279b_vectors';
const AUTHORITY_SHA = '0134063318bf601dcc152c6c175368cdf9168378';

if ($argc !== 2) {
    fwrite(STDERR, "usage: php scripts/dump-server-syncplay-vectors.php <phlix-server-checkout-path>\n");
    exit(1);
}

$serverRoot = rtrim($argv[1], '/');
$autoload = $serverRoot . '/vendor/autoload.php';
if (!is_file($autoload)) {
    fwrite(STDERR, "FAIL: {$autoload} not found — run composer install in the server checkout first.\n");
    exit(1);
}

$serverSha = trim((string) shell_exec('git -C ' . escapeshellarg($serverRoot) . ' rev-parse HEAD 2>/dev/null'));
if (preg_match('/^[0-9a-f]{40}$/', $serverSha) !== 1) {
    fwrite(STDERR, "FAIL: could not resolve a full 40-char server sha from '{$serverRoot}'.\n");
    exit(1);
}
if ($serverSha !== AUTHORITY_SHA) {
    fwrite(STDERR, "FAIL: server checkout is {$serverSha} but the S415 ruling authority is " . AUTHORITY_SHA . ".\n");
    fwrite(STDERR, "Re-verify the ruling (S279 authority list) at the new commit BEFORE regenerating this fixture.\n");
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
$port = (int) getenv('PHLIX_VEC_MYSQL_PORT');
$user = (string) getenv('PHLIX_VEC_MYSQL_USER');
$pass = (string) getenv('PHLIX_VEC_MYSQL_PASSWORD');

// --- Scratch schema through PDO (admin duty; the DATA rails below all run on
// --- the server's own Workerman connection + real service code).
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
$pdo->exec('USE `' . SCRATCH_DB . '`');

$migrationPath = $serverRoot . '/migrations/042_syncplay_snapshots.sql';
if (!is_file($migrationPath)) {
    fwrite(STDERR, "FAIL: {$migrationPath} not found — refusing to invent a schema the server does not ship.\n");
    exit(1);
}
$migrationSql = (string) file_get_contents($migrationPath);
// Strip -- comment lines, then execute the remaining statements.
$migrationSql = (string) preg_replace('/^\s*--.*$/m', '', $migrationSql);
foreach (array_filter(array_map('trim', explode(';', $migrationSql))) as $statement) {
    $pdo->exec($statement);
}

// --- REAL server objects, no hand-built responses anywhere below.
//
// Driver-compatibility shim (documented, minimal): workerman/mysql binds
// list-shaped query args with their 0-based keys, so bindParam(0) throws a
// ValueError on PHP >= 8. The server's own positional `?` queries therefore
// cannot run through the vendor driver unmodified on this box. This subclass
// re-keys LIST args to 1-based before delegating to the REAL parent — SQL,
// bound VALUES, fetch modes, and result mapping are 100% the untouched
// server + vendor code paths; nothing about the emission is imitated.
$dbClass = new class ($host, $port, $user, $pass, SCRATCH_DB, 'utf8mb4') extends \Workerman\MySQL\Connection {
    public function bindMore($parray)
    {
        if (is_array($parray) && $parray !== [] && array_is_list($parray)) {
            $parray = array_combine(range(1, count($parray)), $parray);
        }
        parent::bindMore($parray);
    }
};
$db = $dbClass;

$ref = new \ReflectionClass(\Phlix\Session\SyncPlay\SyncPlaySnapshotService::class);
$service = $ref->newInstance();
$dbProp = $ref->getProperty('db');
$dbProp->setAccessible(true);
$dbProp->setValue($service, $db);

$manager = new \Phlix\Session\SyncPlay\SyncPlayManager();
$manager->setSnapshotService($service);
$controller = new \Phlix\Server\Http\Controllers\SyncPlayController($manager, $service);

/** Drive one controller method and return [status, decoded body] from the REAL Response. */
$drive = static function (string $method, \Phlix\Server\Http\Request $request, array $params) use ($controller): array {
    $response = $controller->{$method}($request, $params);
    return [$response->statusCode, json_decode($response->body, true, 512, JSON_THROW_ON_ERROR)];
};

/**
 * Deterministic ids so the fixture bytes are stable across regenerations at
 * the same server sha.
 */
$groupId = null;

// 1) POST /groups — create a password group (real createGroup + real snapshot publish).
$req = new \Phlix\Server\Http\Request();
$req->body = [
    'name' => 'Movie Night',
    'password' => 'vec-password',
    'memberId' => 'member_host',
    'memberName' => 'Host One',
];
$req->userId = 'member_host';
[$createStatus, $createBody] = $drive('createGroup', $req, []);
if ($createStatus !== 200 || ($createBody['success'] ?? null) !== true) {
    fwrite(STDERR, "FAIL: createGroup rail did not succeed — {$createStatus} " . json_encode($createBody) . "\n");
    exit(1);
}
$groupId = (string) $createBody['group']['group_id'];

// 2) POST /groups/{id}/join — second member (real verifyPassword + join + publish).
$req = new \Phlix\Server\Http\Request();
$req->body = [
    'password' => 'vec-password',
    'memberId' => 'member_guest',
    'memberName' => 'Guest Two',
];
$req->userId = 'member_guest';
[$joinStatus, $joinBody] = $drive('joinGroup', $req, ['id' => $groupId]);
if ($joinStatus !== 200 || count($joinBody['group']['members'] ?? []) !== 2) {
    fwrite(STDERR, "FAIL: joinGroup rail did not produce a 2-member dict — {$joinStatus} " . json_encode($joinBody) . "\n");
    exit(1);
}

// 3) GET /groups — list envelope read back through the REAL DB query.
[$listStatus, $listBody] = $drive('listGroups', new \Phlix\Server\Http\Request(), []);
if ($listStatus !== 200 || count($listBody['groups'] ?? []) !== 1) {
    fwrite(STDERR, "FAIL: listGroups rail empty — the DB round-trip is broken. " . json_encode($listBody) . "\n");
    exit(1);
}

// 4) GET /groups/{id} — single read through deserialize()->getState().
[$getStatus, $getBody] = $drive('getGroup', new \Phlix\Server\Http\Request(), ['id' => $groupId]);

// 5) POST /groups/{id}/leave — the GUEST leaves (host election NOT exercised:
//    its broadcast path needs a WS handler; the envelope arms below are what
//    this contract pins).
$req = new \Phlix\Server\Http\Request();
$req->body = ['memberId' => 'member_guest'];
$req->userId = 'member_guest';
[$leaveStatus, $leaveBody] = $drive('leaveGroup', $req, ['id' => $groupId]);

// 6) Error arms — real @400 (missing name) and real @404 (unknown group).
$req = new \Phlix\Server\Http\Request();
$req->body = ['name' => ''];
[$err400Status, $err400Body] = $drive('createGroup', $req, []);
[$err404Status, $err404Body] = $drive('getGroup', new \Phlix\Server\Http\Request(), ['id' => 'sp_does_not_exist']);

// 7) A hand-BUILT GroupState pushed through the REAL getState(): two members,
//    current media, a populated queue and playing state so EVERY emitted key
//    (including the queue-item shape and both is_host values) has a witness.
//    Only the INPUT literals are hand-built; the vector below is emission.
$state = new \Phlix\Session\SyncPlay\GroupState('sp_vectorhost', 'Vector Group');
$state->addMember('alpha', ['name' => 'Alpha']);
$state->addMember('beta', ['name' => 'Beta']);
$state->setHost('alpha');
$state->setCurrentMedia('media_42', 3600000);
$state->addToQueue('media_43', ['title' => 'Queued Feature', 'kind' => 'movie']);
$state->updatePlayback(\Phlix\Session\SyncPlay\GroupState::STATE_PLAYING, 90000);
$builtState = $state->getState();

$fixture = [
    '$comment' => 'GENERATED by scripts/dump-server-syncplay-vectors.php from the REAL server code (controller, manager, snapshot service, GroupState::getState) — do not hand-edit. Regenerate ONLY against the provenance serverSha (authority re-check first — the script refuses drift) and re-run test/syncPlayShapeParity.test.ts. Every "response"/"state" value below is EMITTED bytes decoded from the real Response body or the real getState(); only the INPUT literals are hand-built.',
    'provenance' => [
        'serverRepo' => 'detain/phlix-server',
        'serverSha' => $serverSha,
        'generator' => 'scripts/dump-server-syncplay-vectors.php',
        'authority' => 'src/Server/Http/Controllers/SyncPlayController.php + src/Session/SyncPlay/GroupState.php + src/Session/SyncPlay/SyncPlaySnapshotService.php',
        'marker' => 'syncplay-vectors-v1',
    ],
    'rails' => [
        'listGroups' => ['status' => $listStatus, 'response' => $listBody],
        'createGroup' => ['status' => $createStatus, 'response' => $createBody],
        'getGroup' => ['status' => $getStatus, 'response' => $getBody],
        'joinGroup' => ['status' => $joinStatus, 'response' => $joinBody],
        'leaveGroup' => ['status' => $leaveStatus, 'response' => $leaveBody],
        'createGroupError' => ['status' => $err400Status, 'response' => $err400Body],
        'getGroupNotFound' => ['status' => $err404Status, 'response' => $err404Body],
    ],
    'groupState' => [
        'case' => 'two-members-with-queue-and-playing-state',
        'state' => $builtState,
    ],
];

// Fail-fast guards on the emission itself (mirrors what the vitest side will
// assert — the script must not write a fixture that is already wrong).
$assert = static function (bool $cond, string $msg): void {
    if (!$cond) {
        fwrite(STDERR, "FAIL: {$msg}\n");
        exit(1);
    }
};
$assert(array_keys($builtState) === ['group_id', 'group_name', 'member_count', 'members', 'host_id', 'current_media_id', 'current_media_duration', 'playback_position', 'playback_state', 'queue', 'created_at', 'last_activity_at'], 'getState() key order changed — the authority ruling must be re-measured before this fixture regenerates');
$assert(is_array($builtState['members']) && array_keys($builtState['members']) === ['alpha', 'beta'], 'members is not a dict keyed by member id');
$assert(array_keys($builtState['members']['alpha']) === ['id', 'name', 'is_host', 'joined_at'], 'member value shape changed');
$assert($builtState['members']['alpha']['is_host'] === true && $builtState['members']['beta']['is_host'] === false, 'is_host split missing');
$assert(array_keys($builtState['queue'][0]) === ['media_id', 'media_info', 'added_at', 'added_by'], 'queue item shape changed');
$assert(array_keys($listBody) === ['groups'] && count($listBody['groups']) === 1, 'list envelope shape changed');
$assert(array_keys($listBody['groups'][0]) === ['id', 'name', 'member_count', 'has_password', 'current_media', 'is_playing'], 'list row keys changed');
$assert($listBody['groups'][0]['has_password'] === true, 'password flag did not survive the real publish/read round-trip');
foreach ([
    'createGroup' => ['success', 'group'],
    'joinGroup' => ['success', 'group'],
    'getGroup' => ['group'],
    'leaveGroup' => ['success', 'message'],
    'createGroupError' => ['error'],
    'getGroupNotFound' => ['error'],
] as $rail => $keys) {
    $body = $fixture['rails'][$rail]['response'];
    $assert(array_keys($body) === $keys, "rail {$rail} envelope keys changed: " . implode(',', array_keys($body)));
}
$assert($err400Status === 400 && $err404Status === 404, 'error arm statuses changed');
$assert($leaveBody['message'] !== null, 'leave rail produced a null message — the string arm lost its witness');
$assert(array_key_exists('message', $fixture['rails']['leaveGroup']['response']), 'leave envelope lost the message key');

echo json_encode($fixture, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR), "\n";
