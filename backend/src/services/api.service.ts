import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL, MUNICIPALITY_ID } from '@config';
import { HttpException } from '@/exceptions/HttpException';
import { logger } from '@/utils/logger';

class ApiService {
  private client: AxiosInstance;
  private municipalityId: string;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30_000,
      headers: { 'Content-Type': 'application/json' },
    });
    this.municipalityId = MUNICIPALITY_ID || '2281';
  }

  private path(resource: string): string {
    const trimmed = resource.startsWith('/') ? resource.slice(1) : resource;
    return `/${this.municipalityId}/${trimmed}`;
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const res: AxiosResponse<T> = await this.client.request(config);
      return res.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const status = err.response.status;
        const data = err.response.data as { message?: string; title?: string; detail?: string } | undefined;
        const msg = data?.detail || data?.message || data?.title || err.message;
        logger.error(`api-service ${status} ${config.method} ${config.url}: ${msg}`);
        throw new HttpException(status, msg, data);
      }
      logger.error(`api-service request failed: ${(err as Error).message}`);
      throw new HttpException(502, 'Failed to reach api-service-systemregister');
    }
  }

  get<T>(resource: string, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>({ method: 'GET', url: this.path(resource), params });
  }

  post<T>(resource: string, data?: unknown): Promise<T> {
    return this.request<T>({ method: 'POST', url: this.path(resource), data });
  }

  put<T>(resource: string, data?: unknown): Promise<T> {
    return this.request<T>({ method: 'PUT', url: this.path(resource), data });
  }

  patch<T>(resource: string, data?: unknown): Promise<T> {
    return this.request<T>({ method: 'PATCH', url: this.path(resource), data });
  }

  delete<T>(resource: string): Promise<T> {
    return this.request<T>({ method: 'DELETE', url: this.path(resource) });
  }
}

export const apiService = new ApiService();
export default ApiService;
