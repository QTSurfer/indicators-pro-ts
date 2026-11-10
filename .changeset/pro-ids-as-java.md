---
"@qtsurfer/indicators-pro": patch
---

The ids that `superTrend`, `rollingPercentile` and `ewmaVolatility` build from a decimal parameter are written as the
Java engine writes them, as `envelopes` already did: `ewmaVolatility(0.0001)` registers `ewma1.0E-4` and not
`ewma0.0001`, and `superTrend(10, 0.000025)` registers `st10_2.5E-5`. A whole value still drops its decimal part
(`st14_2`, `pctl20_1`) and the usual ones are unchanged (`ewma0.94`, `pctl20_0.95`, `st10_2.5`).
