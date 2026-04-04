import axios, { AxiosInstance } from 'axios';
import { logger } from '@/lib/logger';

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
      logger.debug('Unity connection test started', { baseUrl: this.baseUrl, endpoint: '/api/types' });
      const response = await this.client.get('/api/types', { timeout: 10000 });
      logger.debug('Unity connection test finished', { baseUrl: this.baseUrl, status: response.status });
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
      logger.debug('Fetching Unity systems', { baseUrl: this.baseUrl, endpoint: '/api/instances/system' });
      const response = await this.client.get('/api/instances/system');
      if (response.status === 200 && Array.isArray(response.data)) {
        logger.debug('Fetched Unity systems', { baseUrl: this.baseUrl, count: response.data.length });
        return response.data;
      }
      logger.debug('Unity systems request returned non-array payload', { baseUrl: this.baseUrl, status: response.status });
      return [];
    } catch (error) {
      console.error('Failed to fetch Unity systems:', error);
      return [];
    }
  }

  async fetchPools() {
    try {
      logger.debug('Fetching Unity pools', { baseUrl: this.baseUrl, endpoint: '/api/instances/pool' });
      const response = await this.client.get('/api/instances/pool');
      if (response.status === 200 && Array.isArray(response.data)) {
        logger.debug('Fetched Unity pools', { baseUrl: this.baseUrl, count: response.data.length });
        return response.data;
      }
      logger.debug('Unity pools request returned non-array payload', { baseUrl: this.baseUrl, status: response.status });
      return [];
    } catch (error) {
      console.error('Failed to fetch Unity pools:', error);
      return [];
    }
  }

  async fetchLUNs() {
    try {
      logger.debug('Fetching Unity LUNs', { baseUrl: this.baseUrl, endpoint: '/api/instances/lun' });
      const response = await this.client.get('/api/instances/lun');
      if (response.status === 200 && Array.isArray(response.data)) {
        logger.debug('Fetched Unity LUNs', { baseUrl: this.baseUrl, count: response.data.length });
        return response.data;
      }
      logger.debug('Unity LUN request returned non-array payload', { baseUrl: this.baseUrl, status: response.status });
      return [];
    } catch (error) {
      console.error('Failed to fetch Unity LUNs:', error);
      return [];
    }
  }

  async fetchHosts() {
    try {
      logger.debug('Fetching Unity hosts', { baseUrl: this.baseUrl, endpoint: '/api/instances/host' });
      const response = await this.client.get('/api/instances/host');
      if (response.status === 200 && Array.isArray(response.data)) {
        logger.debug('Fetched Unity hosts', { baseUrl: this.baseUrl, count: response.data.length });
        return response.data;
      }
      logger.debug('Unity hosts request returned non-array payload', { baseUrl: this.baseUrl, status: response.status });
      return [];
    } catch (error) {
      console.error('Failed to fetch Unity hosts:', error);
      return [];
    }
  }
}
