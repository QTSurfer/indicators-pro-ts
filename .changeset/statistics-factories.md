---
"@qtsurfer/indicators-pro": minor
---

`Pro.on(group)` gains the factories of the new statistics, with the ids, overloads and outputs of the Java engine's
`Pro`: `autocorrelation` (`acf20`), `hurstExponent` (`hurst20`), `linearRegressionSlope` (`lrs20`, with its
`Intercept`), `rollingPercentile` (`pctl20_0.95`, with `Median`, `Min` and `Max`), `simpleLinearRegression`
(`slr20`, with `Intercept`, `RSquared` and `StandardError`), `skewness` (`skew20`), `valueAtRisk` (`valRisk20`, with
an optional confidence and annualization factor) and `zScore` (`zscore20`). They read the group's price, so they work
on a ticker feed too.
