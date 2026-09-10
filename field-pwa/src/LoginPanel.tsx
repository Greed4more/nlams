import { useState, type FormEvent } from 'react';
import { loginWithBypass, type BhumitraSession } from './auth/session';

/**
 * Deliberately not a full-screen gate — cached project data (Dexie) stays
 * visible offline even when signed out, per the "IndexedDB is the single
 * source of truth" principle in sync/syncEngine.ts. Signing in only unlocks
 * downloading fresh data and syncing pending field submissions.
 */
export function LoginPanel({ onSignedIn }: { onSignedIn: (session: BhumitraSession) => void }): JSX.Element {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const session = await loginWithBypass(password);
      onSignedIn(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="field-card mb-6">
      <h2 className="mb-1">Sign in</h2>
      <p className="mb-3 text-sm text-gray-500">
        Demo bypass sign-in as Land Acquisition Officer — same backend and password as the NLAMS
        web app's Quick Demo Access.
      </p>
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Bypass password"
          className="field-input"
          autoComplete="current-password"
        />
        {error && <p className="text-sm text-field-red">{error}</p>}
        <button type="submit" className="btn-primary" disabled={loading || !password}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </section>
  );
}
