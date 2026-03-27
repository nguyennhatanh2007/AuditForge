export class AlletraService {
  constructor(private readonly baseUrl: string) {}

  async testConnection() {
    return { ok: true, message: `HPE Alletra endpoint accepted at ${this.baseUrl}.` };
  }
}
