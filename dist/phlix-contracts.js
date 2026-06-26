//#region src/auth.ts
var e = {
	PHLIX: "phlix",
	PHLIX_HUB: "phlix-hub"
}, t = {
	SERVER: "server",
	HUB: "hub",
	CLIENT: "client"
}, n = {
	ACCESS: "access",
	REFRESH: "refresh"
}, r = {
	ONLINE: "online",
	OFFLINE: "offline",
	CLAIMING: "claiming",
	DISABLED: "disabled"
}, i = {
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
}, a = {
	PLAYBACK_STARTED: "playback.started",
	PLAYBACK_ENDED: "playback.ended",
	LIBRARY_UPDATED: "library.updated",
	DOWNLOAD_COMPLETE: "download.complete",
	RECORDING_STARTED: "recording.started",
	RECORDING_STOPPED: "recording.stopped",
	ALERT: "alert"
}, o = { TEST: "webhook.test" }, s = {
	plugin: i,
	webhook: a,
	webhookReserved: o
}, c = "X-Phlix-Device-ID", l = "X-Phlix-Device-Name", u = "X-Phlix-Device-Type", d = "X-Phlix-Session-ID";
function f(e) {
	let t = {
		[c]: e.deviceId,
		[l]: e.deviceName,
		[u]: e.deviceType
	};
	return e.sessionId !== void 0 && e.sessionId !== "" && (t[d] = e.sessionId), e.token !== void 0 && e.token !== "" && (t.Authorization = `Bearer ${e.token}`), t;
}
//#endregion
//#region src/ticks.ts
var p = 1e7, m = 6e8, h = 36e9;
function g(e) {
	return e / p;
}
function _(e) {
	return Math.floor(e * p);
}
function v(e) {
	return Math.floor(e / m);
}
function y(e) {
	let t = Math.floor(g(e)), n = Math.floor(t / 3600), r = Math.floor(t % 3600 / 60), i = Math.floor(t % 60);
	return n > 0 ? `${n}:${r.toString().padStart(2, "0")}:${i.toString().padStart(2, "0")}` : `${r}:${i.toString().padStart(2, "0")}`;
}
function b(e) {
	let t = v(e);
	return t < 60 ? `${t} min` : `${Math.floor(t / 60)}h ${t % 60}m`;
}
function x(e) {
	if (!e) return "";
	let t = Math.floor(e / h), n = Math.floor(e % h / m);
	return t > 0 ? `${t}h ${n}m` : `${n}m`;
}
//#endregion
export { s as EVENT, t as JWT_AUD, e as JWT_ISS, n as JWT_TYPE, i as PLUGIN_EVENT, r as SERVER_STATUS, h as TICKS_PER_HOUR, m as TICKS_PER_MINUTE, p as TICKS_PER_SECOND, a as WEBHOOK_EVENT, o as WEBHOOK_EVENT_RESERVED, c as X_PHLIX_DEVICE_ID, l as X_PHLIX_DEVICE_NAME, u as X_PHLIX_DEVICE_TYPE, d as X_PHLIX_SESSION_ID, f as buildPhlixHeaders, x as formatDuration, b as formatRuntime, _ as secondsToTicks, y as ticksToHms, v as ticksToMinutes, g as ticksToSeconds };

//# sourceMappingURL=phlix-contracts.js.map