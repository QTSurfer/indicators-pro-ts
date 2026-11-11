---
"@qtsurfer/indicators-pro": minor
---

`Pro.on(group)` gains `exactStdDev` and `exactVariance`, with the ids, overloads and metadata of the Java engine's
`Pro`, and the package now exports the two classes behind them, `StandardDeviationRTIndicator` and
`VarianceRTIndicator` (the variance was internal until now).

- `exactStdDev(periods)` registers `xstd` + periods, `exactStdDev(name, periods)` a name, and
  `exactStdDev(name, periods, sample)` a name with the form chosen. `exactVariance` takes the same three shapes and
  registers `xvar` + periods. There is no form without a period. The metadata hold `periods` and `sample`.
- Both read the group's price, so they work on a ticker feed too and raise no notice.
- They differ from the `stdDev` and `variance` of `@qtsurfer/indicators` in their default: these two give the
  population deviation and variance, the free ones the sample form (Bessel's correction). Pass `true` as `sample` to
  get the sample form: `exactVariance(name, 20, true)` gives the same values as the free `variance(20)` once the
  window is full, except on a window of identical prices, where it gives exactly 0.
- The two classes have the same simple names as the free ones: import them from `@qtsurfer/indicators-pro`, and the
  free ones from `@qtsurfer/indicators`.
- A period below 1 throws when the indicator is created.
