---
"@qtsurfer/indicators-pro": patch
---

A period below the minimum is now rejected before anything is built, with the message of the Java engine, by the classes
that used to fail from the window store or from a typed array with their own text: `RealizedVolatilityRTIndicator`,
`ParkinsonVolatilityRTIndicator`, `GarmanKlassVolatilityRTIndicator` and `RogersSatchellVolatilityRTIndicator`
(`Periods must be >= 1, got: 0`); `SharpeRatioRTIndicator`, `ValueAtRiskRTIndicator`, `SkewnessRTIndicator`,
`KurtosisRTIndicator` and `HurstExponentRTIndicator`, which checked after the window and so showed the window's text for
a period of 0 or less; the two regressions, which keep their old lower-case text; and `CmfRTIndicator`,
`MfiRTIndicator` and the senkou period of `IchimokuRTIndicator`, which reject a negative value (`Periods must be >= 0,
got: -1`, `SenkouPeriod must be >= 0, got: -1`) and still accept 0. The numbers in the messages of the Value at Risk
confidence, the EWMA lambda and the rolling percentile are written as Java writes them (`got: 1.0`).
