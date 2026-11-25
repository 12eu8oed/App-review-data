export type StoreType = 'play' | 'apple';

export type AstryxTheme = 'neutral' | 'stone' | 'matcha';
export type ColorMode = 'light' | 'dark';

export interface Review {
  id: string;
  userName: string;
  userImage: string;
  date: string;
  timestamp: number;
  formattedDate: string;
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

export interface AppInfo {
  title: string;
  icon: string;
  developer: string;
  appId: string;
  numericId?: string | number;
  storeUrl?: string;
  storeType: StoreType;
}

export interface HistoryItem {
  id: string;
  store: StoreType;
}

export interface ReviewStats {
  total: number;
  averageScore: string;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ExtractionProgress {
  fetched: number;
  target: number;
  percent: number;
  stage: 'connecting' | 'rss' | 'scraping' | 'play' | 'done';
}
