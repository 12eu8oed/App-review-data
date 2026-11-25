import { useCallback, useEffect, useRef, useState } from 'react';
import { AppInfo, ExtractionProgress, HistoryItem, Review, StoreType } from '../types/review';
import { extractAppIdAndStore, normalizeReviews } from '../utils/reviewUtils';

const HISTORY_STORAGE_KEY = 'app-review-history';

function loadHistory(): HistoryItem[] {
  try {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function useReviewExtractor() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ExtractionProgress>({
    fetched: 0,
    target: 0,
    percent: 0,
    stage: 'connecting',
  });
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const cancelExtraction = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setLoading(false);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  const extractReviews = useCallback(
    async (
      rawInput: string,
      currentStore: StoreType,
      fetchCount: number,
      sortOrder: number,
      onStoreDetected?: (store: StoreType) => void,
      onStart?: () => void
    ) => {
      const { id, store: activeStore } = extractAppIdAndStore(rawInput, currentStore);
      if (!id) return;

      if (activeStore !== currentStore) {
        onStoreDetected?.(activeStore);
      }

      // Abort any previous in-flight extraction
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);
      setReviews([]);
      setAppInfo(null);
      setProgress({
        fetched: 0,
        target: fetchCount,
        percent: 4,
        stage: 'connecting',
      });

      onStart?.();

      const infoUrl = `/api/app-info?appId=${encodeURIComponent(id)}&storeType=${activeStore}`;
      const streamUrl = `/api/reviews/stream?appId=${encodeURIComponent(id)}&num=${fetchCount}&storeType=${activeStore}&sort=${sortOrder}`;
      const jsonUrl = `/api/reviews?appId=${encodeURIComponent(id)}&num=${fetchCount}&storeType=${activeStore}&sort=${sortOrder}`;

      try {
        // Run app-info lookup and review extraction in parallel
        const infoPromise = fetch(infoUrl, { signal: controller.signal }).then(async (res) => {
          if (!res.ok) {
            throw new Error(
              `${activeStore === 'play' ? 'Google Play' : 'App Store'}에서 앱 정보를 찾을 수 없습니다. 올바른 주소나 ID인지 확인해 주세요.`
            );
          }
          const data = await res.json();
          setAppInfo({ ...data, storeType: activeStore });
          return data;
        });

        const reviewsPromise = (async () => {
          const res = await fetch(streamUrl, { signal: controller.signal });
          const contentType = res.headers.get('content-type') || '';

          if (!res.ok) {
            const errBody = await res.json().catch(() => null);
            throw new Error(errBody?.error || '리뷰를 가져오는데 실패했습니다.');
          }

          // Fallback if response is plain JSON instead of SSE stream
          if (!contentType.includes('text/event-stream') || !res.body) {
            const jsonRes = await fetch(jsonUrl, { signal: controller.signal });
            if (!jsonRes.ok) {
              const errBody = await jsonRes.json().catch(() => null);
              throw new Error(errBody?.error || '리뷰를 가져오는데 실패했습니다.');
            }
            const jsonData = await jsonRes.json();
            return jsonData.data || jsonData;
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let finalData: any[] | null = null;

          const processBlock = (block: string) => {
            const lines = block.split('\n');
            let eventName = 'message';
            let dataLine = '';

            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventName = line.slice(6).trim();
              } else if (line.startsWith('data:')) {
                dataLine += line.slice(5).trim();
              }
            }

            if (!dataLine) return;
            const parsed = JSON.parse(dataLine);

            if (eventName === 'progress') {
              setProgress(parsed as ExtractionProgress);
            } else if (eventName === 'complete') {
              finalData = parsed.data || [];
            } else if (eventName === 'error') {
              throw new Error(parsed.error || '리뷰 데이터를 가져오는데 실패했습니다.');
            }
          };

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            let delimiterIdx = buffer.indexOf('\n\n');
            while (delimiterIdx !== -1) {
              const block = buffer.slice(0, delimiterIdx).trim();
              buffer = buffer.slice(delimiterIdx + 2);
              if (block) processBlock(block);
              delimiterIdx = buffer.indexOf('\n\n');
            }
          }

          if (buffer.trim()) {
            processBlock(buffer.trim());
          }

          if (!finalData) {
            throw new Error('서버에서 리뷰 데이터를 수신하지 못했습니다.');
          }

          return finalData;
        })();

        const [, rawReviews] = await Promise.all([infoPromise, reviewsPromise]);
        if (controller.signal.aborted) return;

        const normalized = normalizeReviews(rawReviews);
        setReviews(normalized);
        setProgress({
          fetched: normalized.length,
          target: fetchCount,
          percent: 100,
          stage: 'done',
        });

        setHistory((prev) => {
          const item: HistoryItem = { id, store: activeStore };
          const next = [item, ...prev.filter((h) => h.id !== id || h.store !== activeStore)].slice(0, 5);
          try {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
          } catch {
            // Ignore storage errors
          }
          return next;
        });
      } catch (err: any) {
        if (err?.name === 'AbortError' || controller.signal.aborted) return;
        setError(err?.message || '오류가 발생했습니다.');
      } finally {
        if (!controller.signal.aborted) {
          setTimeout(() => {
            setLoading(false);
          }, 180);
        }
      }
    },
    []
  );

  return {
    reviews,
    appInfo,
    loading,
    progress,
    error,
    history,
    extractReviews,
    cancelExtraction,
    clearHistory,
  };
}
