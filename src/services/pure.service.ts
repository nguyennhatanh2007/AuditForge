import { logger } from '@/lib/logger';
import { createStorageClient, fetchPagedList } from '@/services/storage-http';
import type { AxiosInstance } from 'axios';

export class PureService {
  private client: AxiosInstance;
  private readonly username?: string;
  private readonly secret?: string;

  constructor(
    private readonly baseUrl: string,
    usernameOrToken?: string,
    password?: string
  ) {
    if (password) {
      this.username = usernameOrToken;
      this.secret = password;
    } else {
      this.secret = usernameOrToken;
    }

    this.client = createStorageClient({
      baseURL: this.baseUrl,
      username: this.username,
      password: this.secret,
      tokenHeader: 'X-Auth-Token',
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
    logger.debug('Fetching Pure arrays', { baseUrl: this.baseUrl, endpoint: '/api/2.0/arrays' });
    const records = await fetchPagedList(this.client, {
      endpoint: '/api/2.0/arrays',
      mode: 'none',
    });
    logger.debug('Fetched Pure arrays', { baseUrl: this.baseUrl, count: records.length });
    return records;
  }

  async fetchVolumes() {
    logger.debug('Fetching Pure volumes', { baseUrl: this.baseUrl, endpoint: '/api/2.0/volumes' });
    const records = await fetchPagedList(this.client, {
      endpoint: '/api/2.0/volumes',
      mode: 'token',
      tokenParam: 'continuation_token',
      tokenFields: ['continuation_token', 'next_token', 'nextToken'],
    });
    logger.debug('Fetched Pure volumes', { baseUrl: this.baseUrl, count: records.length });
    return records;
  }

  async fetchHosts() {
    logger.debug('Fetching Pure hosts', { baseUrl: this.baseUrl, endpoint: '/api/2.0/hosts' });
    const records = await fetchPagedList(this.client, {
      endpoint: '/api/2.0/hosts',
      mode: 'token',
      tokenParam: 'continuation_token',
      tokenFields: ['continuation_token', 'next_token', 'nextToken'],
    });
    logger.debug('Fetched Pure hosts', { baseUrl: this.baseUrl, count: records.length });
    return records;
  }

  async fetchVolumeGroups() {
    logger.debug('Fetching Pure volume groups', { baseUrl: this.baseUrl, endpoint: '/api/2.0/volume-groups' });
    const records = await fetchPagedList(this.client, {
      endpoint: '/api/2.0/volume-groups',
      mode: 'token',
      tokenParam: 'continuation_token',
      tokenFields: ['continuation_token', 'next_token', 'nextToken'],
    });
    logger.debug('Fetched Pure volume groups', { baseUrl: this.baseUrl, count: records.length });
    return records;
  }

  async fetchLUNs() {
    return this.fetchVolumes();
  }
}
