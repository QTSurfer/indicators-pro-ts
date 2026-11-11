# Indicators

The indicators `@qtsurfer/indicators-pro` ships: its classes, and the factories of `Pro` that register them on a group.
The base indicators (SMA, EMA, ATR, WMA…) are listed in `indicators.md` of `@qtsurfer/indicators`.
Update the row in the same change that adds a class or a factory:
`tests/IndicatorsDoc.test.ts` runs every call below on a kline group and fails when a class is missing here, a factory
does not exist, or the id, the outputs or the bar flag differ from what the facade registers.

- **Class** — the class exported by `@qtsurfer/indicators-pro`.
- **Call** — the call of `Pro.on(group)` that registers it with the default id. The statistics, the volatility
  estimators, ALMA, DEMA and NATR have no default period: the call shows 20. `—` when the class is ported and the Java engine
  has no `Pro` factory for it yet: it is added with `group.add(name, new Class(…))`, and the Id and Outputs columns are
  empty (the Bars column still says whether the class reads whole bars).
- **Id** — the name it registers under; the id of every output is this name plus the suffix.
- **Outputs** — the suffixes of the other values an indicator with several outputs registers beside it. The indicator
  itself is its main output.
- **Bars** — it reads a whole bar (high, low, close, volume) and not a single value, so it belongs on a kline group: on a
  ticker those are the exchange's 24-hour statistics. Such a class implements `RichRTIndicator` and returns `true` from
  `requiresBarData()`; a group fed from a ticker reports it once, with an `IndicatorNotice`, through `getNotices()`.

## Summary

| Group | Indicators |
|---|---:|
| Trend | 10 |
| Volume | 4 |
| Statistics | 9 |
| Risk and performance ratios | 7 |
| Volatility estimators | 6 |
| Volatility | 5 |
| Averages | 6 |
| Momentum | 12 |

## Trend

Efficiency ratio reads the group's price; the others read whole bars. Each call also takes the parameters of the class,
with or without a name (`aroon(10)`, `aroon("a", 10)`), and builds the id from them; a whole multiplier, step or
maximum has no decimal part in the id (`chand22_3`, `psar1_2`).

| Indicator | Class | Call | Id | Outputs | Bars | Notes |
|---|---|---|---|---|---|---|
| ADX | `AdxRTIndicator` | `adx()` | `adx14` | `PlusDI`, `MinusDI` | yes | the main output is the ADX |
| Aroon | `AroonRTIndicator` | `aroon()` | `aroon25` | `Up`, `Down` | yes | how many bars ago the highest high and the lowest low of the window were; the main output is the oscillator (Aroon Up less Aroon Down, from -100 to 100), `Up` and `Down` are the two lines, from 0 to 100; 25 periods by default |
| Chande Kroll stop | `ChandeKrollStopRTIndicator` | `chandeKrollStop()` | `cks10_1_9_9` | `StopShort` | yes | stop built on the ATR and the extremes of the close; the main output is the stop of a long position, `StopShort` the one of a short position; 10 ATR periods, a multiplier of 1, and 9 and 9 periods by default |
| Chandelier exit | `ChandelierExitRTIndicator` | `chandelierExit()` | `chand22_3` | `ShortExit` | yes | trailing stop an ATR multiple from the highest high; the main output is the long exit, `ShortExit` the short exit; 22 periods and a multiplier of 3 by default |
| Donchian channel | `DonchianChannelRTIndicator` | `donchianChannel()` | `donch20` | `Upper`, `Lower` | yes | highest high and lowest low of the window; the main output is the middle line, `Upper` and `Lower` the two boundaries; 20 periods by default |
| Efficiency ratio | `EfficiencyRatioRTIndicator` | `efficiencyRatio()` | `er10` | | | how much of the movement of the group's price over the window was in one direction, from 0 to 1; the class also gives the direction and the volatility, which are not outputs; 10 periods by default |
| Ichimoku | `IchimokuRTIndicator` | `ichimoku()` | `ichi9_26_52` | `Kijun`, `SenkouA`, `SenkouB`, `Chikou` | yes | the main output is the Tenkan-sen |
| Parabolic SAR | `ParabolicSarRTIndicator` | `parabolicSar()` | `psar0.02_0.2` | | yes | Wilder's stop and reverse; the value is the SAR, the class also gives the direction of the trend, which is not an output; a step of 0.02 and a maximum of 0.2 by default |
| SuperTrend | `SuperTrendRTIndicator` | `superTrend()` | `st10_3` | `Upper`, `Lower` | yes | a whole multiplier has no decimal part in the id |
| Vortex | `VortexRTIndicator` | `vortex()` | `vortex14` | `ViPlus`, `ViMinus` | yes | the main output is VI+ less VI-; `ViPlus` and `ViMinus` are the two lines; 14 periods by default |

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

## Volatility

The relative volatility index reads the group's price; the others read whole bars. Each call also takes the parameters
of the class, with or without a name (`keltnerChannel(10, 5, 2)`, `keltnerChannel("k", 10, 5, 2)`), and builds the id
from them. NATR has no default period, so it takes one: `natr(14)` or `natr("n", 14)`.

| Indicator | Class | Call | Id | Outputs | Bars | Notes |
|---|---|---|---|---|---|---|
| Choppiness index | `ChoppinessIndexRTIndicator` | `choppinessIndex()` | `chop14` | | yes | whether the market trends or ranges, from 0 to 100: 100 times the base 10 logarithm of the sum of the true ranges over the range of the window, over the logarithm of the periods; 14 periods by default |
| Keltner channel | `KeltnerChannelRTIndicator` | `keltnerChannel()` | `kc20_10_1.5` | `Upper`, `Lower` | yes | an EMA of the close, the main output, with a band above and below at an ATR multiple, the `Upper` and `Lower` outputs; 20 EMA periods, 10 ATR periods and a multiplier of 1.5 by default; a whole multiplier has no decimal part in the id |
| Mass index | `MassIndexRTIndicator` | `massIndex()` | `mass25_9` | | yes | sum of the ratio of an EMA of the high-low range to the EMA of that EMA; 25 and 9 periods by default |
| NATR | `NatrRTIndicator` | `natr(20)` | `natr20` | | yes | the ATR as a percentage of the close, to compare instruments |
| Relative volatility index | `RelativeVolatilityIndexRTIndicator` | `relativeVolatilityIndex()` | `rvi10_14` | | | the RSI applied to the standard deviation of the group's price, from 0 to 100; 10 and 14 periods by default |

## Averages

Each reads the group's price, so it works on a ticker feed too. Each call also takes the parameters of the class, with
or without a name (`mcGinleyDynamic(10)`, `mcGinleyDynamic("m", 10)`), and builds the id from them; ALMA and DEMA have
no default period, so they take one.

| Indicator | Class | Call | Id | Outputs | Bars | Notes |
|---|---|---|---|---|---|---|
| Arnaud Legoux moving average | `AlmaRTIndicator` | `alma(20)` | `alma20` |  | | Gaussian-weighted average of the window; offset factor 0.85 and sigma factor 6 by default |
| Double exponential moving average | `DemaRTIndicator` | `dema(20)` | `dema20` |  | | twice an EMA less the EMA of that EMA, for less lag |
| Envelopes | `EnvelopesRTIndicator` | `envelopes()` | `env20_2.5` | `Upper`, `Lower` | | an EMA, the main output, with a band above and below it at a fixed percentage; 20 periods and 2.5% by default; a whole percentage has no decimal part in the id |
| Fractal adaptive moving average | `FramaRTIndicator` | `frama()` | `frama20` |  | | EMA whose smoothing follows the fractal dimension of the window; the class also gives the dimension and the alpha, which are not outputs; an odd number of periods is made even, and the id keeps the number given |
| Least squares moving average | `LeastSquaresMovingAverageRTIndicator` | `leastSquaresMovingAverage()` | `lsma25` |  | | end point of the least-squares line through the window; 25 periods by default |
| McGinley Dynamic | `McGinleyDynamicRTIndicator` | `mcGinleyDynamic()` | `mcg14` |  | | self-adjusting moving average that follows the speed of the price; 14 periods by default |

## Momentum

Each reads the group's price, so it works on a ticker feed too. Each call also takes the parameters of the class, with
or without a name (`roc(5)`, `roc("r", 5)`), and builds the id from them. Know sure thing takes its arrays only with a
name: `knowSureThing("k", [10, 15], [10, 10], [1, 2], 9)`.

| Indicator | Class | Call | Id | Outputs | Bars | Notes |
|---|---|---|---|---|---|---|
| Adaptive Fisher transform | `AdaptiveFisherTransformRTIndicator` | `adaptiveFisherTransform()` | `afisher10_5_20` |  | | Fisher transform whose window follows the efficiency ratio; the class also gives the ratio and the window, which are not outputs; 10, 5 and 20 periods by default |
| Chande forecast oscillator | `ChandeForecastOscillatorRTIndicator` | `chandeForecastOscillator()` | `cfo14` |  | | percentage deviation of the price from its least squares average, which is not an output; 14 periods by default |
| Chande momentum oscillator | `CmoRTIndicator` | `cmo()` | `cmo14` |  | | gains less losses over their sum for the last price changes, from -100 to 100; 14 periods by default |
| Connors RSI | `ConnorsRsiRTIndicator` | `connorsRsi()` | `crsi3_2_100` |  | | mean of the RSI of the price, the RSI of its streak and the percent rank of its rate of change; 3, 2 and 100 periods by default |
| Coppock curve | `CoppockCurveRTIndicator` | `coppockCurve()` | `coppock14_11_10` |  | | weighted moving average of the sum of two rates of change; 14, 11 and 10 periods by default |
| Detrended price oscillator | `DetrendedPriceOscillatorRTIndicator` | `detrendedPriceOscillator()` | `dpo20` |  | | a past price less the simple moving average of the window; 20 periods by default |
| Fisher transform | `FisherTransformRTIndicator` | `fisherTransform()` | `fisher10` |  | | the price turned into a Gaussian-like variable for sharper turning points; 10 periods by default |
| Know sure thing | `KnowSureThingRTIndicator` | `knowSureThing()` | `kst` | `Signal` | | weighted sum of four smoothed rates of change; the signal, an average of the KST, is the `Signal` output; Pring's periods and weights by default |
| Momentum | `MomentumRTIndicator` | `momentum()` | `mom10` |  | | the price less the price n ticks ago; 10 periods by default |
| Rate of change | `RocRTIndicator` | `roc()` | `roc12` |  | | change of the price over n ticks, in percent; 12 periods by default |
| TRIX | `TrixRTIndicator` | `trix()` | `trix15` |  | | rate of change of a triple EMA, in percent; 15 periods by default |
| True strength index | `TrueStrengthIndexRTIndicator` | `trueStrengthIndex()` | `tsi25_13` |  | | double-smoothed momentum over double-smoothed absolute momentum, in percent; 25 and 13 periods by default |

## Not in this package

Six classes of the Java engine's pro module have no TypeScript class and no `Pro` call, on purpose. Adding any of them later
is a minor change, not a breaking one.

| Java class | Why |
|---|---|
| `Smma` | An alias of `Mma` (Wilder's smoothing), which `@qtsurfer/indicators` already has: SMMA is its `mma`. |
| `Beta`, `Correlation`, `Covariance`, `InformationRatio`, `TreynorRatio` | Each needs two series, an asset and a benchmark, and a group has no way yet to feed a second series to an indicator. They wait for a design of pairs between instruments. |
