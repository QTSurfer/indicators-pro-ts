# @qtsurfer/indicators-pro

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
