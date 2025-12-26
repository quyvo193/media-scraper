import { useState, FormEvent } from 'react';
import { useSubmitScrapeJob } from '@/lib/hooks';

/**
 * ScrapeForm Component
 * Form for submitting URLs to scrape
 */
export function ScrapeForm() {
  const [urls, setUrls] = useState('');
  const [validationError, setValidationError] = useState('');

  const { mutate: submitJob, isPending, isSuccess, isError, data } = useSubmitScrapeJob();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Parse and validate URLs
    const urlList = urls
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urlList.length === 0) {
      setValidationError('Please enter at least one URL');
      return;
    }

    if (urlList.length > 100) {
      setValidationError('Maximum 100 URLs allowed at once');
      return;
    }

    // Validate URL format
    const invalidUrls = urlList.filter((url) => {
      try {
        new URL(url);
        return false;
      } catch {
        return true;
      }
    });

    if (invalidUrls.length > 0) {
      setValidationError(`Invalid URL format: ${invalidUrls[0]}`);
      return;
    }

    // Submit the job
    submitJob(urlList, {
      onSuccess: () => {
        // Clear form on success
        setUrls('');
      },
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">Scrape URLs</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="urls" className="block text-sm font-medium text-gray-700 mb-2">
            Enter URLs (one per line)
          </label>
          <textarea
            id="urls"
            rows={6}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com&#10;https://news.ycombinator.com&#10;https://github.com"
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            disabled={isPending}
          />
          <p className="mt-2 text-xs text-gray-500">
            Maximum 100 URLs. Each URL must start with http:// or https://
          </p>
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
            <div className="flex items-center">
              <svg className="mr-2 h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {validationError}
            </div>
          </div>
        )}

        {/* API Error */}
        {isError && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
            <div className="flex items-center">
              <svg className="mr-2 h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              Failed to submit scrape job. Please try again.
            </div>
          </div>
        )}

        {/* Success Message */}
        {isSuccess && data && (
          <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-800">
            <div className="flex items-center">
              <svg
                className="mr-2 h-5 w-5 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <strong>Success!</strong> Job #{data.data.job_id} created with {data.data.total_urls} URLs.
                <br />
                <span className="text-xs">Processing in background. Refresh to see results.</span>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || urls.trim().length === 0}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {isPending ? (
            <span className="flex items-center justify-center">
              <svg
                className="mr-2 h-5 w-5 animate-spin text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Submitting...
            </span>
          ) : (
            'Start Scraping'
          )}
        </button>
      </form>
    </div>
  );
}

