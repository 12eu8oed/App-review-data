import gplay from 'google-play-scraper';
import appStore from 'app-store-scraper';
import * as cheerio from 'cheerio';
import { TtlCache } from './cache.ts';
import type {
  AppInfoResponse,
  ProgressCallback,
  ReviewItem,
  ReviewsQuery,
  StoreType,
} from './types.ts';

const APPLE_DEFAULT_ICON = 'https://www.apple.com/apple-touch-icon.png';
const REQUEST_TIMEOUT_MS = 10_000;
const APPLE_WEB_HEADERS = {
  'X-Apple-Store-Front': '143466,12',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};

const appInfoCache = new TtlCache<AppInfoResponse>(10 * 60 * 1000, 100);
const reviewsCache = new TtlCache<ReviewItem[]>(5 * 60 * 1000, 50);
const numericIdCache = new TtlCache<string>(30 * 60 * 1000, 200);

function makeDedupeKey(userName: string, text: string): string {
  return `${userName}\0${text}`;
}

function makeStableId(prefix: string, seed: string, index: number): string {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}-${(hash >>> 0).toString(36)}-${index}`;
}

function combineSignals(parent?: AbortSignal, timeoutMs = REQUEST_TIMEOUT_MS): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  if (!parent) return timeoutSignal;
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([parent, timeoutSignal]);
  }
  return parent;
}

async function resolveAppleNumericId(appId: string, country: string): Promise<string> {
  if (/^\d+$/.test(appId)) return appId;

  const cacheKey = `${country}:${appId}`;
  const cached = numericIdCache.get(cacheKey);
  if (cached) return cached;

  try {
    const info = await appStore.app({ appId, country });
    const resolved = String(info.id || info.appId || appId);
    numericIdCache.set(cacheKey, resolved);
    return resolved;
  } catch {
    return appId;
  }
}

export async function fetchAppInfo(
  appId: string,
  storeType: StoreType,
  country: string
): Promise<AppInfoResponse> {
  const cacheKey = `${storeType}:${country}:${appId}`;
  const cached = appInfoCache.get(cacheKey);
  if (cached) return cached;

  if (storeType === 'apple') {
    const isNumeric = /^\d+$/.test(appId);
    const targetId = isNumeric ? { id: appId } : { appId };
    const info = await appStore.app({ ...targetId, country });

    const response: AppInfoResponse = {
      title: info.title,
      icon: info.icon,
      developer: info.developer,
      appId: info.appId,
      numericId: info.id,
      storeUrl: info.url,
    };
    if (info.id) {
      numericIdCache.set(`${country}:${appId}`, String(info.id));
    }
    appInfoCache.set(cacheKey, response);
    return response;
  }

  const info = await gplay.app({ appId, lang: 'ko', country });
  const response: AppInfoResponse = {
    title: info.title,
    icon: info.icon,
    developer: info.developer,
    appId: info.appId,
    storeUrl: info.url,
  };
  appInfoCache.set(cacheKey, response);
  return response;
}

function parseAppleRssXml(xmlText: string): ReviewItem[] {
  const $ = cheerio.load(xmlText, { xmlMode: true });
  const pageReviews: ReviewItem[] = [];

  $('feed > entry').each((idx, el) => {
    const $el = $(el);
    const ratingStr = $el.find('im\\:rating').text().trim();
    const content = $el.find('content').first().text().trim();
    // Skip feed metadata entry (app summary) if it has neither rating nor review content
    if (!ratingStr && !content) return;

    const id = $el.find('id').first().text().trim();
    const userName = $el.find('author > name').first().text().trim() || 'Unknown';
    const title = $el.find('title').first().text().trim();
    const date = $el.find('updated').first().text().trim() || new Date().toISOString();
    const version = $el.find('im\\:version').text().trim();
    const link = $el.find('link').first().attr('href') || '';
    const score = Math.min(5, Math.max(1, parseInt(ratingStr || '5', 10) || 5));

    pageReviews.push({
      id: id || makeStableId('rss', `${userName}:${date}:${content}`, idx),
      userName,
      userImage: APPLE_DEFAULT_ICON,
      date,
      score,
      scoreText: String(score),
      url: link,
      title,
      text: content,
      replyDate: '',
      replyText: '',
      version,
      thumbsUp: 0,
    });
  });

  return pageReviews;
}

async function fetchAppleRssReviews(
  numericId: string,
  country: string,
  num: number,
  sort: 1 | 2,
  seenKeys: Set<string>,
  onProgress?: ProgressCallback,
  signal?: AbortSignal
): Promise<ReviewItem[]> {
  const numPages = Math.min(10, Math.max(1, Math.ceil(num / 50)));
  const appleSort = sort === 1 ? 'mostHelpful' : 'mostRecent';
  const collected: ReviewItem[] = [];

  // Fetch RSS pages concurrently in batches of 5 for fast response
  const batchSize = 5;
  for (let start = 1; start <= numPages; start += batchSize) {
    if (signal?.aborted) break;

    const pages: number[] = [];
    for (let p = start; p < start + batchSize && p <= numPages; p++) {
      pages.push(p);
    }

    const batchResults = await Promise.all(
      pages.map(async (page) => {
        const url = `https://itunes.apple.com/${country}/rss/customerreviews/page=${page}/id=${encodeURIComponent(numericId)}/sortBy=${appleSort}/xml`;
        try {
          const res = await fetch(url, { signal: combineSignals(signal) });
          if (!res.ok) return [];
          const xml = await res.text();
          return parseAppleRssXml(xml);
        } catch (err) {
          if (!signal?.aborted) {
            console.error(`Apple RSS Error on page ${page}:`, err);
          }
          return [];
        }
      })
    );

    let batchAdded = 0;
    for (const pageReviews of batchResults) {
      for (const review of pageReviews) {
        const key = makeDedupeKey(review.userName, review.text);
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          collected.push(review);
          batchAdded++;
        }
      }
    }

    onProgress?.({
      fetched: Math.min(collected.length, num),
      target: num,
      percent: Math.min(95, Math.round((collected.length / num) * 100)),
      stage: 'rss',
    });

    if (collected.length >= num || batchAdded === 0) break;
  }

  return collected;
}

function parseAppleWebHtml(html: string, country: string, numericId: string, page: number): ReviewItem[] {
  const $ = cheerio.load(html);
  const pageReviews: ReviewItem[] = [];
  const storeUrl = `https://apps.apple.com/${country}/app/id${numericId}`;

  $('.customer-review').each((idx, el) => {
    const $el = $(el);
    const text = $el.find('.content').text().trim();
    if (!text) return;

    const title = $el.find('.customerReviewTitle').text().trim();
    const reviewer = $el.find('.reviewer').text().trim() || 'Unknown';
    const ratingStr = $el.find('.rating').attr('aria-label');
    const parsedScore = ratingStr ? parseInt(ratingStr.match(/\d+/)?.[0] || '5', 10) : 5;
    const score = Math.min(5, Math.max(1, Number.isFinite(parsedScore) ? parsedScore : 5));

    const userInfo = $el.find('.user-info').text();
    const version = userInfo.match(/버전\s*([0-9.]+)/i)?.[1] || '';
    const dateMatch = userInfo.match(/(\d{4}\.\d{2}\.\d{2})/);
    const date = dateMatch ? dateMatch[1].replace(/\./g, '-') : new Date().toISOString();

    pageReviews.push({
      id: makeStableId(`web-p${page}`, `${reviewer}:${date}:${text}`, idx),
      userName: reviewer,
      userImage: APPLE_DEFAULT_ICON,
      title,
      text,
      score,
      scoreText: String(score),
      date,
      version,
      url: storeUrl,
      replyDate: '',
      replyText: '',
      thumbsUp: 0,
    });
  });

  return pageReviews;
}

async function fetchAppleWebReviews(
  numericId: string,
  country: string,
  num: number,
  sort: 1 | 2,
  seenKeys: Set<string>,
  initialCount: number,
  onProgress?: ProgressCallback,
  signal?: AbortSignal
): Promise<ReviewItem[]> {
  const appleSort = sort === 1 ? 'mostHelpful' : 'mostRecent';
  const numPages = Math.min(1000, Math.ceil(num / 5));
  const batchSize = 5;
  const collected: ReviewItem[] = [];

  let emptyBatchCount = 0;
  let rateLimited = false;

  for (let i = 1; i <= numPages; i += batchSize) {
    if (signal?.aborted) break;

    const batch: number[] = [];
    for (let j = i; j < i + batchSize && j <= numPages; j++) {
      batch.push(j);
    }

    const results = await Promise.all(
      batch.map(async (page) => {
        const url = `https://itunes.apple.com/${country}/customer-reviews/id${encodeURIComponent(numericId)}?displayable-kind=11&page=${page}&sortBy=${appleSort}`;
        try {
          const res = await fetch(url, {
            headers: APPLE_WEB_HEADERS,
            signal: combineSignals(signal),
          });
          if (res.status === 403 || res.status === 429) {
            rateLimited = true;
            return [];
          }
          if (!res.ok) return [];
          const html = await res.text();
          return parseAppleWebHtml(html, country, numericId, page);
        } catch (err) {
          if (!signal?.aborted) {
            console.error(`Apple Web Fetch Error on page ${page}:`, err);
          }
          return [];
        }
      })
    );

    let addedAnyNew = false;
    for (const pageReviews of results) {
      for (const review of pageReviews) {
        const key = makeDedupeKey(review.userName, review.text);
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          collected.push(review);
          addedAnyNew = true;
        }
      }
    }

    const totalFetched = initialCount + collected.length;
    onProgress?.({
      fetched: Math.min(totalFetched, num),
      target: num,
      percent: Math.min(98, Math.round((totalFetched / num) * 100)),
      stage: 'scraping',
    });

    if (totalFetched >= num) break;
    if (rateLimited) {
      console.warn('Apple rate limit (403/429) reached in web fetch.');
      break;
    }

    if (!addedAnyNew) {
      emptyBatchCount++;
      // Stop early once we confirm 3 consecutive empty batches past the initial pages
      if (emptyBatchCount >= 3 && i > 15) break;
    } else {
      emptyBatchCount = 0;
    }

    const delay = 80 + Math.random() * 140;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return collected;
}

async function fetchAppleReviews(
  query: ReviewsQuery,
  onProgress?: ProgressCallback,
  signal?: AbortSignal
): Promise<ReviewItem[]> {
  const numericId = await resolveAppleNumericId(query.appId, query.country);
  const seenKeys = new Set<string>();
  let allReviews: ReviewItem[] = [];
  let rssAttempted = false;

  if (query.num <= 500) {
    rssAttempted = true;
    const rssReviews = await fetchAppleRssReviews(
      numericId,
      query.country,
      query.num,
      query.sort,
      seenKeys,
      onProgress,
      signal
    );
    allReviews = allReviews.concat(rssReviews);
  }

  if (allReviews.length < query.num && !signal?.aborted) {
    const webReviews = await fetchAppleWebReviews(
      numericId,
      query.country,
      query.num,
      query.sort,
      seenKeys,
      allReviews.length,
      onProgress,
      signal
    );
    allReviews = allReviews.concat(webReviews);
  }

  // Fallback to RSS if web scraping returned nothing (e.g. instant 403 for num > 500)
  if (allReviews.length === 0 && !rssAttempted && !signal?.aborted) {
    const fallbackReviews = await fetchAppleRssReviews(
      numericId,
      query.country,
      query.num,
      query.sort,
      seenKeys,
      onProgress,
      signal
    );
    allReviews = allReviews.concat(fallbackReviews);
  }

  if (allReviews.length === 0) {
    throw new Error(
      'Apple App Store의 리뷰 데이터를 가져올 수 없습니다. RSS API와 페이지 스크래핑 모두 실패했습니다.'
    );
  }

  return allReviews.slice(0, query.num);
}

async function fetchGooglePlayReviews(
  query: ReviewsQuery,
  onProgress?: ProgressCallback
): Promise<ReviewItem[]> {
  onProgress?.({
    fetched: 0,
    target: query.num,
    percent: 25,
    stage: 'play',
  });

  const result = await gplay.reviews({
    appId: query.appId,
    lang: query.lang,
    country: query.country,
    sort: query.sort,
    num: query.num,
  });

  const rawList: any[] = Array.isArray(result) ? result : result?.data || [];
  const normalized: ReviewItem[] = rawList.slice(0, query.num).map((r, idx) => ({
    id: r.id ? String(r.id) : makeStableId('gplay', `${r.userName}:${r.date}:${r.text}`, idx),
    userName: r.userName || 'Unknown',
    userImage: r.userImage || '',
    date: r.date || new Date().toISOString(),
    score: typeof r.score === 'number' ? r.score : parseInt(r.scoreText || '5', 10) || 5,
    scoreText: String(r.scoreText || r.score || '5'),
    url: r.url || '',
    title: r.title || '',
    text: r.text || '',
    replyDate: r.replyDate || '',
    replyText: r.replyText || '',
    version: r.version || '',
    thumbsUp: typeof r.thumbsUp === 'number' ? r.thumbsUp : 0,
  }));

  onProgress?.({
    fetched: normalized.length,
    target: query.num,
    percent: 100,
    stage: 'done',
  });

  return normalized;
}

export async function fetchReviews(
  query: ReviewsQuery,
  onProgress?: ProgressCallback,
  signal?: AbortSignal
): Promise<ReviewItem[]> {
  const cacheKey = `${query.storeType}:${query.country}:${query.lang}:${query.sort}:${query.num}:${query.appId}`;
  const cached = reviewsCache.get(cacheKey);
  if (cached) {
    onProgress?.({
      fetched: cached.length,
      target: query.num,
      percent: 100,
      stage: 'done',
    });
    return cached;
  }

  onProgress?.({
    fetched: 0,
    target: query.num,
    percent: 5,
    stage: 'connecting',
  });

  const reviews =
    query.storeType === 'apple'
      ? await fetchAppleReviews(query, onProgress, signal)
      : await fetchGooglePlayReviews(query, onProgress);

  if (!signal?.aborted && reviews.length > 0) {
    reviewsCache.set(cacheKey, reviews);
  }

  onProgress?.({
    fetched: reviews.length,
    target: query.num,
    percent: 100,
    stage: 'done',
  });

  return reviews;
}
