// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { db } from './db/database';

describe('App', () => {
  let container: HTMLDivElement;

  beforeEach(async () => {
    await db.projects.clear();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: false });
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('mounts the Dexie-backed project screen', async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(<App />);
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(container.textContent).toContain('Assigned projects');
    expect(container.textContent).toContain('Projects');
    root.unmount();
  });
});