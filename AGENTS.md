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
`tests/fixtures/reference/`, which is committed. It is a set of gzip files (`base`, `scenarios`, `edges`, `barEdges`
and `facade`, each `.json.gz`) that the Java engine's oracle wrote (see "Maintainers" below), and nobody edits them
by hand. To look at one: `gunzip -c tests/fixtures/reference/facade.json.gz | head`. `tests/fixtures.ts` reads them
all and gives the tests one `reference` object.

## What you can change

- A bug in the TypeScript code, with a test that fails before the fix and passes after it.
- Tests, documentation, and speed, as long as no value in `tests/fixtures/reference/` changes.
- A new indicator, a different algorithm, or any change to a value in the fixture starts in the Java engine, which is
  not public. Open an issue that says what you need; a maintainer ports it. A pull request that edits the fixture or
  changes a number will not pass `tests/parity.test.ts`.

## Layout and conventions

- `src/<group>/` mirrors the Java packages (`trend`, `volume`, `volatility`, `statistics`, `statistics/volatility`,
  `averages`, `momentum`…). PascalCase files named as the Java class. `src/pro/Pro.ts` is the facade: `Pro.on(group).adx()`
  registers an indicator with the id, the overloads and the output suffixes of the Java engine's `Pro`.
- Import aliases `$averages`, `$core`, `$momentum`, `$pro`, `$statistics`, `$trend`, `$volatility`, `$volume`, defined in
  `tsconfig.json`, `tsup.config.ts` and `vitest.config.ts`.
- Zero runtime dependencies beyond `@qtsurfer/core` and `@qtsurfer/indicators`.
- The guard against a value that is not finite is the Java class's, ported as it is: every class ported so far leaves
  the value out and keeps the last one, as the Java classes do.
- A constructor throws a `RangeError` with the Java class's message. A message that prints a double writes it with
  `javaDouble` (`src/core/JavaNumber.ts`), as Java's `Double.toString` does: `1.0E200`, not `1e+200`.
- A class that reads whole bars implements `RTIndicatorSource<Kline | Ticker>` and `requiresBarData()`. A bar with a
  field that is not finite is left out whole, with nothing updated, when the class reads that field; a field the class
  does not read is never looked at.
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
   equal to the last bit, or a stated tolerance when the class takes logarithms. A class that reads the price goes in
   `tests/subjects.ts` (compared on the scenarios and on the `edges` series); a class that reads whole bars goes in
   `tests/barSubjects.ts` (compared on the scenarios and on the `barEdges` series of bars).

   ```bash
   QTS_JAVA_ENGINE=/path/to/java-engine pnpm oracle   # rewrites tests/fixtures/reference/
   ```

   The oracle runs as `Oracle.java <output.json> <facade-calls.txt>` and writes one JSON document to a temporary
   file; `tools/java-oracle/reference-files.mjs` splits it into the gzip files and leaves a file as it is when its
   text did not change. Check that the values that were in the fixture before did not change.
4. Add its factory to `src/pro/Pro.ts` once the Java engine's `Pro` has it, with the same id, overloads and output
   suffixes. A class without a factory is added with `group.add(name, new Class(…))`. Add one line per overload to
   `tests/fixtures/facade-calls.txt` and rewrite the fixture: `tests/facade.test.ts` runs each call here and compares
   the names, display hints and metadata with what the Java engine's `Pro` registered for it. A call the Java build
   does not have yet is skipped, not passed.
5. Add its row to `indicators.md` (class, call, id, outputs, bars; `—` in Call while it has no factory) and update the
   count in `README.md`.
