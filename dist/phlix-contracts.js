//#region src/playback.ts
var e = "auto";
function t(e, t) {
	if (e.length !== 0) {
		if (t !== void 0) {
			let n = e.find((e) => e.id === t);
			if (n !== void 0) return n;
		}
		return e[Math.floor(e.length / 2)];
	}
}
//#endregion
//#region src/auth.ts
var n = {
	PHLIX: "phlix",
	PHLIX_HUB: "phlix-hub"
}, r = {
	SERVER: "server",
	HUB: "hub",
	CLIENT: "client"
}, i = {
	ACCESS: "access",
	REFRESH: "refresh"
}, a = {
	ONLINE: "online",
	OFFLINE: "offline",
	CLAIMING: "claiming",
	DISABLED: "disabled"
}, o = {
	PLAYBACK_STARTED: "phlix.playback.started",
	PLAYBACK_PAUSED: "phlix.playback.paused",
	PLAYBACK_RESUMED: "phlix.playback.resumed",
	PLAYBACK_STOPPED: "phlix.playback.stopped",
	LIBRARY_SCAN_STARTED: "phlix.library.scan.started",
	LIBRARY_SCAN_COMPLETED: "phlix.library.scan.completed",
	LIBRARY_ITEM_ADDED: "phlix.library.item.added",
	LIBRARY_ITEM_UPDATED: "phlix.library.item.updated",
	LIBRARY_ITEM_REMOVED: "phlix.library.item.removed",
	USER_CREATED: "phlix.user.created",
	USER_LOGGED_IN: "phlix.user.logged_in",
	USER_LOGGED_OUT: "phlix.user.logged_out"
}, s = {
	PLAYBACK_STARTED: "playback.started",
	PLAYBACK_ENDED: "playback.ended",
	LIBRARY_UPDATED: "library.updated",
	DOWNLOAD_COMPLETE: "download.complete",
	RECORDING_STARTED: "recording.started",
	RECORDING_STOPPED: "recording.stopped",
	MEDIA_ADDED: "media.added",
	ALERT: "alert"
}, c = { TEST: "webhook.test" }, l = {
	plugin: o,
	webhook: s,
	webhookReserved: c
}, u = {
	SERVERS_READ: "mcp:servers:read",
	LIBRARY_READ: "mcp:library:read",
	PLAYBACK_READ: "mcp:playback:read",
	PLAYBACK_CONTROL: "mcp:playback:control"
}, d = [
	u.SERVERS_READ,
	u.LIBRARY_READ,
	u.PLAYBACK_READ,
	u.PLAYBACK_CONTROL
], f = "phlix-mcp-", p = "X-Phlix-Device-ID", m = "X-Phlix-Device-Name", h = "X-Phlix-Device-Type", g = "X-Phlix-Session-ID";
function _(e) {
	let t = {
		[p]: e.deviceId,
		[m]: e.deviceName,
		[h]: e.deviceType
	};
	return e.sessionId !== void 0 && e.sessionId !== "" && (t[g] = e.sessionId), e.token !== void 0 && e.token !== "" && (t.Authorization = `Bearer ${e.token}`), t;
}
//#endregion
//#region src/ticks.ts
var v = 1e7, y = 6e8, b = 36e9;
function x(e) {
	return e / v;
}
function S(e) {
	return Math.floor(e * v);
}
function C(e) {
	return Math.floor(e / y);
}
function w(e) {
	let t = Math.floor(x(Number.isFinite(e) && e > 0 ? e : 0)), n = Math.floor(t / 3600), r = Math.floor(t % 3600 / 60), i = Math.floor(t % 60);
	return n > 0 ? `${n}:${r.toString().padStart(2, "0")}:${i.toString().padStart(2, "0")}` : `${r}:${i.toString().padStart(2, "0")}`;
}
function T(e) {
	let t = C(Number.isFinite(e) && e > 0 ? e : 0);
	return t < 60 ? `${t} min` : `${Math.floor(t / 60)}h ${t % 60}m`;
}
function E(e) {
	if (!e || !Number.isFinite(e) || e < 0) return "";
	let t = Math.floor(e / b), n = Math.floor(e % b / y);
	return t > 0 ? `${t}h ${n}m` : `${n}m`;
}
//#endregion
//#region src/Rating.ts
function D(e) {
	if (e.rating_score !== void 0 && e.rating_score !== null) return e.rating_score;
	let t = e.metadata_json?.rating;
	return typeof t == "number" ? t : null;
}
//#endregion
//#region src/Audio.ts
function O(e, t) {
	if (!e.length || !t.length) return 0;
	for (let n of t) {
		let t = n.toLowerCase().split("-")[0], r = e.findIndex((e) => e.language?.toLowerCase().startsWith(t));
		if (r !== -1) return r;
	}
	return 0;
}
//#endregion
export { e as AUTO_QUALITY, l as EVENT, r as JWT_AUD, n as JWT_ISS, i as JWT_TYPE, u as MCP_SCOPE, d as MCP_SCOPES, f as MCP_TOKEN_PREFIX, o as PLUGIN_EVENT, a as SERVER_STATUS, b as TICKS_PER_HOUR, y as TICKS_PER_MINUTE, v as TICKS_PER_SECOND, s as WEBHOOK_EVENT, c as WEBHOOK_EVENT_RESERVED, p as X_PHLIX_DEVICE_ID, m as X_PHLIX_DEVICE_NAME, h as X_PHLIX_DEVICE_TYPE, g as X_PHLIX_SESSION_ID, _ as buildPhlixHeaders, E as formatDuration, T as formatRuntime, O as pickDefaultAudio, t as pickDefaultRendition, D as pickDisplayRating, S as secondsToTicks, w as ticksToHms, C as ticksToMinutes, x as ticksToSeconds };

//# sourceMappingURL=phlix-contracts.js.map