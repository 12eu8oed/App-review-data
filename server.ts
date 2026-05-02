import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import gplay from "google-play-scraper";
import appStore from "app-store-scraper";

async function fetchAppleWebReviews(appId: string, country: string = 'kr') {
  let numericId = appId;
  if (!/^\d+$/.test(appId)) {
    try {
      const info = await appStore.app({ appId, country });
      numericId = String(info.id || info.appId);
    } catch(e) {}
  }
  
  const url = `https://apps.apple.com/${country}/app/id${numericId}`;
  try {
    const res = await fetch(url);
    const html = await res.text();
    const match = html.match(/<script type=\"application\/json\" id=\"serialized-server-data\">([^<]+)<\/script>/);
    if (!match) return [];
    
    const data = JSON.parse(match[1]);
    const reviewsNode = data?.data?.[0]?.data?.shelfMapping?.allProductReviews?.items || data?.data?.[0]?.data?.shelfMapping?.userProductReviews?.items;
    
    if (!reviewsNode || !Array.isArray(reviewsNode)) {
       return [];
    }
    
    return reviewsNode.map((item: any) => {
      const review = item.review;
      if (!review) return null;
      return {
        id: review.id || String(Math.random()),
        userName: review.reviewerName || 'Unknown',
        title: review.title || '',
        text: review.contents || '',
        score: review.rating || 5,
        date: review.date || new Date().toISOString()
      };
    }).filter(Boolean);
  } catch(e) {
    console.error('Apple Web Fetch Error:', e);
    return [];
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API routes
  app.get("/api/reviews", async (req, res) => {
    const { appId, lang = 'ko', country = 'kr', sort = 2, num = 100, storeType = 'play' } = req.query;

    if (!appId) {
      return res.status(400).json({ error: "appId is required" });
    }

    try {
      if (storeType === 'apple') {
        const isNumeric = /^\d+$/.test(appId as string);
        
        let numericId = appId;
        if (!isNumeric) {
          try {
             const info = await appStore.app({ appId: appId as string, country: country as string });
             numericId = String(info.id || info.appId);
          } catch(e) {}
        }
        
        const numPages = Math.min(10, Math.ceil(Number(num) / 50));
        let allReviews: any[] = [];
        const appleSort = Number(sort) === 1 ? 'mostHelpful' : 'mostRecent';
        
        for (let i = 1; i <= Math.max(1, numPages); i++) {
          try {
             const url = `https://itunes.apple.com/${country}/rss/customerreviews/page=${i}/id=${numericId}/sortby=${appleSort}/json`;
             const rssRes = await fetch(url);
             if (!rssRes.ok) break;
             const rssData = await rssRes.json();
             const entries = rssData?.feed?.entry;
             if (!entries) break;
             const entriesArr = Array.isArray(entries) ? entries : [entries];
             
             const pageReviews = entriesArr.map((r: any) => ({
                id: r.id?.label || String(Math.random()),
                userName: r.author?.name?.label || 'Unknown',
                userImage: 'https://www.apple.com/apple-touch-icon.png',
                date: r.updated?.label || new Date().toISOString(),
                score: parseInt(r['im:rating']?.label || '5'),
                scoreText: r['im:rating']?.label || '5',
                url: r.link?.attributes?.href || '',
                title: r.title?.label || '',
                text: r.content?.label || '',
                replyDate: '',
                replyText: '',
                version: r['im:version']?.label || '',
                thumbsUp: 0
             }));
             allReviews = allReviews.concat(pageReviews);
          } catch (e) {
            console.error(`Apple Store API Error on page ${i}:`, e);
            break; 
          }
        }
        
        // RSS 실패 시 HTML 우회 스크래핑으로 일부만이라도 가져오기
        if (allReviews.length === 0) {
          allReviews = await fetchAppleWebReviews(appId as string, country as string);
        }
        
        if (allReviews.length === 0) {
          throw new Error("Apple App Store의 리뷰 데이터를 가져올 수 없습니다. 최근 Apple의 리뷰 API(RSS) 지원이 중단되어 현재 라이브러리가 작동하지 않으며, 페이지에도 리뷰가 없습니다. 자세한 내용은 GitHub app-store-scraper 이슈 #299를 참조하세요.");
        }
        
        const formatted = allReviews.map(r => ({
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
        })).slice(0, Number(num));
        
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
