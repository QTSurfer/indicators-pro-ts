---
"@qtsurfer/indicators-pro": minor
---

The Accelerator Oscillator, the Know Sure Thing and the Stochastic Oscillator feed their averages only with values that are valid, as the Java engine does, so for their first updates the line no longer carries the warm-up of the averages behind it, and `isReady()` is true only once the line is exact. Values from the ready update on do not change.

- Accelerator Oscillator: the average of the AO is fed once the slow average is ready. With the default periods it is ready from the 38th update (it was the 34th).
- Know Sure Thing: an average is fed once its rate of change is ready, and the signal once the KST is valid. With the default periods the KST is valid from the 45th update and the indicator, which includes the signal, is ready from the 53rd (it was the 31st).
- Stochastic Oscillator: until the first full window `%K` reads the raw `%K`, then `%K` is smoothed, and `%D` is fed once `%K` is. It is ready when both lines are valid: from the 18th update with `(14, 3, 3)` (it was the 14th), `%K` alone being the definition from the 16th.
