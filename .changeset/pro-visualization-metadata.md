---
"@qtsurfer/indicators-pro": minor
---

Every factory of `Pro` describes how a chart should draw its indicator and each of its outputs, with the same keys and rows as the Java engine's `Pro`: unit (`dsp`), placement (`plc`, drawn over the price), range (`rng`), floor (`flo`), zero line (`lvl`), and per output plot style (`sty`), side (`sde`), drawn by default (`drw`) and band edge (`band`). Averages, bands, the Ichimoku lines, Parabolic SAR, VWAP and the rolling percentile are drawn over the price; Accelerator and Awesome oscillators are histograms; Parabolic SAR is drawn as dots; the oscillators carry their scale and zero line. Outputs that are on another scale or derived are registered but not drawn by default: the main output of Bull and Bear power and of Vortex (their two lines are drawn), SuperTrend's two bands, the Ichimoku lagging span and the intercept, R squared and standard error of the regressions.

The indicators that had no display hint now carry the unit of the table (`F` fraction for the volatilities, `R` ratio, `I` index, `N` pure number), so a consumer that formats by unit formats them. The eight oscillators that have always been percentages (`adx`, `aroon`, `choppinessIndex`, `mfi`, `relativeVolatilityIndex`, `stochasticOscillator`, `ultimateOscillator`, `williamsR`) keep that unit. No value changes.

Requires `@qtsurfer/core` and `@qtsurfer/indicators` `^0.16.0`, which carry the keys.
