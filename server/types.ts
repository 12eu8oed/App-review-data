export type StoreType = 'play' | 'apple';

export interface ReviewItem {
  id: string;
  userName: string;
  userImage: string;
  date: string;
  score: number;
  scoreText: string;
  url: string;
  title: string;
  text: string;
  replyDate: string;
  replyText: string;
  version: string;
  thumbsUp: number;
}

export interface AppInfoResponse {
  title: string;
  icon: string;
  developer: string;
  appId: string;
  numericId?: string | number;
  storeUrl?: string;
}

export interface ReviewsQuery {
  appId: string;
  storeType: StoreType;
  country: string;
  lang: string;
  sort: 1 | 2;
  num: number;
}

export interface FetchProgress {
  fetched: number;
  target: number;
  percent: number;
  stage: 'connecting' | 'rss' | 'scraping' | 'play' | 'done';
}

export type ProgressCallback = (progress: FetchProgress) => void;
