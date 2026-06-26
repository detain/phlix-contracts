import { describe, it, expect } from 'vitest';
import { PLUGIN_EVENT, WEBHOOK_EVENT, WEBHOOK_EVENT_RESERVED, EVENT } from '../src/events';
import { JWT_ISS, JWT_AUD, JWT_TYPE } from '../src/auth';
import { SERVER_STATUS } from '../src/hub';

describe('plugin event aliases', () => {
  it('match the phlix.* manifest aliases', () => {
    expect(PLUGIN_EVENT.PLAYBACK_STARTED).toBe('phlix.playback.started');
    expect(PLUGIN_EVENT.PLAYBACK_PAUSED).toBe('phlix.playback.paused');
    expect(PLUGIN_EVENT.PLAYBACK_RESUMED).toBe('phlix.playback.resumed');
    expect(PLUGIN_EVENT.PLAYBACK_STOPPED).toBe('phlix.playback.stopped');
    expect(PLUGIN_EVENT.LIBRARY_SCAN_STARTED).toBe('phlix.library.scan.started');
    expect(PLUGIN_EVENT.LIBRARY_SCAN_COMPLETED).toBe('phlix.library.scan.completed');
    expect(PLUGIN_EVENT.LIBRARY_ITEM_ADDED).toBe('phlix.library.item.added');
    expect(PLUGIN_EVENT.LIBRARY_ITEM_UPDATED).toBe('phlix.library.item.updated');
    expect(PLUGIN_EVENT.LIBRARY_ITEM_REMOVED).toBe('phlix.library.item.removed');
    expect(PLUGIN_EVENT.USER_CREATED).toBe('phlix.user.created');
    expect(PLUGIN_EVENT.USER_LOGGED_IN).toBe('phlix.user.logged_in');
    expect(PLUGIN_EVENT.USER_LOGGED_OUT).toBe('phlix.user.logged_out');
  });
});

describe('webhook event types', () => {
  it('match the webhook-events.json catalog', () => {
    expect(WEBHOOK_EVENT.PLAYBACK_STARTED).toBe('playback.started');
    expect(WEBHOOK_EVENT.PLAYBACK_ENDED).toBe('playback.ended');
    expect(WEBHOOK_EVENT.LIBRARY_UPDATED).toBe('library.updated');
    expect(WEBHOOK_EVENT.DOWNLOAD_COMPLETE).toBe('download.complete');
    expect(WEBHOOK_EVENT.RECORDING_STARTED).toBe('recording.started');
    expect(WEBHOOK_EVENT.RECORDING_STOPPED).toBe('recording.stopped');
    expect(WEBHOOK_EVENT.ALERT).toBe('alert');
    expect(WEBHOOK_EVENT_RESERVED.TEST).toBe('webhook.test');
  });

  it('groups both vocabularies under EVENT', () => {
    expect(EVENT.plugin).toBe(PLUGIN_EVENT);
    expect(EVENT.webhook).toBe(WEBHOOK_EVENT);
    expect(EVENT.webhookReserved).toBe(WEBHOOK_EVENT_RESERVED);
  });
});

describe('jwt + server-status constants', () => {
  it('match the PHP DTO constants', () => {
    expect(JWT_ISS.PHLIX).toBe('phlix');
    expect(JWT_ISS.PHLIX_HUB).toBe('phlix-hub');
    expect(JWT_AUD.SERVER).toBe('server');
    expect(JWT_AUD.HUB).toBe('hub');
    expect(JWT_AUD.CLIENT).toBe('client');
    expect(JWT_TYPE.ACCESS).toBe('access');
    expect(JWT_TYPE.REFRESH).toBe('refresh');
    expect(SERVER_STATUS.ONLINE).toBe('online');
    expect(SERVER_STATUS.OFFLINE).toBe('offline');
    expect(SERVER_STATUS.CLAIMING).toBe('claiming');
    expect(SERVER_STATUS.DISABLED).toBe('disabled');
  });
});
