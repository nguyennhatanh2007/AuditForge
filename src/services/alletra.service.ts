import { logger } from '@/lib/logger';
import { createStorageClient, fetchPagedList } from '@/services/storage-http';
import type { AxiosInstance } from 'axios';

export class AlletraService {
  private client: AxiosInstance;

  constructor(
    private readonly baseUrl: string,
    private readonly clientId?: string,
    private readonly clientSecret?: string
  ) {
    this.client = createStorageClient({
      baseURL: this.baseUrl,
      username: clientId,
      password: clientSecret,
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
    logger.debug('Fetching Alletra systems', { baseUrl: this.baseUrl, endpoint: '/api/v1/system' });
    const records = await fetchPagedList(this.client, {
      endpoint: '/api/v1/system',
      mode: 'none',
    });
    logger.debug('Fetched Alletra systems', { baseUrl: this.baseUrl, count: records.length });
    return records;
  }

  async fetchVolumes() {
    logger.debug('Fetching Alletra volumes', { baseUrl: this.baseUrl, endpoint: '/api/v1/volumes' });
    const records = await fetchPagedList(this.client, {
      endpoint: '/api/v1/volumes',
      mode: 'index',
      pageParam: 'page',
      pageSizeParam: 'limit',
      pageSize: 200,
    });
    logger.debug('Fetched Alletra volumes', { baseUrl: this.baseUrl, count: records.length });
    return records;
  }

  async fetchArrays() {
    logger.debug('Fetching Alletra arrays', { baseUrl: this.baseUrl, endpoint: '/api/v1/arrays' });
    const records = await fetchPagedList(this.client, {
      endpoint: '/api/v1/arrays',
      mode: 'none',
    });
    logger.debug('Fetched Alletra arrays', { baseUrl: this.baseUrl, count: records.length });
    return records;
  }

  async fetchPools() {
    logger.debug('Fetching Alletra pools', { baseUrl: this.baseUrl, endpoint: '/api/v1/storage-pools' });
    const records = await fetchPagedList(this.client, {
      endpoint: '/api/v1/storage-pools',
      mode: 'index',
      pageParam: 'page',
      pageSizeParam: 'limit',
      pageSize: 200,
    });
    logger.debug('Fetched Alletra pools', { baseUrl: this.baseUrl, count: records.length });
    return records;
  }

  async fetchLUNs() {
    return this.fetchVolumes();
  }
}
