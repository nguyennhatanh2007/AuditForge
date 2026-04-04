import axios, { AxiosInstance } from 'axios';
import { logger } from '@/lib/logger';

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
      logger.debug('Pure connection test started', { baseUrl: this.baseUrl, endpoint: '/api/2.0/app/info' });
      const response = await this.client.get('/api/2.0/app/info', { timeout: 10000 });
      logger.debug('Pure connection test finished', { baseUrl: this.baseUrl, status: response.status });
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
      logger.debug('Fetching Pure arrays', { baseUrl: this.baseUrl, endpoint: '/api/2.0/arrays' });
      const response = await this.client.get('/api/2.0/arrays');
      if (response.status === 200 && Array.isArray(response.data)) {
        logger.debug('Fetched Pure arrays', { baseUrl: this.baseUrl, count: response.data.length });
        return response.data;
      }
      logger.debug('Pure arrays request returned non-array payload', { baseUrl: this.baseUrl, status: response.status });
      return [];
    } catch (error) {
      console.error('Failed to fetch Pure arrays:', error);
      return [];
    }
  }

  async fetchVolumes() {
    try {
      logger.debug('Fetching Pure volumes', { baseUrl: this.baseUrl, endpoint: '/api/2.0/volumes' });
      const response = await this.client.get('/api/2.0/volumes');
      if (response.status === 200 && Array.isArray(response.data)) {
        logger.debug('Fetched Pure volumes', { baseUrl: this.baseUrl, count: response.data.length });
        return response.data;
      }
      logger.debug('Pure volumes request returned non-array payload', { baseUrl: this.baseUrl, status: response.status });
      return [];
    } catch (error) {
      console.error('Failed to fetch Pure volumes:', error);
      return [];
    }
  }

  async fetchHosts() {
    try {
      logger.debug('Fetching Pure hosts', { baseUrl: this.baseUrl, endpoint: '/api/2.0/hosts' });
      const response = await this.client.get('/api/2.0/hosts');
      if (response.status === 200 && Array.isArray(response.data)) {
        logger.debug('Fetched Pure hosts', { baseUrl: this.baseUrl, count: response.data.length });
        return response.data;
      }
      logger.debug('Pure hosts request returned non-array payload', { baseUrl: this.baseUrl, status: response.status });
      return [];
    } catch (error) {
      console.error('Failed to fetch Pure hosts:', error);
      return [];
    }
  }

  async fetchVolumeGroups() {
    try {
      logger.debug('Fetching Pure volume groups', { baseUrl: this.baseUrl, endpoint: '/api/2.0/volume-groups' });
      const response = await this.client.get('/api/2.0/volume-groups');
      if (response.status === 200 && Array.isArray(response.data)) {
        logger.debug('Fetched Pure volume groups', { baseUrl: this.baseUrl, count: response.data.length });
        return response.data;
      }
      logger.debug('Pure volume groups request returned non-array payload', { baseUrl: this.baseUrl, status: response.status });
      return [];
    } catch (error) {
      console.error('Failed to fetch Pure volume groups:', error);
      return [];
    }
  }

  async fetchLUNs() {
    return this.fetchVolumes();
  }
}
