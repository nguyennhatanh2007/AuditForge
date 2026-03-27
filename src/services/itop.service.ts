export class ItopService {
  async testConnection() {
    return { ok: true, message: 'iTop connection test is not wired to a live endpoint yet.' };
  }

  async fetchInventory() {
    return [] as const;
  }
}
