import React from 'react';
import { Download } from 'lucide-react';

interface TopBarProps {
  hasResults: boolean;
  filteredCount: number;
  onExport: () => void;
  onJumpToExtract: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  hasResults,
  filteredCount,
  onExport,
  onJumpToExtract,
}) => {
  return (
    <header className="sticky top-0 z-20 h-14 bg-[var(--color-bg-surface)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          href="#extract-workspace"
          className="text-base font-bold tracking-tight text-[var(--color-text-primary)] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)] rounded-[var(--radius-inner)]"
        >
          리뷰 데이터 추출기
        </a>

        {/* Zone 2: Clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--color-text-secondary)]">
          <a
            href="#extract-workspace"
            className="hover:text-[var(--color-text-primary)] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            추출 설정
          </a>
          <a
            href="#summary-section"
            className="hover:text-[var(--color-text-primary)] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            요약 통계
          </a>
          <a
            href="#reviews-section"
            className="hover:text-[var(--color-text-primary)] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            리뷰 목록
          </a>
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          {hasResults ? (
            <button
              type="button"
              onClick={onExport}
              disabled={filteredCount === 0}
              className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-45 text-[var(--color-on-accent)] text-xs font-semibold rounded-[var(--radius-element)] transition-colors duration-150 inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="tabular-nums">엑셀 저장 ({filteredCount.toLocaleString()})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onJumpToExtract}
              className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] text-xs font-semibold rounded-[var(--radius-element)] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            >
              데이터 추출
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
