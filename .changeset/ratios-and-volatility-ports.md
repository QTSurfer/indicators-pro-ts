---
"@qtsurfer/indicators-pro": minor
---

New indicators, ported from the Java engine and compared with it value by value: the risk and performance ratios
`CalmarRatioRTIndicator`, `MaxDrawdownRTIndicator`, `OmegaRatioRTIndicator`, `SharpeRatioRTIndicator`,
`SortinoRatioRTIndicator`, `TailRatioRTIndicator` and `UlcerIndexRTIndicator`, and the volatilities
`EwmaVolatilityRTIndicator` and `RealizedVolatilityRTIndicator`. They have no `Pro` call yet: add them with
`group.add(name, new Class(…))`. Every price-fed indicator, the ones added before included, is now also compared with
Java on short synthetic series: flat, rising, falling and zig-zag prices, a series shorter than the window, a price
that collapses, and zero and negative prices.
