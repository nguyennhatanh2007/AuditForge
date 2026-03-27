export class VcenterService {
  constructor(private readonly baseUrl: string) {}

  async testConnection() {
    return { ok: true, message: `vCenter endpoint accepted at ${this.baseUrl}.` };
  }

  async fetchInventory() {
    return [] as const;
  }
}
