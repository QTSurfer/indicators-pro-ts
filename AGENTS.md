# AGENTS.md

`@qtsurfer/indicators-pro`: the pro real-time streaming indicators of QTSurfer for TypeScript. They give the same
numbers as the Java engine's pro indicators, which is why an indicator is decided in the Java engine and ported here,
never the reverse. They build on `@qtsurfer/core` and `@qtsurfer/indicators`
([engine-ts](https://github.com/QTSurfer/engine-ts)).

## Commands

```bash
pnpm install
pnpm check      # tsc --noEmit
pnpm build      # tsup
pnpm test       # vitest: parity with the Java values, the doc test, the licence files
```

`pnpm test` needs no Java. The values the indicators must give, and what each call of `Pro` must register, are in
`tests/fixtures/reference.json`, which is committed. The Java engine wrote it (see "Maintainers" below) and nobody
edits it by hand.

## What you can change

- A bug in the TypeScript code, with a test that fails before the fix and passes after it.
- Tests, documentation, and speed, as long as no value in `tests/fixtures/reference.json` changes.
- A new indicator, a different algorithm, or any change to a value in the fixture starts in the Java engine, which is
  not public. Open an issue that says what you need; a maintainer ports it. A pull request that edits the fixture or
  changes a number will not pass `tests/parity.test.ts`.

## Layout and conventions

- `src/<group>/` mirrors the Java packages (`trend`, `volume`, `statistics`, `statistics/volatility`, `averages`,
  `momentum`…). PascalCase files named as the Java class. `src/pro/Pro.ts` is the facade: `Pro.on(group).adx()`
  registers an indicator with the id, the overloads and the output suffixes of the Java engine's `Pro`.
- Import aliases `$averages`, `$core`, `$momentum`, `$pro`, `$statistics`, `$trend`, `$volume`, defined in
  `tsconfig.json`, `tsup.config.ts` and `vitest.config.ts`.
- Zero runtime dependencies beyond `@qtsurfer/core` and `@qtsurfer/indicators`.
- The guard against a value that is not finite is the Java class's, ported as it is: most indicators leave the value out and
  keep the last one, and a few do not guard it because the Java class does not (their doc comment says so).
- A class that reads whole bars implements `RTIndicatorSource<Kline | Ticker>` and `requiresBarData()`.
- `indicators.md` has one row per indicator class; `tests/IndicatorsDoc.test.ts` runs every call in it and fails when a
  row differs from what the facade registers.
- A change to the published package comes with a changeset (`pnpm changeset`), written in English. A change that
  removes or renames a public name says so (`major` while the package is `1.x`, `minor` while it is `0.x`).
- The licence files (`LICENSE`, `LICENSING.md`, `STRATEGY-EXCEPTION.md`, `CLA.md`) are legal text: do not edit them
  without the owner. `pnpm test` runs `scripts/check-license-files.mjs`.

## Maintainers: porting an indicator

This needs a checkout of the Java engine (`QTS_JAVA_ENGINE=/path/to/java-engine`).

1. Read the Java class completely (and its test).
2. Port it with the same algorithm, names and guards. Mirror the Java package under `src/`.
3. Add it to `tools/java-oracle/Oracle.java`, rewrite the fixture, and compare the series in `tests/parity.test.ts`:
   equal to the last bit, or a stated tolerance when the class takes logarithms.

   ```bash
   QTS_JAVA_ENGINE=/path/to/java-engine pnpm oracle   # rewrites tests/fixtures/reference.json
   ```

   Check that the values that were in the fixture before did not change.
4. Add its factory to `src/pro/Pro.ts` once the Java engine's `Pro` has it, with the same id, overloads and output
   suffixes. A class without a factory is added with `group.add(name, new Class(…))`. Add one line per overload to
   `tests/fixtures/facade-calls.txt` and rewrite the fixture: `tests/facade.test.ts` runs each call here and compares
   the names, display hints and metadata with what the Java engine's `Pro` registered for it. A call the Java build
   does not have yet is skipped, not passed.
5. Add its row to `indicators.md` (class, call, id, outputs, bars; `—` in Call while it has no factory) and update the
   count in `README.md`.
