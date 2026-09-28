/**
 * Generates ready-to-paste Pine Script v5 code for TradingView
 * implementing the exact strategy:
 * - EMA 9 / EMA 21 (or EMA 10 / EMA 20)
 * - Volume > Volume SMA 20 (The Black Line)
 * - Barstate confirmed close
 * - Alert conditions and on-chart labels
 */

export function generatePineScript(strategyMode: 'EMA_9_21' | 'EMA_10_20' = 'EMA_9_21'): string {
  const fastPeriod = strategyMode === 'EMA_9_21' ? 9 : 10;
  const slowPeriod = strategyMode === 'EMA_9_21' ? 21 : 20;

  return `//@version=5
indicator("CryptoScalp Pro - استراتيجية تقاطع EMA والفوليوم", overlay=true)

// --- إعدادات المتوسطات المتحركة الأسية (EMA) ---
fastLen = input.int(${fastPeriod}, title="المتوسط السريع (Fast EMA)", minval=1)
slowLen = input.int(${slowPeriod}, title="المتوسط البطيء (Slow EMA)", minval=1)
volMaLen = input.int(20, title="متوسط الفوليوم (خط الحجم الأسود)", minval=1)

fastEMA = ta.ema(close, fastLen)
slowEMA = ta.ema(close, slowLen)
volMA = ta.sma(volume, volMaLen)

// --- رسم المتوسطات على الشارت ---
plot(fastEMA, color=color.rgb(14, 165, 233), linewidth=2, title="Fast EMA (${fastPeriod})")
plot(slowEMA, color=color.rgb(217, 70, 239), linewidth=2, title="Slow EMA (${slowPeriod})")

// --- شروط الاستراتيجية الصارمة ---
// 1. تقاطع المتوسط السريع فوق المتوسط البطيء
emaCrossUp = ta.crossover(fastEMA, slowEMA)

// 2. التحقق من أن حجم التداول الحالي أعلى من متوسط الـ 20 (خط الحجم الأسود)
volConfirmed = volume > volMA

// 3. تأكيد إغلاق الشمعة (عدم الدخول أثناء تكون الشمعة)
candleClosed = barstate.isconfirmed

// إشارة الدخول المؤكدة
validBuySignal = emaCrossUp and volConfirmed and candleClosed

// --- تنبيهات وإشارات على الشارت ---
plotshape(series=validBuySignal, title="إشارة شراء مؤكدة (Golden Cross + Volume)", 
          location=location.belowbar, color=color.rgb(34, 197, 94), style=shape.labelup, 
          text="شراء مؤكد\\nEMA+VOL", textcolor=color.white, size=size.normal)

// إشعار تنبيه TradingView
alertcondition(validBuySignal, title="تنبيه شراء مضاربي مؤكد", 
               message="🚀 فرصة مضاربية مؤكدة على {{ticker}}: حدث تقاطع إيجابي مع إغلاق الشمعة وتخطي خط الفوليوم الأسود عند سعر {{close}}")
`;
}
