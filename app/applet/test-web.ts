import * as cheerio from 'cheerio';
async function test() {
  const url = 'https://itunes.apple.com/kr/customer-reviews/id976131101?displayable-kind=11&page=1&sortBy=mostRecent';
  const res = await fetch(url, {
    headers: { 
      'X-Apple-Store-Front': '143466,12',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  console.log('Status:', res.status);
  const html = await res.text();
  const $ = cheerio.load(html);
  const reviews = $('.customer-review');
  console.log('reviews count:', reviews.length);
}
test();
