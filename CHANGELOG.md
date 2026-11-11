# @qtsurfer/indicators-pro

## 0.4.1

### Patch Changes

- [#6](https://github.com/QTSurfer/indicators-pro-ts/pull/6) [`187c8a1`](https://github.com/QTSurfer/indicators-pro-ts/commit/187c8a1167e7e3dc114b41880d066892c236be14) Thanks [@mrmx](https://github.com/mrmx)! - A period below the minimum is now rejected before anything is built, with the message of the Java engine, by the classes
  that used to fail from the window store or from a typed array with their own text: `RealizedVolatilityRTIndicator`,
  `ParkinsonVolatilityRTIndicator`, `GarmanKlassVolatilityRTIndicator` and `RogersSatchellVolatilityRTIndicator`
  (`Periods must be >= 1, got: 0`); `SharpeRatioRTIndicator`, `ValueAtRiskRTIndicator`, `SkewnessRTIndicator`,
  `KurtosisRTIndicator` and `HurstExponentRTIndicator`, which checked after the window and so showed the window's text for
  a period of 0 or less; the two regressions, which keep their old lower-case text; and `CmfRTIndicator`,
  `MfiRTIndicator` and the senkou period of `IchimokuRTIndicator`, which reject a negative value (`Periods must be >= 0,
got: -1`, `SenkouPeriod must be >= 0, got: -1`) and still accept 0. The numbers in the messages of the Value at Risk
  confidence, the EWMA lambda and the rolling percentile are written as Java writes them (`got: 1.0`).

## 0.4.0

### Minor Changes

- [#4](https://github.com/QTSurfer/indicators-pro-ts/pull/4) [`c94a1fe`](https://github.com/QTSurfer/indicators-pro-ts/commit/c94a1fe1a5b24721b1581f2eb8ca962f8a04b581) Thanks [@mrmx](https://github.com/mrmx)! - New indicators, ported from the Java engine and compared with it value by value, on the reference dataset with and
  without values that are not finite and on synthetic series of bars: the momentum indicators
  `AcceleratorOscillatorRTIndicator`, `AwesomeOscillatorRTIndicator`, `BalanceOfPowerRTIndicator`,
  `BullBearPowerRTIndicator`, `RelativeVigorIndexRTIndicator`, `StochasticOscillatorRTIndicator`,
  `UltimateOscillatorRTIndicator` and `WilliamsRRTIndicator`, and the volume indicators `AdlRTIndicator`,
  `ChaikinOscillatorRTIndicator`, `EaseOfMovementRTIndicator`, `ElderForceIndexRTIndicator`,
  `KlingerOscillatorRTIndicator`, `NegativeVolumeIndexRTIndicator` and `PvtRTIndicator`. All fifteen read whole bars, so
  they belong on a kline group. A bar with a field the class reads that is not finite is left out, and a constructor
  throws a `RangeError` with the Java message for a degenerate argument. The Awesome and Chaikin oscillators accept a fast
  period above the slow one, and are ready when both of their averages are. The values are equal to Java's to the last bit.

- [#4](https://github.com/QTSurfer/indicators-pro-ts/pull/4) [`4da1941`](https://github.com/QTSurfer/indicators-pro-ts/commit/4da1941fb9f2eea92d3b45ca7fbef213495791ba) Thanks [@mrmx](https://github.com/mrmx)! - `Pro.on(group)` gains `exactStdDev` and `exactVariance`, with the ids, overloads and metadata of the Java engine's
  `Pro`, and the package now exports the two classes behind them, `StandardDeviationRTIndicator` and
  `VarianceRTIndicator` (the variance was internal until now).

  - `exactStdDev(periods)` registers `xstd` + periods, `exactStdDev(name, periods)` a name, and
    `exactStdDev(name, periods, sample)` a name with the form chosen. `exactVariance` takes the same three shapes and
    registers `xvar` + periods. There is no form without a period. The metadata hold `periods` and `sample`.
  - Both read the group's price, so they work on a ticker feed too and raise no notice.
  - They differ from the `stdDev` and `variance` of `@qtsurfer/indicators` in their default: these two give the
    population deviation and variance, the free ones the sample form (Bessel's correction). Pass `true` as `sample` to
    get the sample form: `exactVariance(name, 20, true)` gives the same values as the free `variance(20)` once the
    window is full, except on a window of identical prices, where it gives exactly 0.
  - The two classes have the same simple names as the free ones: import them from `@qtsurfer/indicators-pro`, and the
    free ones from `@qtsurfer/indicators`.
  - A period below 1 throws a `RangeError` (`Periods must be >= 1, got: 0`) when the indicator is created, as in the Java
    engine; the pro `ZScoreRTIndicator`, which builds on the variance, reports the same message.

- [#4](https://github.com/QTSurfer/indicators-pro-ts/pull/4) [`e708f17`](https://github.com/QTSurfer/indicators-pro-ts/commit/e708f171272c08a24826946e35e9ddc67a3fc85a) Thanks [@mrmx](https://github.com/mrmx)! - `Pro.on(group)` gains the factories of the momentum and volume indicators that read whole bars, with the ids,
  overloads, outputs, display hints and metadata of the Java engine's `Pro`:

  - Momentum: `acceleratorOscillator` (`acc`), `awesomeOscillator` (`ao5_34`), `balanceOfPower` (`bop`), `bullBearPower`
    (`bbp13`, with `Bull` and `Bear`), `relativeVigorIndex` (`rvgi10`), `stochasticOscillator` (`stoch14_3_3`, with `D`;
    %K and %D in percent), `ultimateOscillator` (`uo`, in percent) and `williamsR` (`willr14`, in percent).
  - Volume: `adl` (`adl`), `chaikinOscillator` (`chaikin3_10`), `easeOfMovement` (`eom14`), `elderForceIndex` (`efi13`),
    `klingerOscillator` (`klinger`, with `Signal`), `negativeVolumeIndex` (`nvi`) and `pvt` (`pvt`). Of these, the
    accumulation/distribution line, the Chaikin oscillator, the Elder force index, the Klinger oscillator (its signal line
    included) and the price volume trend carry the volume display hint; the ease of movement and the negative volume index
    carry none.

  All fifteen read whole bars, so they belong on a kline group: a group fed from a ticker raises one notice for each, for
  the indicator and not for its outputs. The ones with parameters (`awesomeOscillator`, `bullBearPower`,
  `relativeVigorIndex`, `stochasticOscillator`, `williamsR`, `chaikinOscillator`, `easeOfMovement` and `elderForceIndex`)
  take them with or without a name, build their id from them and put them in the metadata; the short forms keep the
  class defaults. The seven without parameters (`acceleratorOscillator`, `balanceOfPower`, `ultimateOscillator`, `adl`,
  `klingerOscillator`, `negativeVolumeIndex` and `pvt`) take only an optional name. A fast period above the slow one is
  accepted by the Awesome and Chaikin oscillators, as in the Java engine. The new constants `Pro.SUFFIX_BULL`,
  `Pro.SUFFIX_BEAR` and `Pro.SUFFIX_D` name the new outputs.

- [#4](https://github.com/QTSurfer/indicators-pro-ts/pull/4) [`8eced70`](https://github.com/QTSurfer/indicators-pro-ts/commit/8eced70b3cb306be4b92cc9b24f172fa053c6084) Thanks [@mrmx](https://github.com/mrmx)! - `Pro.on(group)` gains the factories of the trend and volatility indicators, with the ids, overloads and outputs of the
  Java engine's `Pro`:

  - `aroon` (`aroon25`, with `Up` and `Down`, all three in percent), `chandeKrollStop` (`cks10_1_9_9`, with `StopShort`),
    `chandelierExit` (`chand22_3`, with `ShortExit`), `donchianChannel` (`donch20`, with `Upper` and `Lower`),
    `parabolicSar` (`psar0.02_0.2`), `vortex` (`vortex14`, with `ViPlus` and `ViMinus`), `choppinessIndex` (`chop14`, in
    percent), `keltnerChannel` (`kc20_10_1.5`, with `Upper` and `Lower`), `massIndex` (`mass25_9`) and `natr`
    (`natr14`, in percent) read whole bars, so they belong on a kline group: a group fed from a ticker raises one notice
    for each, for the indicator and not for its outputs.
  - `efficiencyRatio` (`er10`) and `relativeVolatilityIndex` (`rvi10_14`, in percent) read the group's price, so they work
    on a ticker feed too and raise no notice.

  Each takes the parameters of its class, with or without a name, and builds its id from them (a whole multiplier, step
  or maximum has no decimal part: `chand10_2`, `psar1_2`); the short forms keep the class defaults and put them in the
  metadata. `natr` has no default period, so it takes a period or a name and a period. The new constants
  `Pro.SUFFIX_UP`, `Pro.SUFFIX_DOWN`, `Pro.SUFFIX_STOP_SHORT`, `Pro.SUFFIX_SHORT_EXIT`, `Pro.SUFFIX_VI_PLUS` and
  `Pro.SUFFIX_VI_MINUS` name the new outputs.

- [#4](https://github.com/QTSurfer/indicators-pro-ts/pull/4) [`45ff8fb`](https://github.com/QTSurfer/indicators-pro-ts/commit/45ff8fb2fab14e0a6b488a53c9dbbcabbf192bfb) Thanks [@mrmx](https://github.com/mrmx)! - New indicators, ported from the Java engine and compared with it value by value, on the reference dataset with and
  without values that are not finite and on synthetic series of prices and of bars: the trend indicators
  `AroonRTIndicator`, `ChandeKrollStopRTIndicator`, `ChandelierExitRTIndicator`, `DonchianChannelRTIndicator`,
  `EfficiencyRatioRTIndicator`, `ParabolicSarRTIndicator` and `VortexRTIndicator`, and the volatility indicators
  `ChoppinessIndexRTIndicator`, `KeltnerChannelRTIndicator`, `MassIndexRTIndicator`, `NatrRTIndicator` and
  `RelativeVolatilityIndexRTIndicator`. All but the efficiency ratio and the relative volatility index read whole bars, so
  they belong on a kline group. A bar with a high, low or close that is not finite (whichever the class reads) is left out,
  and a constructor throws a `RangeError` with the Java message for a degenerate argument.

### Patch Changes

- [#4](https://github.com/QTSurfer/indicators-pro-ts/pull/4) [`45ff8fb`](https://github.com/QTSurfer/indicators-pro-ts/commit/45ff8fb2fab14e0a6b488a53c9dbbcabbf192bfb) Thanks [@mrmx](https://github.com/mrmx)! - `SuperTrendRTIndicator.isUpTrend()` is `false` until the first bar, as in the Java engine (it was `true`). After `reset()`
  it is `true`, as in Java.

## 0.3.0

### Minor Changes

- [#2](https://github.com/QTSurfer/indicators-pro-ts/pull/2) [`f7d694b`](https://github.com/QTSurfer/indicators-pro-ts/commit/f7d694bad5c632b8c88a4cac927f09096129a73c) Thanks [@mrmx](https://github.com/mrmx)! - New indicators, ported from the Java engine and compared with it value by value: the moving averages
  `AlmaRTIndicator`, `DemaRTIndicator`, `EnvelopesRTIndicator`, `FramaRTIndicator`,
  `LeastSquaresMovingAverageRTIndicator` and `McGinleyDynamicRTIndicator`, and the momentum indicators
  `MomentumRTIndicator`, `RocRTIndicator`, `CmoRTIndicator` and `DetrendedPriceOscillatorRTIndicator`.

- [#2](https://github.com/QTSurfer/indicators-pro-ts/pull/2) [`27be536`](https://github.com/QTSurfer/indicators-pro-ts/commit/27be536b7ac5a918d74e55c26142cd8b715cab1d) Thanks [@mrmx](https://github.com/mrmx)! - New momentum indicators, ported from the Java engine and compared with it value by value:
  `ChandeForecastOscillatorRTIndicator`, `ConnorsRsiRTIndicator`, `CoppockCurveRTIndicator`, `FisherTransformRTIndicator`,
  `AdaptiveFisherTransformRTIndicator`, `KnowSureThingRTIndicator` (with its `getSignal()` line), `TrixRTIndicator` and
  `TrueStrengthIndexRTIndicator`.

- [#2](https://github.com/QTSurfer/indicators-pro-ts/pull/2) [`04fd0c9`](https://github.com/QTSurfer/indicators-pro-ts/commit/04fd0c9933c402d56cf0d511fd65cace45cba7ae) Thanks [@mrmx](https://github.com/mrmx)! - The averages and momentum indicators added in this release (`AlmaRTIndicator`, `DemaRTIndicator`,
  `EnvelopesRTIndicator`, `FramaRTIndicator`, `LeastSquaresMovingAverageRTIndicator`, `McGinleyDynamicRTIndicator`,
  `MomentumRTIndicator`, `RocRTIndicator`, `CmoRTIndicator`, `DetrendedPriceOscillatorRTIndicator`,
  `ChandeForecastOscillatorRTIndicator`, `ConnorsRsiRTIndicator`, `CoppockCurveRTIndicator`, `FisherTransformRTIndicator`,
  `AdaptiveFisherTransformRTIndicator`, `KnowSureThingRTIndicator`, `TrixRTIndicator` and
  `TrueStrengthIndexRTIndicator`) ignore a price that is not finite and keep their last value, and their constructors throw
  a `RangeError` for degenerate arguments, as the Java engine's classes do.

- [#2](https://github.com/QTSurfer/indicators-pro-ts/pull/2) [`ae0ec2c`](https://github.com/QTSurfer/indicators-pro-ts/commit/ae0ec2c99fc5060a9eba4fccf268436c97ffd7dc) Thanks [@mrmx](https://github.com/mrmx)! - `Pro.on(group)` gains the factories of the averages and momentum indicators, with the ids, overloads and outputs of
  the Java engine's `Pro`: `alma` (`alma20`), `dema` (`dema20`), `envelopes` (`env20_2.5`, with `Upper` and `Lower`),
  `frama` (`frama20`), `leastSquaresMovingAverage` (`lsma25`), `mcGinleyDynamic` (`mcg14`), `momentum` (`mom10`), `roc`
  (`roc12`), `cmo` (`cmo14`), `detrendedPriceOscillator` (`dpo20`), `chandeForecastOscillator` (`cfo14`),
  `fisherTransform` (`fisher10`), `trix` (`trix15`), `connorsRsi` (`crsi3_2_100`), `coppockCurve` (`coppock14_11_10`),
  `adaptiveFisherTransform` (`afisher10_5_20`), `trueStrengthIndex` (`tsi25_13`) and `knowSureThing` (`kst`, with its
  `Signal` line, named by the new constant `Pro.SUFFIX_SIGNAL`). Each takes the parameters of its class, with or without
  a name, and builds its id from them (a whole envelope percentage has no decimal part: `env20_5`); `alma` and `dema`
  have no default period, and `knowSureThing` takes its arrays only with a name. They read the group's price, so they
  work on a ticker feed too.

### Patch Changes

- [#2](https://github.com/QTSurfer/indicators-pro-ts/pull/2) [`af9c9dd`](https://github.com/QTSurfer/indicators-pro-ts/commit/af9c9dd41ebf97eab142d3439fa58b3060eb29ed) Thanks [@mrmx](https://github.com/mrmx)! - The ids that `superTrend`, `rollingPercentile` and `ewmaVolatility` build from a decimal parameter are written as the
  Java engine writes them, as `envelopes` already did: `ewmaVolatility(0.0001)` registers `ewma1.0E-4` and not
  `ewma0.0001`, and `superTrend(10, 0.000025)` registers `st10_2.5E-5`. A whole value still drops its decimal part
  (`st14_2`, `pctl20_1`) and the usual ones are unchanged (`ewma0.94`, `pctl20_0.95`, `st10_2.5`).

## 0.2.0

### Minor Changes

- [`97c7587`](https://github.com/QTSurfer/indicators-pro-ts/commit/97c75874f726103789bad6df351b2eba76ea5252) Thanks [@mrmx](https://github.com/mrmx)! - First open-source release: the package is dual-licensed (GNU AGPL v3 with the QTSurfer Strategy Exception, or a
  commercial licence) and published to npm.

  - **Breaking:** `Pro.atr` is removed. ATR is a free indicator of `@qtsurfer/indicators` now: use `group.atr(...)`,
    which registers it under the same default id, `atr14`.
  - `indicators.md` lists every indicator of the package: its class, the `Pro` call, the default id, the outputs and
    whether it reads whole bars. A test keeps it equal to what the facade registers.
  - Requires `@qtsurfer/core` and `@qtsurfer/indicators` `^0.14.0`.

- [`97c7587`](https://github.com/QTSurfer/indicators-pro-ts/commit/97c75874f726103789bad6df351b2eba76ea5252) Thanks [@mrmx](https://github.com/mrmx)! - New indicators, ported from the Java engine and compared with it value by value: the risk and performance ratios
  `CalmarRatioRTIndicator`, `MaxDrawdownRTIndicator`, `OmegaRatioRTIndicator`, `SharpeRatioRTIndicator`,
  `SortinoRatioRTIndicator`, `TailRatioRTIndicator` and `UlcerIndexRTIndicator`, and the volatilities
  `EwmaVolatilityRTIndicator` and `RealizedVolatilityRTIndicator`. Every price-fed indicator, the ones added before included, is now also compared with
  Java on short synthetic series: flat, rising, falling and zig-zag prices, a series shorter than the window, a price
  that collapses, and zero and negative prices.

- [`97c7587`](https://github.com/QTSurfer/indicators-pro-ts/commit/97c75874f726103789bad6df351b2eba76ea5252) Thanks [@mrmx](https://github.com/mrmx)! - `Pro.on(group)` gains the factories of the risk and performance indicators, with the ids, overloads and outputs of
  the Java engine's `Pro`: `calmarRatio` (`calmar20`), `maxDrawdown` (`maxDd`, with its `Current` drawdown),
  `omegaRatio` (`omega20`), `sharpeRatio` (`sharpe20`), `sortinoRatio` (`sortino20`), `tailRatio` (`tail20`),
  `ulcerIndex` (`ulcer20`), `ewmaVolatility` (`ewma0.94`) and `realizedVolatility` (`rvol20`). They read the group's
  price, so they work on a ticker feed too.

- [`97c7587`](https://github.com/QTSurfer/indicators-pro-ts/commit/97c75874f726103789bad6df351b2eba76ea5252) Thanks [@mrmx](https://github.com/mrmx)! - `Pro.on(group)` gains the factories of the new statistics, with the ids, overloads and outputs of the Java engine's
  `Pro`: `autocorrelation` (`acf20`), `hurstExponent` (`hurst20`), `linearRegressionSlope` (`lrs20`, with its
  `Intercept`), `rollingPercentile` (`pctl20_0.95`, with `Median`, `Min` and `Max`), `simpleLinearRegression`
  (`slr20`, with `Intercept`, `RSquared` and `StandardError`), `skewness` (`skew20`), `valueAtRisk` (`valRisk20`, with
  an optional confidence and annualization factor) and `zScore` (`zscore20`). They read the group's price, so they work
  on a ticker feed too.

- [`97c7587`](https://github.com/QTSurfer/indicators-pro-ts/commit/97c75874f726103789bad6df351b2eba76ea5252) Thanks [@mrmx](https://github.com/mrmx)! - New statistics indicators, ported from the Java engine and compared with it value by value: `SkewnessRTIndicator`,
  `ZScoreRTIndicator`, `ValueAtRiskRTIndicator`, `AutocorrelationRTIndicator`, `HurstExponentRTIndicator`,
  `LinearRegressionSlopeRTIndicator`, `SimpleLinearRegressionRTIndicator` and `RollingPercentileRTIndicator`.
