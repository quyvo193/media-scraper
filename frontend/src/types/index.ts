/**
 * Type definitions for Media Scraper API
 */

export interface Media {
  id: number;
  jobId: number;
  sourceUrl: string;
  mediaUrl: string;
  type: 'image' | 'video';
  title: string | null;
  createdAt: string;
}

export interface ScrapeJob {
  id: number;
  userId: number | null;
  urls: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt: string | null;
  media?: Media[];
  mediaCount?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ScrapeRequest {
  urls: string[];
}

export interface ScrapeJobResponse {
  job_id: number;
  status: string;
  total_urls: number;
  created_at: string;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

export interface MediaFilters {
  page?: number;
  limit?: number;
  type?: 'image' | 'video';
  search?: string;
}

export interface JobFilters {
  page?: number;
  limit?: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}

