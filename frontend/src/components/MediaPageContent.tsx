import { useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useMedia } from "@/lib/hooks";
import { useAuth } from "@/contexts/AuthContext";
import { MediaGallery } from "@/components/MediaGallery";
import { Pagination } from "@/components/Pagination";
import { Filters } from "@/components/Filters";
import { ErrorMessage } from "@/components/ErrorMessage";

export function MediaPageContent() {
  const { username, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get values from URL query params
  const page = parseInt(searchParams.get("page") || "1", 10);
  const type = (searchParams.get("type") || "all") as "all" | "image" | "video";
  const search = searchParams.get("search") || "";

  const limit = 20;

  const { data, isLoading, isError, refetch } = useMedia({
    page,
    limit,
    type: type === "all" ? undefined : type,
    search: search || undefined,
  });

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams();

      // Set page
      if (newPage !== 1) {
        params.set("page", newPage.toString());
      }

      // Preserve type
      if (type && type !== "all") {
        params.set("type", type);
      }

      // Preserve search
      if (search) {
        params.set("search", search);
      }

      const queryString = params.toString();
      const newUrl = `/media${queryString ? `?${queryString}` : ""}`;

      navigate(newUrl);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigate, type, search]
  );

  const handleTypeChange = useCallback(
    (newType: "all" | "image" | "video") => {
      const params = new URLSearchParams();

      // Always reset to page 1
      // No need to set page=1, we omit it

      // Set type
      if (newType !== "all") {
        params.set("type", newType);
      }

      // Preserve search
      if (search) {
        params.set("search", search);
      }

      const queryString = params.toString();
      navigate(`/media${queryString ? `?${queryString}` : ""}`);
    },
    [navigate, search]
  );

  const handleSearchChange = useCallback(
    (newSearch: string) => {
      const params = new URLSearchParams();

      // Always reset to page 1
      // No need to set page=1, we omit it

      // Preserve type
      if (type && type !== "all") {
        params.set("type", type);
      }

      // Set search
      if (newSearch) {
        params.set("search", newSearch);
      }

      const queryString = params.toString();
      navigate(`/media${queryString ? `?${queryString}` : ""}`);
    },
    [navigate, type]
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Media Gallery
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Browse all scraped images and videos
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Back to Home
              </Link>
              <div className="flex items-center gap-3 border-l border-gray-300 pl-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {username}
                  </p>
                  <p className="text-xs text-gray-500">Logged in</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            All Media
            {data && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({data.pagination.total} total items)
              </span>
            )}
          </h2>
          {data && data.pagination.totalPages > 1 && (
            <span className="text-sm text-gray-500">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6">
          <Filters
            onTypeChange={handleTypeChange}
            onSearchChange={handleSearchChange}
            currentType={type}
            currentSearch={search}
          />
        </div>

        {/* Error State */}
        {isError && <ErrorMessage onRetry={() => refetch()} />}

        {/* Gallery */}
        {!isError && (
          <>
            <MediaGallery
              media={data?.data || []}
              isLoading={isLoading}
              isEmpty={!isLoading && (!data || data.data.length === 0)}
            />

            {/* Pagination */}
            {data && data.pagination.totalPages > 0 && (
              <div className="mt-8">
                <Pagination
                  currentPage={data.pagination.page}
                  totalPages={data.pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500">
            Media Scraper - Built with React, React Query, and Tailwind CSS
          </p>
        </div>
      </footer>
    </main>
  );
}
