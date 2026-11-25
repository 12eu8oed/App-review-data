import React from 'react';
import { Star } from 'lucide-react';
import { ReviewStats } from '../types/review';

interface SummaryDashboardProps {
  stats: ReviewStats;
  totalCollected: number;
  ratingFilter: number | 'all';
  onRatingFilterChange: (rating: number | 'all') => void;
}

const SCORES: (5 | 4 | 3 | 2 | 1)[] = [5, 4, 3, 2, 1];

export const SummaryDashboard: React.FC<SummaryDashboardProps> = ({
  stats,
  totalCollected,
  ratingFilter,
  onRatingFilterChange,
}) => {
  if (totalCollected === 0) return null;

  const filterRatio =
    totalCollected > 0 ? Math.round((stats.total / totalCollected) * 100) : 0;

  return (
    <section id="summary-section" className="grid grid-cols-1 md:grid-cols-3 gap-4 scroll-mt-20">
      {/* Metric 1: Filtered Count */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius-container)] p-5 flex flex-col justify-between">
        <span className="text-xs font-medium text-[var(--color-text-muted)]">
          필터링된 리뷰 수
        </span>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight tabular-nums font-mono">
            {stats.total.toLocaleString()}
          </span>
          <span className="text-sm text-[var(--color-text-secondary)]">건</span>
        </div>
        <p className="mt-2 text-xs text-[var(--color-text-muted)] tabular-nums">
          전체 {totalCollected.toLocaleString()}건 대비 {filterRatio}%
        </p>
      </div>

      {/* Metric 2: Average Score */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius-container)] p-5 flex flex-col justify-between">
        <span className="text-xs font-medium text-[var(--color-text-muted)]">
          평균 별점
        </span>
        <div className="mt-3 flex items-center gap-2.5">
          <span className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight tabular-nums font-mono">
            {stats.averageScore}
          </span>
          <div className="flex items-center gap-0.5 text-[var(--color-star)]" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`w-4 h-4 ${
                  n <= Math.round(Number(stats.averageScore))
                    ? 'fill-current'
                    : 'text-[var(--color-border-strong)]'
                }`}
              />
            ))}
          </div>
        </div>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          5.0 만점 기준 산술 평균
        </p>
      </div>

      {/* Metric 3: Interactive Rating Distribution */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius-container)] p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-[var(--color-text-muted)]">
            별점 분포 (클릭하여 필터)
          </span>
          {ratingFilter !== 'all' && (
            <button
              type="button"
              onClick={() => onRatingFilterChange('all')}
              className="text-xs font-semibold text-[var(--color-accent)] hover:underline cursor-pointer"
            >
              전체 보기
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          {SCORES.map((score) => {
            const count = stats.distribution[score];
            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
            const isActive = ratingFilter === score;

            return (
              <button
                key={score}
                type="button"
                onClick={() => onRatingFilterChange(isActive ? 'all' : score)}
                className={`w-full flex items-center gap-2.5 text-xs px-2 py-1 rounded-[var(--radius-inner)] transition-colors duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold'
                    : 'hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]'
                }`}
              >
                <span className="w-5 text-left font-mono tabular-nums shrink-0">{score}점</span>
                <div className="flex-1 h-1.5 bg-[var(--color-bg-subtle)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-star)] rounded-full transition-all duration-200"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-12 text-right font-mono tabular-nums shrink-0 text-[var(--color-text-muted)]">
                  {count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
