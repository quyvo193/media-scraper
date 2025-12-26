import { Media } from '@/types';
import { useState, useEffect } from 'react';

interface MediaCardProps {
  media: Media;
}

/**
 * Safely extract hostname from URL
 */
function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * MediaCard Component
 * Displays a single media item (image or video)
 */
export function MediaCard({ media }: MediaCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Load image using Image API for better reliability
  useEffect(() => {
    if (media.type === 'image') {
      setIsLoading(true);
      setHasError(false);

      const img = new Image();

      img.onload = () => {
        setIsLoading(false);
      };

      img.onerror = () => {
        setIsLoading(false);
        setHasError(true);
      };

      img.src = media.mediaUrl;

      // Cleanup
      return () => {
        img.onload = null;
        img.onerror = null;
      };
    } else {
      // For videos, rely on onLoadedData event
      setIsLoading(true);
      setHasError(false);
    }
  }, [media.mediaUrl, media.type]);

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg">
      {/* Media Display */}
      <div className="relative min-h-[200px] max-h-[400px] overflow-hidden bg-gray-100">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-4 text-center z-10">
            <svg
              className="mb-2 h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-sm text-gray-500">Failed to load media</p>
          </div>
        )}

        {media.type === 'image' ? (
          <img
            src={media.mediaUrl}
            alt={media.title || 'Scraped image'}
            className={`w-full h-full object-contain transition-all duration-300 group-hover:scale-105 ${
              isLoading || hasError ? 'opacity-0' : 'opacity-100'
            }`}
            style={{ maxHeight: '400px' }}
          />
        ) : (
          <video
            src={media.mediaUrl}
            className={`w-full h-full object-contain ${
              isLoading || hasError ? 'opacity-0' : 'opacity-100'
            }`}
            style={{ maxHeight: '400px' }}
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
            controls
            preload="metadata"
          />
        )}

        {/* Type Badge */}
        <div className="absolute left-2 top-2">
          <span
            className={`rounded px-2 py-1 text-xs font-medium text-white ${
              media.type === 'image' ? 'bg-blue-500' : 'bg-purple-500'
            }`}
          >
            {media.type}
          </span>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <a
              href={media.mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm font-medium text-white hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <svg
                className="mr-1 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Open
            </a>
          </div>
        </div>
      </div>

      <div className="p-3">
        {media.title && (
          <h3
            className="mb-1 truncate text-sm font-medium text-gray-900"
            title={media.title}
          >
            {media.title}
          </h3>
        )}
        <p className="truncate text-xs text-gray-500" title={media.sourceUrl}>
          Source: {getHostname(media.sourceUrl)}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          {new Date(media.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

