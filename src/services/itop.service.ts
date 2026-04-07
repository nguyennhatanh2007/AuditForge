import axios, { AxiosInstance } from 'axios';
import { logger } from '@/lib/logger';

export class ItopService {
  private client: AxiosInstance;
  private readonly token?: string;

  constructor(
    private readonly baseUrl: string = 'http://localhost:8080',
    private readonly username?: string,
    private readonly password?: string,
    token?: string
  ) {
    this.token = token;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      validateStatus: (status) => status < 500,
    });
  }

  async testConnection() {
    try {
      // Try to fetch any class to test connectivity
      const response = await this.client.post('/webservices/rest.php', this.buildQuery('Server'), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000,
      });

      if (response.status >= 200 && response.status < 300) {
        // Check for error in response data
        if (response.data?.code === 0) {
          return { ok: true, message: 'iTop connection successful.' };
        }
        throw new Error(`HTTP ${response.status} - ${response.data?.message || 'Connection check failed'}`);
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      throw new Error(`iTop connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async fetchInventory() {
    try {
      const response = await this.client.post('/webservices/rest.php', this.buildQuery('Server'), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (response.status >= 200 && response.status < 300 && response.data?.objects) {
        return Object.values(response.data.objects);
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch iTop inventory:', error);
      return [];
    }
  }

  async fetchCIs() {
    try {
      const response = await this.client.post('/webservices/rest.php', this.buildQuery('CI'), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (response.status >= 200 && response.status < 300 && response.data?.objects) {
        return Object.values(response.data.objects);
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch iTop CIs:', error);
      return [];
    }
  }

  async fetchServers() {
    try {
      const response = await this.client.post('/webservices/rest.php', this.buildQuery('Server'), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (response.status >= 200 && response.status < 300 && response.data?.objects) {
        return Object.values(response.data.objects);
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch iTop servers:', error);
      return [];
    }
  }

  async fetchVirtualMachines() {
    try {
      const response = await this.client.post('/webservices/rest.php', this.buildQuery('VirtualMachine'), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (response.status >= 200 && response.status < 300 && response.data?.objects) {
        return Object.values(response.data.objects);
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch iTop VMs:', error);
      return [];
    }
  }

  async fetchLogicalVolumes() {
    try {
      const response = await this.client.post('/webservices/rest.php', this.buildQuery('LogicalVolume'), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (response.status >= 200 && response.status < 300 && response.data?.objects) {
        return Object.values(response.data.objects);
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch iTop logical volumes:', error);
      return [];
    }
  }

  async fetchApplicationInstances() {
    try {
      const response = await this.client.post('/webservices/rest.php', this.buildQuery('ApplicationInstance'), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (response.status >= 200 && response.status < 300 && response.data?.objects) {
        return Object.values(response.data.objects);
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch iTop application instances:', error);
      return [];
    }
  }

  async updateVirtualMachine(key: string, fields: Record<string, string | number | null | undefined>) {
    return this.updateObject('VirtualMachine', key, fields);
  }

  async updateServer(key: string, fields: Record<string, string | number | null | undefined>) {
    return this.updateObject('Server', key, fields);
  }

  async updateLogicalVolume(key: string, fields: Record<string, string | number | null | undefined>) {
    return this.updateObject('LogicalVolume', key, fields);
  }

  async updateObject(className: string, key: string, fields: Record<string, string | number | null | undefined>) {
    try {
      if (!key) {
        throw new Error(`Thiếu khóa đối tượng cần cập nhật cho ${className}.`);
      }

      const filteredFields = Object.fromEntries(
        Object.entries(fields).filter(([, value]) => value !== undefined),
      ) as Record<string, string | number | null>;

      if (Object.keys(filteredFields).length === 0) {
        throw new Error(`Không có trường nào để cập nhật cho ${className} (${key}).`);
      }

      logger.debug('iTop update started', { className, key, fieldCount: Object.keys(filteredFields).length });
      const response = await this.client.post('/webservices/rest.php', this.buildQuery(className, {
        operation: 'core/update',
        key,
        fields: filteredFields,
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (response.status >= 200 && response.status < 300) {
        if (response.data?.code === 0) {
          logger.debug('iTop update finished', { className, key, status: response.status });
          return response.data;
        }

        throw new Error(response.data?.message || `iTop từ chối cập nhật ${className} (${key}).`);
      }

      throw new Error(`HTTP ${response.status} khi cập nhật ${className} (${key}).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('iTop update failed', { className, key, message });
      throw new Error(`Không thể cập nhật iTop cho ${className} (${key}): ${message}`);
    }
  }

  private buildQuery(className: string, overrides?: Record<string, unknown>) {
    const jsonData: Record<string, string> = {
      operation: 'core/get',
      class: className,
      key: 'SELECT ' + className,
      output_fields: '*',
    };

    if (overrides) {
      Object.assign(jsonData, overrides);
    }

    // Build URLEncoded params with auth at top level
    const params: Record<string, string> = {
      version: '1.3',
      json_data: JSON.stringify(jsonData),
    };

    // Add authentication - at URL level, not inside json_data
    if (this.token) {
      params.auth_token = this.token;
    } else {
      params.auth_user = this.username || '';
      params.auth_pwd = this.password || '';
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, value);
    });

    return searchParams.toString();
  }
}
