import axios, { type Axios } from 'axios';
import validator from 'validator';
import { ConfigStore } from '../ConfigStore';
import { type ConfigStoreQuery, type Config } from '../types';

export type ConfiguConfigStoreConfiguration = {
  credentials: { org: string; token: string };
  endpoint?: string;
  source?: string;
};

export class ConfiguConfigStore extends ConfigStore {
  private client: Axios;
  constructor({ credentials, endpoint = `https://api.configu.com`, source = 'sdk' }: ConfiguConfigStoreConfiguration) {
    super('configu');

    this.client = axios.create({
      baseURL: endpoint,
      headers: {
        Org: credentials.org,
        Source: source,
      },
      responseType: 'json',
    });

    if (validator.isJWT(credentials.token)) {
      this.client.defaults.headers.common.Authorization = `Bearer ${credentials.token}`;
    } else {
      this.client.defaults.headers.common.Token = credentials.token;
    }
  }

  async get(queries: ConfigStoreQuery[]): Promise<Config[]> {
    const { data } = await this.client.post('/config', { queries });
    return data;
  }

  async set(configs: Config[]): Promise<void> {
    const response = await this.client.put('/config', { configs });
    if (response.status === 202) {
      const protectedSet = response.data.diff.pending[0].set;
      throw new Error(
        `The ConfigSet '${protectedSet}' is protected; your change will be reviewed by an admin. Please contact your admin to approve your request using the following link: ${response.data.queueUrl}?sp=${protectedSet}`,
      );
    }
  }
}
