export interface Candlestick {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema9?: number;
  ema21?: number;
  ema10?: number;
  ema20?: number;
  volSma20?: number;
}

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export type TechnicalRating = 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';

export type CrossStatus = 'GOLDEN_CROSS' | 'BULLISH' | 'BEARISH_CROSS' | 'BEARISH';

export interface CryptoPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  priceChangePercent24h: number;
  volume24h: number; // Quote volume in USDT
  currentCandleVolume: number;
  volumeSma20: number;
  isVolumeAboveBlackLine: boolean;
  volumeSurgeRatio: number; // e.g. 1.45 means 145% of average
  ema9: number;
  ema21: number;
  ema10: number;
  ema20: number;
  crossStatus: CrossStatus;
  crossCandlesAgo: number; // 0 = current candle, 1 = previous closed candle
  technicalRating: TechnicalRating;
  technicalScore: number; // 0 to 100
  rsi14: number;
  candleCloseTime: number; // Timestamp when current candle will close
  candleConfirmedClosed: boolean;
  timeframe: Timeframe;
  high24h: number;
  low24h: number;
}

export interface ScreenerFilterState {
  market: 'SPOT'; // Only spot, strictly no futures/PERP
  quoteAsset: 'USDT' | 'ALL';
  timeframe: Timeframe;
  minVolume24hUsdt: number;
  strategyFilter: 'EMA_CROSS_UP' | 'BULLISH_TREND' | 'ALL';
  strategyMode: 'EMA_9_21' | 'EMA_10_20'; // 10/20 is the TradingView screener trick
  technicalRatingFilter: 'BUY_OR_STRONG' | 'STRONG_BUY_ONLY' | 'ALL';
  volumeCondition: 'ABOVE_BLACK_LINE' | 'ANY'; // Volume > Volume MA 20
  excludePerpAndFutures: boolean;
  onlyClosedCandles: boolean;
  searchQuery: string;
}

export interface ScreenerPreset {
  id: string;
  name: string;
  description: string;
  filters: ScreenerFilterState;
}

export interface ChecklistVerification {
  pairSymbol: string;
  emaCrossVerified: boolean;
  candleCloseConfirmed: boolean;
  volumeAboveBlackLine: boolean;
  supportResistanceChecked: boolean;
  riskRewardAcceptable: boolean;
  notes: string;
}

export interface TradeCalculation {
  capital: number;
  riskPercentage: number;
  entryPrice: number;
  stopLossPrice: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskAmount: number;
  positionSizeCoins: number;
  positionSizeUsdt: number;
  potentialProfit1: number;
  potentialProfit2: number;
  potentialProfit3: number;
  riskRewardRatio: number;
}
