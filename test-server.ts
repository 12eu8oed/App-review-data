import express from "express";
import gplay from "google-play-scraper";
import appStore from "app-store-scraper";

const app = express();

app.get("/api/reviews", async (req, res) => {
  const { appId, lang = 'ko', country = 'kr', sort = 2, num = 100, storeType = 'play' } = req.query;
  try {
    if (storeType === 'apple') {
      const isNumeric = /^\d+$/.test(appId as string);
      const targetId = isNumeric ? { id: appId as string } : { appId: appId as string };
      const numPages = Math.min(10, Math.ceil(Number(num) / 50));
      let allReviews: any[] = [];
      
      for (let i = 1; i <= numPages; i++) {
        try {
          const pageReviews = await appStore.reviews({
            ...targetId,
            country: country as string,
            sort: appStore.sort.RECENT,
            page: i
          });
          if (pageReviews && pageReviews.length > 0) {
            allReviews = allReviews.concat(pageReviews);
          } else { break; }
        } catch (e) { break; }
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
    const reviews = await gplay.reviews({ appId: appId as string, num: Number(num) });
    res.json(reviews);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/app-info", async (req, res) => {
  const { appId, storeType = 'play', country = 'kr' } = req.query;
  try {
    if (storeType === 'apple') {
      const isNumeric = /^\d+$/.test(appId as string);
      const targetId = isNumeric ? { id: appId as string } : { appId: appId as string };
      const info = await appStore.app({ ...targetId, country: country as string });
      return res.json({ title: info.title, icon: info.icon, developer: info.developer, appId: info.appId, storeUrl: info.url });
    }
    const info = await gplay.app({ appId: appId as string });
    res.json(info);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

const server = app.listen(3001, async () => {
    try {
        console.log("Fetching App info");
        const infoRes = await fetch("http://127.0.0.1:3001/api/app-info?appId=378084485&storeType=apple");
        console.log("INFO status:", infoRes.status);
        console.log("INFO data:", await infoRes.json());
        
        console.log("Fetching Reviews");
        const reviewsRes = await fetch("http://127.0.0.1:3001/api/reviews?appId=378084485&storeType=apple&num=100");
        console.log("REVIEWS status:", reviewsRes.status);
        const revData = await reviewsRes.json();
        console.log("REVIEWS count:", revData?.data?.length);
    } catch(e) {
        console.error("Test fetch error:", e);
    } finally {
        server.close();
    }
});
