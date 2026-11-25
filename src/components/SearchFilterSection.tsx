import React, { useState } from 'react';
import {
  ChevronDown,
  Loader2,
  Moon,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sun,
  Trash2,
} from 'lucide-react';
import { AstryxTheme, ColorMode, HistoryItem, StoreType } from '../types/review';
import { AppStoreIcon, PlayStoreIcon } from './StoreIcons';

interface SearchFilterSectionProps {
  appId: string;
  onAppIdChange: (value: string) => void;
  storeType: StoreType;
  onStoreTypeChange: (store: StoreType) => void;
  fetchCount: number;
  onFetchCountChange: (count: number) => void;
  sortOrder: number;
  onSortOrderChange: (sort: number) => void;
  ratingFilter: number | 'all';
  onRatingFilterChange: (rating: number | 'all') => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  keywordFilter: string;
  onKeywordFilterChange: (keyword: string) => void;
  loading: boolean;
  history: HistoryItem[];
  onExtract: (targetId?: string, targetStore?: StoreType) => void;
  onClearHistory: () => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  theme: AstryxTheme;
  onThemeChange: (theme: AstryxTheme) => void;
  colorMode: ColorMode;
  onColorModeToggle: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

const APPLE_PRESETS = [100, 500, 1000, 2000, 5000];
const PLAY_PRESETS = [100, 200, 300, 400, 500, 1000, 2000, 5000];
const THEME_OPTIONS: { id: AstryxTheme; label: string }[] = [
  { id: 'neutral', label: 'Neutral' },
  { id: 'stone', label: 'Stone' },
  { id: 'matcha', label: 'Matcha' },
];

export const SearchFilterSection: React.FC<SearchFilterSectionProps> = ({
  appId,
  onAppIdChange,
  storeType,
  onStoreTypeChange,
  fetchCount,
  onFetchCountChange,
  sortOrder,
  onSortOrderChange,
  ratingFilter,
  onRatingFilterChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  keywordFilter,
  onKeywordFilterChange,
  loading,
  history,
  onExtract,
  onClearHistory,
  onResetFilters,
  hasActiveFilters,
  theme,
  onThemeChange,
  colorMode,
  onColorModeToggle,
  inputRef,
}) => {
  const [showFilters, setShowFilters] = useState(true);
  const [showCountPresets, setShowCountPresets] = useState(false);

  const presets = storeType === 'apple' ? APPLE_PRESETS : PLAY_PRESETS;

  return (
    <section id="extract-workspace" className="space-y-5 scroll-mt-20">
      {/* Workspace Header & Astryx Theme Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] [text-wrap:balance]">
            앱 스토어 리뷰 데이터 워크벤치
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
            Google Play와 Apple App Store의 사용자 리뷰를 실시간으로 수집하고 필터링하여 엑셀 파일로 내보냅니다.
          </p>
        </div>

        {/* Workspace Controls: Astryx Theme Cascade & Color Mode */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div
            className="inline-flex items-center p-1 bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-[var(--radius-element)]"
            role="group"
            aria-label="테마 팔레트 선택"
          >
            {THEME_OPTIONS.map((opt) => {
              const active = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onThemeChange(opt.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-inner)] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-xs'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onColorModeToggle}
            aria-label={colorMode === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            className="h-9 px-3 bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border)] rounded-[var(--radius-element)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-150 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {colorMode === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5" />
                <span>라이트</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5" />
                <span>다크</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Command Surface (Single-Elevation) */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius-page)] overflow-visible">
        {/* Top Row: Store Segmented Control + Search Input + Primary CTA */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Store Segmented Control */}
            <div className="inline-flex p-1 bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-[var(--radius-element)] self-start">
              <button
                type="button"
                onClick={() => onStoreTypeChange('play')}
                className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-inner)] text-xs font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  storeType === 'play'
                    ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-xs'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <PlayStoreIcon className="w-4 h-4 shrink-0" />
                <span>Google Play</span>
              </button>
              <button
                type="button"
                onClick={() => onStoreTypeChange('apple')}
                className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-inner)] text-xs font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  storeType === 'apple'
                    ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-xs'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <AppStoreIcon className="w-4 h-4 shrink-0" />
                <span>App Store</span>
              </button>
            </div>

            {storeType === 'apple' && (
              <p className="text-xs text-[var(--color-text-muted)]">
                App Store 병렬 페이지 수집 지원 · 최대 5,000건 요청 가능
              </p>
            )}
          </div>

          {/* Command Input Row */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-[var(--color-text-muted)]" />
              </div>
              <input
                ref={inputRef}
                type="text"
                placeholder={
                  storeType === 'play'
                    ? '패키지 ID (예: com.kakao.talk) 또는 Google Play URL'
                    : '앱 숫자 ID (예: 378084485) 또는 App Store URL'
                }
                className="w-full h-11 pl-10 pr-4 bg-[var(--color-bg-subtle)] border border-[var(--color-border)] focus:bg-[var(--color-bg-surface)] focus:border-[var(--color-accent)] rounded-[var(--radius-element)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none transition-colors duration-150"
                value={appId}
                onChange={(e) => onAppIdChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && onExtract()}
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className={`h-11 px-4 border rounded-[var(--radius-element)] text-xs font-semibold transition-colors duration-150 inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                  showFilters
                    ? 'bg-[var(--color-bg-subtle)] border-[var(--color-border-strong)] text-[var(--color-text-primary)]'
                    : 'bg-[var(--color-bg-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>상세 필터</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    showFilters ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={() => onExtract()}
                disabled={loading || !appId.trim()}
                className="h-11 px-6 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-45 text-[var(--color-on-accent)] text-sm font-semibold rounded-[var(--radius-element)] transition-colors duration-150 inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>수집 중</span>
                  </>
                ) : (
                  <span>추출하기</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Filter Toolbar (Hairline separated, no nested cards) */}
        {showFilters && (
          <div className="px-4 sm:px-6 py-5 border-t border-[var(--color-border)] bg-[var(--color-bg-body)]/50 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Fetch Count */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
                  수집 건수
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={fetchCount}
                    onChange={(e) => {
                      const value = Math.min(5000, Math.max(1, Number(e.target.value) || 1));
                      onFetchCountChange(value);
                    }}
                    onFocus={() => setShowCountPresets(true)}
                    className="w-full h-10 pl-3 pr-14 bg-[var(--color-bg-surface)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-[var(--radius-element)] text-sm text-[var(--color-text-primary)] tabular-nums outline-none transition-colors"
                    min="1"
                    max="5000"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <span className="text-xs text-[var(--color-text-muted)]">건</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCountPresets((prev) => !prev);
                      }}
                      aria-label="수집 건수 프리셋 열기"
                      className="p-1 hover:bg-[var(--color-bg-hover)] rounded-[var(--radius-inner)] text-[var(--color-text-muted)] cursor-pointer"
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-150 ${
                          showCountPresets ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {showCountPresets && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setShowCountPresets(false)}
                      />
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius-container)] shadow-lg z-30 max-h-52 overflow-y-auto py-1">
                        {presets.map((count) => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => {
                              onFetchCountChange(count);
                              setShowCountPresets(false);
                            }}
                            className={`w-full px-3.5 py-2 text-left text-xs font-medium flex justify-between items-center transition-colors cursor-pointer tabular-nums ${
                              fetchCount === count
                                ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold'
                                : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                            }`}
                          >
                            <span>{count.toLocaleString()}건</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Sort Order */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
                  수집 정렬 기준
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => onSortOrderChange(Number(e.target.value))}
                  className="w-full h-10 px-3 bg-[var(--color-bg-surface)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-[var(--radius-element)] text-sm text-[var(--color-text-primary)] outline-none transition-colors"
                >
                  <option value={2}>최신순 (Recent)</option>
                  <option value={1}>유용한 순 (Helpful)</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
                  평점 필터
                </label>
                <select
                  value={ratingFilter}
                  onChange={(e) =>
                    onRatingFilterChange(
                      e.target.value === 'all' ? 'all' : Number(e.target.value)
                    )
                  }
                  className="w-full h-10 px-3 bg-[var(--color-bg-surface)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-[var(--radius-element)] text-sm text-[var(--color-text-primary)] outline-none transition-colors"
                >
                  <option value="all">모든 평점</option>
                  <option value={5}>5점</option>
                  <option value={4}>4점</option>
                  <option value={3}>3점</option>
                  <option value={2}>2점</option>
                  <option value={1}>1점</option>
                </select>
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
                  시작일
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--color-bg-surface)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-[var(--radius-element)] text-sm text-[var(--color-text-primary)] tabular-nums outline-none transition-colors"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
                  종료일
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--color-bg-surface)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-[var(--radius-element)] text-sm text-[var(--color-text-primary)] tabular-nums outline-none transition-colors"
                />
              </div>
            </div>

            {/* Keyword Filter + Filter Reset */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                </div>
                <input
                  type="text"
                  placeholder="수집된 리뷰 제목·본문 내 키워드 검색 (예: 오류, 결제, 디자인)"
                  value={keywordFilter}
                  onChange={(e) => onKeywordFilterChange(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 bg-[var(--color-bg-surface)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-[var(--radius-element)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none transition-colors"
                />
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="h-10 px-3.5 bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border)] rounded-[var(--radius-element)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>필터 초기화</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recent History Bar (Zero-Pill: clean rectangular quick actions) */}
      {history.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[var(--color-text-muted)] mr-1">
            최근 검색
          </span>
          {history.map((h) => (
            <button
              key={`${h.store}-${h.id}`}
              type="button"
              onClick={() => {
                onAppIdChange(h.id);
                onExtract(h.id, h.store);
              }}
              className="h-8 px-3 bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border)] rounded-[var(--radius-element)] text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-150 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {h.store === 'apple' ? (
                <AppStoreIcon className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <PlayStoreIcon className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="font-mono">{h.id}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={onClearHistory}
            className="h-8 px-2.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            title="검색 기록 전체 삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>지우기</span>
          </button>
        </div>
      )}
    </section>
  );
};
