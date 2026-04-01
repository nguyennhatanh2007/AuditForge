import axios, { AxiosInstance } from 'axios';

export class UnityService {
  private client: AxiosInstance;

  constructor(
    private readonly baseUrl: string,
    private readonly username?: string,
    private readonly password?: string
  ) {
    this.client = axios.create({
      baseURL: this.baseUrl,
      auth: username && password ? { username, password } : undefined,
      timeout: 30000,
      validateStatus: (status) => status < 500,
      httpsAgent: { rejectUnauthorized: false } as any,
    });
  }

  async testConnection() {
    try {
      const response = await this.client.get('/api/types', { timeout: 10000 });
      if (response.status === 200) {
        return { ok: true, message: `Dell Unity endpoint accepted at ${this.baseUrl}.` };
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      throw new Error(`Unity connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async fetchSystems() {
    try {
      const response = await this.client.get('/api/instances/system');
      if (response.status === 200 && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch Unity systems:', error);
      return [];
    }
  }

  async fetchPools() {
    try {
      const response = await this.client.get('/api/instances/pool');
      if (response.status === 200 && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch Unity pools:', error);
      return [];
    }
  }

  async fetchLUNs() {
    try {
      const response = await this.client.get('/api/instances/lun');
      if (response.status === 200 && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch Unity LUNs:', error);
      return [];
    }
  }
}
