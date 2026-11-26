---
"@qtsurfer/indicators-pro": minor
---

The double exponential average, the TRIX, the true strength index and the mass index say they are ready when every stage of the indicator has its values, where they said so when their first stage did. Each stage after the first adds `periods - 1` updates: `dema(14)` is ready at update 27 (it was 14), `trix(14)` at 41 (it was 14), `trueStrengthIndex(25, 13)` at 38 (it was 14) and `massIndex(25, 9)` at 41 (it was 25). The values do not change at any update, only the update from which each indicator is ready. The updates that count are the ones that are not left out, so a value that is not finite does not count, and the first update of the true strength index, which only gives the price the first change is taken from, counts as update 1. These mirror the Java engine.
