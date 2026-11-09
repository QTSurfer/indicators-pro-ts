# Indicators

The indicators `@qtsurfer/indicators-pro` ships: its classes, and the factories of `Pro` that register them on a group.
The base indicators (SMA, EMA, ATR, WMA…) are listed in `indicators.md` of `@qtsurfer/indicators`.
Update the row in the same change that adds a class or a factory:
`tests/IndicatorsDoc.test.ts` runs every call below on a kline group and fails when a class is missing here, a factory
does not exist, or the id, the outputs or the bar flag differ from what the facade registers.

- **Class** — the class exported by `@qtsurfer/indicators-pro`.
- **Call** — the call of `Pro.on(group)` that registers it with the default id. The statistics and the volatility
  estimators have no default period: the call shows 20. `—` when the class is ported and the Java engine has no `Pro`
  factory for it yet: it is added with `group.add(name, new Class(…))`, and the Id, Outputs and Bars columns are empty.
- **Id** — the name it registers under; the id of every output is this name plus the suffix.
- **Outputs** — the suffixes of the other values an indicator with several outputs registers beside it. The indicator
  itself is its main output.
- **Bars** — it reads a whole bar (high, low, close, volume) and not a single value, so it belongs on a kline group: on a
  ticker those are the exchange's 24-hour statistics. Such a class implements `RichRTIndicator` and returns `true` from
  `requiresBarData()`; a group fed from a ticker reports it once, with an `IndicatorNotice`, through `getNotices()`.

## Summary

| Group | Indicators |
|---|---:|
| Trend | 3 |
| Volume | 4 |
| Statistics | 9 |
| Risk and performance ratios | 7 |
| Volatility estimators | 6 |
| Averages | 6 |
| Momentum | 4 |

## Trend

| Indicator | Class | Call | Id | Outputs | Bars | Notes |
|---|---|---|---|---|---|---|
| ADX | `AdxRTIndicator` | `adx()` | `adx14` | `PlusDI`, `MinusDI` | yes | the main output is the ADX |
| Ichimoku | `IchimokuRTIndicator` | `ichimoku()` | `ichi9_26_52` | `Kijun`, `SenkouA`, `SenkouB`, `Chikou` | yes | the main output is the Tenkan-sen |
| SuperTrend | `SuperTrendRTIndicator` | `superTrend()` | `st10_3` | `Upper`, `Lower` | yes | a whole multiplier has no decimal part in the id |

## Volume

| Indicator | Class | Call | Id | Outputs | Bars | Notes |
|---|---|---|---|---|---|---|
| CMF | `CmfRTIndicator` | `cmf()` | `cmf20` | | yes | Chaikin Money Flow |
| MFI | `MfiRTIndicator` | `mfi()` | `mfi14` | | yes | Money Flow Index |
| OBV | `ObvRTIndicator` | `obv()` | `obv` | | yes | On-Balance Volume |
| VWAP | `VwapRTIndicator` | `vwap()` | `vwap` | | yes | volume-weighted average price |

## Statistics

Every statistics indicator here has a `Pro` call. Variance is the building block of Z-Score: it is a class of the
source tree, but not exported, without a call, and not counted in the Summary.

| Indicator | Class | Call | Id | Outputs | Bars | Notes |
|---|---|---|---|---|---|---|
| Autocorrelation | `AutocorrelationRTIndicator` | `autocorrelation(20)` | `acf20` |  |  | lag-1 autocorrelation of the log returns of the group's price |
| Hurst exponent | `HurstExponentRTIndicator` | `hurstExponent(20)` | `hurst20` |  |  | rescaled-range Hurst exponent of the log returns; 0.5 until the window is full |
| Kurtosis | `KurtosisRTIndicator` | `kurtosis(20)` | `kurt20` | | | excess kurtosis of the group's price |
| Linear regression slope | `LinearRegressionSlopeRTIndicator` | `linearRegressionSlope(20)` | `lrs20` | `Intercept` |  | slope of the least-squares line through the window; also the intercept, the mean and a forecast |
| Rolling percentile | `RollingPercentileRTIndicator` | `rollingPercentile(20, 0.95)` | `pctl20_0.95` | `Median`, `Min`, `Max` |  | percentile of the window, interpolated between ranks; also the median, the minimum and the maximum |
| Simple linear regression | `SimpleLinearRegressionRTIndicator` | `simpleLinearRegression(20)` | `slr20` | `Intercept`, `RSquared`, `StandardError` |  | slope of the least-squares line; also the intercept, R squared, the standard error and a forecast |
| Skewness | `SkewnessRTIndicator` | `skewness(20)` | `skew20` |  |  | sample skewness of the group's price |
| Value at Risk | `ValueAtRiskRTIndicator` | `valueAtRisk(20)` | `valRisk20` |  |  | parametric (Gaussian) Value at Risk of the log returns; 95% confidence by default |
| Variance | `VarianceRTIndicator` | — | | | | rolling variance of the window; an internal building block that is not exported |
| Z-Score | `ZScoreRTIndicator` | `zScore(20)` | `zscore20` |  |  | distance of the group's price from the mean of the window, in standard deviations |

## Risk and performance ratios

Each reads the group's price. All but Maximum drawdown and the Ulcer index work on the log returns of the price.

| Indicator | Class | Call | Id | Outputs | Bars | Notes |
|---|---|---|---|---|---|---|
| Calmar ratio | `CalmarRatioRTIndicator` | `calmarRatio(20)` | `calmar20` |  |  | annualized return over the largest drawdown of the window's cumulative log return; 252 periods a year by default |
| Maximum drawdown | `MaxDrawdownRTIndicator` | `maxDrawdown()` | `maxDd` | `Current` |  | largest fall of the price from its peak so far, as a fraction of the peak; also the peak and the current drawdown |
| Omega ratio | `OmegaRatioRTIndicator` | `omegaRatio(20)` | `omega20` |  |  | gains over losses of the log returns against a threshold (0 by default); also the two sums |
| Sharpe ratio | `SharpeRatioRTIndicator` | `sharpeRatio(20)` | `sharpe20` |  |  | mean log return less a risk-free rate, over its standard deviation; also the mean and the deviation |
| Sortino ratio | `SortinoRatioRTIndicator` | `sortinoRatio(20)` | `sortino20` |  |  | mean log return less a minimum acceptable return, over the downside deviation |
| Tail ratio | `TailRatioRTIndicator` | `tailRatio(20)` | `tail20` |  |  | upper percentile of the log returns over the absolute lower one; 95% and 5% by default |
| Ulcer index | `UlcerIndexRTIndicator` | `ulcerIndex(20)` | `ulcer20` |  |  | root of the mean squared drawdown of the price in the window, in percent; also the largest drawdown |

## Volatility estimators

Parkinson, Garman-Klass, Rogers-Satchell and Yang-Zhang read whole bars. EWMA and realized volatility read the
group's price. Each takes an optional annualization factor: in its named form, and with `withAnnualizationFactor`
on every class.

| Indicator | Class | Call | Id | Outputs | Bars | Notes |
|---|---|---|---|---|---|---|
| Parkinson volatility | `ParkinsonVolatilityRTIndicator` | `parkinson(20)` | `park20` | | yes | high and low |
| Garman-Klass volatility | `GarmanKlassVolatilityRTIndicator` | `garmanKlass(20)` | `gk20` | | yes | open, high, low and close |
| Rogers-Satchell volatility | `RogersSatchellVolatilityRTIndicator` | `rogersSatchell(20)` | `rs20` | | yes | open, high, low and close |
| Yang-Zhang volatility | `YangZhangVolatilityRTIndicator` | `yangZhang(20)` | `yz20` | | yes | open, high, low and close |
| EWMA volatility | `EwmaVolatilityRTIndicator` | `ewmaVolatility()` | `ewma0.94` |  |  | exponentially weighted volatility of the log returns of the group's price; lambda 0.94 by default |
| Realized volatility | `RealizedVolatilityRTIndicator` | `realizedVolatility(20)` | `rvol20` |  |  | standard deviation of the log returns of the group's price over a window |

## Averages

None has a `Pro` call yet: add them with `group.add(name, new Class(…))`. Each reads the group's price.

| Indicator | Class | Call | Id | Outputs | Bars | Notes |
|---|---|---|---|---|---|---|
| Arnaud Legoux moving average | `AlmaRTIndicator` | — | | | | Gaussian-weighted average of the window; offset factor 0.85 and sigma factor 6 by default |
| Double exponential moving average | `DemaRTIndicator` | — | | | | twice an EMA less the EMA of that EMA, for less lag |
| Envelopes | `EnvelopesRTIndicator` | — | | | | an EMA with a band above and below at a fixed percentage; also the two bands; 20 periods and 2.5% by default |
| Fractal adaptive moving average | `FramaRTIndicator` | — | | | | EMA whose smoothing follows the fractal dimension of the window; also the dimension and the alpha; an odd number of periods is made even |
| Least squares moving average | `LeastSquaresMovingAverageRTIndicator` | — | | | | end point of the least-squares line through the window; 25 periods by default |
| McGinley Dynamic | `McGinleyDynamicRTIndicator` | — | | | | self-adjusting moving average that follows the speed of the price; 14 periods by default |

## Momentum

None has a `Pro` call yet: add them with `group.add(name, new Class(…))`. Each reads the group's price.

| Indicator | Class | Call | Id | Outputs | Bars | Notes |
|---|---|---|---|---|---|---|
| Chande momentum oscillator | `CmoRTIndicator` | — | | | | gains less losses over their sum for the last price changes, from -100 to 100; 14 periods by default |
| Detrended price oscillator | `DetrendedPriceOscillatorRTIndicator` | — | | | | a past price less the simple moving average of the window; 20 periods by default |
| Momentum | `MomentumRTIndicator` | — | | | | the price less the price n ticks ago; 10 periods by default |
| Rate of change | `RocRTIndicator` | — | | | | change of the price over n ticks, in percent; 12 periods by default |
