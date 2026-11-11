---
"@qtsurfer/indicators-pro": minor
---

`Pro.on(group)` gains the factories of the trend and volatility indicators, with the ids, overloads and outputs of the
Java engine's `Pro`:

- `aroon` (`aroon25`, with `Up` and `Down`, all three in percent), `chandeKrollStop` (`cks10_1_9_9`, with `StopShort`),
  `chandelierExit` (`chand22_3`, with `ShortExit`), `donchianChannel` (`donch20`, with `Upper` and `Lower`),
  `parabolicSar` (`psar0.02_0.2`), `vortex` (`vortex14`, with `ViPlus` and `ViMinus`), `choppinessIndex` (`chop14`, in
  percent), `keltnerChannel` (`kc20_10_1.5`, with `Upper` and `Lower`), `massIndex` (`mass25_9`) and `natr`
  (`natr14`, in percent) read whole bars, so they belong on a kline group: a group fed from a ticker raises one notice
  for each, for the indicator and not for its outputs.
- `efficiencyRatio` (`er10`) and `relativeVolatilityIndex` (`rvi10_14`, in percent) read the group's price, so they work
  on a ticker feed too and raise no notice.

Each takes the parameters of its class, with or without a name, and builds its id from them (a whole multiplier, step
or maximum has no decimal part: `chand10_2`, `psar1_2`); the short forms keep the class defaults and put them in the
metadata. `natr` has no default period, so it takes a period or a name and a period. The new constants
`Pro.SUFFIX_UP`, `Pro.SUFFIX_DOWN`, `Pro.SUFFIX_STOP_SHORT`, `Pro.SUFFIX_SHORT_EXIT`, `Pro.SUFFIX_VI_PLUS` and
`Pro.SUFFIX_VI_MINUS` name the new outputs.
