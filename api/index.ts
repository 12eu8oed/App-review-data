import express from "express";
import cors from "cors";
import gplay from "google-play-scraper";

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.get("/api/reviews", async (req, res) => {
  const { appId, lang = 'ko', country = 'kr', sort = 2, num = 100 } = req.query;

  if (!appId) {
    return res.status(400).json({ error: "appId is required" });
  }

  try {
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
  const { appId } = req.query;
  if (!appId) {
    return res.status(400).json({ error: "appId is required" });
  }
  try {
    const info = await gplay.app({ appId: appId as string });
    res.json(info);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch app info" });
  }
});

export default app;
