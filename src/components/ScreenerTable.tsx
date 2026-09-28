import React from 'react';
import { CryptoPair } from '../types/crypto';
import { TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, ArrowUpRight, Check, Eye } from 'lucide-react';

interface ScreenerTableProps {
  pairs: CryptoPair[];
  selectedPair: CryptoPair | null;
  onSelectPair: (pair: CryptoPair) => void;
  isLoading: boolean;
}

export const ScreenerTable: React.FC<ScreenerTableProps> = ({
  pairs,
  selectedPair,
  onSelectPair,
  isLoading,
}) => {
  if (isLoading && pairs.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
        <div className="inline-block w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm text-slate-300 font-medium">جاري فحص أزواج العملات وحساب تقاطعات المتوسطات والفوليوم...</p>
        <p className="text-xs text-slate-500 mt-1">يتم استثناء جميع عقود PERP والتركيز على سوق Spot فقط</p>
      </div>
    );
  }

  if (pairs.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">لا توجد عملات مطابقة للشروط الحالية</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
          الشروط الصارمة تحميك من الدخول العشوائي. جرب توسيع الفلتر لاختيار (اتجاه صاعد) أو فريم زمني مختلف (مثل 5د أو 1س) أو ضبط الفوليوم.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white">نتائج الفلتر اللحظي (Crypto Screener Results)</span>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
            {pairs.length} عملة مطابقة
          </span>
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          انقر على أي عملة لبدء التحقق اليدوي على الشارت
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-medium text-slate-400">
              <th className="py-2.5 px-4 text-right">الزوج / المنصة</th>
              <th className="py-2.5 px-3 text-right">السعر (USDT)</th>
              <th className="py-2.5 px-3 text-right">التغير 24س</th>
              <th className="py-2.5 px-3 text-right">حالة التقاطع</th>
              <th className="py-2.5 px-3 text-right">المتوسطات (EMA)</th>
              <th className="py-2.5 px-3 text-right">الفوليوم vs خط الحجم الأسود</th>
              <th className="py-2.5 px-3 text-right">التقييم الفني</th>
              <th className="py-2.5 px-3 text-right">إغلاق الشمعة</th>
              <th className="py-2.5 px-4 text-center">التحقق</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {pairs.map((p) => {
              const isSelected = selectedPair?.symbol === p.symbol;
              const isPositiveChange = p.priceChangePercent24h >= 0;
              const isGoldenCross = p.crossStatus === 'GOLDEN_CROSS';

              return (
                <tr
                  key={p.symbol}
                  onClick={() => onSelectPair(p)}
                  className={`cursor-pointer transition-colors group ${
                    isSelected
                      ? 'bg-cyan-950/30 border-l-2 border-l-cyan-400'
                      : 'hover:bg-slate-800/50'
                  }`}
                >
                  {/* Pair Name */}
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-200">
                        {p.baseAsset.slice(0, 3)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-100 flex items-center gap-1">
                          <span>{p.baseAsset}</span>
                          <span className="text-[10px] text-slate-500 font-normal">/{p.quoteAsset}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">Binance Spot</div>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-100 whitespace-nowrap">
                    ${formatPrice(p.price)}
                  </td>

                  {/* 24h Change */}
                  <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                        isPositiveChange ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPositiveChange ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {isPositiveChange ? '+' : ''}{p.priceChangePercent24h.toFixed(2)}%
                    </span>
                  </td>

                  {/* Cross Status */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {isGoldenCross ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded">
                        <ArrowUpRight className="w-3 h-3" />
                        تقاطع ذهبي صاعد
                      </span>
                    ) : p.crossStatus === 'BULLISH' ? (
                      <span className="text-cyan-400 font-medium text-[11px]">
                        اتجاه صاعد (EMA9 &gt; 21)
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">محايد / سلبي</span>
                    )}
                  </td>

                  {/* EMAs */}
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-cyan-400" title="المتوسط السريع">
                        {formatPrice(p.ema9)}
                      </span>
                      <span className="text-slate-600">/</span>
                      <span className="text-fuchsia-400" title="المتوسط البطيء">
                        {formatPrice(p.ema21)}
                      </span>
                    </div>
                  </td>

                  {/* Volume vs Black Line */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {p.isVolumeAboveBlackLine ? (
                        <div className="flex items-center gap-1 text-emerald-400 font-mono text-xs font-semibold">
                          <Check className="w-3.5 h-3.5" />
                          <span>{p.volumeSurgeRatio.toFixed(1)}x</span>
                          <span className="text-[10px] text-emerald-500 font-normal">أعلى من الخط</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-slate-500 font-mono text-xs">
                          <span>{p.volumeSurgeRatio.toFixed(1)}x</span>
                          <span className="text-[10px] text-slate-600 font-normal">أقل من المتوسط</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Technical Rating */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {p.technicalRating === 'STRONG_BUY' ? (
                      <span className="inline-block text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded">
                        شراء قوي (Strong Buy)
                      </span>
                    ) : p.technicalRating === 'BUY' ? (
                      <span className="inline-block text-[11px] font-medium text-cyan-300 bg-cyan-950/70 border border-cyan-800/60 px-2 py-0.5 rounded">
                        شراء (Buy)
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">محايد</span>
                    )}
                  </td>

                  {/* Candle Close Status */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {p.candleConfirmedClosed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        مغلقة مؤكدة
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                        جارية (انتظر الإغلاق)
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-2.5 px-4 text-center whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPair(p);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-cyan-600 hover:text-white rounded-lg transition-colors border border-slate-700/80"
                    >
                      <Eye className="w-3 h-3" />
                      فحص الشارت
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function formatPrice(val: number): string {
  if (val >= 1000) return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (val >= 1) return val.toFixed(2);
  if (val >= 0.01) return val.toFixed(4);
  return val.toFixed(6);
}
