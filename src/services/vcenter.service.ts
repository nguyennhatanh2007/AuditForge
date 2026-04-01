import axios, { AxiosInstance } from 'axios';
import https from 'https';

export class VcenterService {
  private client: AxiosInstance;

  constructor(
    private readonly baseUrl: string,
    private readonly username?: string,
    private readonly password?: string
  ) {
    // Create HTTPS agent that ignores self-signed certificates
    // Required for ESXi hosts which use self-signed SSL certificates
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    this.client = axios.create({
      baseURL: this.baseUrl,
      auth: username && password ? { username, password } : undefined,
      timeout: 30000,
      validateStatus: (status) => status < 500,
      httpsAgent,
    });
  }

  async testConnection() {
    try {
      const response = await this.client.get('/api', { timeout: 10000 });
      if (response.status >= 200 && response.status < 300) {
        return { ok: true, message: `vCenter endpoint accepted at ${this.baseUrl}.` };
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      throw new Error(`vCenter connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async fetchInventory() {
    try {
      const response = await this.client.get('/rest/vcenter/vm');
      if (response.status >= 200 && response.status < 300 && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch vCenter inventory:', error);
      return [];
    }
  }

  async fetchHosts() {
    try {
      const response = await this.client.get('/rest/vcenter/host');
      if (response.status >= 200 && response.status < 300 && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch vCenter hosts:', error);
      return [];
    }
  }

  async fetchDatastores() {
    try {
      const response = await this.client.get('/rest/vcenter/datastore');
      if (response.status >= 200 && response.status < 300 && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch vCenter datastores:', error);
      return [];
    }
  }
}
