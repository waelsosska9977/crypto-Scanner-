import React, { useState } from 'react';
import { ScreenerFilterState, ScreenerPreset, Timeframe } from '../types/crypto';
import { Filter, BookmarkCheck, Search, ShieldCheck, Clock, BarChart3, Plus, Trash2 } from 'lucide-react';

interface FilterControlsProps {
  filters: ScreenerFilterState;
  setFilters: React.Dispatch<React.SetStateAction<ScreenerFilterState>>;
  presets: ScreenerPreset[];
  activePresetId: string | null;
  onSelectPreset: (preset: ScreenerPreset) => void;
  onSavePreset: (name: string, description: string) => void;
  onDeletePreset: (id: string) => void;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  setFilters,
  presets,
  activePresetId,
  onSelectPreset,
  onSavePreset,
  onDeletePreset,
}) => {
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');

  const timeframes: { value: Timeframe; label: string }[] = [
    { value: '5m', label: '5 د (سكالبينج)' },
    { value: '15m', label: '15 د (الأنسب للمضاربة)' },
    { value: '1h', label: '1 س (سوينغ سريع)' },
    { value: '4h', label: '4 س (اتجاه متوسط)' },
    { value: '1d', label: 'يومي' },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    onSavePreset(newPresetName.trim(), newPresetDesc.trim());
    setNewPresetName('');
    setNewPresetDesc('');
    setShowPresetModal(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 shadow-sm">
      {/* Top row: Presets & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <BookmarkCheck className="w-4 h-4 text-cyan-400" />
            <span>الإعدادات المحفوظة (Presets):</span>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {presets.map((p) => (
              <div key={p.id} className="inline-flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5">
                <button
                  onClick={() => onSelectPreset(p)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    activePresetId === p.id
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={p.description}
                >
                  {p.name}
                </button>
                {presets.length > 1 && (
                  <button
                    onClick={() => onDeletePreset(p.id)}
                    className="px-1 text-slate-600 hover:text-red-400 text-xs"
                    title="حذف هذا النموذج"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={() => setShowPresetModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors"
            >
              <Plus className="w-3 h-3 text-cyan-400" />
              <span>حفظ الإعداد الحالي</span>
            </button>
          </div>
        </div>

        {/* Search box */}
        <div className="relative min-w-[200px] flex-1 sm:flex-initial">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="بحث بالرمز (مثل BTC, SOL)..."
            value={filters.searchQuery}
            onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-9 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Main Filter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Timeframe Selection */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            الفريم الزمني (Timeframe)
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {timeframes.slice(0, 3).map((tf) => (
              <button
                key={tf.value}
                onClick={() => setFilters((prev) => ({ ...prev, timeframe: tf.value }))}
                className={`py-1 px-2 text-[11px] font-medium rounded transition-colors text-center ${
                  filters.timeframe === tf.value
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf.label.split(' ')[0]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 mt-1">
            {timeframes.slice(3).map((tf) => (
              <button
                key={tf.value}
                onClick={() => setFilters((prev) => ({ ...prev, timeframe: tf.value }))}
                className={`py-1 px-2 text-[11px] font-medium rounded transition-colors text-center ${
                  filters.timeframe === tf.value
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Strategy Mode & Cross Alignment */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            استراتيجية التقاطع (EMA Strategy)
          </label>
          <select
            value={filters.strategyMode}
            onChange={(e) => setFilters((prev) => ({ ...prev, strategyMode: e.target.value as any }))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 mb-1.5"
          >
            <option value="EMA_9_21">تقاطع EMA 9 مع EMA 21 (الأصلية)</option>
            <option value="EMA_10_20">تقاطع EMA 10 مع EMA 20 (حيلة TradingView)</option>
          </select>

          <select
            value={filters.strategyFilter}
            onChange={(e) => setFilters((prev) => ({ ...prev, strategyFilter: e.target.value as any }))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="EMA_CROSS_UP">تقاطع صعودي إيجابي حديث (Crosses Up)</option>
            <option value="BULLISH_TREND">اتجاه صاعد مستمر (EMA Fast &gt; Slow)</option>
            <option value="ALL">عرض جميع العملات</option>
          </select>
        </div>

        {/* 3. Technical Ratings & Volume Filter */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            التقييم الفني (Technical Ratings)
          </label>
          <select
            value={filters.technicalRatingFilter}
            onChange={(e) => setFilters((prev) => ({ ...prev, technicalRatingFilter: e.target.value as any }))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 mb-1.5"
          >
            <option value="BUY_OR_STRONG">شراء قوي أو شراء (Strong Buy / Buy)</option>
            <option value="STRONG_BUY_ONLY">شراء قوي فقط (Strong Buy Only)</option>
            <option value="ALL">الكل (شامل المحايد والبيع)</option>
          </select>

          <select
            value={filters.volumeCondition}
            onChange={(e) => setFilters((prev) => ({ ...prev, volumeCondition: e.target.value as any }))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ABOVE_BLACK_LINE">فوليوم أعلى من خط الحجم الأسود (Vol &gt; MA 20)</option>
            <option value="ANY">أي حجم تداول</option>
          </select>
        </div>

        {/* 4. Strict Safety Toggles */}
        <div className="flex flex-col justify-between py-0.5">
          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            شروط الأمان والانضباط
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 mb-1.5">
            <input
              type="checkbox"
              checked={filters.excludePerpAndFutures}
              onChange={(e) => setFilters((prev) => ({ ...prev, excludePerpAndFutures: e.target.checked }))}
              className="accent-cyan-500 rounded"
            />
            <span className="leading-tight">
              استثناء العقود والـ PERP (سوق سبوت فقط)
            </span>
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
            <input
              type="checkbox"
              checked={filters.onlyClosedCandles}
              onChange={(e) => setFilters((prev) => ({ ...prev, onlyClosedCandles: e.target.checked }))}
              className="accent-cyan-500 rounded"
            />
            <span className="leading-tight">
              انتظار إغلاق الشمعة (تجنب الشموع الجارية)
            </span>
          </label>
        </div>
      </div>

      {/* Modal for saving custom preset */}
      {showPresetModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 text-cyan-400" />
              حفظ إعدادات الفلترة باسم مخصص
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              يمكنك حفظ تركيبة الشروط الحالية كنموذج ثابت للرجوع إليه بضغطة زر واحدة.
            </p>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">اسم النموذج المخصص</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: استراتيجيتي للمضاربة 15د"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">وصف مختصر (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: تقاطع EMA 9/21 مع فوليوم أعلى من خط الحجم الأسود"
                  value={newPresetDesc}
                  onChange={(e) => setNewPresetDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPresetModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
                >
                  حفظ النموذج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
