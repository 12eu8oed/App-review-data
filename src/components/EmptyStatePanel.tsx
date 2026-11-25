import React from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import { StoreType } from '../types/review';

interface EmptyStatePanelProps {
  onSelectSample: (id: string, store: StoreType) => void;
}

const SAMPLE_APPS: { label: string; id: string; store: StoreType; storeLabel: string }[] = [
  { label: '카카오톡', id: 'com.kakao.talk', store: 'play', storeLabel: 'Google Play' },
  { label: '배달의민족', id: '378084485', store: 'apple', storeLabel: 'App Store' },
  { label: '토스', id: 'viva.republica.toss', store: 'play', storeLabel: 'Google Play' },
];

export const EmptyStatePanel: React.FC<EmptyStatePanelProps> = ({ onSelectSample }) => {
  return (
    <section className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius-page)] p-8 sm:p-12 text-center">
      <div className="w-12 h-12 rounded-[var(--radius-container)] bg-[var(--color-bg-subtle)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-5">
        <Search className="w-5 h-5 text-[var(--color-text-muted)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] tracking-tight">
        추출할 앱의 ID 또는 스토어 URL을 입력하세요
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] mt-2 max-w-md mx-auto leading-relaxed">
        수집된 리뷰의 별점 분포, 키워드 필터링, 상세 내역 확인 및 엑셀(.xlsx) 내보내기가 이 작업 영역에 표시됩니다.
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
        <span className="text-xs font-medium text-[var(--color-text-muted)] mr-1">
          빠른 테스트
        </span>
        {SAMPLE_APPS.map((sample) => (
          <button
            key={`${sample.store}-${sample.id}`}
            type="button"
            onClick={() => onSelectSample(sample.id, sample.store)}
            className="px-3.5 py-2 bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border)] rounded-[var(--radius-element)] text-xs font-medium text-[var(--color-text-primary)] transition-colors duration-150 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          >
            <span>{sample.label}</span>
            <span className="text-[var(--color-text-muted)]">· {sample.storeLabel}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
          </button>
        ))}
      </div>
    </section>
  );
};
