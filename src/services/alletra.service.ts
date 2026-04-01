import axios, { AxiosInstance } from 'axios';

export class AlletraService {
  private client: AxiosInstance;

  constructor(
    private readonly baseUrl: string,
    private readonly clientId?: string,
    private readonly clientSecret?: string
  ) {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      validateStatus: (status) => status < 500,
      httpsAgent: { rejectUnauthorized: false } as any,
    });
  }

  async testConnection() {
    try {
      const response = await this.client.get('/api/v1/system', { timeout: 10000 });
      if (response.status === 200) {
        return { ok: true, message: `HPE Alletra endpoint accepted at ${this.baseUrl}.` };
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      throw new Error(`HPE Alletra connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async fetchSystems() {
    try {
      const response = await this.client.get('/api/v1/system');
      if (response.status === 200 && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch Alletra systems:', error);
      return [];
    }
  }

  async fetchVolumes() {
    try {
      const response = await this.client.get('/api/v1/volumes');
      if (response.status === 200 && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch Alletra volumes:', error);
      return [];
    }
  }

  async fetchArrays() {
    try {
      const response = await this.client.get('/api/v1/arrays');
      if (response.status === 200 && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch Alletra arrays:', error);
      return [];
    }
  }

  async fetchPools() {
    try {
      const response = await this.client.get('/api/v1/storage-pools');
      if (response.status === 200 && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch Alletra pools:', error);
      return [];
    }
  }
}
