/**
 * Bhumitra Field App — Dexie.js IndexedDB Database
 * Source of truth for all offline data. All writes go here FIRST, sync to backend SECOND.
 *
 * Schema version 1 — initial field-operations tables
 */
import Dexie, { type Table } from 'dexie';

// ─── Domain types ────────────────────────────────────────────────────────────

export interface DBProject {
  id: string;
  name: string;
  purpose: string;
  current_stage: string;
  state_code: string;
  district_code: string;
  boundary_geojson?: object;
  status: string;
  assigned_to?: string;
  cached_at: number; // epoch ms
}

export interface DBParcel {
  id: string;
  project_id?: string;
  ulpin_id?: string;
  state_code: string;
  district_code: string;
  village_mouza: string;
  khatian_plot_no: string;
  provenance: 'ulpin_verified' | 'svamitva_digitised' | 'legacy_migrated' | 'self_declared_pending';
  restriction_flags: string[];
  current_status: 'clear' | 'restricted' | 'disputed' | 'possessed';
  geometry_geojson?: object;
  cached_at: number;
}

export type SyncStatus = 'pending' | 'syncing' | 'failed' | 'synced';
export type SyncType =
  | 'PARCEL_VERIFY'
  | 'PHOTO_UPLOAD'
  | 'FAMILY_ENUMERATION'
  | 'SIA_CONSENT'
  | 'GRIEVANCE'
  | 'SIA_CONSENT_UPDATE';

export interface DBSyncQueueItem {
  id: string;               // client_record_id (UUID v4) — stable identity before server ID
  type: SyncType;
  endpoint: string;
  method: 'POST' | 'PATCH' | 'PUT';
  payload: object;
  status: SyncStatus;
  error_message?: string;
  retries: number;
  created_at: number;
  last_attempted_at?: number;
}

export interface DBPhoto {
  id: string;              // client UUID
  parcel_id?: string;
  project_id?: string;
  family_record_id?: string;
  blob: Blob;
  latitude?: number;
  longitude?: number;
  accuracy?: number;       // metres — undefined if GPS unavailable
  captured_at: number;     // epoch ms
  sync_status: SyncStatus;
  server_url?: string;     // set after successful upload
  reference_type?: string; // 'parcel' | 'family' | 'sia' | 'possession'
  reference_id?: string;
}

export interface DBFamilyRecord {
  id: string;              // client UUID
  project_id: string;
  parcel_id?: string;
  family_head_name: string;
  family_size: number;
  category: string;        // SC/ST/OBC/General — only if legally relevant
  current_address: string;
  land_lost_acres?: number;
  asset_details?: string;
  entitlement_category?: string;
  resettlement_site_preference?: string;
  photo_ids: string[];     // linked DBPhoto IDs
  sync_status: SyncStatus;
  created_at: number;
  last_modified: number;
}

export interface DBSIAHearing {
  id: string;              // client UUID
  project_id: string;
  hearing_date: string;    // ISO date string
  attendee_count: number;
  consenting_count: number;
  consent_percentage: number;
  objections_summary?: string;
  photo_ids: string[];
  sync_status: SyncStatus;
  created_at: number;
}

export interface DBOfflineParcelVerification {
  id: string;              // client UUID
  parcel_id: string;
  officer_id: string;
  verified_status: 'confirmed' | 'mismatch';
  mismatch_notes?: string;
  photo_ids: string[];
  sync_status: SyncStatus;
  created_at: number;
}

// ─── Database class ───────────────────────────────────────────────────────────

export class BhumitraFieldDB extends Dexie {
  projects!: Table<DBProject, string>;
  parcels!: Table<DBParcel, string>;
  sync_queue!: Table<DBSyncQueueItem, string>;
  photos!: Table<DBPhoto, string>;
  family_records!: Table<DBFamilyRecord, string>;
  sia_hearings!: Table<DBSIAHearing, string>;
  parcel_verifications!: Table<DBOfflineParcelVerification, string>;

  constructor() {
    super('BhumitraFieldDB');

    this.version(1).stores({
      projects:             'id, district_code, state_code, assigned_to, cached_at',
      parcels:              'id, project_id, ulpin_id, district_code, state_code, village_mouza, current_status',
      sync_queue:           'id, type, status, created_at, last_attempted_at',
      photos:               'id, parcel_id, project_id, family_record_id, sync_status, captured_at',
      family_records:       'id, project_id, parcel_id, sync_status, created_at',
      sia_hearings:         'id, project_id, sync_status, created_at',
      parcel_verifications: 'id, parcel_id, sync_status, created_at'
    });
  }
}

export const db = new BhumitraFieldDB();
