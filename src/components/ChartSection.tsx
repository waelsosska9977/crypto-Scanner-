import React, { useState, useEffect, useRef } from 'react';
import { CryptoPair, Candlestick, Timeframe } from '../types/crypto';
import { fetchCandles } from '../services/binanceApi';
import { Clock, TrendingUp, ShieldAlert, Target, RefreshCw, BarChart2, ExternalLink, ChevronDown } from 'lucide-react';

export function formatPrice(val: number): string {
  if (!val || isNaN(val)) return '0.00';
  if (val >= 1000) return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (val >= 1) return val.toFixed(2);
  if (val >= 0.01) return val.toFixed(4);
  if (val >= 0.0001) return val.toFixed(6);
  return val.toFixed(8);
}

function getTradingViewInterval(tf: Timeframe): string {
  switch (tf) {
    case '1m': return '1';
    case '5m': return '5';
    case '15m': return '15';
    case '1h': return '60';
    case '4h': return '240';
    case '1d': return 'D';
    default: return '15';
  }
}

interface ChartSectionProps {
  pair: CryptoPair;
  allPairs?: CryptoPair[];
  onSelectPair?: (pair: CryptoPair) => void;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  entryPrice: number;
  stopLossPrice: number;
  takeProfit1: number;
  takeProfit2: number;
}

export const ChartSection: React.FC<ChartSectionProps> = ({
  pair,
  allPairs = [],
  onSelectPair,
  timeframe,
  onTimeframeChange,
  entryPrice,
  stopLossPrice,
  takeProfit1,
  takeProfit2,
}) => {
  const [candles, setCandles] = useState<Candlestick[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<'interactive' | 'tradingview'>('interactive');
  const [hoveredCandle, setHoveredCandle] = useState<Candlestick | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load candles when pair or timeframe changes
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      const data = await fetchCandles(pair.symbol, timeframe, 50, pair.price);
      if (isMounted) {
        setCandles(data);
        setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [pair.symbol, timeframe, pair.price]);

  // Live countdown to candle close
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      let intervalMs = 15 * 60 * 1000;
      if (timeframe === '5m') intervalMs = 5 * 60 * 1000;
      else if (timeframe === '1m') intervalMs = 60 * 1000;
      else if (timeframe === '1h') intervalMs = 60 * 60 * 1000;
      else if (timeframe === '4h') intervalMs = 4 * 60 * 60 * 1000;
      else if (timeframe === '1d') intervalMs = 24 * 60 * 60 * 1000;

      const nextClose = Math.ceil(now / intervalMs) * intervalMs;
      const diffSec = Math.max(0, Math.floor((nextClose - now) / 1000));
      setSecondsRemaining(diffSec);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [timeframe]);

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Dimensions for custom SVG chart
  const chartHeight = 360;
  const volumeHeight = 100;
  const padding = { top: 20, right: 75, bottom: 25, left: 10 };
  const totalWidth = 800; // SVG viewBox width

  // Compute scale boundaries
  const prices = candles.flatMap((c) => [c.high, c.low]).filter(Boolean);
  const minPrice = prices.length ? Math.min(...prices) * 0.997 : 0;
  const maxPrice = prices.length ? Math.max(...prices) * 1.003 : 1;
  const priceRange = Math.max(maxPrice - minPrice, 0.000001);

  const volumes = candles.map((c) => c.volume);
  const maxVol = Math.max(...volumes, ...(candles.map((c) => c.volSma20 || 0))) * 1.15 || 1;

  const getX = (index: number) => {
    const step = (totalWidth - padding.left - padding.right) / Math.max(candles.length - 1, 1);
    return padding.left + index * step;
  };

  const getY = (price: number) => {
    return padding.top + (1 - (price - minPrice) / priceRange) * (chartHeight - padding.top - padding.bottom);
  };

  const getVolY = (vol: number) => {
    return chartHeight + volumeHeight - (vol / maxVol) * (volumeHeight - 15);
  };

  // Find crossover events for visual arrows
  const crossIndices: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const prevFast = candles[i - 1].ema9;
    const prevSlow = candles[i - 1].ema21;
    const currFast = candles[i].ema9;
    const currSlow = candles[i].ema21;
    if (prevFast && prevSlow && currFast && currSlow) {
      if (prevFast <= prevSlow && currFast > currSlow) {
        crossIndices.push(i);
      }
    }
  }

  const tvInterval = getTradingViewInterval(timeframe);
  const cleanSymbol = pair.symbol.toUpperCase();
  const tvEmbedUrl = `https://s.tradingview.com/widgetembed/?symbol=BINANCE%3A${encodeURIComponent(cleanSymbol)}&interval=${tvInterval}&theme=dark&style=1&timezone=Etc%2FUTC&studies=%5B%22EMA%40tv-basicstudies%22%2C%22MASimple%40tv-basicstudies%22%5D&locale=ar_AE&toolbarbg=0a0e17&allow_symbol_change=1&withdateranges=1&hide_side_toolbar=0`;
  const tvExternalUrl = `https://www.tradingview.com/chart/?symbol=BINANCE:${cleanSymbol}&interval=${tvInterval}`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Top Bar of Chart */}
      <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/70">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Direct Coin Switcher Dropdown */}
          {allPairs.length > 0 && onSelectPair ? (
            <div className="relative">
              <select
                value={pair.symbol}
                onChange={(e) => {
                  const target = allPairs.find((p) => p.symbol === e.target.value);
                  if (target) onSelectPair(target);
                }}
                className="bg-slate-900 border border-cyan-500/40 text-cyan-300 font-bold text-sm rounded-lg px-2.5 py-1.5 pr-7 appearance-none cursor-pointer hover:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              >
                {allPairs.map((p) => (
                  <option key={p.symbol} value={p.symbol}>
                    {p.baseAsset}/{p.quoteAsset} (${formatPrice(p.price)})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base">{pair.baseAsset}/{pair.quoteAsset}</span>
              <span className="text-xs text-slate-400 font-mono">Spot</span>
            </div>
          )}

          <div className="h-4 w-[1px] bg-slate-800"></div>

          <div className="text-xs font-mono font-bold text-white">
            ${formatPrice(pair.price)}
          </div>

          <div className={`text-xs font-mono font-medium ${pair.priceChangePercent24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {pair.priceChangePercent24h >= 0 ? '+' : ''}{pair.priceChangePercent24h.toFixed(2)}%
          </div>

          <a
            href={tvExternalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 bg-slate-900/80 px-2 py-1 rounded border border-slate-800 hover:border-slate-700 transition-colors"
            title="فتح الشارت على منصة TradingView في لسان جديد"
          >
            <span>شارت TradingView الكامل</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Timeframe & Mode Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Timeframe pills */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            {(['5m', '15m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  timeframe === tf
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Candle countdown banner */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/40 border border-amber-800/50 rounded-lg text-amber-300 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>إغلاق الشمعة:</span>
            <span className="font-mono font-bold">{formatCountdown(secondsRemaining)}</span>
          </div>

          {/* Switch Chart Type */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setChartMode('interactive')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                chartMode === 'interactive' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'
              }`}
            >
              شارت المؤشرات الداخلي
            </button>
            <button
              onClick={() => setChartMode('tradingview')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                chartMode === 'tradingview' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'
              }`}
            >
              شارت TradingView المباشر
            </button>
          </div>
        </div>
      </div>

      {/* Strategy Indicator Legend */}
      <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span className="text-slate-300 font-medium">Fast EMA (9/10)</span>
            <span className="font-mono text-cyan-400">
              ${formatPrice(hoveredCandle?.ema9 ?? pair.ema9)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400"></span>
            <span className="text-slate-300 font-medium">Slow EMA (21/20)</span>
            <span className="font-mono text-fuchsia-400">
              ${formatPrice(hoveredCandle?.ema21 ?? pair.ema21)}
            </span>
          </div>

          {/* The Black Line Legend as requested */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            <span className="w-3 h-1 bg-amber-200"></span>
            <span className="text-slate-200 font-medium">خط الحجم (Volume SMA 20 - الخط البارز)</span>
            <span className="font-mono text-amber-200">
              {((hoveredCandle?.volSma20 ?? pair.volumeSma20) || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Real-time volume condition banner */}
        <div className="flex items-center gap-1.5">
          {pair.isVolumeAboveBlackLine ? (
            <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded text-[11px] font-bold">
              ✓ الفوليوم يتجاوز خط المتوسط (سيولة تدعم الحركة الصاعدة)
            </span>
          ) : (
            <span className="text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded text-[11px]">
              ⚠ الفوليوم دون خط الحجم - انتظر سيولة إضافية
            </span>
          )}
        </div>
      </div>

      {/* Chart Canvas Area */}
      {chartMode === 'tradingview' ? (
        <div className="h-[490px] w-full bg-slate-950 flex flex-col items-center justify-center p-2 relative">
          <iframe
            key={`${pair.symbol}-${timeframe}`}
            title={`TradingView Chart ${pair.symbol}`}
            src={tvEmbedUrl}
            className="w-full h-full border-0 rounded-lg"
            allow="fullscreen"
          />
        </div>
      ) : (
        <div ref={containerRef} className="relative w-full bg-slate-950 p-2">
          {loading ? (
            <div className="h-[460px] flex items-center justify-center">
              <div className="inline-block w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${totalWidth} ${chartHeight + volumeHeight}`}
              className="w-full h-[460px] overflow-visible select-none"
              onMouseLeave={() => setHoveredCandle(null)}
            >
              {/* Background Grid Lines */}
              {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
                const y = padding.top + ratio * (chartHeight - padding.top - padding.bottom);
                const priceAtY = maxPrice - ratio * priceRange;
                return (
                  <g key={ratio}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={totalWidth - padding.right}
                      y2={y}
                      stroke="#1e293b"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={totalWidth - padding.right + 8}
                      y={y + 4}
                      fill="#64748b"
                      fontSize="10"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {formatPrice(priceAtY)}
                    </text>
                  </g>
                );
              })}

              {/* Dividing line between Candlestick and Volume pane */}
              <line
                x1={padding.left}
                y1={chartHeight}
                x2={totalWidth - padding.right}
                y2={chartHeight}
                stroke="#334155"
                strokeWidth="1"
              />
              <text
                x={padding.left + 5}
                y={chartHeight + 14}
                fill="#64748b"
                fontSize="10"
                fontFamily="sans-serif"
              >
                حجم التداول (Volume) + خط الحجم الأسود/الذهبي
              </text>

              {/* Volume Bars */}
              {candles.map((c, i) => {
                const x = getX(i);
                const isUp = c.close >= c.open;
                const barY = getVolY(c.volume);
                const barHeight = chartHeight + volumeHeight - barY;
                const barWidth = Math.max(3, (totalWidth - padding.left - padding.right) / candles.length * 0.7);

                return (
                  <rect
                    key={`vol-${i}`}
                    x={x - barWidth / 2}
                    y={barY}
                    width={barWidth}
                    height={Math.max(1, barHeight)}
                    fill={isUp ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}
                    className="transition-all hover:opacity-100"
                  />
                );
              })}

              {/* Volume SMA 20 (The Black / Golden Line) */}
              <path
                d={candles.reduce((path, c, i) => {
                  if (c.volSma20 === undefined) return path;
                  const x = getX(i);
                  const y = getVolY(c.volSma20);
                  return `${path} ${path ? 'L' : 'M'} ${x} ${y}`;
                }, '')}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="2 2"
              />

              {/* Fast EMA Line (Cyan) */}
              <path
                d={candles.reduce((path, c, i) => {
                  if (c.ema9 === undefined) return path;
                  const x = getX(i);
                  const y = getY(c.ema9);
                  return `${path} ${path ? 'L' : 'M'} ${x} ${y}`;
                }, '')}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
              />

              {/* Slow EMA Line (Fuchsia) */}
              <path
                d={candles.reduce((path, c, i) => {
                  if (c.ema21 === undefined) return path;
                  const x = getX(i);
                  const y = getY(c.ema21);
                  return `${path} ${path ? 'L' : 'M'} ${x} ${y}`;
                }, '')}
                fill="none"
                stroke="#d946ef"
                strokeWidth="2"
              />

              {/* Candlesticks */}
              {candles.map((c, i) => {
                const x = getX(i);
                const isUp = c.close >= c.open;
                const candleColor = isUp ? '#22c55e' : '#ef4444';
                const openY = getY(c.open);
                const closeY = getY(c.close);
                const highY = getY(c.high);
                const lowY = getY(c.low);
                const bodyY = Math.min(openY, closeY);
                const bodyHeight = Math.max(2, Math.abs(closeY - openY));
                const candleWidth = Math.max(3, (totalWidth - padding.left - padding.right) / candles.length * 0.7);

                return (
                  <g
                    key={`c-${i}`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredCandle(c)}
                  >
                    {/* Wick */}
                    <line
                      x1={x}
                      y1={highY}
                      x2={x}
                      y2={lowY}
                      stroke={candleColor}
                      strokeWidth="1.2"
                    />
                    {/* Body */}
                    <rect
                      x={x - candleWidth / 2}
                      y={bodyY}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={candleColor}
                      rx="1"
                    />
                  </g>
                );
              })}

              {/* Golden Cross Indicators on Chart */}
              {crossIndices.map((idx) => {
                const candle = candles[idx];
                const x = getX(idx);
                const y = getY(candle.low) + 18;
                return (
                  <g key={`cross-${idx}`}>
                    <polygon
                      points={`${x},${y - 8} ${x - 5},${y + 2} ${x + 5},${y + 2}`}
                      fill="#22c55e"
                    />
                    <rect
                      x={x - 30}
                      y={y + 4}
                      width="60"
                      height="15"
                      fill="#14532d"
                      rx="3"
                    />
                    <text
                      x={x}
                      y={y + 15}
                      fill="#86efac"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      تقاطع ذهبي ▲
                    </text>
                  </g>
                );
              })}

              {/* Draggable / Visual Stop Loss & Target Lines if set */}
              {stopLossPrice > 0 && (
                <g>
                  <line
                    x1={padding.left}
                    y1={getY(stopLossPrice)}
                    x2={totalWidth - padding.right}
                    y2={getY(stopLossPrice)}
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={totalWidth - padding.right + 5}
                    y={getY(stopLossPrice) + 4}
                    fill="#ef4444"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    SL ${formatPrice(stopLossPrice)}
                  </text>
                </g>
              )}

              {takeProfit1 > 0 && (
                <g>
                  <line
                    x1={padding.left}
                    y1={getY(takeProfit1)}
                    x2={totalWidth - padding.right}
                    y2={getY(takeProfit1)}
                    stroke="#22c55e"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={totalWidth - padding.right + 5}
                    y={getY(takeProfit1) + 4}
                    fill="#22c55e"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    TP1 ${formatPrice(takeProfit1)}
                  </text>
                </g>
              )}
            </svg>
          )}

          {/* Hover detail tooltip */}
          {hoveredCandle && (
            <div className="absolute top-4 left-4 bg-slate-900/90 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 pointer-events-none backdrop-blur shadow-xl space-y-1">
              <div className="text-[11px] text-slate-400 font-mono">
                {new Date(hoveredCandle.time).toLocaleTimeString('ar-EG')}
              </div>
              <div className="grid grid-cols-2 gap-x-3 font-mono text-[11px]">
                <span>افتتاح: ${formatPrice(hoveredCandle.open)}</span>
                <span>إغلاق: ${formatPrice(hoveredCandle.close)}</span>
                <span>أعلى: ${formatPrice(hoveredCandle.high)}</span>
                <span>أدنى: ${formatPrice(hoveredCandle.low)}</span>
              </div>
              <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                <span>فوليوم: {hoveredCandle.volume.toLocaleString()}</span>
                <span className={hoveredCandle.volSma20 && hoveredCandle.volume > hoveredCandle.volSma20 ? 'text-emerald-400' : 'text-slate-400'}>
                  خط الحجم: {hoveredCandle.volSma20?.toLocaleString() || '-'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Critical Analysis Warning as requested in prompt */}
      <div className="px-4 py-3 bg-amber-950/20 border-t border-slate-800/80 flex items-start gap-3 text-xs text-amber-200/90">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300">قاعدة المحلل الفني الذهبية: </span>
          <span>
            لا تعتمد على قائمة الفلتر بشكل أعمى! تأكد يدوياً من حدوث تقاطع EMA 9 مع EMA 21 للأعلى على الشارت،
            ولا تدخل أبداً أثناء الشمعة الحالية بل انتظر إغلاق الشمعة (Close) للتأكد من ثبات الاختراق وعدم ارتداد السعر،
            وتأكد أن عمود الفوليوم يخترق خط الحجم الأسود لتأكيد وجود السيولة الدافعة.
          </span>
        </div>
      </div>
    </div>
  );
};
