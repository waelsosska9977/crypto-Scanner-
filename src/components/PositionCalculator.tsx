import React, { useState, useEffect } from 'react';
import { CryptoPair, TradeCalculation } from '../types/crypto';
import { Calculator, DollarSign, ShieldAlert, Target, Percent, TrendingUp } from 'lucide-react';

interface PositionCalculatorProps {
  pair: CryptoPair | null;
  onLevelsChange?: (entry: number, stopLoss: number, tp1: number, tp2: number) => void;
}

export const PositionCalculator: React.FC<PositionCalculatorProps> = ({
  pair,
  onLevelsChange,
}) => {
  const [capital, setCapital] = useState<number>(1000);
  const [riskPercent, setRiskPercent] = useState<number>(1.5);
  const [entryPrice, setEntryPrice] = useState<number>(pair?.price || 100);
  const [stopLossPrice, setStopLossPrice] = useState<number>(() => {
    if (pair) {
      return Math.min(pair.price * 0.985, pair.ema21 > 0 && pair.ema21 < pair.price ? pair.ema21 * 0.995 : pair.price * 0.98);
    }
    return 98;
  });

  const onLevelsChangeRef = React.useRef(onLevelsChange);
  useEffect(() => {
    onLevelsChangeRef.current = onLevelsChange;
  }, [onLevelsChange]);

  // When selected pair symbol changes, update default entry and SL
  useEffect(() => {
    if (pair) {
      const entry = pair.price;
      const sl = Math.min(entry * 0.985, pair.ema21 > 0 && pair.ema21 < entry ? pair.ema21 * 0.995 : entry * 0.98);
      setEntryPrice(entry);
      setStopLossPrice(sl);
    }
  }, [pair?.symbol]);

  // Compute targets and sizes
  const riskAmount = (capital * riskPercent) / 100;
  const slDistance = Math.max(0.000001, Math.abs(entryPrice - stopLossPrice));
  const slPercent = entryPrice > 0 ? (slDistance / entryPrice) * 100 : 0;

  // Position size in coins = riskAmount / (entry - SL)
  const positionCoins = slDistance > 0 ? riskAmount / slDistance : 0;
  const positionUsdt = positionCoins * entryPrice;

  // Take profit targets based on Risk-Reward multipliers
  const tp1 = entryPrice + slDistance * 1.5;
  const tp2 = entryPrice + slDistance * 2.0;
  const tp3 = entryPrice + slDistance * 3.0;

  const profit1 = positionCoins * (tp1 - entryPrice);
  const profit2 = positionCoins * (tp2 - entryPrice);
  const profit3 = positionCoins * (tp3 - entryPrice);

  const prevReportedRef = React.useRef<{ entry: number; sl: number; tp1: number; tp2: number } | null>(null);

  useEffect(() => {
    const prev = prevReportedRef.current;
    if (
      !prev ||
      prev.entry !== entryPrice ||
      prev.sl !== stopLossPrice ||
      prev.tp1 !== tp1 ||
      prev.tp2 !== tp2
    ) {
      prevReportedRef.current = { entry: entryPrice, sl: stopLossPrice, tp1, tp2 };
      onLevelsChangeRef.current?.(entryPrice, stopLossPrice, tp1, tp2);
    }
  }, [entryPrice, stopLossPrice, tp1, tp2]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calculator className="w-4 h-4 text-cyan-400" />
            حاسبة إدارة المخاطر وتحديد حجم الصفقة ({pair ? pair.symbol : 'عام'})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            التحكم الصارم في رأس المال وحساب أحجام المراكز المضاربية لتفادي خسائر التداول العشوائي
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {/* Total Capital */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
            رأس المال المخصص للمضاربة ($)
          </label>
          <input
            type="number"
            value={capital}
            onChange={(e) => setCapital(Math.max(1, parseFloat(e.target.value) || 0))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Risk Percentage */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-cyan-400" />
            نسبة المخاطرة في الصفقة (%)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="10"
              value={riskPercent}
              onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            />
            <div className="flex gap-1">
              {[1, 2, 3].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRiskPercent(r)}
                  className={`px-2 py-1 text-[11px] rounded border transition-colors ${
                    riskPercent === r
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {r}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Entry Price */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            سعر الدخول بعد إغلاق الشمعة ($)
          </label>
          <input
            type="number"
            step="any"
            value={entryPrice}
            onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Stop Loss Price */}
        <div>
          <label className="block text-xs font-medium text-rose-400 mb-1 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            سعر وقف الخسارة (Stop Loss)
          </label>
          <input
            type="number"
            step="any"
            value={stopLossPrice}
            onChange={(e) => setStopLossPrice(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-950 border border-rose-900/50 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Calculated Results Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800/80 mb-5">
        <div>
          <span className="text-[11px] text-slate-400 block mb-0.5">المبلغ المعرض للمخاطرة (Max Loss)</span>
          <span className="text-base font-mono font-bold text-rose-400">
            ${riskAmount.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 block">
            ({slPercent.toFixed(2)}% مسافة وقف الخسارة)
          </span>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 block mb-0.5">حجم الصفقة الآمن (Spot Position Size)</span>
          <div className="text-base font-mono font-bold text-cyan-300">
            ${positionUsdt.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">
            {positionCoins.toFixed(4)} {pair?.baseAsset || 'عملة'}
          </span>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 block mb-0.5">معدل العائد إلى المخاطرة (R:R)</span>
          <span className="text-base font-mono font-bold text-emerald-400">
            1 : 2.0 (ممتاز)
          </span>
          <span className="text-[10px] text-slate-500 block">
            يحقق انضباط مضاربي عالي المردود
          </span>
        </div>
      </div>

      {/* Take Profit Target Ladder */}
      <div className="border border-slate-800 rounded-lg p-3 bg-slate-950/50">
        <span className="text-xs font-bold text-slate-300 block mb-2">
          خطة جني الأرباح المجزأة (Take-Profit Targets)
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-slate-300">الهدف 1 (1:1.5 R:R)</span>
              <span className="text-[11px] text-emerald-400 font-mono">+${profit1.toFixed(2)}</span>
            </div>
            <div className="text-sm font-mono font-bold text-emerald-400">
              ${tp1.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500">جني 40% من الكمية ونقل الوقف لنقطة الدخول</span>
          </div>

          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-slate-300">الهدف 2 (1:2 R:R)</span>
              <span className="text-[11px] text-emerald-400 font-mono">+${profit2.toFixed(2)}</span>
            </div>
            <div className="text-sm font-mono font-bold text-emerald-400">
              ${tp2.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500">جني 40% إضافية وتأمين الصفقة بالكامل</span>
          </div>

          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-slate-300">الهدف 3 (1:3 R:R)</span>
              <span className="text-[11px] text-emerald-400 font-mono">+${profit3.toFixed(2)}</span>
            </div>
            <div className="text-sm font-mono font-bold text-emerald-400">
              ${tp3.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500">جني الـ 20% المتبقية كأرباح زخم إضافية</span>
          </div>
        </div>
      </div>
    </div>
  );
};
