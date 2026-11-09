---
"@qtsurfer/indicators-pro": minor
---

New indicators, ported from the Java engine and compared with it value by value: the moving averages
`AlmaRTIndicator`, `DemaRTIndicator`, `EnvelopesRTIndicator`, `FramaRTIndicator`,
`LeastSquaresMovingAverageRTIndicator` and `McGinleyDynamicRTIndicator`, and the momentum indicators
`MomentumRTIndicator`, `RocRTIndicator`, `CmoRTIndicator` and `DetrendedPriceOscillatorRTIndicator`. They have no `Pro`
call yet: add them with `group.add(name, new Class(…))`.
