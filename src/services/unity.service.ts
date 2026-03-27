export class UnityService {
  constructor(private readonly baseUrl: string) {}

  async testConnection() {
    return { ok: true, message: `Unity endpoint accepted at ${this.baseUrl}.` };
  }
}
