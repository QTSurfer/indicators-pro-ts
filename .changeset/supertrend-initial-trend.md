---
"@qtsurfer/indicators-pro": patch
---

`SuperTrendRTIndicator.isUpTrend()` is `false` until the first bar, as in the Java engine (it was `true`). After `reset()`
it is `true`, as in Java.
