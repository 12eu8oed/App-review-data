import { StoreType } from './types.ts';

const SAFE_APP_ID_RE = /^[a-zA-Z0-9._-]+$/;
const COUNTRY_RE = /^[a-z]{2}$/i;
const LANG_RE = /^[a-z]{2}(-[a-zA-Z]{2})?$/;

export function parseStoreType(raw: unknown): StoreType {
  return raw === 'apple' ? 'apple' : 'play';
}

export function parseCountry(raw: unknown): string {
  if (typeof raw === 'string' && COUNTRY_RE.test(raw.trim())) {
    return raw.trim().toLowerCase();
  }
  return 'kr';
}

export function parseLang(raw: unknown): string {
  if (typeof raw === 'string' && LANG_RE.test(raw.trim())) {
    return raw.trim();
  }
  return 'ko';
}

export function parseSort(raw: unknown): 1 | 2 {
  const num = Number(raw);
  return num === 1 ? 1 : 2;
}

export function parseNum(raw: unknown): number {
  const parsed = Math.floor(Number(raw));
  if (!Number.isFinite(parsed) || parsed < 1) return 100;
  return Math.min(5000, parsed);
}

export function parseAppId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 200) return null;
  if (!SAFE_APP_ID_RE.test(trimmed)) return null;
  return trimmed;
}
