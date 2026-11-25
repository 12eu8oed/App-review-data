import React, { useEffect } from 'react';
import { ExternalLink, Star, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Review } from '../types/review';
import { formatKoreanDate, isSafeExternalUrl } from '../utils/reviewUtils';

interface ReviewDetailModalProps {
  review: Review | null;
  onClose: () => void;
}

export const ReviewDetailModal: React.FC<ReviewDetailModalProps> = ({ review, onClose }) => {
  useEffect(() => {
    if (!review) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [review, onClose]);

  return (
    <AnimatePresence>
      {review && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-author"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius-page)] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                {review.userImage ? (
                  <img
                    src={review.userImage}
                    alt={review.userName}
                    className="w-10 h-10 rounded-[var(--radius-element)] bg-[var(--color-bg-subtle)] border border-[var(--color-border)] object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-[var(--radius-element)] bg-[var(--color-bg-subtle)] border border-[var(--color-border)] flex items-center justify-center font-semibold text-sm text-[var(--color-text-secondary)] shrink-0">
                    {review.userName.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0">
                  <h3
                    id="review-modal-author"
                    className="font-semibold text-base text-[var(--color-text-primary)] truncate"
                  >
                    {review.userName}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--color-text-muted)]">
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
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{review.formattedDate}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="상세 창 닫기"
                className="w-9 h-9 flex items-center justify-center hover:bg-[var(--color-bg-hover)] rounded-[var(--radius-element)] transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                {review.title && (
                  <h4 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
                    {review.title}
                  </h4>
                )}
                <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {review.text}
                </p>

                {/* Unboxed metadata row */}
                <div className="mt-5 pt-4 border-t border-[var(--color-border)] flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-muted)] tabular-nums">
                  <span>도움됨 {review.thumbsUp.toLocaleString()}</span>
                  {review.version && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">버전 {review.version}</span>
                    </>
                  )}
                </div>
              </div>

              {review.replyText && (
                <div className="bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-[var(--radius-container)] p-5">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                      개발자 답변
                    </span>
                    {review.replyDate && (
                      <span className="text-xs font-mono tabular-nums text-[var(--color-text-muted)]">
                        {formatKoreanDate(review.replyDate)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                    {review.replyText}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[var(--color-bg-subtle)]/60 border-t border-[var(--color-border)] flex justify-end gap-2.5">
              {isSafeExternalUrl(review.url) && (
                <a
                  href={review.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 px-4 bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] text-[var(--color-text-primary)] font-semibold rounded-[var(--radius-element)] transition-colors text-xs inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>스토어에서 보기</span>
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-semibold rounded-[var(--radius-element)] transition-colors text-xs whitespace-nowrap shrink-0 cursor-pointer"
              >
                확인
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
