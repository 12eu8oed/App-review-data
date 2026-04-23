import appStore from "app-store-scraper";

async function test() {
  const reviews = await appStore.reviews({ id: '378084485', country: 'kr', page: 1 });
  if (reviews && reviews.length > 0) {
    console.log("Apple App Store Review Date Format:", reviews[0].updated);
    console.log("Raw Review Object:", JSON.stringify(reviews[0], null, 2));
  }
}
test();
