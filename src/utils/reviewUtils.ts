import * as XLSX from 'xlsx';
import { AppInfo, Review, ReviewStats, StoreType } from '../types/review';

export function extractAppIdAndStore(
  input: string,
  currentStore: StoreType
): { id: string; store: StoreType } {
  let resultStore = currentStore;
  const trimmed = input.trim();
  let resultId = trimmed;

  if (trimmed.includes('apps.apple.com')) {
    resultStore = 'apple';
  } else if (trimmed.includes('play.google.com')) {
    resultStore = 'play';
  }

  if (resultStore === 'play' && trimmed.includes('id=')) {
    const match = trimmed.match(/id=([^&]+)/);
    resultId = match ? match[1] : trimmed;
  } else if (resultStore === 'apple' && trimmed.includes('id')) {
    const match = trimmed.match(/\/id(\d+)/);
    resultId = match ? match[1] : trimmed.replace(/\D/g, '');
  }

  return { id: resultId.trim(), store: resultStore };
}

export function isSafeExternalUrl(url?: string): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function formatKoreanDate(dateStr: string): string {
  const time = Date.parse(dateStr);
  if (Number.isNaN(time)) return dateStr || '-';
  return new Date(time).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function normalizeReviews(rawList: any[]): Review[] {
  return rawList.map((r, index) => {
    const date = r.date || new Date().toISOString();
    const parsedTime = Date.parse(date);
    const timestamp = Number.isNaN(parsedTime) ? 0 : parsedTime;

    return {
      id: r.id ? String(r.id) : `rev-${index}-${timestamp}`,
      userName: r.userName || 'Unknown',
      userImage: r.userImage || '',
      date,
      timestamp,
      formattedDate: formatKoreanDate(date),
      score: typeof r.score === 'number' ? r.score : parseInt(r.scoreText || '5', 10) || 5,
      scoreText: String(r.scoreText || r.score || '5'),
      url: r.url || '',
      title: r.title || '',
      text: r.text || '',
      replyDate: r.replyDate || '',
      replyText: r.replyText || '',
      version: r.version || '',
      thumbsUp: typeof r.thumbsUp === 'number' ? r.thumbsUp : 0,
    };
  });
}

export function computeReviewStats(reviews: Review[]): ReviewStats {
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  if (reviews.length === 0) {
    return { total: 0, averageScore: '0.0', distribution };
  }

  let scoreSum = 0;
  for (let i = 0; i < reviews.length; i++) {
    const score = reviews[i].score;
    scoreSum += score;
    if (score >= 1 && score <= 5) {
      distribution[score as 1 | 2 | 3 | 4 | 5]++;
    }
  }

  return {
    total: reviews.length,
    averageScore: (scoreSum / reviews.length).toFixed(1),
    distribution,
  };
}

export function exportReviewsToExcel(reviews: Review[], appInfo: AppInfo | null): void {
  if (reviews.length === 0) return;

  const storeLabel = appInfo?.storeType === 'apple' ? 'App Store' : 'Google Play';
  const rows = reviews.map((r) => ({
    스토어: storeLabel,
    작성자: r.userName,
    평점: r.score,
    날짜: r.formattedDate,
    제목: r.title || '',
    내용: r.text,
    버전: r.version || '',
    추천수: r.thumbsUp,
    답변날짜: r.replyDate ? formatKoreanDate(r.replyDate) : '',
    답변내용: r.replyText || '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reviews');

  const safeTitle = (appInfo?.title || 'reviews').replace(/[\\/:*?"<>|]/g, '_');
  const fileName = `${safeTitle}_${appInfo?.storeType || 'play'}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
