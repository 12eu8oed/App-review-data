import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { fetchAppInfo, fetchReviews } from './reviewService.ts';
import {
  parseAppId,
  parseCountry,
  parseLang,
  parseNum,
  parseSort,
  parseStoreType,
} from './validation.ts';
import type { ReviewsQuery } from './types.ts';

function parseReviewsQuery(req: Request): ReviewsQuery | null {
  const appId = parseAppId(req.query.appId);
  if (!appId) return null;

  return {
    appId,
    storeType: parseStoreType(req.query.storeType),
    country: parseCountry(req.query.country),
    lang: parseLang(req.query.lang),
    sort: parseSort(req.query.sort),
    num: parseNum(req.query.num),
  };
}

export function createApiApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/app-info', async (req: Request, res: Response) => {
    const appId = parseAppId(req.query.appId);
    if (!appId) {
      return res.status(400).json({ error: '유효한 appId가 필요합니다.' });
    }

    const storeType = parseStoreType(req.query.storeType);
    const country = parseCountry(req.query.country);

    try {
      const info = await fetchAppInfo(appId, storeType, country);
      return res.json(info);
    } catch (error: any) {
      console.error('Error fetching app info:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to fetch app info',
      });
    }
  });

  app.get('/api/reviews', async (req: Request, res: Response) => {
    const query = parseReviewsQuery(req);
    if (!query) {
      return res.status(400).json({ error: '유효한 appId가 필요합니다.' });
    }

    const controller = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) {
        controller.abort();
      }
    });

    try {
      const data = await fetchReviews(query, undefined, controller.signal);
      return res.json({ data });
    } catch (error: any) {
      if (controller.signal.aborted) return;
      console.error('Error fetching reviews:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to fetch reviews',
      });
    }
  });

  app.get('/api/reviews/stream', async (req: Request, res: Response) => {
    const query = parseReviewsQuery(req);
    if (!query) {
      return res.status(400).json({ error: '유효한 appId가 필요합니다.' });
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const controller = new AbortController();
    let closed = false;

    res.on('close', () => {
      if (!res.writableEnded) {
        closed = true;
        controller.abort();
      }
    });

    const sendEvent = (event: string, payload: unknown) => {
      if (closed || res.writableEnded) return;
      res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
    };

    try {
      const data = await fetchReviews(
        query,
        (progress) => sendEvent('progress', progress),
        controller.signal
      );

      if (!closed) {
        sendEvent('complete', { data });
        res.end();
      }
    } catch (error: any) {
      console.error('Error streaming reviews:', error);
      if (!closed) {
        sendEvent('error', {
          error: error?.message || 'Failed to fetch reviews',
        });
        res.end();
      }
    }
  });

  app.use((err: any, _req: Request, res: Response, _next: express.NextFunction) => {
    console.error('Unhandled API error:', err);
    if (res.headersSent) return;
    res.status(500).json({ error: err?.message || 'Internal Server Error' });
  });

  return app;
}
