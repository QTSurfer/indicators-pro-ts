# @qtsurfer/indicators-pro

<p align="center">
  <a href="https://github.com/QTSurfer/indicators-pro-ts/actions/workflows/ci.yaml"><img src="https://github.com/QTSurfer/indicators-pro-ts/actions/workflows/ci.yaml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@qtsurfer/indicators-pro"><img src="https://img.shields.io/npm/v/@qtsurfer/indicators-pro?label=%40qtsurfer%2Findicators-pro" alt="npm"></a>
  <a href="LICENSING.md"><img src="https://img.shields.io/badge/License-AGPL%20v3%20%7C%20commercial-blue.svg" alt="License"></a>
</p>

The pro real-time streaming indicators of [QTSurfer](https://qtsurfer.com) for TypeScript: the same indicators the
Java engine runs on the server, with the same algorithms, ids and outputs, to run in
the browser or in Node.js. They build on [`@qtsurfer/indicators`](https://github.com/QTSurfer/engine-ts) and are used
through the same group builder.

## Install

```bash
npm install @qtsurfer/indicators-pro @qtsurfer/indicators @qtsurfer/core
```

## Use

```ts
import { InstrumentGroupRTIndicator, InstrumentMapKlineSourceRTIndicator } from "@qtsurfer/indicators";
import { Pro } from "@qtsurfer/indicators-pro";

const map = new InstrumentMapKlineSourceRTIndicator("BTC/USDT");
const group = new InstrumentGroupRTIndicator(map);
Pro.on(group).adx().ichimoku().vwap().yangZhang(20);

map.updateFrom(kline);
group.getIndicatorValue("adx14");            // 23.74…
group.getIndicatorValue("ichi9_26_52Kijun"); // an output of an indicator that has several
```

`Pro.on(group)` has the ids, overloads and output suffixes of the Java engine's `Pro`, so a QTScript line
`pro.adx()` means the same here and on the server. Indicators that read whole bars (high, low, volume)
belong on a kline group: on a ticker those are the exchange's 24-hour statistics.

## Ported

59 of the 82 pro indicators of the Java module: every factory of the Java engine's `Pro` (ADX, CMF,
Ichimoku, MFI, OBV, SuperTrend, VWAP) and the fifty-two that came after it (Kurtosis, Skewness, Z-Score,
Value at Risk, Autocorrelation, the Hurst exponent, the linear regression slope, the simple linear regression,
the rolling percentile, the Calmar, Omega, Sharpe, Sortino and tail ratios, the maximum drawdown, the Ulcer index,
the EWMA and realized volatilities, the four OHLC volatility estimators, the ALMA, DEMA, FRAMA, least squares and
McGinley Dynamic moving averages, the envelopes, Momentum, ROC, the Chande momentum and forecast oscillators, the
detrended price oscillator, Connors RSI, the Coppock curve, the Fisher and adaptive Fisher transforms, Know sure
thing, TRIX, the true strength index, Aroon, the Chande Kroll stop, the Chandelier exit, the Donchian channel, the
efficiency ratio, the Parabolic SAR, Vortex, the Choppiness index, the Keltner channel, the Mass index, NATR and the
relative volatility index). ATR is not here: it is a free indicator of `@qtsurfer/indicators`. Each is compared with the
Java engine, value by value, on a seeded dataset and on the same one with values that are not finite, and on short
synthetic series that reach the guards the dataset does not (see below).

[`indicators.md`](indicators.md) lists them: class, `Pro` call, default id, outputs and whether the indicator reads
whole bars. A test fails when it differs from what the facade registers.

## Parity with Java

`tests/fixtures/reference.json` is written by the Java engine (`tools/java-oracle/Oracle.java`), never by
hand, from a checkout of the Java engine:

```bash
QTS_JAVA_ENGINE=/path/to/java-engine pnpm oracle
```

The fixture was written on Apple silicon (arm64). A build of V8 for x86-64 can round a logarithm one bit differently:
on x86-64 Linux with Node.js 22 the Parkinson volatility is one bit away from Java's at one bar of the reference
dataset. That is why every series that takes a logarithm is held to a tolerance and not to equality, whatever the
figures below say for the machine they were measured on. The series that take none are equal to the last bit on both.

The arithmetic of `+ - * /` and `sqrt` is exact in every JavaScript engine, so those series are equal to
the last bit. That holds the maximum drawdown and the Ulcer index to the last bit, as every other indicator that takes
no logarithm or exponential (among them the DEMA, the envelopes, the least squares and McGinley Dynamic averages,
Momentum, ROC, the Chande momentum and forecast oscillators, the detrended price oscillator, Connors RSI, the Coppock
curve, Know sure thing, TRIX, the true strength index, Aroon, the Chande Kroll stop, the Chandelier exit, the Donchian
channel, the efficiency ratio, the Parabolic SAR, Vortex, the Keltner channel, the Mass index, NATR and the relative
volatility index). The indicators that take logarithms or an exponential (the four OHLC volatility estimators, the EWMA
and realized volatilities, Autocorrelation, the Hurst exponent, Value at Risk, the Calmar, Omega, Sharpe, Sortino and
tail ratios, ALMA, FRAMA, the Choppiness index and the Fisher and adaptive Fisher transforms) are held to a relative
1e-12, because engines do not all round a logarithm the way Java does. Measured on the
reference dataset, the OHLC estimators and ALMA are equal to the last bit in Node.js (V8) and Bun (JavaScriptCore)
too. FRAMA is within 5e-15 of Java's in V8 (its alpha, which magnifies the error of the logarithms, is the furthest)
and within 3e-16 in JavaScriptCore. The Fisher transform is within 3e-16 in V8 and equal in JavaScriptCore but for one
value, 1e-16 away; the adaptive Fisher transform is within 3e-14 in V8 (it adds half of its previous value to a
logarithm, and the two can nearly cancel) and equal in JavaScriptCore. The others work on log returns, and V8 rounds 3
of the 599 returns of the clean prices one bit away from Java's (JavaScriptCore, 1 of 599). Value at Risk, the realized
volatility and the Calmar, Sharpe and Sortino ratios keep running sums, which enlarge that bit: they are within 4e-13 of
Java's in V8 and 7e-15 in JavaScriptCore, as are Autocorrelation and the Hurst exponent. The EWMA volatility, the Omega
ratio and the tail ratio are within 1e-15 in both. The Choppiness index, which takes one base 10 logarithm, is within
5e-16 of Java's in V8 and 2e-16 in JavaScriptCore.

`tests/edges.test.ts` runs every price-fed indicator on short synthetic series: forty identical prices, a rising and
a falling ramp, a zig-zag, five values (fewer than the window), a price that collapses to 1e-8 and comes back, the
smallest positive price, and a zero, a leading zero and a negative price. They reach the guards of the indicators
that the dataset never does. The values are equal to Java's to the last bit, except those of the Hurst exponent and
the tail ratio on the collapse, which are within 3e-16 in V8, those of FRAMA, which are within 5e-15 in V8 and equal
in JavaScriptCore, and those of the Fisher and adaptive Fisher transforms, which are within 3e-16 and 3e-15 in V8 and
equal in JavaScriptCore.

`tests/barEdges.test.ts` does the same for every indicator that reads whole bars (the eleven ported earlier, ATR, which
several of them build on, and the ten new ones, each with the variants of its constructor). The series of bars are
written into the fixture as inputs: a rising and a falling series with the high and the low around the close, flat
bars, bars with no range, gaps, a high below a low, no volume at all and no volume for a stretch, a price that collapses
to 1e-8 and comes back, five bars (fewer than any window), the smallest positive price, a bar of zeros, a negative
price, a range and prices near the largest double, and each field in turn of one bar set to NaN, Infinity and -Infinity,
in the middle of a series and as its first bar. The values are equal to Java's to the last bit, except those of the
Choppiness index, which are within 5e-16 in V8 and 2e-16 in JavaScriptCore, and of Parkinson and Garman-Klass
volatility, which are within 5e-16 in V8 (the four OHLC estimators are equal in JavaScriptCore).

## Develop

```bash
pnpm install
pnpm check && pnpm build && pnpm test
```

Changes to the package come with a changeset (`pnpm changeset`); [CONTRIBUTING.md](CONTRIBUTING.md) has the rest.

## License

Copyright (C) 2026 Wualabs LTD. Dual-licensed: the [GNU AGPL v3](LICENSE) (only) with the
[QTSurfer Strategy Exception](STRATEGY-EXCEPTION.md), so the strategies you write with the indicators stay under
terms of your choice, or a commercial licence from Wualabs. [LICENSING.md](LICENSING.md) says what each one
allows. Contributions need the [Wualabs CLA](CLA.md) ([CONTRIBUTING.md](CONTRIBUTING.md)).

## Security

To report a vulnerability privately, see [SECURITY.md](SECURITY.md).
