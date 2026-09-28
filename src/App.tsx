import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CryptoPair,
  ScreenerFilterState,
  ScreenerPreset,
  Timeframe,
  TechnicalRating,
  CrossStatus,
} from './types/crypto';
import {
  fetchSpotTickers,
  fetchCandles,
  TOP_COINS,
  isStrictSpotPair,
  calculateEMA,
  calculateSMA,
  calculateRSI,
  calculateTechnicalRating,
  intervalToMs,
  generateFallbackCandles,
} from './services/binanceApi';
import { soundAlerts } from './services/soundAlerts';
import { Header } from './components/Header';
import { FilterControls } from './components/FilterControls';
import { ScreenerTable } from './components/ScreenerTable';
import { ChartSection } from './components/ChartSection';
import { VerificationChecklist } from './components/VerificationChecklist';
import { PositionCalculator } from './components/PositionCalculator';
import { TradingViewGuide } from './components/TradingViewGuideModal';
import { Zap, ShieldCheck, ArrowRight, RefreshCw, BarChart2 } from 'lucide-react';

const INITIAL_PRESETS: ScreenerPreset[] = [
  {
    id: 'tv-standard-15m',
    name: 'استراتيجية TradingView المعتمدة (15 دقيقة)',
    description: 'تقاطع صعودي مع فوليوم أعلى من خط الحجم الأسود واستثناء PERP',
    filters: {
      market: 'SPOT',
      quoteAsset: 'USDT',
      timeframe: '15m',
      minVolume24hUsdt: 1000000,
      strategyFilter: 'EMA_CROSS_UP',
      strategyMode: 'EMA_10_20',
      technicalRatingFilter: 'BUY_OR_STRONG',
      volumeCondition: 'ABOVE_BLACK_LINE',
      excludePerpAndFutures: true,
      onlyClosedCandles: false,
      searchQuery: '',
    },
  },
  {
    id: 'scalp-fast-5m',
    name: 'سكالبينج سريع (5 دقائق)',
    description: 'تقاطع EMA 9/21 صاعد للشارتات السريعة مع تأكيد الفوليوم',
    filters: {
      market: 'SPOT',
      quoteAsset: 'USDT',
      timeframe: '5m',
      minVolume24hUsdt: 2000000,
      strategyFilter: 'EMA_CROSS_UP',
      strategyMode: 'EMA_9_21',
      technicalRatingFilter: 'BUY_OR_STRONG',
      volumeCondition: 'ABOVE_BLACK_LINE',
      excludePerpAndFutures: true,
      onlyClosedCandles: true,
      searchQuery: '',
    },
  },
  {
    id: 'swing-1h',
    name: 'سوينغ اختراق (1 ساعة)',
    description: 'اتجاه صاعد مستقر على فريم الساعة مع زخم شراء قوي',
    filters: {
      market: 'SPOT',
      quoteAsset: 'USDT',
      timeframe: '1h',
      minVolume24hUsdt: 5000000,
      strategyFilter: 'BULLISH_TREND',
      strategyMode: 'EMA_9_21',
      technicalRatingFilter: 'STRONG_BUY_ONLY',
      volumeCondition: 'ABOVE_BLACK_LINE',
      excludePerpAndFutures: true,
      onlyClosedCandles: true,
      searchQuery: '',
    },
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'screener' | 'chart' | 'calculator' | 'guide'>('screener');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [presets, setPresets] = useState<ScreenerPreset[]>(INITIAL_PRESETS);
  const [activePresetId, setActivePresetId] = useState<string | null>('tv-standard-15m');
  const [filters, setFilters] = useState<ScreenerFilterState>(INITIAL_PRESETS[0].filters);

  const [pairs, setPairs] = useState<CryptoPair[]>([]);
  const [selectedPair, setSelectedPair] = useState<CryptoPair | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Levels for interactive chart overlay from calculator
  const [tradeLevels, setTradeLevels] = useState({
    entryPrice: 0,
    stopLossPrice: 0,
    takeProfit1: 0,
    takeProfit2: 0,
  });

  const handleLevelsChange = useCallback((entry: number, sl: number, tp1: number, tp2: number) => {
    setTradeLevels((prev) => {
      if (
        prev.entryPrice === entry &&
        prev.stopLossPrice === sl &&
        prev.takeProfit1 === tp1 &&
        prev.takeProfit2 === tp2
      ) {
        return prev;
      }
      return { entryPrice: entry, stopLossPrice: sl, takeProfit1: tp1, takeProfit2: tp2 };
    });
  }, []);

  // Sound toggle sync
  useEffect(() => {
    soundAlerts.setSoundEnabled(isSoundEnabled);
  }, [isSoundEnabled]);

  // Fetch market data and compute indicators
  const loadMarketData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const tickers = await fetchSpotTickers();
      const tickerMap = new Map<string, any>();
      tickers.forEach((t) => tickerMap.set(t.symbol, t));

      // Scan our curated top liquid coins + any actively high-volume spot pairs
      const symbolsToScan = TOP_COINS.map((c) => `${c}USDT`);
      const enrichedPairs: CryptoPair[] = [];

      for (const symbol of symbolsToScan) {
        if (filters.excludePerpAndFutures && !isStrictSpotPair(symbol)) {
          continue;
        }

        const t = tickerMap.get(symbol);
        const price = t ? parseFloat(t.lastPrice) : 0;
        const change = t ? parseFloat(t.priceChangePercent) : 0;
        const vol24h = t ? parseFloat(t.quoteVolume) : 0;

        // Fetch recent candles for indicator calculations
        const candles = await fetchCandles(symbol, filters.timeframe, 35);
        if (candles.length < 22) continue;

        const currentCandle = candles[candles.length - 1];
        const prevCandle = candles[candles.length - 2];

        const ema9 = currentCandle.ema9 ?? currentCandle.close;
        const ema21 = currentCandle.ema21 ?? currentCandle.close;
        const ema10 = currentCandle.ema10 ?? currentCandle.close;
        const ema20 = currentCandle.ema20 ?? currentCandle.close;

        // Compare based on active strategy mode
        const fastNow = filters.strategyMode === 'EMA_10_20' ? ema10 : ema9;
        const slowNow = filters.strategyMode === 'EMA_10_20' ? ema20 : ema21;
        const fastPrev = filters.strategyMode === 'EMA_10_20' ? (prevCandle.ema10 ?? fastNow) : (prevCandle.ema9 ?? fastNow);
        const slowPrev = filters.strategyMode === 'EMA_10_20' ? (prevCandle.ema20 ?? slowNow) : (prevCandle.ema21 ?? slowNow);

        let crossStatus: CrossStatus = 'NEUTRAL' as any;
        let crossCandlesAgo = 99;

        // Check if crossed up in current or previous candle
        if (fastPrev <= slowPrev && fastNow > slowNow) {
          crossStatus = 'GOLDEN_CROSS';
          crossCandlesAgo = 0;
        } else if (fastNow > slowNow) {
          crossStatus = 'BULLISH';
          crossCandlesAgo = 1;
        } else if (fastPrev >= slowPrev && fastNow < slowNow) {
          crossStatus = 'BEARISH_CROSS';
        } else {
          crossStatus = 'BEARISH';
        }

        // Volume vs Black Line (Volume SMA 20)
        const volSma = currentCandle.volSma20 || 1;
        const isVolumeAboveBlackLine = currentCandle.volume > volSma;
        const volumeSurgeRatio = currentCandle.volume / volSma;

        // Technical Rating & RSI
        const closes = candles.map((c) => c.close);
        const rsi14 = calculateRSI(closes, 14);
        const { rating: technicalRating, score: technicalScore } = calculateTechnicalRating(
          currentCandle.close,
          ema9,
          ema21,
          rsi14,
          isVolumeAboveBlackLine,
          change
        );

        // Candle Close Check
        const intervalMs = intervalToMs(filters.timeframe);
        const candleCloseTime = currentCandle.time + intervalMs;
        const now = Date.now();
        const candleConfirmedClosed = now >= candleCloseTime;

        enrichedPairs.push({
          symbol,
          baseAsset: symbol.replace('USDT', ''),
          quoteAsset: 'USDT',
          price: price || currentCandle.close,
          priceChangePercent24h: change,
          volume24h: vol24h,
          currentCandleVolume: currentCandle.volume,
          volumeSma20: volSma,
          isVolumeAboveBlackLine,
          volumeSurgeRatio,
          ema9,
          ema21,
          ema10,
          ema20,
          crossStatus,
          crossCandlesAgo,
          technicalRating,
          technicalScore,
          rsi14,
          candleCloseTime,
          candleConfirmedClosed,
          timeframe: filters.timeframe,
          high24h: t ? parseFloat(t.highPrice) : currentCandle.high,
          low24h: t ? parseFloat(t.lowPrice) : currentCandle.low,
        });
      }

      setPairs(enrichedPairs);
      setLastUpdated(new Date());

      // If no pair selected yet, select the first strong opportunity
      setSelectedPair((prev) => {
        if (!prev && enrichedPairs.length > 0) {
          return (
            enrichedPairs.find((p) => p.crossStatus === 'GOLDEN_CROSS' && p.isVolumeAboveBlackLine) ||
            enrichedPairs.find((p) => p.technicalRating === 'STRONG_BUY') ||
            enrichedPairs[0]
          );
        } else if (prev) {
          const updated = enrichedPairs.find((p) => p.symbol === prev.symbol);
          return updated || prev;
        }
        return null;
      });

      // Check if fresh Golden Cross with volume was detected
      const goldenCrossCount = enrichedPairs.filter(
        (p) => p.crossStatus === 'GOLDEN_CROSS' && p.isVolumeAboveBlackLine
      ).length;
      if (goldenCrossCount > 0 && isSoundEnabled) {
        soundAlerts.playGoldenCrossChime();
      }
    } catch (e) {
      console.warn('Error fetching market pairs', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters.timeframe, filters.strategyMode, filters.excludePerpAndFutures, isSoundEnabled]);

  // Initial load and periodic refresh
  useEffect(() => {
    loadMarketData();
    const interval = setInterval(loadMarketData, 45000); // 45 seconds polling
    return () => clearInterval(interval);
  }, [loadMarketData]);

  // Filter pairs based on active user filters
  const filteredPairs = useMemo(() => {
    return pairs.filter((p) => {
      // 1. Search filter
      if (filters.searchQuery) {
        const q = filters.searchQuery.toUpperCase().trim();
        if (!p.symbol.includes(q) && !p.baseAsset.includes(q)) return false;
      }

      // 2. Strict Spot filter (exclude PERP/Futures)
      if (filters.excludePerpAndFutures && !isStrictSpotPair(p.symbol)) {
        return false;
      }

      // 3. Strategy / Cross Filter
      if (filters.strategyFilter === 'EMA_CROSS_UP') {
        if (p.crossStatus !== 'GOLDEN_CROSS' && p.crossStatus !== 'BULLISH') return false;
      } else if (filters.strategyFilter === 'BULLISH_TREND') {
        const fast = filters.strategyMode === 'EMA_10_20' ? p.ema10 : p.ema9;
        const slow = filters.strategyMode === 'EMA_10_20' ? p.ema20 : p.ema21;
        if (fast <= slow) return false;
      }

      // 4. Technical Rating
      if (filters.technicalRatingFilter === 'STRONG_BUY_ONLY') {
        if (p.technicalRating !== 'STRONG_BUY') return false;
      } else if (filters.technicalRatingFilter === 'BUY_OR_STRONG') {
        if (p.technicalRating !== 'STRONG_BUY' && p.technicalRating !== 'BUY') return false;
      }

      // 5. Volume Condition (The Black Line)
      if (filters.volumeCondition === 'ABOVE_BLACK_LINE') {
        if (!p.isVolumeAboveBlackLine) return false;
      }

      // 6. Confirmed Closed Candles Only
      if (filters.onlyClosedCandles) {
        if (!p.candleConfirmedClosed) return false;
      }

      return true;
    });
  }, [pairs, filters]);

  // Opportunity count
  const opportunitiesCount = useMemo(() => {
    return filteredPairs.filter(
      (p) => (p.crossStatus === 'GOLDEN_CROSS' || p.crossStatus === 'BULLISH') && p.isVolumeAboveBlackLine
    ).length;
  }, [filteredPairs]);

  // Preset handlers
  const handleSelectPreset = (preset: ScreenerPreset) => {
    setActivePresetId(preset.id);
    setFilters(preset.filters);
  };

  const handleSavePreset = (name: string, description: string) => {
    const newPreset: ScreenerPreset = {
      id: `custom-${Date.now()}`,
      name,
      description,
      filters: { ...filters },
    };
    setPresets((prev) => [...prev, newPreset]);
    setActivePresetId(newPreset.id);
  };

  const handleDeletePreset = (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
    if (activePresetId === id && presets.length > 1) {
      setActivePresetId(presets[0].id);
      setFilters(presets[0].filters);
    }
  };

  const handleSelectPairAndInspect = (pair: CryptoPair) => {
    setSelectedPair(pair);
    setActiveTab('chart');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSoundEnabled={isSoundEnabled}
        setIsSoundEnabled={setIsSoundEnabled}
        isRefreshing={isRefreshing}
        onRefresh={loadMarketData}
        lastUpdated={lastUpdated}
        opportunitiesCount={opportunitiesCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {/* Tab 1: Screener View */}
        {activeTab === 'screener' && (
          <div className="space-y-6">
            {/* Filter Controls & Presets */}
            <FilterControls
              filters={filters}
              setFilters={setFilters}
              presets={presets}
              activePresetId={activePresetId}
              onSelectPreset={handleSelectPreset}
              onSavePreset={handleSavePreset}
              onDeletePreset={handleDeletePreset}
            />

            {/* Results Table */}
            <ScreenerTable
              pairs={filteredPairs}
              selectedPair={selectedPair}
              onSelectPair={handleSelectPairAndInspect}
              isLoading={isLoading}
            />

            {/* Selected Pair Quick Audit Bar */}
            {selectedPair && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 font-bold">
                    {selectedPair.baseAsset.slice(0, 3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {selectedPair.baseAsset}/{selectedPair.quoteAsset}
                      </span>
                      <span className="font-mono text-cyan-400 text-xs font-semibold">
                        ${selectedPair.price.toFixed(4)}
                      </span>
                      <span className={`text-xs font-mono ${selectedPair.priceChangePercent24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {selectedPair.priceChangePercent24h >= 0 ? '+' : ''}{selectedPair.priceChangePercent24h.toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>الفوليوم vs خط الحجم الأسود:</span>
                      <span className={selectedPair.isVolumeAboveBlackLine ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        {selectedPair.volumeSurgeRatio.toFixed(1)}x {selectedPair.isVolumeAboveBlackLine ? '(متجاوز للخط)' : '(دون المتوسط)'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('chart')}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>فحص الشارت والمراجعة اليدوية</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('calculator')}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                  >
                    <span>حساب حجم الصفقة</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Chart & Manual Verification View */}
        {activeTab === 'chart' && (
          <div className="space-y-6">
            {selectedPair ? (
              <>
                <ChartSection
                  pair={selectedPair}
                  allPairs={pairs}
                  onSelectPair={setSelectedPair}
                  timeframe={filters.timeframe}
                  onTimeframeChange={(tf) => setFilters((prev) => ({ ...prev, timeframe: tf }))}
                  entryPrice={tradeLevels.entryPrice || selectedPair.price}
                  stopLossPrice={tradeLevels.stopLossPrice}
                  takeProfit1={tradeLevels.takeProfit1}
                  takeProfit2={tradeLevels.takeProfit2}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Step-by-step verification audit */}
                  <VerificationChecklist pair={selectedPair} />

                  {/* Built-in position calculator */}
                  <PositionCalculator
                    pair={selectedPair}
                    onLevelsChange={handleLevelsChange}
                  />
                </div>
              </>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <BarChart2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">اختر عملة من الفلتر لبدء الفحص اليدوي</h3>
                <p className="text-xs text-slate-400 mb-4">
                  تتيح لك أداة الفحص فحص تقاطع EMA 9/21 والتحقق من خط الفوليوم الأسود وحساب أهداف الصفقة.
                </p>
                <button
                  onClick={() => setActiveTab('screener')}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
                >
                  العودة للفلتر واختيار عملة
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Dedicated Calculator */}
        {activeTab === 'calculator' && (
          <div className="space-y-6">
            <PositionCalculator
              pair={selectedPair}
              onLevelsChange={handleLevelsChange}
            />
            {selectedPair && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h4 className="text-xs font-bold text-slate-300 mb-2">توصية المحلل الفني للصفقة الحالية ({selectedPair.symbol})</h4>
                <div className="text-xs text-slate-400 space-y-1 leading-relaxed">
                  <p>• تأكد دائماً أن نسبة الخسارة المحتملة لا تتجاوز 1.5% - 2% من إجمالي رأس المال المخصص للمضاربة.</p>
                  <p>• إذا كان الفوليوم دون خط الحجم الأسود، قم بخفض حجم الصفقة بمقدار النصف أو انتظر اكتمال السيولة.</p>
                  <p>• عند وصول السعر للهدف الأول (TP1)، انقل وقف الخسارة مباشرة إلى نقطة الدخول (Breakeven) لحماية رأس المال.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Step-by-step TradingView Guide & Pine Script */}
        {activeTab === 'guide' && <TradingViewGuide />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CryptoScalp Pro · منصة فلترة العملات الرقمية للمضاربة الفنية واقتناص الفرص</span>
          <span className="font-mono text-slate-600 text-[11px]">
            استراتيجية EMA 9/21 و 10/20 · خط الحجم الأسود SMA 20 · سوق Spot فقط
          </span>
        </div>
      </footer>
    </div>
  );
}
