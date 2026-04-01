import axios, { AxiosInstance } from 'axios';

export class PureService {
  private client: AxiosInstance;

  constructor(
    private readonly baseUrl: string,
    private readonly apiToken?: string
  ) {
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: apiToken ? { 'X-Auth-Token': apiToken } : {},
      timeout: 30000,
      validateStatus: (status) => status < 500,
      httpsAgent: { rejectUnauthorized: false } as any,
    });
  }

  async testConnection() {
    try {
      const response = await this.client.get('/api/2.0/app/info', { timeout: 10000 });
      if (response.status === 200) {
        return { ok: true, message: `Pure Storage endpoint accepted at ${this.baseUrl}.` };
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      throw new Error(`Pure Storage connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async fetchArrays() {
    try {
      const response = await this.client.get('/api/2.0/arrays');
      if (response.status === 200 && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch Pure arrays:', error);
      return [];
    }
  }

  async fetchVolumes() {
    try {
      const response = await this.client.get('/api/2.0/volumes');
      if (response.status === 200 && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch Pure volumes:', error);
      return [];
    }
  }

  async fetchHosts() {
    try {
      const response = await this.client.get('/api/2.0/hosts');
      if (response.status === 200 && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch Pure hosts:', error);
      return [];
    }
  }

  async fetchVolumeGroups() {
    try {
      const response = await this.client.get('/api/2.0/volume-groups');
      if (response.status === 200 && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch Pure volume groups:', error);
      return [];
    }
  }
}
