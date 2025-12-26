import axios, { AxiosInstance } from 'axios';
import type {
  Media,
  ScrapeJob,
  PaginatedResponse,
  ApiResponse,
  ScrapeRequest,
  ScrapeJobResponse,
  QueueStats,
  MediaFilters,
  JobFilters,
} from '@/types';

/**
 * Transform snake_case API response to camelCase
 */
function transformMedia(data: any): Media {
  return {
    id: data.id,
    jobId: data.job_id,
    sourceUrl: data.source_url,
    mediaUrl: data.media_url,
    type: data.type,
    title: data.title,
    createdAt: data.created_at,
  };
}

function transformJob(data: any): ScrapeJob {
  return {
    id: data.id,
    userId: data.user_id,
    urls: data.urls,
    status: data.status,
    createdAt: data.created_at,
    completedAt: data.completed_at,
    media: data.media?.map(transformMedia),
    mediaCount: data.media_count,
  };
}

/**
 * API Client for Media Scraper Backend
 */
class ApiClient {
  private client: AxiosInstance;
  private username: string | null = null;
  private password: string | null = null;

  constructor() {
    // Get API URL from environment or use default
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add Basic Auth to every request
    this.client.interceptors.request.use((config) => {
      if (this.username && this.password) {
        const credentials = btoa(`${this.username}:${this.password}`);
        config.headers.Authorization = `Basic ${credentials}`;
      }
      return config;
    });

    // Handle errors globally
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // Server responded with error status
          console.error('API Error:', error.response.data);
        } else if (error.request) {
          // Request made but no response
          console.error('Network Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Set authentication credentials
   */
  setCredentials(username: string, password: string) {
    this.username = username;
    this.password = password;
  }

  /**
   * Clear authentication credentials
   */
  clearCredentials() {
    this.username = null;
    this.password = null;
  }

  /**
   * Get paginated media
   */
  async getMedia(filters?: MediaFilters): Promise<PaginatedResponse<Media>> {
    const params = new URLSearchParams();

    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.search) params.append('search', filters.search);

    const response = await this.client.get<any>(
      `/api/media?${params.toString()}`
    );

    // Transform snake_case to camelCase
    return {
      ...response.data,
      data: response.data.data.map(transformMedia),
    };
  }

  /**
   * Get media by ID
   */
  async getMediaById(id: number): Promise<ApiResponse<Media>> {
    const response = await this.client.get<any>(`/api/media/${id}`);

    // Transform snake_case to camelCase
    return {
      ...response.data,
      data: transformMedia(response.data.data),
    };
  }

  /**
   * Submit URLs for scraping
   */
  async submitScrapeJob(urls: string[]): Promise<ApiResponse<ScrapeJobResponse>> {
    const response = await this.client.post<ApiResponse<ScrapeJobResponse>>('/api/scrape', {
      urls,
    } as ScrapeRequest);
    return response.data;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<ApiResponse<QueueStats>> {
    const response = await this.client.get<ApiResponse<QueueStats>>('/api/scrape/queue/stats');
    return response.data;
  }

  /**
   * Get paginated jobs
   */
  async getJobs(filters?: JobFilters): Promise<PaginatedResponse<ScrapeJob>> {
    const params = new URLSearchParams();

    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.status) params.append('status', filters.status);

    const response = await this.client.get<any>(
      `/api/jobs?${params.toString()}`
    );

    // Transform snake_case to camelCase
    return {
      ...response.data,
      data: response.data.data.map(transformJob),
    };
  }

  /**
   * Get job by ID
   */
  async getJobById(id: number): Promise<ApiResponse<ScrapeJob>> {
    const response = await this.client.get<any>(`/api/jobs/${id}`);

    // Transform snake_case to camelCase
    return {
      ...response.data,
      data: transformJob(response.data.data),
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    const response = await this.client.get<ApiResponse<{ status: string; timestamp: string }>>(
      '/health'
    );
    return response.data;
  }
}

// Export singleton instance
export const api = new ApiClient();

