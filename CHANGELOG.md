# @qtsurfer/indicators-pro

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
