import React, { useState, useEffect } from 'react';
import { CryptoPair, ChecklistVerification } from '../types/crypto';
import { soundAlerts } from '../services/soundAlerts';
import { CheckCircle2, Circle, AlertCircle, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';

interface VerificationChecklistProps {
  pair: CryptoPair;
  onVerificationComplete?: (isReady: boolean) => void;
}

export const VerificationChecklist: React.FC<VerificationChecklistProps> = ({
  pair,
  onVerificationComplete,
}) => {
  const [checklist, setChecklist] = useState<ChecklistVerification>({
    pairSymbol: pair.symbol,
    emaCrossVerified: pair.crossStatus === 'GOLDEN_CROSS' || pair.ema9 > pair.ema21,
    candleCloseConfirmed: pair.candleConfirmedClosed,
    volumeAboveBlackLine: pair.isVolumeAboveBlackLine,
    supportResistanceChecked: false,
    riskRewardAcceptable: false,
    notes: '',
  });

  const onVerificationCompleteRef = React.useRef(onVerificationComplete);
  useEffect(() => {
    onVerificationCompleteRef.current = onVerificationComplete;
  }, [onVerificationComplete]);

  // Reset or initialize state when pair changes
  useEffect(() => {
    setChecklist((prev) => {
      if (prev.pairSymbol !== pair.symbol) {
        return {
          pairSymbol: pair.symbol,
          emaCrossVerified: pair.crossStatus === 'GOLDEN_CROSS' || pair.ema9 > pair.ema21,
          candleCloseConfirmed: pair.candleConfirmedClosed,
          volumeAboveBlackLine: pair.isVolumeAboveBlackLine,
          supportResistanceChecked: false,
          riskRewardAcceptable: false,
          notes: '',
        };
      }
      return {
        ...prev,
        emaCrossVerified: pair.crossStatus === 'GOLDEN_CROSS' || pair.ema9 > pair.ema21,
        candleCloseConfirmed: pair.candleConfirmedClosed,
        volumeAboveBlackLine: pair.isVolumeAboveBlackLine,
      };
    });
  }, [pair.symbol, pair.crossStatus, pair.ema9, pair.ema21, pair.candleConfirmedClosed, pair.isVolumeAboveBlackLine]);

  const toggleCheck = (key: keyof Omit<ChecklistVerification, 'pairSymbol' | 'notes'>) => {
    setChecklist((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      const allPassed =
        updated.emaCrossVerified &&
        updated.candleCloseConfirmed &&
        updated.volumeAboveBlackLine &&
        updated.supportResistanceChecked &&
        updated.riskRewardAcceptable;

      if (allPassed && !isAllPassed) {
        soundAlerts.playChecklistCompleteTone();
      }
      return updated;
    });
  };

  const isAllPassed =
    checklist.emaCrossVerified &&
    checklist.candleCloseConfirmed &&
    checklist.volumeAboveBlackLine &&
    checklist.supportResistanceChecked &&
    checklist.riskRewardAcceptable;

  const lastNotifiedPassedRef = React.useRef<boolean | null>(null);

  useEffect(() => {
    if (lastNotifiedPassedRef.current !== isAllPassed) {
      lastNotifiedPassedRef.current = isAllPassed;
      onVerificationCompleteRef.current?.(isAllPassed);
    }
  }, [isAllPassed]);

  const checks = [
    {
      id: 'emaCrossVerified' as const,
      title: '1. التحقق اليدوي من تقاطع المتوسطات (EMA 9 يقطع EMA 21 للأعلى)',
      desc: 'عدم الاعتماد الأعمى على الفلتر: افتح الشارت وتأكد بالعين المجردة أن المتوسط الأزرق (EMA 9) يعلو المتوسط الأرجواني (EMA 21).',
      autoStatus: pair.ema9 > pair.ema21,
      autoLabel: pair.ema9 > pair.ema21 ? 'متحقق آلياً' : 'غير مكتمل',
    },
    {
      id: 'candleCloseConfirmed' as const,
      title: '2. انتظار إغلاق الشمعة (Candle Close Confirmation)',
      desc: 'عدم الدخول إطلاقاً أثناء الشمعة الحالية لمنع الارتداد الوهمي. انتظر جرس إغلاق الشمعة وتأكيد الثبات فوق المتوسطات.',
      autoStatus: pair.candleConfirmedClosed,
      autoLabel: pair.candleConfirmedClosed ? 'شمعة مغلقة ومؤكدة' : 'الشمعة جارية (انتظر الإغلاق)',
    },
    {
      id: 'volumeAboveBlackLine' as const,
      title: '3. فلترة الفوليوم (تجاوز خط الحجم الأسود / SMA 20)',
      desc: 'تأكد من أن حجم تداول شمعة الاختراق يخترق خط الحجم الأسود للأعلى لضمان تدفق سيولة كافية تدعم الصعود.',
      autoStatus: pair.isVolumeAboveBlackLine,
      autoLabel: pair.isVolumeAboveBlackLine ? 'فوليوم متجاوز للخط الأسود' : 'الفوليوم ضعيف دون المتوسط',
    },
    {
      id: 'supportResistanceChecked' as const,
      title: '4. فحص أقرب مقاومة وقمة سابقة (No Immediate Ceiling)',
      desc: 'تأكد أن السعر لا يصطدم بمقاومة قوية أو قمة يومية قريبة جداً تمنع تحقيق الهدف الأول.',
      autoStatus: null,
      autoLabel: 'يتطلب تأكيدك اليدوي',
    },
    {
      id: 'riskRewardAcceptable' as const,
      title: '5. تحديد وقف الخسارة ونسبة العائد للمخاطرة (R:R لا تقل عن 1:2)',
      desc: 'وضع أمر وقف الخسارة أسفل شمعة الاختراق أو أسفل EMA 21، وضمان أن الهدف يحقق ضعف المخاطرة على الأقل.',
      autoStatus: null,
      autoLabel: 'يتطلب تأكيدك اليدوي',
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            نظام التحقق اليدوي والمراجعة قبل الدخول ({pair.symbol})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            بروتوكول المحلل المحترف لتفادي إشارات الفلتر المتأخرة والارتدادات الخادعة
          </p>
        </div>

        <div>
          {isAllPassed ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-600/80 rounded-lg text-emerald-300 text-xs font-bold shadow-lg shadow-emerald-950/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              جاهز للدخول والمضاربة
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-950/60 border border-amber-700/60 rounded-lg text-amber-300 text-xs font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              قيد المراجعة والتحقق
            </span>
          )}
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-3">
        {checks.map((check) => {
          const isChecked = checklist[check.id];
          return (
            <div
              key={check.id}
              onClick={() => toggleCheck(check.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                isChecked
                  ? 'bg-slate-950/80 border-cyan-500/30'
                  : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className={`mt-0.5 p-0.5 rounded transition-colors ${
                    isChecked ? 'text-cyan-400' : 'text-slate-600'
                  }`}
                >
                  {isChecked ? (
                    <CheckCircle2 className="w-4 h-4 fill-cyan-950 text-cyan-400" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className={`text-xs font-semibold ${
                        isChecked ? 'text-slate-100' : 'text-slate-300'
                      }`}
                    >
                      {check.title}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        check.autoStatus === true
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                          : check.autoStatus === false
                          ? 'bg-amber-950 text-amber-400 border border-amber-800/50'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {check.autoLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {check.desc}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notes / Plan input */}
      <div className="mt-4 pt-3 border-t border-slate-800">
        <label className="block text-xs font-medium text-slate-400 mb-1">
          ملاحظات الصفقة وقرار المحلل (Trade Log & Notes)
        </label>
        <textarea
          rows={2}
          value={checklist.notes}
          onChange={(e) => setChecklist((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="مثال: تم التأكد من اختراق المقاومة عند 24.50 مع فوليوم عالي، ووقف الخسارة محدد عند 23.80..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
        />
      </div>
    </div>
  );
};
