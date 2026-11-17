---
"@qtsurfer/indicators-pro": minor
---

Connors RSI smooths both of its RSIs with Wilder's averages by default, as Connors RSI is usually defined, as the Java engine does. It used Cutler's simple averages before, so its values change from the second bar on. A final `true` (`sma`) keeps the old averages: `new ConnorsRsiRTIndicator(3, 2, 100, true)` and `connorsRsi("c", 3, 2, 100, true)`.
