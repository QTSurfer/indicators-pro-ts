---
"@qtsurfer/indicators-pro": minor
---

`Pro.on(group)` gains the factories of the averages and momentum indicators, with the ids, overloads and outputs of
the Java engine's `Pro`: `alma` (`alma20`), `dema` (`dema20`), `envelopes` (`env20_2.5`, with `Upper` and `Lower`),
`frama` (`frama20`), `leastSquaresMovingAverage` (`lsma25`), `mcGinleyDynamic` (`mcg14`), `momentum` (`mom10`), `roc`
(`roc12`), `cmo` (`cmo14`), `detrendedPriceOscillator` (`dpo20`), `chandeForecastOscillator` (`cfo14`),
`fisherTransform` (`fisher10`), `trix` (`trix15`), `connorsRsi` (`crsi3_2_100`), `coppockCurve` (`coppock14_11_10`),
`adaptiveFisherTransform` (`afisher10_5_20`), `trueStrengthIndex` (`tsi25_13`) and `knowSureThing` (`kst`, with its
`Signal` line, named by the new constant `Pro.SUFFIX_SIGNAL`). Each takes the parameters of its class, with or without
a name, and builds its id from them (a whole envelope percentage has no decimal part: `env20_5`); `alma` and `dema`
have no default period, and `knowSureThing` takes its arrays only with a name. They read the group's price, so they
work on a ticker feed too.
