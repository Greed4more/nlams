/**
 * Downloads the signed-in officer's proposals from the real NLAMS server
 * (GET /api/proposals, server/src/routes/proposals.ts) and caches them into
 * Dexie so they stay visible offline — see db/database.ts's DBProject.
 * IndexedDB stays the source of truth for rendering; this just refreshes it
 * whenever a connection is available (see App.tsx).
 */
import { db } from '../db/database';
import { getSession } from '../auth/session';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

interface ServerProposal {
  id: string;
  projectName: string;
  requiringBody: string;
  state: string;
  district: string;
  currentStage: string;
}

export async function pullProjects(): Promise<number> {
  const session = getSession();
  if (!session) return 0;

  const res = await fetch(`${API_BASE}/api/proposals`, {
    headers: { Authorization: `Bearer ${session.token}` },
    signal: AbortSignal.timeout(15_000)
  });
  if (!res.ok) throw new Error(`Failed to download projects: HTTP ${res.status}`);

  const proposals = (await res.json()) as ServerProposal[];
  const now = Date.now();

  await db.projects.bulkPut(
    proposals.map((p) => ({
      id: p.id,
      name: p.projectName,
      purpose: p.requiringBody,
      current_stage: p.currentStage,
      state_code: p.state,
      district_code: p.district,
      status: p.currentStage,
      assigned_to: session.name,
      cached_at: now
    }))
  );

  return proposals.length;
}
