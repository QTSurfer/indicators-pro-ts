---
"@qtsurfer/indicators-pro": minor
---

New indicators, ported from the Java engine and compared with it value by value, on the reference dataset with and
without values that are not finite and on synthetic series of prices and of bars: the trend indicators
`AroonRTIndicator`, `ChandeKrollStopRTIndicator`, `ChandelierExitRTIndicator`, `DonchianChannelRTIndicator`,
`EfficiencyRatioRTIndicator`, `ParabolicSarRTIndicator` and `VortexRTIndicator`, and the volatility indicators
`ChoppinessIndexRTIndicator`, `KeltnerChannelRTIndicator`, `MassIndexRTIndicator`, `NatrRTIndicator` and
`RelativeVolatilityIndexRTIndicator`. All but the efficiency ratio and the relative volatility index read whole bars, so
they belong on a kline group. A bar with a high, low or close that is not finite (whichever the class reads) is left out,
and a constructor throws a `RangeError` with the Java message for a degenerate argument. They have no `Pro` call yet:
register them with `group.add(name, new Class(…))`.
