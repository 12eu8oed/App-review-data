import React from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Review } from '../types/review';

interface ReviewsTableProps {
  reviews: Review[];
  totalFiltered: number;
  loading: boolean;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSelectReview: (review: Review) => void;
  onResetFilters?: () => void;
}

export const ReviewsTable: React.FC<ReviewsTableProps> = ({
  reviews,
  totalFiltered,
  loading,
  currentPage,
  pageSize,
  totalPages,
  onPageChange,
  onSelectReview,
  onResetFilters,
}) => {
  const startRow = totalFiltered === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(totalFiltered, currentPage * pageSize);

  return (
    <section
      id="reviews-section"
      className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius-page)] overflow-hidden scroll-mt-20"
    >
      {/* Table Top Utility Bar */}
      <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          수집된 리뷰 목록
        </h3>
        <span className="text-xs text-[var(--color-text-muted)] font-mono tabular-nums">
          {totalFiltered > 0
            ? `${startRow.toLocaleString()}–${endRow.toLocaleString()} / 총 ${totalFiltered.toLocaleString()}건`
            : '0건'}
        </span>
      </div>

      {/* High-Density Data Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--color-bg-subtle)]/70 border-b border-[var(--color-border)]">
              <th className="px-5 py-3 text-xs font-semibold text-[var(--color-text-secondary)] whitespace-nowrap">
                작성자
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] whitespace-nowrap">
                평점
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)]">
                리뷰 내용
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] whitespace-nowrap">
                버전
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-[var(--color-text-secondary)] text-right whitespace-nowrap">
                작성일
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {reviews.map((review) => (
              <tr
                key={review.id}
                onClick={() => onSelectReview(review)}
                className="hover:bg-[var(--color-bg-hover)]/60 transition-colors duration-100 cursor-pointer group"
              >
                <td className="px-5 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    {review.userImage ? (
                      <img
                        src={review.userImage}
                        alt={review.userName}
                        className="w-7 h-7 rounded-[var(--radius-inner)] bg-[var(--color-bg-subtle)] object-cover shrink-0 border border-[var(--color-border)]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-[var(--radius-inner)] bg-[var(--color-bg-subtle)] border border-[var(--color-border)] flex items-center justify-center text-xs font-semibold text-[var(--color-text-secondary)] shrink-0">
                        {review.userName.slice(0, 1)}
                      </div>
                    )}
                    <span className="text-sm font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors max-w-[140px] truncate">
                      {review.userName}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5 text-[var(--color-star)]">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < review.score
                              ? 'fill-current'
                              : 'text-[var(--color-border-strong)]'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-mono tabular-nums text-[var(--color-text-muted)]">
                      {review.score}.0
                    </span>
                  </div>
                </td>

                <td className="px-4 py-3 max-w-md">
                  {review.title && (
                    <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-0.5 truncate">
                      {review.title}
                    </p>
                  )}
                  <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-snug">
                    {review.text}
                  </p>
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-xs font-mono tabular-nums text-[var(--color-text-muted)]">
                    {review.version || '—'}
                  </span>
                </td>

                <td className="px-5 py-3 whitespace-nowrap text-right">
                  <span className="text-xs font-mono tabular-nums text-[var(--color-text-muted)]">
                    {review.formattedDate}
                  </span>
                </td>
              </tr>
            ))}

            {totalFiltered === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    선택한 필터 조건에 일치하는 리뷰가 없습니다.
                  </p>
                  {onResetFilters && (
                    <button
                      type="button"
                      onClick={onResetFilters}
                      className="mt-3 px-4 py-2 bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border)] rounded-[var(--radius-element)] text-xs font-semibold text-[var(--color-text-primary)] transition-colors cursor-pointer"
                    >
                      필터 초기화
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-5 py-3.5 bg-[var(--color-bg-subtle)]/50 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-medium text-[var(--color-text-muted)] font-mono tabular-nums">
            페이지 {currentPage} / {totalPages}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-9 px-3 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius-element)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] disabled:opacity-40 transition-colors inline-flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap shrink-0"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>이전</span>
            </button>

            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => onPageChange(pageNum)}
                      className={`w-9 h-9 rounded-[var(--radius-element)] text-xs font-semibold font-mono tabular-nums transition-colors cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]'
                          : 'bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return (
                    <span
                      key={pageNum}
                      className="px-1 text-xs text-[var(--color-text-muted)]"
                    >
                      ···
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="h-9 px-3 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius-element)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] disabled:opacity-40 transition-colors inline-flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap shrink-0"
            >
              <span>다음</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
