import type { BaseStateAdapter } from "./stateAdapter.js";
import westBengalAdapter from "./westBengalAdapter.js";

class AdapterRegistry {
  private readonly adapters = new Map<string, BaseStateAdapter>();

  constructor() {
    this.register(westBengalAdapter);
  }

  register(adapter: BaseStateAdapter): void {
    this.adapters.set(adapter.stateCode, adapter);
  }

  get(stateCode: string): BaseStateAdapter | null {
    return this.adapters.get(stateCode) ?? null;
  }

  list() {
    return Array.from(this.adapters.values()).map((adapter) => ({
      stateCode: adapter.stateCode,
      stateName: adapter.stateName,
      isRegistered: true,
    }));
  }
}

export const adapterRegistry = new AdapterRegistry();
