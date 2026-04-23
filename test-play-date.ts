import gplay from "google-play-scraper";

async function test() {
  const reviews = await gplay.reviews({ appId: 'com.kakao.talk', country: 'kr', lang: 'ko', num: 1 });
  if (reviews && reviews.data && reviews.data.length > 0) {
    console.log("Google Play Store Review Date Format:", reviews.data[0].date);
    console.log("Raw Review Object:", JSON.stringify(reviews.data[0], null, 2));
  }
}
test();
