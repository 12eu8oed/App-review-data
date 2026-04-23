type StoreType = 'play' | 'apple';

const extractAppId = (input: string, store: StoreType) => {
  if (store === 'play' && input.includes('id=')) {
    const match = input.match(/id=([^&]+)/);
    return match ? match[1] : input;
  }
  if (store === 'apple' && input.includes('id')) {
    // Extract numerical ID from Apple URL (e.g. apps.apple.com/app/id123456)
    const match = input.match(/\/id(\d+)/);
    return match ? match[1] : input.replace(/\D/g, ''); // Fallback to stripping non-digits
  }
  return input.trim();
};

const input = "https://apps.apple.com/kr/app/%EB%B0%B0%EB%8B%AC%EC%9D%98%EB%AF%BC%EC%A1%B1-%EB%B0%B0%EB%8B%AC%ED%8C%81-%EB%AC%B4%EB%A3%8C-%EB%B0%B0%EB%AF%BC%ED%81%B4%EB%9F%BD/id378084485";
console.log("Extracted ID:", extractAppId(input, 'apple'));
