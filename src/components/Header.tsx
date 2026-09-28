import React from 'react';
import { Volume2, VolumeX, RefreshCw, Zap, TrendingUp, Sliders, Calculator, BookOpen } from 'lucide-react';

interface HeaderProps {
  activeTab: 'screener' | 'chart' | 'calculator' | 'guide';
  setActiveTab: (tab: 'screener' | 'chart' | 'calculator' | 'guide') => void;
  isSoundEnabled: boolean;
  setIsSoundEnabled: (enabled: boolean) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  lastUpdated: Date;
  opportunitiesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isSoundEnabled,
  setIsSoundEnabled,
  isRefreshing,
  onRefresh,
  lastUpdated,
  opportunitiesCount,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-30 px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-900/30">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              CryptoScalp Pro
              {opportunitiesCount > 0 && (
                <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-950/70 border border-emerald-800/50 px-2 py-0.5 rounded">
                  {opportunitiesCount} فرص مؤكدة
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800/80">
          <button
            onClick={() => setActiveTab('screener')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'screener'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            فلتر السوق (Screener)
          </button>

          <button
            onClick={() => setActiveTab('chart')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'chart'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            الشارت والتحقق اليدوي
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'calculator'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            حاسبة إدارة المخاطر
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'guide'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            دليل TradingView
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          {/* Sound Alert Toggle */}
          <button
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className={`p-2 rounded-lg border transition-colors ${
              isSoundEnabled
                ? 'bg-slate-900 border-slate-700 text-cyan-400 hover:bg-slate-800'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={isSoundEnabled ? 'التنبيهات الصوتية مفعلة' : 'التنبيهات الصوتية مكتومة'}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Refresh Data Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 hover:border-slate-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">تحديث</span>
            <span className="font-mono text-slate-400 text-[11px]">
              {lastUpdated.toLocaleTimeString('ar-EG', { minute: '2-digit', second: '2-digit' })}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      <div className="flex md:hidden items-center justify-around gap-1 pt-2.5 mt-2 border-t border-slate-800/80 text-xs">
        <button
          onClick={() => setActiveTab('screener')}
          className={`px-2 py-1 rounded ${activeTab === 'screener' ? 'text-cyan-400 font-bold bg-slate-900' : 'text-slate-400'}`}
        >
          الفلتر
        </button>
        <button
          onClick={() => setActiveTab('chart')}
          className={`px-2 py-1 rounded ${activeTab === 'chart' ? 'text-cyan-400 font-bold bg-slate-900' : 'text-slate-400'}`}
        >
          الشارت
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-2 py-1 rounded ${activeTab === 'calculator' ? 'text-cyan-400 font-bold bg-slate-900' : 'text-slate-400'}`}
        >
          الحاسبة
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`px-2 py-1 rounded ${activeTab === 'guide' ? 'text-cyan-400 font-bold bg-slate-900' : 'text-slate-400'}`}
        >
          دليل TV
        </button>
      </div>
    </header>
  );
};
