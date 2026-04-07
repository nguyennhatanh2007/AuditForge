import { logger } from '@/lib/logger';
import { createStorageClient, fetchPagedList } from '@/services/storage-http';
import type { AxiosInstance } from 'axios';

export class UnityService {
  private client: AxiosInstance;

  constructor(
    private readonly baseUrl: string,
    private readonly username?: string,
    private readonly password?: string
  ) {
    this.client = createStorageClient({
      baseURL: this.baseUrl,
      username,
      password,
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
    logger.debug('Fetching Unity systems', { baseUrl: this.baseUrl, endpoint: '/api/instances/system' });
    const records = await fetchPagedList(this.client, {
      endpoint: '/api/instances/system',
      mode: 'index',
      pageParam: 'page',
      pageSizeParam: 'per_page',
      pageSize: 200,
    });
    logger.debug('Fetched Unity systems', { baseUrl: this.baseUrl, count: records.length });
    return records;
  }

  async fetchPools() {
    logger.debug('Fetching Unity pools', { baseUrl: this.baseUrl, endpoint: '/api/instances/pool' });
    const records = await fetchPagedList(this.client, {
      endpoint: '/api/instances/pool',
      mode: 'index',
      pageParam: 'page',
      pageSizeParam: 'per_page',
      pageSize: 200,
    });
    logger.debug('Fetched Unity pools', { baseUrl: this.baseUrl, count: records.length });
    return records;
  }

  async fetchLUNs() {
    logger.debug('Fetching Unity LUNs', { baseUrl: this.baseUrl, endpoint: '/api/instances/lun' });
    const records = await fetchPagedList(this.client, {
      endpoint: '/api/instances/lun',
      mode: 'index',
      pageParam: 'page',
      pageSizeParam: 'per_page',
      pageSize: 200,
    });
    logger.debug('Fetched Unity LUNs', { baseUrl: this.baseUrl, count: records.length });
    return records;
  }

  async fetchHosts() {
    logger.debug('Fetching Unity hosts', { baseUrl: this.baseUrl, endpoint: '/api/instances/host' });
    const records = await fetchPagedList(this.client, {
      endpoint: '/api/instances/host',
      mode: 'index',
      pageParam: 'page',
      pageSizeParam: 'per_page',
      pageSize: 200,
    });
    logger.debug('Fetched Unity hosts', { baseUrl: this.baseUrl, count: records.length });
    return records;
  }
}
