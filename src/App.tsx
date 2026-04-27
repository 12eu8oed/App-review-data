import React, { useState, useMemo } from 'react';
import { Search, Download, Star, Loader2, AlertCircle, ExternalLink, Trash2, History, Filter, Calendar, ListOrdered, X, MessageSquare, ThumbsUp, ChevronDown, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

// Store Icons Components
const PlayStoreIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className}>
    <path fill="#4caf50" d="M4.3,3.7l22,23.3L4.2,44.4C4,44.2,3.9,43.9,3.9,43.5V4.6C3.9,4.2,4,3.9,4.3,3.7z"/>
    <path fill="#4bc0c8" d="M30.4,24l13.4-7.7c1-0.6,1-1.5,0-2.1L6.7,1.5C6.1,1.1,5.6,1,5.2,1.3l21,21L30.4,24z"/>
    <path fill="#ffeb3b" d="M30.4,24.1l-4.1-4.2l-21.2-22C4.9,23.3,5,23.6,5.1,23.8l38.7,22.3c1,0.6,1,1.5,0,2.1L30.4,24.1z"/>
    <path fill="#f44336" d="M30.4,24.1l13.4,7.7c1,0.6,1,1.5,0,2.1L6.7,46.5c-0.6,0.3-1.1,0.5-1.5,0.2l21-21l4.2-1.6L30.4,24.1z"/>
  </svg>
);

const AppStoreIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className}>
    <path fill="#1a80fa" d="M256,0C114.6,0,0,114.6,0,256s114.6,256,256,256s256-114.6,256-256S397.4,0,256,0z"/>
    <path fill="#fff" d="M327.9,322.9L228.3,150.3c-2.3-4.1-6.7-6.5-11.4-6.5c-4.7,0-9,2.4-11.4,6.5l-99.7,172.5c-2.3,4-2.3,9,0,13.1c2.4,4,6.7,6.4,11.4,6.4h199.3c4.7,0,9-2.4,11.4-6.4C330.2,331.8,330.2,326.9,327.9,322.9z M216.7,281.3l-55.5-96l-55.5,96H216.7z M189,233.1h55.5l-27.7-48L189,233.1z M342.3,281.3h-83.3l41.6-72L342.3,281.3z M272.9,301.7h55.5l-27.7-48L272.9,301.7z M395.4,322.9l-49.8-86.2l-27.7,48l22.1,38.1H299.7l27.7,48h56.5c4.7,0,9-2.4,11.4-6.4C397.7,331.8,397.7,326.9,395.4,322.9z"/>
  </svg>
);

type StoreType = 'play' | 'apple';

interface Review {
  id: string;
  userName: string;
  userImage: string;
  date: string;
  score: number;
  scoreText: string;
  url: string;
  title: string;
  text: string;
  replyDate: string;
  replyText: string;
  version: string;
  thumbsUp: number;
}

interface AppInfo {
  title: string;
  icon: string;
  developer: string;
  appId: string;
  storeUrl?: string;
  storeType: StoreType;
}

export default function App() {
  const [appId, setAppId] = useState('');
  const [storeType, setStoreType] = useState<StoreType>('play');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Filter States
  const [fetchCount, setFetchCount] = useState(100);
  const [sortOrder, setSortOrder] = useState<number>(2); // 2: RECENT/NEWEST, 1: HELPFUL
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [keywordFilter, setKeywordFilter] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [showCountPresets, setShowCountPresets] = useState(false);

  const [history, setHistory] = useState<{id: string, store: StoreType}[]>(() => {
    const saved = localStorage.getItem('app-review-history');
    return saved ? JSON.parse(saved) : [];
  });

  const extractAppIdAndStore = (input: string, currentStore: StoreType): { id: string, store: StoreType } => {
    let resultStore = currentStore;
    let resultId = input.trim();

    // Auto-detect store from URL
    if (input.includes('apps.apple.com')) {
      resultStore = 'apple';
    } else if (input.includes('play.google.com')) {
      resultStore = 'play';
    }

    if (resultStore === 'play' && input.includes('id=')) {
      const match = input.match(/id=([^&]+)/);
      resultId = match ? match[1] : input;
    } else if (resultStore === 'apple' && input.includes('id')) {
      const match = input.match(/\/id(\d+)/);
      resultId = match ? match[1] : input.replace(/\D/g, ''); // Extract numerical ID
    }

    return { id: resultId.trim(), store: resultStore };
  };

  const fetchReviews = async (targetId?: string, targetStore?: StoreType) => {
    const rawInput = targetId || appId;
    const { id, store: activeStore } = extractAppIdAndStore(rawInput, targetStore || storeType);
    
    if (!id) return;

    // Update auto-detected store in UI
    if (activeStore !== storeType) {
      setStoreType(activeStore);
    }

    setLoading(true);
    setError(null);
    setReviews([]);
    setAppInfo(null);
    setCurrentPage(1);

    try {
      // Fetch App Info
      const infoRes = await fetch(`/api/app-info?appId=${encodeURIComponent(id)}&storeType=${activeStore}`);
      if (!infoRes.ok) throw new Error(`${activeStore === 'play' ? 'Google Play' : 'App Store'}에서 앱 정보를 찾을 수 없습니다. 올바른 주소나 ID인지 확인해 주세요.`);
      const infoData = await infoRes.json();
      setAppInfo({ ...infoData, storeType: activeStore });

      // Fetch Reviews
      const reviewsRes = await fetch(`/api/reviews?appId=${encodeURIComponent(id)}&num=${fetchCount}&storeType=${activeStore}&sort=${sortOrder}`);
      if (!reviewsRes.ok) throw new Error('리뷰를 가져오는데 실패했습니다.');
      const reviewsData = await reviewsRes.json();
      setReviews(reviewsData.data || reviewsData);

      // Update History
      const historyItem = { id, store: activeStore };
      const filteredHistory = history.filter(h => h.id !== id || h.store !== activeStore);
      const newHistory = [historyItem, ...filteredHistory].slice(0, 5);
      
      setHistory(newHistory);
      localStorage.setItem('app-review-history', JSON.stringify(newHistory));
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // ... (rest of the component keeps the same filter and pagination logic)
  const filteredReviews = useMemo(() => {
    setCurrentPage(1);
    return reviews.filter(review => {
      if (ratingFilter !== 'all' && review.score !== ratingFilter) return false;
      
      if (startDate || endDate) {
        const rDate = new Date(review.date);
        
        if (startDate) {
          const start = new Date(`${startDate}T00:00:00`);
          if (rDate < start) return false;
        }
        if (endDate) {
          const end = new Date(`${endDate}T23:59:59.999`);
          if (rDate > end) return false;
        }
      }

      if (keywordFilter && !review.text.toLowerCase().includes(keywordFilter.toLowerCase())) return false;
      return true;
    });
  }, [reviews, ratingFilter, startDate, endDate, keywordFilter]);

  const totalPages = Math.ceil(filteredReviews.length / pageSize);
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReviews.slice(start, start + pageSize);
  }, [filteredReviews, currentPage]);

  const exportToExcel = () => {
    if (filteredReviews.length === 0) return;
    const data = filteredReviews.map(r => ({
      '작성자': r.userName,
      '평점': r.score,
      '날짜': new Date(r.date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      '제목': r.title || '',
      '내용': r.text,
      '버전': r.version || '',
      '추천수': r.thumbsUp,
      '답변날짜': r.replyDate || '',
      '답변내용': r.replyText || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reviews');
    const fileName = `${appInfo?.title || 'reviews'}_${appInfo?.storeType || 'play'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('app-review-history');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Download className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Play Store Review</h1>
              <p className="text-xs text-slate-500 font-medium">Exporter Pro</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-500">
            <span>v2.0.0</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search & Filter Section */}
        <section className="mb-12">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight mb-3">리뷰 데이터 추출하기</h2>
            <p className="text-slate-500">구글 플레이와 앱스토어의 데이터를 손쉽게 추출하세요.</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {/* Store Type Toggle */}
            <div className="flex justify-center mb-6">
              <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 shadow-inner relative">
                <button
                  onClick={() => setStoreType('play')}
                  className={`relative z-10 flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-colors ${storeType === 'play' ? 'text-green-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <PlayStoreIcon className="w-5 h-5" />
                  Google Play
                </button>
                <button
                  onClick={() => setStoreType('apple')}
                  className={`relative z-10 flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-colors ${storeType === 'apple' ? 'text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <AppStoreIcon className="w-5 h-5" />
                  App Store
                </button>
                {/* Active Indicator Background */}
                <div 
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${storeType === 'play' ? 'left-1' : 'left-[calc(50%+2px)]'}`}
                />
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder={storeType === 'play' ? "com.example.app 또는 플레이 스토어 URL 입력" : "앱 아이디(숫자) 또는 앱스토어 URL 입력"}
                className="w-full pl-12 pr-48 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all shadow-sm text-lg"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchReviews()}
              />
              <div className="absolute right-2 top-2 bottom-2 flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-2 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/50 active:scale-95 ${showFilters ? 'bg-slate-100 border-slate-300 text-slate-800 shadow-inner' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm'}`}
                >
                  <Filter className={`w-4 h-4 ${showFilters ? 'text-slate-600' : 'text-slate-400'}`} />
                  필터
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showFilters ? 'rotate-180 text-slate-500' : 'text-slate-400'}`} />
                </button>
                <button
                  onClick={() => fetchReviews()}
                  disabled={loading || !appId}
                  className="px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-xl transition-all flex items-center gap-2 shadow-md shadow-blue-100"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '추출하기'}
                </button>
              </div>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Fetch Count */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <ListOrdered className="w-3.5 h-3.5" /> 수집 건수
                      </label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={fetchCount}
                          onChange={(e) => {
                            let value = Math.max(1, Number(e.target.value));
                            if (storeType === 'apple' && value > 500) value = 500;
                            setFetchCount(value);
                          }}
                          onFocus={() => setShowCountPresets(true)}
                          className="w-full p-2.5 pr-20 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                          min="1"
                          max={storeType === 'apple' ? "500" : undefined}
                          placeholder="예: 3125"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-400">건</span>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowCountPresets(!showCountPresets);
                            }}
                            className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-400"
                          >
                            <ChevronDown className={`w-4 h-4 transition-transform ${showCountPresets ? 'rotate-180' : ''}`} />
                          </button>
                        </div>

                        {/* Custom Dropdown List */}
                        <AnimatePresence>
                          {showCountPresets && (
                            <>
                              <div 
                                className="fixed inset-0 z-20" 
                                onClick={() => setShowCountPresets(false)} 
                              />
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto custom-scrollbar"
                              >
                                {(storeType === 'apple' ? [100, 200, 300, 400, 500] : [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]).map((count) => (
                                  <button
                                    key={count}
                                    type="button"
                                    onClick={() => {
                                      setFetchCount(count);
                                      setShowCountPresets(false);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors flex justify-between items-center"
                                  >
                                    <span className="font-medium">{count}건</span>
                                    {fetchCount === count && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />}
                                  </button>
                                ))}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                      {storeType === 'apple' && (
                        <p className="text-[10px] sm:text-xs text-blue-500/80 font-medium mt-1 leading-tight flex items-start gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          애플 정책상 최대 500건만 수집 가능합니다.
                        </p>
                      )}
                    </div>

                    {/* Rating Filter & Sort Order */}
                    <div className="space-y-4">
                      {/* Sort Order */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <ListOrdered className="w-3.5 h-3.5" /> 수집 기준
                        </label>
                        <select 
                          value={sortOrder}
                          onChange={(e) => setSortOrder(Number(e.target.value))}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                        >
                          <option value={2}>최신순 (Recent)</option>
                          <option value={1}>유용한 순 (Helpful)</option>
                        </select>
                      </div>

                      {/* Rating Filter (moved inside same column wrapper) */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <Star className="w-3.5 h-3.5" /> 평점 필터
                        </label>
                        <select 
                          value={ratingFilter}
                          onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                        >
                          <option value="all">모든 평점</option>
                          <option value={5}>5점만 보기</option>
                          <option value={4}>4점만 보기</option>
                          <option value={3}>3점만 보기</option>
                          <option value={2}>2점만 보기</option>
                          <option value={1}>1점만 보기</option>
                        </select>
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="space-y-4 sm:col-span-2 lg:col-span-1">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <Calendar className="w-3.5 h-3.5" /> 시작일
                        </label>
                        <input 
                          type="date" 
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <Calendar className="w-3.5 h-3.5" /> 종료일
                        </label>
                        <input 
                          type="date" 
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Search Keyword */}
                    <div className="space-y-2 lg:col-span-3">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <MessageSquare className="w-3.5 h-3.5" /> 특정 검색어 필터
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                          <Search className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <input 
                          type="text" 
                          placeholder="리뷰 내용 중 포함된 단어를 입력하세요 (예: 오류, 배송, 디자인)"
                          value={keywordFilter}
                          onChange={(e) => setKeywordFilter(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* History Chips */}
            {history.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
                  <History className="w-3 h-3" /> 최근 검색
                </div>
                {history.map((h) => (
                  <button
                    key={`${h.store}-${h.id}`}
                    onClick={() => {
                      setAppId(h.id);
                      fetchReviews(h.id, h.store);
                    }}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm flex items-center gap-1"
                  >
                    {h.store === 'apple' ? <AppStoreIcon className="w-3 h-3" /> : <PlayStoreIcon className="w-3 h-3" />}
                    {h.id}
                  </button>
                ))}
                <button 
                  onClick={clearHistory}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  title="검색 기록 삭제"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="max-w-3xl mx-auto mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        <AnimatePresence>
          {(appInfo || reviews.length > 0) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* App Info Card */}
              {appInfo && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
                  <img src={appInfo.icon} alt={appInfo.title} className="w-24 h-24 rounded-2xl shadow-inner border border-slate-100" referrerPolicy="no-referrer" />
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-bold mb-1">{appInfo.title}</h3>
                    <p className="text-slate-500 font-medium mb-3">{appInfo.developer}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">{appInfo.appId}</span>
                      <a 
                        href={`https://play.google.com/store/apps/details?id=${appInfo.appId}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                      >
                        스토어에서 보기 <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col gap-2">
                    <button
                      onClick={exportToExcel}
                      disabled={filteredReviews.length === 0}
                      className="px-8 py-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-bold rounded-2xl transition-all flex items-center gap-3 shadow-lg shadow-green-100"
                    >
                      <Download className="w-5 h-5" />
                      엑셀 다운로드 ({filteredReviews.length})
                    </button>
                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-tighter">
                      전체 {reviews.length}건 중 {filteredReviews.length}건 필터링됨
                    </p>
                  </div>
                </div>
              )}

              {/* Summary Dashboard */}
              {filteredReviews.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Count */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-center items-center text-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">필터링된 리뷰 수</span>
                    <div className="text-4xl font-black text-slate-800 tracking-tight">
                      {filteredReviews.length.toLocaleString()}<span className="text-lg text-slate-400 font-medium ml-1">건</span>
                    </div>
                  </div>

                  {/* Average Score */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-center items-center text-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">평균 별점</span>
                    <div className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                      {(filteredReviews.reduce((acc, curr) => acc + curr.score, 0) / filteredReviews.length).toFixed(1)}
                      <Star className="w-6 h-6 text-amber-400 fill-current" />
                    </div>
                  </div>

                  {/* Rating Distribution */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">별점 분포</span>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map(score => {
                        const count = filteredReviews.filter(r => r.score === score).length;
                        const percentage = filteredReviews.length > 0 ? (count / filteredReviews.length) * 100 : 0;
                        return (
                          <div key={score} className="flex items-center gap-2 text-xs">
                            <div className="w-4 font-bold text-slate-500 text-right shrink-0">{score}</div>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-amber-400 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="w-8 text-slate-400 text-right shrink-0">{count}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Reviews Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">사용자</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">평점</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">리뷰 내용</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">날짜</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedReviews.map((review) => (
                        <tr 
                          key={review.id} 
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                          onClick={() => setSelectedReview(review)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={review.userImage} alt={review.userName} className="w-8 h-8 rounded-full bg-slate-200" referrerPolicy="no-referrer" />
                              <span className="font-semibold text-sm group-hover:text-blue-600 transition-colors">{review.userName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-0.5 text-amber-400">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3.5 h-3.5 ${i < review.score ? 'fill-current' : 'text-slate-200'}`} />
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 max-w-md">
                            <p className="text-sm text-slate-700 line-clamp-2" title={review.text}>
                              {review.text}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-xs font-medium text-slate-500">
                              {new Date(review.date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredReviews.length === 0 && !loading && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                            필터 조건에 맞는 데이터가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-blue-300 disabled:opacity-50 transition-all"
                      >
                        이전
                      </button>
                      <div className="flex gap-1">
                        {[...Array(totalPages)].map((_, i) => {
                          const pageNum = i + 1;
                          // Only show a few page numbers if there are many
                          if (
                            pageNum === 1 || 
                            pageNum === totalPages || 
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'}`}
                              >
                                {pageNum}
                              </button>
                            );
                          } else if (
                            pageNum === currentPage - 2 || 
                            pageNum === currentPage + 2
                          ) {
                            return <span key={pageNum} className="flex items-center px-1 text-slate-400">...</span>;
                          }
                          return null;
                        })}
                      </div>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-blue-300 disabled:opacity-50 transition-all"
                      >
                        다음
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!loading && !appInfo && reviews.length === 0 && !error && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-400">시작하려면 앱 ID를 입력하세요</h3>
            <p className="text-slate-400 text-sm mt-2">예: com.kakao.talk (카카오톡)</p>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-32 bg-slate-200 rounded-2xl" />
            <div className="h-96 bg-slate-100 rounded-2xl" />
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-12 border-t border-slate-200 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500 font-medium">
          <p>© 2026 Play Store Review Exporter. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-blue-600 transition-colors">이용약관</a>
            <a href="#" className="hover:text-blue-600 transition-colors">개인정보처리방침</a>
            <a href="#" className="hover:text-blue-600 transition-colors">도움말</a>
          </div>
        </div>
      </footer>

      {/* Review Detail Modal */}
      <AnimatePresence>
        {selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReview(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <img 
                    src={selectedReview.userImage} 
                    alt={selectedReview.userName} 
                    className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-sm" 
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{selectedReview.userName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < selectedReview.score ? 'fill-current' : 'text-slate-200'}`} />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-500">
                        {new Date(selectedReview.date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8 overflow-y-auto custom-scrollbar">
                <div className="space-y-8">
                  {/* Review Text */}
                  <div>
                    <div className="flex items-center gap-2 mb-4 text-blue-600">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">리뷰 내용</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">
                      {selectedReview.text}
                    </p>
                    <div className="mt-6 flex items-center gap-4">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full text-slate-500">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">{selectedReview.thumbsUp}</span>
                      </div>
                      {selectedReview.version && (
                        <div className="text-xs font-bold text-slate-400">
                          Version: {selectedReview.version}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Developer Reply */}
                  {selectedReview.replyText && (
                    <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-blue-700">
                          <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Download className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-widest">개발자 답변</span>
                        </div>
                        <span className="text-xs font-medium text-blue-400">{selectedReview.replyDate}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">
                        {selectedReview.replyText}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <a
                  href={selectedReview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  스토어에서 보기
                </a>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-sm shadow-lg shadow-blue-100"
                >
                  확인
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
