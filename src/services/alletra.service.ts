import axios, { AxiosInstance } from 'axios';
import { logger } from '@/lib/logger';

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
      logger.debug('Alletra connection test started', { baseUrl: this.baseUrl, endpoint: '/api/v1/system' });
      const response = await this.client.get('/api/v1/system', { timeout: 10000 });
      logger.debug('Alletra connection test finished', { baseUrl: this.baseUrl, status: response.status });
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
      logger.debug('Fetching Alletra systems', { baseUrl: this.baseUrl, endpoint: '/api/v1/system' });
      const response = await this.client.get('/api/v1/system');
      if (response.status === 200 && Array.isArray(response.data)) {
        logger.debug('Fetched Alletra systems', { baseUrl: this.baseUrl, count: response.data.length });
        return response.data;
      }
      logger.debug('Alletra systems request returned non-array payload', { baseUrl: this.baseUrl, status: response.status });
      return [];
    } catch (error) {
      console.error('Failed to fetch Alletra systems:', error);
      return [];
    }
  }

  async fetchVolumes() {
    try {
      logger.debug('Fetching Alletra volumes', { baseUrl: this.baseUrl, endpoint: '/api/v1/volumes' });
      const response = await this.client.get('/api/v1/volumes');
      if (response.status === 200 && Array.isArray(response.data)) {
        logger.debug('Fetched Alletra volumes', { baseUrl: this.baseUrl, count: response.data.length });
        return response.data;
      }
      logger.debug('Alletra volumes request returned non-array payload', { baseUrl: this.baseUrl, status: response.status });
      return [];
    } catch (error) {
      console.error('Failed to fetch Alletra volumes:', error);
      return [];
    }
  }

  async fetchArrays() {
    try {
      logger.debug('Fetching Alletra arrays', { baseUrl: this.baseUrl, endpoint: '/api/v1/arrays' });
      const response = await this.client.get('/api/v1/arrays');
      if (response.status === 200 && Array.isArray(response.data)) {
        logger.debug('Fetched Alletra arrays', { baseUrl: this.baseUrl, count: response.data.length });
        return response.data;
      }
      logger.debug('Alletra arrays request returned non-array payload', { baseUrl: this.baseUrl, status: response.status });
      return [];
    } catch (error) {
      console.error('Failed to fetch Alletra arrays:', error);
      return [];
    }
  }

  async fetchPools() {
    try {
      logger.debug('Fetching Alletra pools', { baseUrl: this.baseUrl, endpoint: '/api/v1/storage-pools' });
      const response = await this.client.get('/api/v1/storage-pools');
      if (response.status === 200 && Array.isArray(response.data)) {
        logger.debug('Fetched Alletra pools', { baseUrl: this.baseUrl, count: response.data.length });
        return response.data;
      }
      logger.debug('Alletra pools request returned non-array payload', { baseUrl: this.baseUrl, status: response.status });
      return [];
    } catch (error) {
      console.error('Failed to fetch Alletra pools:', error);
      return [];
    }
  }

  async fetchLUNs() {
    return this.fetchVolumes();
  }
}
