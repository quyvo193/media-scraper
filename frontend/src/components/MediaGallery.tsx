import { Media } from '@/types';
import { MediaCard } from './MediaCard';

interface MediaGalleryProps {
  media: Media[];
  isLoading?: boolean;
  isEmpty?: boolean;
}

/**
 * MediaGallery Component
 * Displays a grid of media items
 */
export function MediaGallery({
  media,
  isLoading = false,
  isEmpty = false,
}: MediaGalleryProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="min-h-[200px] bg-gray-200" />
            <div className="p-3">
              <div className="mb-2 h-4 rounded bg-gray-200" />
              <div className="h-3 w-2/3 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-1/2 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (isEmpty || media.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <svg
          className="mb-4 h-16 w-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          No media found
        </h3>
        <p className="text-sm text-gray-500">
          Start by submitting URLs to scrape or try adjusting your filters.
        </p>
      </div>
    );
  }

  // Gallery grid
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {media.map((item) => (
        <MediaCard key={item.id} media={item} />
      ))}
    </div>
  );
}

