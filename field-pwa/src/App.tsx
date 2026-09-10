import { useEffect, useState } from 'react';
import { db, type DBProject } from './db/database';
import { runSync, startSyncMonitor, stopSyncMonitor } from './sync/syncEngine';
import { pullProjects } from './sync/pull';
import { updateNetworkStatus, useNetworkStore } from './store/networkStore';
import { getSession, clearSession, type BhumitraSession } from './auth/session';
import { LoginPanel } from './LoginPanel';

function SyncBadge(): JSX.Element {
  const isOnline = useNetworkStore((state) => state.isOnline);
  const pending = useNetworkStore((state) => state.pending + state.photos_pending);

  return (
    <span className={isOnline ? 'badge-online' : 'badge-offline'}>
      {isOnline ? 'Online' : `Offline - ${pending} pending`}
    </span>
  );
}

export default function App(): JSX.Element {
  const [projects, setProjects] = useState<DBProject[]>([]);
  const [databaseReady, setDatabaseReady] = useState(false);
  const [session, setSession] = useState<BhumitraSession | null>(() => getSession());
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const isOnline = useNetworkStore((state) => state.isOnline);
  const refreshStats = useNetworkStore((state) => state.refreshStats);

  const loadLocalProjects = async (): Promise<DBProject[]> => {
    const localProjects = await db.projects.orderBy('cached_at').reverse().toArray();
    setProjects(localProjects);
    setDatabaseReady(true);
    return localProjects;
  };

  useEffect(() => {
    let active = true;

    void loadLocalProjects();
    void refreshStats();
    startSyncMonitor();

    const handleOnline = (): void => updateNetworkStatus(true);
    const handleOffline = (): void => updateNetworkStatus(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
      void runSync().then(refreshStats);
      if (getSession()) {
        void pullProjects()
          .then(() => {
            if (active) void loadLocalProjects();
          })
          .catch((err) => {
            if (active) setDownloadError(err instanceof Error ? err.message : String(err));
          });
      }
    }

    return () => {
      active = false;
      stopSyncMonitor();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshStats]);

  const handleSignedIn = (next: BhumitraSession): void => {
    setSession(next);
    setDownloadError(null);
    void pullProjects()
      .then(loadLocalProjects)
      .catch((err) => setDownloadError(err instanceof Error ? err.message : String(err)));
  };

  const handleSignOut = (): void => {
    clearSession();
    setSession(null);
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Bhumitra Field Operations</p>
          <h1>Assigned projects</h1>
        </div>
        <SyncBadge />
      </header>

      <section className="status-panel" aria-live="polite">
        <strong>{isOnline ? 'Connected' : 'Working offline'}</strong>
        <span>{databaseReady ? 'Local project data is ready on this device.' : 'Opening local database...'}</span>
      </section>

      {session ? (
        <section className="status-panel mb-6" aria-live="polite">
          <div>
            <strong>{session.name}</strong>
            <div className="text-sm text-gray-500">Land Acquisition Officer</div>
          </div>
          <button type="button" className="btn-outline" onClick={handleSignOut}>
            Sign out
          </button>
        </section>
      ) : (
        <LoginPanel onSignedIn={handleSignedIn} />
      )}

      {downloadError && (
        <p className="mb-4 text-sm text-field-red">Couldn't download the latest projects: {downloadError}</p>
      )}

      <section aria-labelledby="projects-heading">
        <div className="section-heading">
          <h2 id="projects-heading">Projects</h2>
          <span>{projects.length} cached</span>
        </div>
        {projects.length === 0 ? (
          <div className="empty-state">
            <h3>No projects cached yet</h3>
            <p>Projects downloaded from the backend will remain available here without a connection.</p>
          </div>
        ) : (
          <ul className="project-list">
            {projects.map((project) => (
              <li className="project-card" key={project.id}>
                <strong>{project.name}</strong>
                <span>{project.current_stage} · {project.status}</span>
                <small>Last cached {new Date(project.cached_at).toLocaleString()}</small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
