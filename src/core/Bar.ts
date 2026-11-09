import type { Kline, Ticker } from "@qtsurfer/core";

/** The prices and volume of one bar, as the indicators that read whole bars take them. */
export interface Bar {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * A bar from a kline or a ticker, a missing value as NaN so the indicators leave it out. A ticker's
 * high, low and volume are the exchange's 24-hour statistics, not those of a bar, and its close is
 * its last price: an indicator that reads bars belongs on a kline stream.
 */
export function barOf(source: Kline | Ticker): Bar {
  if ("close" in source) {
    return {
      open: source.open,
      high: source.high,
      low: source.low,
      close: source.close,
      volume: source.volume,
    };
  }
  return {
    open: source.open ?? NaN,
    high: source.high ?? NaN,
    low: source.low ?? NaN,
    close: source.last ?? NaN,
    volume: source.volume ?? NaN,
  };
}
