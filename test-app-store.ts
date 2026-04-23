import appStore from 'app-store-scraper';
async function test() {
  try {
    const info = await appStore.app({ id: '378084485', country: 'kr' });
    console.log("INFO SUCCESS");
    const reviews = await appStore.reviews({ id: '378084485', country: 'kr', page: 1 });
    console.log("REVIEWS SUCCESS:", reviews.length);
  } catch (e: any) {
    console.error("ERROR CAUGHT:");
    console.error(e);
  }
}
test();
