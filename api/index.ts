import express from "express";
import cors from "cors";
import gplay from "google-play-scraper";
import appStore from "app-store-scraper";
import { parseStringPromise } from 'xml2js';

const app = express();

app.use(cors());
app.use(express.json());

import * as cheerio from 'cheerio';

async function fetchAppleWebReviews(appId: string, country: string = 'kr', num: number = 100, sort: number = 2) {
  // Try to use numeric appId if possible since Apple Web URL needs numeric id (e.g. id362057947)
  let numericId = appId;
  if (!/^\d+$/.test(appId)) {
    try {
      const info = await appStore.app({ appId, country });
      numericId = String(info.id || info.appId);
    } catch(e) {}
  }
  
  // sort 1 (Helpful), sort 2 (Recent)
  const appleSort = sort === 1 ? 'mostHelpful' : 'mostRecent';
  
  let allReviews: any[] = [];
  // Each page on web view returns about 10-20 reviews, but many are duplicates.
  // We'll fetch more pages to ensure we reach the requested 'num'
  const numPages = Math.min(1000, Math.ceil(num / 5)); // Depending on duplicates and 403s, fetch more pages
  
  // Fetch in batches of 10 to be faster
  const batchSize = 10;
  let emptyBatchCount = 0;
  for (let i = 1; i <= numPages; i += batchSize) {
    const batch = [];
    for (let j = i; j < i + batchSize && j <= numPages; j++) {
      batch.push(j);
    }
    
    const results = await Promise.all(batch.map(async (page) => {
      const url = `https://itunes.apple.com/${country}/customer-reviews/id${numericId}?displayable-kind=11&page=${page}&sortBy=${appleSort}`;
      try {
        const res = await fetch(url, {
          headers: { 
            'X-Apple-Store-Front': '143466,12',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (!res.ok) return [];
        
        const html = await res.text();
        const $ = cheerio.load(html);
        
        let pageReviews: any[] = [];
        $('.customer-review').each((_, el) => {
          const title = $(el).find('.customerReviewTitle').text().trim();
          const reviewer = $(el).find('.reviewer').text().trim();
          const ratingStr = $(el).find('.rating').attr('aria-label');
          const rating = ratingStr ? parseInt(ratingStr.match(/\d+/)?.[0] || '5') : 5;
          const version = $(el).find('.user-info').text().match(/버전\s*([0-9\.]+)/i)?.[1] || '';
          const dateMatch = $(el).find('.user-info').text().match(/(\d{4}\.\d{2}\.\d{2})/);
          const date = dateMatch ? dateMatch[1].replace(/\./g, '-') : new Date().toISOString();
          const text = $(el).find('.content').text().trim();
          
          if (!text) return;

          pageReviews.push({ 
             id: String(Math.random()),
             userName: reviewer || 'Unknown',
             userImage: 'https://www.apple.com/apple-touch-icon.png',
             title, 
             text, 
             score: rating,
             scoreText: String(rating),
             date, 
             version,
             url: `https://apps.apple.com/${country}/app/id${numericId}`,
             replyDate: '',
             replyText: '',
             thumbsUp: 0
          });
        });
        
        return pageReviews;
      } catch(e) {
        console.error(`Apple Web Fetch Error on page ${page}:`, e);
        return [];
      }
    }));
    
    let addedAnyNew = false;
    results.forEach(pageReviews => {
      if (pageReviews.length > 0) {
        const prevCount = allReviews.length;
        allReviews = allReviews.concat(pageReviews);
        // Deduplicate
        allReviews = allReviews.filter((r, index, self) => 
          index === self.findIndex((t) => t.userName === r.userName && t.text === r.text)
        );
        if (allReviews.length > prevCount) addedAnyNew = true;
      }
    });
    
    // Quick exit if we reached the count
    if (allReviews.length >= num) break;
    
    // If we've gone through a lot of batches and didn't add anything new, Apple might be repeating or we're at the end
    // Give it a longer grace period in case of a streak of 403s
    if (!addedAnyNew) {
      emptyBatchCount++;
      if (emptyBatchCount >= 5 && i > 50) break;
    } else {
      emptyBatchCount = 0;
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  return allReviews.slice(0, num);
}

// API routes
app.get("/api/reviews", async (req, res) => {
  const { appId, lang = 'ko', country = 'kr', sort = 2, num = 100, storeType = 'play' } = req.query;

  if (!appId) {
    return res.status(400).json({ error: "appId is required" });
  }

  try {
    if (storeType === 'apple') {
      let allReviews: any[] = [];
      
      // num이 500보다 작으면 RSS 시도 (더 빠를 수 있음)
      if (Number(num) <= 500) {
        const isNumeric = /^\d+$/.test(appId as string);
        let numericId = appId;
        if (!isNumeric) {
          try {
             const info = await appStore.app({ appId: appId as string, country: country as string });
             numericId = String(info.id || info.appId);
          } catch(e) {}
        }
        
        const numPages = Math.min(10, Math.ceil(Number(num) / 50));
        const appleSort = Number(sort) === 1 ? 'mostHelpful' : 'mostRecent';
        
        for (let i = 1; i <= Math.max(1, numPages); i++) {
          try {
             const url = `https://itunes.apple.com/${country}/rss/customerreviews/page=${i}/id=${numericId}/sortBy=${appleSort}/xml`;
             const rssRes = await fetch(url);
             if (!rssRes.ok) break;
             const rssData: any = await parseStringPromise(await rssRes.text());
             const entries = rssData?.feed?.entry;
             if (!entries) break;
             const entriesArr = Array.isArray(entries) ? entries : [entries];
             
             const pageReviews = entriesArr.map((r: any) => ({
                id: r.id?.[0] || String(Math.random()),
                userName: r.author?.[0]?.name?.[0] || 'Unknown',
                userImage: 'https://www.apple.com/apple-touch-icon.png',
                date: r.updated?.[0] || new Date().toISOString(),
                score: parseInt(r['im:rating']?.[0] || '5'),
                scoreText: r['im:rating']?.[0] || '5',
                url: r.link?.[0]?.$?.href || '',
                title: r.title?.[0] || '',
                text: r.content?.[0]?._ || r.content?.[0] || '',
                replyDate: '',
                replyText: '',
                version: r['im:version']?.[0] || '',
                thumbsUp: 0
             }));
             allReviews = allReviews.concat(pageReviews);
          } catch (e) {
            console.error(`Apple Store API Error on page ${i}:`, e);
            break; 
          }
        }
      }
      
      // RSS가 실패했거나, 요청 개수가 많으면 HTML 스크래핑 시도
      if (allReviews.length < Number(num)) {
        const webReviews = await fetchAppleWebReviews(appId as string, country as string, Number(num), Number(sort));
        // 합치기 및 중복 제거
        allReviews = allReviews.concat(webReviews);
        allReviews = allReviews.filter((r, index, self) => 
          index === self.findIndex((t) => t.userName === r.userName && t.text === r.text)
        );
      }
      
      if (allReviews.length === 0) {
        throw new Error("Apple App Store의 리뷰 데이터를 가져올 수 없습니다. RSS API와 페이지 스크래핑 모두 실패했습니다.");
      }
      
      const formatted = allReviews.slice(0, Number(num)).map(r => ({
        id: r.id || String(Math.random()),
        userName: r.userName,
        userImage: 'https://www.apple.com/apple-touch-icon.png',
        date: r.updated || r.date || new Date().toISOString(),
        score: r.score,
        scoreText: String(r.score),
        url: r.url || '',
        title: r.title,
        text: r.text,
        replyDate: '',
        replyText: '',
        version: r.version || '',
        thumbsUp: 0
      }));
      
      return res.json({ data: formatted });
    }

    // Default: Google Play
    const reviews = await gplay.reviews({
      appId: appId as string,
      lang: lang as string,
      country: country as string,
      sort: Number(sort),
      num: Number(num)
    });
    res.json(reviews);
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: error.message || "Failed to fetch reviews" });
  }
});

app.get("/api/app-info", async (req, res) => {
  const { appId, storeType = 'play', country = 'kr' } = req.query;
  if (!appId) {
    return res.status(400).json({ error: "appId is required" });
  }
  
  try {
    if (storeType === 'apple') {
      const isNumeric = /^\d+$/.test(appId as string);
      const targetId = isNumeric ? { id: appId as string } : { appId: appId as string };
      const info = await appStore.app({ ...targetId, country: country as string });
      
      return res.json({
        title: info.title,
        icon: info.icon,
        developer: info.developer,
        appId: info.appId,
        numericId: info.id,
        storeUrl: info.url
      });
    }

    // Default: Google Play
    const info = await gplay.app({ appId: appId as string, lang: 'ko', country: country as string });
    res.json(info);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch app info" });
  }
});

export default app;
