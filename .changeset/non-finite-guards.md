---
"@qtsurfer/indicators-pro": minor
---

The averages and momentum indicators added in this release (`AlmaRTIndicator`, `DemaRTIndicator`,
`EnvelopesRTIndicator`, `FramaRTIndicator`, `LeastSquaresMovingAverageRTIndicator`, `McGinleyDynamicRTIndicator`,
`MomentumRTIndicator`, `RocRTIndicator`, `CmoRTIndicator`, `DetrendedPriceOscillatorRTIndicator`,
`ChandeForecastOscillatorRTIndicator`, `ConnorsRsiRTIndicator`, `CoppockCurveRTIndicator`, `FisherTransformRTIndicator`,
`AdaptiveFisherTransformRTIndicator`, `KnowSureThingRTIndicator`, `TrixRTIndicator` and
`TrueStrengthIndexRTIndicator`) ignore a price that is not finite and keep their last value, and their constructors throw
a `RangeError` for degenerate arguments, as the Java engine's classes do.
