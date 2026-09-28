import React, { useState } from 'react';
import { generatePineScript } from '../services/pineScript';
import { BookOpen, Copy, Check, ExternalLink, Layers, ArrowUpRight, BarChart, ShieldAlert } from 'lucide-react';

export const TradingViewGuide: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [selectedScriptMode, setSelectedScriptMode] = useState<'EMA_9_21' | 'EMA_10_20'>('EMA_9_21');

  const pineScriptCode = generatePineScript(selectedScriptMode);

  const handleCopy = () => {
    navigator.clipboard.writeText(pineScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    {
      step: '01',
      title: 'فتح أداة الفلترة (Crypto Screener) واستثناء الـ PERP',
      details: [
        'افتح موقع TradingView وتوجه إلى قائمة المنتجات واختر Screener -> Crypto Pairs Screener.',
        'في خانة السوق (Market)، اختر السوق العام (General) وحدد منصتك المفضلة (مثل Binance أو KuCoin أو Bybit).',
        'تأكد من عدم اختيار أي عملات خاصة بالعقود الآجلة (Futures) واستثناء أي رمز يحتوي على كلمة PERP، بالتركيز على سوق Spot ورمز USDT فقط.',
      ],
      tag: 'سوق Spot فقط',
    },
    {
      step: '02',
      title: 'التحايل على مؤشر EMA (ضبط EMA 10 يقطع EMA 20 صعوداً)',
      details: [
        'نظراً لأن منصة TradingView في بعض نسخ الفلتر القديمة لا تتيح تخصيص فترات EMA 9 و EMA 21 بحرية تامة، نلجأ للبديل المقارب جداً رياضياً وهو Exponential Moving Average (10) و (20).',
        'في خانة الفلاتر الفنية (Technical Filters)، ابحث عن Exponential Moving Average (10).',
        'اختر الشرط: يتقاطع صعوداً (Crosses Up) مع Exponential Moving Average (20).',
        'هذا الشرط يفرز لك العملات التي دخلت للتو في موجة اختراق وزخم صعودي أولي.',
      ],
      tag: 'Crosses Up',
    },
    {
      step: '03',
      title: 'تفعيل مؤشر التحليل الفني (Technical Ratings)',
      details: [
        'ابحث في الفلاتر عن مؤشر التقييم الفني المدمج (Technical Ratings).',
        'اضبط القيمة لتكون (Buy) أو (Strong Buy) - شراء أو شراء قوي.',
        'هذا الفلتر يجمع بين قراءات مؤشرات الزخم والاتجاه والمتوسطات ويضمن أن الزخم العام للسوق داعم للصفقة.',
      ],
      tag: 'Strong Buy / Buy',
    },
    {
      step: '04',
      title: 'حفظ إعدادات الفلتر باسم مخصص (Save Screen)',
      details: [
        'انقر على القائمة المنسدلة للفلتر في أعلى يسار الشاشة.',
        'اختر "Save Screens As..." وقم بتسميته اسماً واضحاً مثل: "استراتيجية المضاربة اللحظية EMA + Volume".',
        'بذلك يمكنك استدعاء كل العملات التي ينطبق عليها الشرط بضغطة زر واحدة في أي وقت دون إعادة الضبط اليدوي.',
      ],
      tag: 'حفظ النموذج',
    },
    {
      step: '05',
      title: 'المراجعة اليدوية على الشارت وفحص خط الحجم الأسود',
      details: [
        'لا تشترِ أبداً بناءً على قائمة الفلتر مباشرة وبشكل أعمى!',
        'افتح شارت العملة يدوياً، وتأكد من تقاطع EMA 9 فوق EMA 21.',
        'انتظر إغلاق الشمعة (Candle Close) ولا تدخل أثناء الشمعة الحالية لمنع التعرض لانعكاس السعر للأسفل.',
        'تأكد من أن عمود الفوليوم يخترق خط الحجم الأسود (Volume SMA 20) لضمان وجود سيولة تدعم الحركة الصاعدة.',
      ],
      tag: 'قاعدة عدم الاعتماد الأعمى',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Intro banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white mb-1">
              الدليل العملي الشامل: تطبيق استراتيجية الفلترة على TradingView
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
              دليل خطوة بخطوة للمضارب المحترف لضبط أداة Crypto Screener على منصة TradingView والتحايل على قيود المتوسطات الأسية، مع كود Pine Script v5 المجاني لرسم خط الحجم الأسود والتنبيهات المباشرة.
            </p>
          </div>
        </div>
      </div>

      {/* Step by Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((st) => (
          <div
            key={st.step}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
                  خطوة {st.step}
                </span>
                <span className="text-[11px] font-medium text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {st.tag}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{st.title}</h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {st.details.map((d, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-500 mt-0.5">•</span>
                    <span className="leading-relaxed">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Pine Script Generator Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              كود Pine Script v5 المخصص لشارت TradingView
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              انسخ هذا المؤشر وألصقه في محرر Pine Editor على شارت TradingView لرسم المتوسطات وخط الحجم الأسود وتفعيل إشارات الدخول المؤكدة بعد إغلاق الشمعة.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedScriptMode}
              onChange={(e) => setSelectedScriptMode(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="EMA_9_21">إعداد EMA 9 و 21 (الافتراضي)</option>
              <option value="EMA_10_20">إعداد EMA 10 و 20 (بديل الفلتر)</option>
            </select>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ بنجاح!' : 'نسخ الكود'}</span>
            </button>
          </div>
        </div>

        {/* Code display */}
        <div className="relative bg-slate-950 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto border border-slate-800/80 leading-relaxed text-left" dir="ltr">
          <pre>{pineScriptCode}</pre>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>طريقة التركيب: افتح أي شارت على TradingView &larr; افتح لسان Pine Editor في الأسفل &larr; احذف المحتوى والصق الكود &larr; اضغط Add to chart.</span>
        </div>
      </div>
    </div>
  );
};
