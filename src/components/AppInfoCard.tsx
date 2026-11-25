import React, { useState } from 'react';
import { AppWindow, Download, ExternalLink } from 'lucide-react';
import { AppInfo } from '../types/review';
import { isSafeExternalUrl } from '../utils/reviewUtils';

interface AppInfoCardProps {
  appInfo: AppInfo;
  totalReviewsCount: number;
  filteredReviewsCount: number;
  onExport: () => void;
}

export const AppInfoCard: React.FC<AppInfoCardProps> = ({
  appInfo,
  totalReviewsCount,
  filteredReviewsCount,
  onExport,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const fallbackStoreUrl =
    appInfo.storeType === 'apple'
      ? `https://apps.apple.com/kr/app/id${encodeURIComponent(String(appInfo.numericId || appInfo.appId))}`
      : `https://play.google.com/store/apps/details?id=${encodeURIComponent(appInfo.appId)}`;

  const storeLink = isSafeExternalUrl(appInfo.storeUrl) ? appInfo.storeUrl : fallbackStoreUrl;
  const storeName = appInfo.storeType === 'apple' ? 'App Store' : 'Google Play';

  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius-page)] p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
      <div className="flex items-center gap-4 min-w-0">
        {appInfo.icon && !imgFailed ? (
          <img
            src={appInfo.icon}
            alt={`${appInfo.title} 앱 아이콘`}
            onError={() => setImgFailed(true)}
            className="w-16 h-16 rounded-[var(--radius-container)] border border-[var(--color-border)] object-cover shrink-0 bg-[var(--color-bg-subtle)]"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-16 h-16 rounded-[var(--radius-container)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] flex items-center justify-center shrink-0 text-[var(--color-text-muted)]">
            <AppWindow className="w-7 h-7" />
          </div>
        )}

        <div className="min-w-0">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight truncate">
            {appInfo.title}
          </h2>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-0.5 truncate">
            {appInfo.developer}
          </p>

          {/* Zero-pill unboxed metadata with typographic separators */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-[var(--color-text-muted)]">
            <span className="font-mono">{appInfo.appId}</span>
            <span aria-hidden="true">·</span>
            <span>{storeName}</span>
            <span aria-hidden="true">·</span>
            <a
              href={storeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[var(--color-accent)] hover:underline underline-offset-2"
            >
              <span>스토어에서 보기</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2 w-full md:w-auto shrink-0">
        <button
          type="button"
          onClick={onExport}
          disabled={filteredReviewsCount === 0}
          className="h-11 px-5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-45 text-[var(--color-on-accent)] text-sm font-semibold rounded-[var(--radius-element)] transition-colors duration-150 inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
        >
          <Download className="w-4 h-4" />
          <span className="tabular-nums">
            엑셀 다운로드 ({filteredReviewsCount.toLocaleString()})
          </span>
        </button>
        <p className="text-xs text-[var(--color-text-muted)] tabular-nums text-center md:text-right">
          수집 {totalReviewsCount.toLocaleString()}건 중 {filteredReviewsCount.toLocaleString()}건 필터 적용
        </p>
      </div>
    </div>
  );
};
