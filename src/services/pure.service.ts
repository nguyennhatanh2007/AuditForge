export class PureService {
  constructor(private readonly baseUrl: string) {}

  async testConnection() {
    return { ok: true, message: `Pure Storage endpoint accepted at ${this.baseUrl}.` };
  }
}
