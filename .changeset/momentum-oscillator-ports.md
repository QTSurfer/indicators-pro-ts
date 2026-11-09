---
"@qtsurfer/indicators-pro": minor
---

New momentum indicators, ported from the Java engine and compared with it value by value:
`ChandeForecastOscillatorRTIndicator`, `ConnorsRsiRTIndicator`, `CoppockCurveRTIndicator`, `FisherTransformRTIndicator`,
`AdaptiveFisherTransformRTIndicator`, `KnowSureThingRTIndicator` (with its `getSignal()` line), `TrixRTIndicator` and
`TrueStrengthIndexRTIndicator`. They have no `Pro` call yet: add them with `group.add(name, new Class(…))`.
