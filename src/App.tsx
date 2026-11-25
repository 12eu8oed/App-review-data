import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { AppInfoCard } from './components/AppInfoCard';
import { EmptyStatePanel } from './components/EmptyStatePanel';
import { LoadingProgressCard } from './components/LoadingProgressCard';
import { ReviewDetailModal } from './components/ReviewDetailModal';
import { ReviewsTable } from './components/ReviewsTable';
import { SearchFilterSection } from './components/SearchFilterSection';
import { SummaryDashboard } from './components/SummaryDashboard';
import { TopBar } from './components/TopBar';
import { useReviewExtractor } from './hooks/useReviewExtractor';
import { AstryxTheme, ColorMode, Review, StoreType } from './types/review';
import { computeReviewStats, exportReviewsToExcel } from './utils/reviewUtils';

const PAGE_SIZE = 50;
const THEME_STORAGE_KEY = 'astryx-theme-palette';
const MODE_STORAGE_KEY = 'astryx-color-mode';

function getInitialTheme(): AstryxTheme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'neutral' || saved === 'stone' || saved === 'matcha') return saved;
  } catch {
    // Ignore storage errors
  }
  return 'neutral';
}

function getInitialColorMode(): ColorMode {
  try {
    const saved = localStorage.getItem(MODE_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Ignore storage errors
  }
  return 'light';
}

export default function App() {
  const [appId, setAppId] = useState('');
  const [storeType, setStoreType] = useState<StoreType>('play');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Astryx CSS-variable cascade theme state
  const [theme, setTheme] = useState<AstryxTheme>(getInitialTheme);
  const [colorMode, setColorMode] = useState<ColorMode>(getInitialColorMode);

  // Filter states
  const [fetchCount, setFetchCount] = useState(100);
  const [sortOrder, setSortOrder] = useState<number>(2); // 2: Recent, 1: Helpful
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [keywordFilter, setKeywordFilter] = useState('');

  const resultsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    reviews,
    appInfo,
    loading,
    progress,
    error,
    history,
    extractReviews,
    cancelExtraction,
    clearHistory,
  } = useReviewExtractor();

  // Sync Astryx CSS-variable theme & dark mode on root <html>
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', colorMode === 'dark');
    try {
      localStorage.setItem(MODE_STORAGE_KEY, colorMode);
    } catch {
      // Ignore storage errors
    }
  }, [colorMode]);

  const handleExtract = useCallback(
    (targetId?: string, targetStore?: StoreType) => {
      const rawInput = targetId ?? appId;
      if (targetId) setAppId(targetId);
      setCurrentPage(1);
      extractReviews(
        rawInput,
        targetStore ?? storeType,
        fetchCount,
        sortOrder,
        setStoreType,
        () => {
          setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 80);
        }
      );
    },
    [appId, storeType, fetchCount, sortOrder, extractReviews]
  );

  const handleResetFilters = useCallback(() => {
    setRatingFilter('all');
    setStartDate('');
    setEndDate('');
    setKeywordFilter('');
  }, []);

  const hasActiveFilters =
    ratingFilter !== 'all' ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    Boolean(keywordFilter.trim());

  useEffect(() => {
    setCurrentPage(1);
  }, [reviews, ratingFilter, startDate, endDate, keywordFilter]);

  const filteredReviews = useMemo(() => {
    const startMs = startDate ? Date.parse(`${startDate}T00:00:00`) : null;
    const endMs = endDate ? Date.parse(`${endDate}T23:59:59.999`) : null;
    const normalizedKeyword = keywordFilter.trim().toLowerCase();

    if (ratingFilter === 'all' && startMs === null && endMs === null && !normalizedKeyword) {
      return reviews;
    }

    return reviews.filter((review) => {
      if (ratingFilter !== 'all' && review.score !== ratingFilter) return false;
      if (startMs !== null && review.timestamp < startMs) return false;
      if (endMs !== null && review.timestamp > endMs) return false;
      if (normalizedKeyword) {
        const textMatch = review.text.toLowerCase().includes(normalizedKeyword);
        const titleMatch = review.title ? review.title.toLowerCase().includes(normalizedKeyword) : false;
        if (!textMatch && !titleMatch) return false;
      }
      return true;
    });
  }, [reviews, ratingFilter, startDate, endDate, keywordFilter]);

  const reviewStats = useMemo(() => computeReviewStats(filteredReviews), [filteredReviews]);

  const totalPages = Math.ceil(filteredReviews.length / PAGE_SIZE);
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredReviews.slice(start, start + PAGE_SIZE);
  }, [filteredReviews, currentPage]);

  const handleExport = useCallback(() => {
    exportReviewsToExcel(filteredReviews, appInfo);
  }, [filteredReviews, appInfo]);

  const handleJumpToExtract = useCallback(() => {
    searchInputRef.current?.focus();
    searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-body)] text-[var(--color-text-primary)] transition-colors duration-150">
      <TopBar
        hasResults={Boolean(appInfo || reviews.length > 0)}
        filteredCount={filteredReviews.length}
        onExport={handleExport}
        onJumpToExtract={handleJumpToExtract}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <SearchFilterSection
          appId={appId}
          onAppIdChange={setAppId}
          storeType={storeType}
          onStoreTypeChange={setStoreType}
          fetchCount={fetchCount}
          onFetchCountChange={setFetchCount}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          ratingFilter={ratingFilter}
          onRatingFilterChange={setRatingFilter}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          keywordFilter={keywordFilter}
          onKeywordFilterChange={setKeywordFilter}
          loading={loading}
          history={history}
          onExtract={handleExtract}
          onClearHistory={clearHistory}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
          theme={theme}
          onThemeChange={setTheme}
          colorMode={colorMode}
          onColorModeToggle={() => setColorMode((m) => (m === 'light' ? 'dark' : 'light'))}
          inputRef={searchInputRef}
        />

        {/* Error State */}
        {error && (
          <div
            role="alert"
            className="p-4 bg-[var(--color-error-subtle)] border border-[var(--color-error)]/30 rounded-[var(--radius-container)] flex items-start gap-3 text-[var(--color-error)]"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div ref={resultsRef} className="scroll-mt-20 space-y-6">
          {/* Loading State */}
          {loading && <LoadingProgressCard progress={progress} onCancel={cancelExtraction} />}

          {/* Results Workspace */}
          {(appInfo || reviews.length > 0) && (
            <div className="space-y-6">
              {appInfo && (
                <AppInfoCard
                  appInfo={appInfo}
                  totalReviewsCount={reviews.length}
                  filteredReviewsCount={filteredReviews.length}
                  onExport={handleExport}
                />
              )}

              <SummaryDashboard
                stats={reviewStats}
                totalCollected={reviews.length}
                ratingFilter={ratingFilter}
                onRatingFilterChange={setRatingFilter}
              />

              {reviews.length > 0 && (
                <ReviewsTable
                  reviews={paginatedReviews}
                  totalFiltered={filteredReviews.length}
                  loading={loading}
                  currentPage={currentPage}
                  pageSize={PAGE_SIZE}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  onSelectReview={setSelectedReview}
                  onResetFilters={hasActiveFilters ? handleResetFilters : undefined}
                />
              )}
            </div>
          )}

          {/* Empty State */}
          {!loading && !appInfo && reviews.length === 0 && !error && (
            <EmptyStatePanel onSelectSample={(id, store) => handleExtract(id, store)} />
          )}
        </div>
      </main>

      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 border-t border-[var(--color-border)] mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[var(--color-text-muted)]">
          <p>© 2026 앱사용자 리뷰 데이터 추출기. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#extract-workspace" className="hover:text-[var(--color-text-primary)] transition-colors">
              추출 도구
            </a>
            <a href="#summary-section" className="hover:text-[var(--color-text-primary)] transition-colors">
              요약 통계
            </a>
            <a href="#reviews-section" className="hover:text-[var(--color-text-primary)] transition-colors">
              리뷰 목록
            </a>
          </div>
        </div>
      </footer>

      <ReviewDetailModal review={selectedReview} onClose={() => setSelectedReview(null)} />
    </div>
  );
}
