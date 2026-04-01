import axios, { AxiosInstance } from 'axios';

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

  private buildQuery(class_name: string) {
    const jsonData: Record<string, string> = {
      operation: 'core/get',
      class: class_name,
      key: 'SELECT ' + class_name,
      output_fields: '*',
    };

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
