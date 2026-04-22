import React, { useState, useMemo } from 'react';
import { Search, Download, Star, Loader2, AlertCircle, ExternalLink, Trash2, History, Filter, Calendar, ListOrdered, X, MessageSquare, ThumbsUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

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
}

export default function App() {
  const [appId, setAppId] = useState('');
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
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [showCountPresets, setShowCountPresets] = useState(false);

  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('play-store-history');
    return saved ? JSON.parse(saved) : [];
  });

  const extractAppId = (input: string) => {
    if (input.includes('id=')) {
      const match = input.match(/id=([^&]+)/);
      return match ? match[1] : input;
    }
    return input.trim();
  };

  const fetchReviews = async (targetId?: string) => {
    const id = targetId || extractAppId(appId);
    if (!id) return;

    setLoading(true);
    setError(null);
    setReviews([]);
    setAppInfo(null);
    setCurrentPage(1); // Reset to first page on new fetch

    try {
      // Fetch App Info first
      const infoRes = await fetch(`/api/app-info?appId=${encodeURIComponent(id)}`);
      if (!infoRes.ok) throw new Error('앱 정보를 찾을 수 없습니다.');
      const infoData = await infoRes.json();
      setAppInfo(infoData);

      // Fetch Reviews with requested count
      const reviewsRes = await fetch(`/api/reviews?appId=${encodeURIComponent(id)}&num=${fetchCount}`);
      if (!reviewsRes.ok) throw new Error('리뷰를 가져오는데 실패했습니다.');
      const reviewsData = await reviewsRes.json();
      setReviews(reviewsData.data || reviewsData);

      // Update History
      if (!history.includes(id)) {
        const newHistory = [id, ...history].slice(0, 5);
        setHistory(newHistory);
        localStorage.setItem('play-store-history', JSON.stringify(newHistory));
      }
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to the fetched reviews
  const filteredReviews = useMemo(() => {
    setCurrentPage(1); // Reset to first page when filters change
    return reviews.filter(review => {
      // Rating filter
      if (ratingFilter !== 'all' && review.score !== ratingFilter) return false;

      // Date filter
      const reviewDate = new Date(review.date);
      if (startDate && reviewDate < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (reviewDate > end) return false;
      }

      return true;
    });
  }, [reviews, ratingFilter, startDate, endDate]);

  // Pagination Logic
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
      '날짜': r.date,
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
    
    const fileName = `${appInfo?.title || 'reviews'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('play-store-history');
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
            <span>v1.1.0</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search & Filter Section */}
        <section className="mb-12">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight mb-3">리뷰 데이터 추출하기</h2>
            <p className="text-slate-500">수집할 건수와 필터를 설정하여 더 정교한 데이터를 추출하세요.</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="com.example.app 또는 플레이 스토어 URL 입력"
                className="w-full pl-12 pr-48 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all shadow-sm text-lg"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchReviews()}
              />
              <div className="absolute right-2 top-2 bottom-2 flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 rounded-xl border-2 transition-all flex items-center gap-2 font-semibold text-sm ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                >
                  <Filter className="w-4 h-4" />
                  필터
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
                          onChange={(e) => setFetchCount(Math.max(1, Number(e.target.value)))}
                          onFocus={() => setShowCountPresets(true)}
                          className="w-full p-2.5 pr-20 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                          min="1"
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
                                {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map((count) => (
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
                    </div>

                    {/* Rating Filter */}
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

                    {/* Date Range */}
                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5" /> 기간 설정
                      </label>
                      <div className="flex items-center gap-2 min-w-0">
                        <input 
                          type="date" 
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="flex-1 min-w-0 p-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] sm:text-xs outline-none focus:border-blue-500"
                        />
                        <span className="text-slate-400 shrink-0">~</span>
                        <input 
                          type="date" 
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="flex-1 min-w-0 p-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] sm:text-xs outline-none focus:border-blue-500"
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
                    key={h}
                    onClick={() => {
                      setAppId(h);
                      fetchReviews(h);
                    }}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
                  >
                    {h}
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
                            <span className="text-xs font-medium text-slate-500">{review.date}</span>
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
                      <span className="text-xs font-medium text-slate-500">{selectedReview.date}</span>
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
