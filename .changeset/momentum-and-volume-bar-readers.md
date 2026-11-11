---
"@qtsurfer/indicators-pro": minor
---

New indicators, ported from the Java engine and compared with it value by value, on the reference dataset with and
without values that are not finite and on synthetic series of bars: the momentum indicators
`AcceleratorOscillatorRTIndicator`, `AwesomeOscillatorRTIndicator`, `BalanceOfPowerRTIndicator`,
`BullBearPowerRTIndicator`, `RelativeVigorIndexRTIndicator`, `StochasticOscillatorRTIndicator`,
`UltimateOscillatorRTIndicator` and `WilliamsRRTIndicator`, and the volume indicators `AdlRTIndicator`,
`ChaikinOscillatorRTIndicator`, `EaseOfMovementRTIndicator`, `ElderForceIndexRTIndicator`,
`KlingerOscillatorRTIndicator`, `NegativeVolumeIndexRTIndicator` and `PvtRTIndicator`. All fifteen read whole bars, so
they belong on a kline group. A bar with a field the class reads that is not finite is left out, and a constructor
throws a `RangeError` with the Java message for a degenerate argument. The Awesome and Chaikin oscillators accept a fast
period above the slow one, and are ready when both of their averages are. The values are equal to Java's to the last bit.
