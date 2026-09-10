import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/database';
import { addToSyncQueue, runSync } from './syncEngine';

describe('offline sync engine', () => {
  beforeEach(async () => {
    await db.sync_queue.clear();
    await db.parcel_verifications.clear();
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key)
    });
    localStorage.clear();
    localStorage.setItem('bhumitra_session', JSON.stringify({ token: 'test-token' }));
    vi.restoreAllMocks();
  });

  it('writes an offline record to Dexie with a stable client id', async () => {
    const id = await addToSyncQueue('PARCEL_VERIFY', '/api/parcels/verify', 'POST', { parcel_id: 'parcel-1' });
    const queued = await db.sync_queue.get(id);

    expect(queued?.id).toBe(id);
    expect(queued?.status).toBe('pending');
    expect(queued?.payload).toMatchObject({ parcel_id: 'parcel-1', client_record_id: id });
  });

  it('processes queued records after connectivity is restored', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    const id = await addToSyncQueue('PARCEL_VERIFY', '/api/parcels/verify', 'POST', { parcel_id: 'parcel-2' });

    const result = await runSync();
    const synced = await db.sync_queue.get(id);

    expect(result.synced).toBe(1);
    expect(synced?.status).toBe('synced');
  });

  it('retains local data and marks a failed request for retry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const id = await addToSyncQueue('PARCEL_VERIFY', '/api/parcels/verify', 'POST', { parcel_id: 'parcel-3' });
    await db.parcel_verifications.add({
      id: 'verification-1',
      parcel_id: 'parcel-3',
      officer_id: 'officer-1',
      verified_status: 'confirmed',
      photo_ids: [],
      sync_status: 'pending',
      created_at: Date.now()
    });

    await runSync();
    const queued = await db.sync_queue.get(id);
    const localRecord = await db.parcel_verifications.get('verification-1');

    expect(queued?.status).toBe('pending');
    expect(queued?.retries).toBe(1);
    expect(queued?.error_message).toBe('offline');
    expect(localRecord).toBeDefined();
  });
});