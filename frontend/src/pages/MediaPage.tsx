import { Suspense } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MediaPageContent } from '@/components/MediaPageContent';

export function MediaPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
              <p className="text-gray-600">Loading media gallery...</p>
            </div>
          </div>
        }
      >
        <MediaPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}

