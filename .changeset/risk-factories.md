---
"@qtsurfer/indicators-pro": minor
---

`Pro.on(group)` gains the factories of the risk and performance indicators, with the ids, overloads and outputs of
the Java engine's `Pro`: `calmarRatio` (`calmar20`), `maxDrawdown` (`maxDd`, with its `Current` drawdown),
`omegaRatio` (`omega20`), `sharpeRatio` (`sharpe20`), `sortinoRatio` (`sortino20`), `tailRatio` (`tail20`),
`ulcerIndex` (`ulcer20`), `ewmaVolatility` (`ewma0.94`) and `realizedVolatility` (`rvol20`). They read the group's
price, so they work on a ticker feed too.
