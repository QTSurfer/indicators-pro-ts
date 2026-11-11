---
"@qtsurfer/indicators-pro": minor
---

`Pro.on(group)` gains the factories of the momentum and volume indicators that read whole bars, with the ids,
overloads, outputs, display hints and metadata of the Java engine's `Pro`:

- Momentum: `acceleratorOscillator` (`acc`), `awesomeOscillator` (`ao5_34`), `balanceOfPower` (`bop`), `bullBearPower`
  (`bbp13`, with `Bull` and `Bear`), `relativeVigorIndex` (`rvgi10`), `stochasticOscillator` (`stoch14_3_3`, with `D`;
  %K and %D in percent), `ultimateOscillator` (`uo`, in percent) and `williamsR` (`willr14`, in percent).
- Volume: `adl` (`adl`), `chaikinOscillator` (`chaikin3_10`), `easeOfMovement` (`eom14`), `elderForceIndex` (`efi13`),
  `klingerOscillator` (`klinger`, with `Signal`), `negativeVolumeIndex` (`nvi`) and `pvt` (`pvt`). Of these, the
  accumulation/distribution line, the Chaikin oscillator, the Elder force index, the Klinger oscillator (its signal line
  included) and the price volume trend carry the volume display hint; the ease of movement and the negative volume index
  carry none.

All fifteen read whole bars, so they belong on a kline group: a group fed from a ticker raises one notice for each, for
the indicator and not for its outputs. The ones with parameters (`awesomeOscillator`, `bullBearPower`,
`relativeVigorIndex`, `stochasticOscillator`, `williamsR`, `chaikinOscillator`, `easeOfMovement` and `elderForceIndex`)
take them with or without a name, build their id from them and put them in the metadata; the short forms keep the
class defaults. The seven without parameters (`acceleratorOscillator`, `balanceOfPower`, `ultimateOscillator`, `adl`,
`klingerOscillator`, `negativeVolumeIndex` and `pvt`) take only an optional name. A fast period above the slow one is
accepted by the Awesome and Chaikin oscillators, as in the Java engine. The new constants `Pro.SUFFIX_BULL`,
`Pro.SUFFIX_BEAR` and `Pro.SUFFIX_D` name the new outputs.
