import axios, { type Axios } from 'axios';
import validator from 'validator';
import { ConfigStore } from '../ConfigStore';
import { type ConfigStoreQuery, type Config } from '../types';

export type ConfiguConfigStoreConfiguration = {
  credentials: { org: string; token: string };
  endpoint?: string;
  source?: string;
  tag?: string;
};

export class ConfiguConfigStore extends ConfigStore {
  private client: Axios;
  private tag?: string;
  constructor({
    credentials,
    endpoint = `https://api.configu.com`,
    source = 'sdk',
    tag,
  }: ConfiguConfigStoreConfiguration) {
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

    this.tag = tag;
  }

  async get(queries: ConfigStoreQuery[]): Promise<Config[]> {
    const { data } = await this.client.post(`/config${this.tag ? `?tag=${this.tag}` : ''}`, { queries });
    return data;
  }

  async set(configs: Config[]): Promise<void> {
    await this.client.put('/config', { configs });
  }
}
