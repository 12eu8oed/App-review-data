import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import gplay from "google-play-scraper";
import appStore from "app-store-scraper";

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
        const targetId = isNumeric ? { id: appId as string } : { appId: appId as string };
        const numPages = Math.min(10, Math.ceil(Number(num) / 50));
        let allReviews: any[] = [];
        const appleSort = Number(sort) === 1 ? appStore.sort.HELPFUL : appStore.sort.RECENT;
        
        for (let i = 1; i <= numPages; i++) {
          try {
            const pageReviews = await appStore.reviews({
              ...targetId,
              country: country as string,
              sort: appleSort,
              page: i
            });
            if (pageReviews && pageReviews.length > 0) {
              allReviews = allReviews.concat(pageReviews);
            } else {
              break;
            }
          } catch (e) {
            break; // Stop if no more pages
          }
        }
        
        const formatted = allReviews.map(r => ({
          id: r.id || String(Math.random()),
          userName: r.userName,
          userImage: 'https://www.apple.com/apple-touch-icon.png',
          date: r.updated || new Date().toISOString(),
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
