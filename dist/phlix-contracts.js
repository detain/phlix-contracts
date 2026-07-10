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
}, u = "X-Phlix-Device-ID", d = "X-Phlix-Device-Name", f = "X-Phlix-Device-Type", p = "X-Phlix-Session-ID";
function m(e) {
	let t = {
		[u]: e.deviceId,
		[d]: e.deviceName,
		[f]: e.deviceType
	};
	return e.sessionId !== void 0 && e.sessionId !== "" && (t[p] = e.sessionId), e.token !== void 0 && e.token !== "" && (t.Authorization = `Bearer ${e.token}`), t;
}
//#endregion
//#region src/ticks.ts
var h = 1e7, g = 6e8, _ = 36e9;
function v(e) {
	return e / h;
}
function y(e) {
	return Math.floor(e * h);
}
function b(e) {
	return Math.floor(e / g);
}
function x(e) {
	let t = Math.floor(v(Number.isFinite(e) && e > 0 ? e : 0)), n = Math.floor(t / 3600), r = Math.floor(t % 3600 / 60), i = Math.floor(t % 60);
	return n > 0 ? `${n}:${r.toString().padStart(2, "0")}:${i.toString().padStart(2, "0")}` : `${r}:${i.toString().padStart(2, "0")}`;
}
function S(e) {
	let t = b(Number.isFinite(e) && e > 0 ? e : 0);
	return t < 60 ? `${t} min` : `${Math.floor(t / 60)}h ${t % 60}m`;
}
function C(e) {
	if (!e || !Number.isFinite(e) || e < 0) return "";
	let t = Math.floor(e / _), n = Math.floor(e % _ / g);
	return t > 0 ? `${t}h ${n}m` : `${n}m`;
}
//#endregion
//#region src/Rating.ts
function w(e) {
	if (e.rating_score !== void 0 && e.rating_score !== null) return e.rating_score;
	let t = e.metadata_json?.rating;
	return typeof t == "number" ? t : null;
}
//#endregion
export { e as AUTO_QUALITY, l as EVENT, r as JWT_AUD, n as JWT_ISS, i as JWT_TYPE, o as PLUGIN_EVENT, a as SERVER_STATUS, _ as TICKS_PER_HOUR, g as TICKS_PER_MINUTE, h as TICKS_PER_SECOND, s as WEBHOOK_EVENT, c as WEBHOOK_EVENT_RESERVED, u as X_PHLIX_DEVICE_ID, d as X_PHLIX_DEVICE_NAME, f as X_PHLIX_DEVICE_TYPE, p as X_PHLIX_SESSION_ID, m as buildPhlixHeaders, C as formatDuration, S as formatRuntime, t as pickDefaultRendition, w as pickDisplayRating, y as secondsToTicks, x as ticksToHms, b as ticksToMinutes, v as ticksToSeconds };

//# sourceMappingURL=phlix-contracts.js.map