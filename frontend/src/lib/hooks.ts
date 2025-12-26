import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { MediaFilters, JobFilters } from '@/types';

/**
 * Custom hooks for API calls using React Query
 */

/**
 * Fetch paginated media
 */
export function useMedia(filters?: MediaFilters) {
  return useQuery({
    queryKey: ['media', filters],
    queryFn: () => api.getMedia(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch media by ID
 */
export function useMediaById(id: number) {
  return useQuery({
    queryKey: ['media', id],
    queryFn: () => api.getMediaById(id),
    enabled: !!id,
  });
}

/**
 * Submit scrape job mutation
 */
export function useSubmitScrapeJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (urls: string[]) => api.submitScrapeJob(urls),
    onSuccess: () => {
      // Invalidate jobs query to refetch
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    },
  });
}

/**
 * Fetch queue statistics
 */
export function useQueueStats() {
  return useQuery({
    queryKey: ['queue-stats'],
    queryFn: () => api.getQueueStats(),
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });
}

/**
 * Fetch paginated jobs
 */
export function useJobs(filters?: JobFilters) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => api.getJobs(filters),
    refetchInterval: 10000, // Refetch every 10 seconds to track job status
  });
}

/**
 * Fetch job by ID
 */
export function useJobById(id: number) {
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: () => api.getJobById(id),
    enabled: !!id,
    refetchInterval: 5000, // Refetch every 5 seconds while job is processing
  });
}

/**
 * Health check
 */
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.healthCheck(),
    refetchInterval: 60000, // Check every minute
  });
}

