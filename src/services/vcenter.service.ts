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
      // Try vCenter REST API
      let response = await this.client.get('/api', { timeout: 10000 });
      if (response.status >= 200 && response.status < 300) {
        return { ok: true, message: `vCenter endpoint accepted at ${this.baseUrl}.` };
      }
      
      // If /api returns 400+, try alternative endpoints for ESXi
      if (response.status >= 400) {
        // Try SDK endpoint (SOAP-based)
        response = await this.client.get('/sdk', { timeout: 10000 });
        if (response.status === 200) {
          return { ok: true, message: `ESXi SDK endpoint available at ${this.baseUrl}` };
        }
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      throw new Error(`vCenter connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async fetchInventory() {
    try {
      let response = await this.client.get('/rest/vcenter/vm', { timeout: 10000 });
      if (response.status >= 200 && response.status < 300 && Array.isArray(response.data)) {
        return response.data;
      }
      response = await this.client.get('/api/vcenter/vm', { timeout: 10000 });
      if (response.status >= 200 && response.status < 300 && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.warn('Failed to fetch vCenter inventory:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  async fetchHosts() {
    try {
      let response = await this.client.get('/rest/vcenter/host', { timeout: 10000 });
      if (response.status >= 200 && response.status < 300 && Array.isArray(response.data)) {
        return response.data;
      }
      response = await this.client.get('/api/vcenter/host', { timeout: 10000 });
      if (response.status >= 200 && response.status < 300 && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.warn('Failed to fetch vCenter hosts:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  async fetchDatastores() {
    try {
      let response = await this.client.get('/rest/vcenter/datastore', { timeout: 10000 });
      if (response.status >= 200 && response.status < 300 && Array.isArray(response.data)) {
        return response.data;
      }
      response = await this.client.get('/api/vcenter/datastore', { timeout: 10000 });
      if (response.status >= 200 && response.status < 300 && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.warn('Failed to fetch vCenter datastores:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }
}
