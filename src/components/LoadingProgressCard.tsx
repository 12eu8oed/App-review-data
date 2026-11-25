import React from 'react';
import { Loader2, X } from 'lucide-react';
import { ExtractionProgress } from '../types/review';

interface LoadingProgressCardProps {
  progress: ExtractionProgress;
  onCancel: () => void;
}

const STAGE_LABEL: Record<ExtractionProgress['stage'], string> = {
  connecting: '스토어 서버에 연결하고 있습니다...',
  rss: 'App Store 최신 피드에서 리뷰를 수집하고 있습니다...',
  scraping: 'App Store 리뷰 페이지를 병렬로 수집하고 있습니다...',
  play: 'Google Play 리뷰 데이터를 불러오고 있습니다...',
  done: '수집된 데이터를 정리하고 있습니다...',
};

export const LoadingProgressCard: React.FC<LoadingProgressCardProps> = ({ progress, onCancel }) => {
  const displayPercent = Math.min(100, Math.max(0, Math.round(progress.percent)));

  return (
    <section className="space-y-4">
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius-page)] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[var(--radius-element)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center shrink-0">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                리뷰 데이터를 추출하는 중입니다
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                {STAGE_LABEL[progress.stage]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right tabular-nums">
              <div className="text-xl font-bold text-[var(--color-text-primary)] font-mono">
                {displayPercent}%
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {progress.fetched > 0
                  ? `${progress.fetched.toLocaleString()} / ${progress.target.toLocaleString()}건`
                  : `목표 ${progress.target.toLocaleString()}건`}
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-2 bg-[var(--color-bg-subtle)] hover:bg-[var(--color-error-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-error)] border border-[var(--color-border)] rounded-[var(--radius-element)] text-xs font-semibold transition-colors duration-150 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            >
              <X className="w-3.5 h-3.5" />
              추출 중단
            </button>
          </div>
        </div>

        {/* Compositor-friendly scaleX progress bar */}
        <div className="mt-5 h-2 bg-[var(--color-bg-subtle)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-accent)] origin-left transition-transform duration-200 ease-out"
            style={{ transform: `scaleX(${displayPercent / 100})` }}
          />
        </div>
      </div>

      {/* Skeleton preview matching table row geometry */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius-container)] overflow-hidden">
        <div className="px-5 py-3 bg-[var(--color-bg-subtle)] border-b border-[var(--color-border)] flex justify-between">
          <div className="h-3.5 w-28 bg-[var(--color-border)] rounded animate-pulse" />
          <div className="h-3.5 w-20 bg-[var(--color-border)] rounded animate-pulse" />
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="px-5 h-11 flex items-center gap-6">
              <div className="h-3.5 w-24 bg-[var(--color-bg-subtle)] rounded animate-pulse shrink-0" />
              <div className="h-3.5 w-16 bg-[var(--color-bg-subtle)] rounded animate-pulse shrink-0" />
              <div className="h-3.5 flex-1 bg-[var(--color-bg-subtle)] rounded animate-pulse" />
              <div className="h-3.5 w-20 bg-[var(--color-bg-subtle)] rounded animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
