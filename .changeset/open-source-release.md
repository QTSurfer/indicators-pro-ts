---
"@qtsurfer/indicators-pro": minor
---

First open-source release: the package is dual-licensed (GNU AGPL v3 with the QTSurfer Strategy Exception, or a
commercial licence) and published to npm.

- **Breaking:** `Pro.atr` is removed. ATR is a free indicator of `@qtsurfer/indicators` now: use `group.atr(...)`,
  which registers it under the same default id, `atr14`.
- `indicators.md` lists every indicator of the package: its class, the `Pro` call, the default id, the outputs and
  whether it reads whole bars. A test keeps it equal to what the facade registers.
- Requires `@qtsurfer/core` and `@qtsurfer/indicators` `^0.14.0`.
