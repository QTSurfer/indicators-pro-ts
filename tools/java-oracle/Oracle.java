import com.wualabs.qtsurfer.engine.core.KlineInterval;
import com.wualabs.qtsurfer.engine.core.KlineSnapshot;
import com.wualabs.qtsurfer.engine.core.instrument.Instrument;
import com.wualabs.qtsurfer.engine.indicators.helpers.group.InstrumentGroupRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.pro.Pro;
import com.wualabs.qtsurfer.engine.indicators.statistics.pro.AutocorrelationRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.statistics.pro.HurstExponentRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.statistics.pro.KurtosisRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.statistics.pro.LinearRegressionSlopeRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.statistics.pro.RollingPercentileRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.statistics.pro.SimpleLinearRegressionRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.statistics.pro.SkewnessRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.statistics.pro.ValueAtRiskRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.statistics.pro.VarianceRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.statistics.pro.ZScoreRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.core.RTIndicator;
import com.wualabs.qtsurfer.engine.indicators.statistics.pro.ratios.CalmarRatioRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.statistics.pro.ratios.MaxDrawdownRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.statistics.pro.ratios.OmegaRatioRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.statistics.pro.ratios.SharpeRatioRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.statistics.pro.ratios.SortinoRatioRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.statistics.pro.ratios.TailRatioRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.statistics.pro.ratios.UlcerIndexRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.statistics.pro.volatility.EwmaVolatilityRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.statistics.pro.volatility.GarmanKlassVolatilityRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.statistics.pro.volatility.ParkinsonVolatilityRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.statistics.pro.volatility.RealizedVolatilityRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.statistics.pro.volatility.RogersSatchellVolatilityRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.statistics.pro.volatility.YangZhangVolatilityRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.trend.pro.AdxRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.trend.pro.IchimokuRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.trend.pro.SuperTrendRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.volatility.AtrRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.volume.pro.CmfRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.volume.pro.MfiRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.volume.pro.ObvRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.volume.pro.VwapRTIndicator;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.StringJoiner;
import java.util.TreeMap;
import java.util.function.DoubleSupplier;
import java.util.function.DoubleUnaryOperator;
import java.util.function.IntToDoubleFunction;
import java.util.function.Supplier;

/**
 * Writes the expected values of the pro indicators ported to TypeScript, from the Java engine, on a
 * seeded dataset and on the same dataset with a few values that are not finite.
 *
 * <p>The dataset is the one of the engine's JMH benchmarks (the same seeds): prices from a Gaussian
 * walk, bars from another seed, volumes from a third. Run with the Java engine's test classpath:
 * {@code java -cp <classpath> Oracle.java <out.json>}.
 *
 * <p>Besides the two scenarios it writes {@code edges}: short synthetic price series (a flat one, ramps,
 * a zig-zag, one shorter than the window, a collapse of the price, zero and negative prices) with the
 * series every price-fed indicator gives on each. The scenarios never reach those branches.
 */
public class Oracle {
  static final int N = 600;
  static final double START = 100.0;
  static final double VOLATILITY = 0.005;
  static final Instrument INSTRUMENT = Instrument.of("BTC", "USDT");

  /** A value that is not finite in a field of a bar (or of the price), at a bar. */
  record Poison(int bar, String field, double value) {}

  static final Poison[] POISONS = {
    new Poison(100, "high", Double.NaN),
    new Poison(150, "price", Double.NaN),
    new Poison(200, "close", Double.POSITIVE_INFINITY),
    new Poison(250, "price", Double.POSITIVE_INFINITY),
    new Poison(300, "volume", Double.NaN),
    new Poison(400, "open", Double.NaN),
    new Poison(450, "low", Double.NEGATIVE_INFINITY)
  };

  static double[] prices, open, high, low, close, volume;

  public static void main(String[] args) throws Exception {
    dataset();
    StringBuilder out = new StringBuilder();
    out.append("{\n  \"bars\": ").append(N).append(",\n");
    out.append("  \"inputs\": {\n");
    out.append("    \"price\": ").append(array(prices)).append(",\n");
    out.append("    \"open\": ").append(array(open)).append(",\n");
    out.append("    \"high\": ").append(array(high)).append(",\n");
    out.append("    \"low\": ").append(array(low)).append(",\n");
    out.append("    \"close\": ").append(array(close)).append(",\n");
    out.append("    \"volume\": ").append(array(volume)).append("\n  },\n");
    StringJoiner poisons = new StringJoiner(", ", "[", "]");
    for (Poison p : POISONS) {
      poisons.add(
          "{\"bar\": " + p.bar + ", \"field\": \"" + p.field + "\", \"value\": \""
              + (Double.isNaN(p.value) ? "NaN" : p.value > 0 ? "Infinity" : "-Infinity") + "\"}");
    }
    out.append("  \"poisons\": ").append(poisons).append(",\n");
    out.append("  \"scenarios\": {\n");
    out.append("    \"clean\": ").append(scenario(false)).append(",\n");
    out.append("    \"corrupt\": ").append(scenario(true)).append("\n  },\n");
    out.append("  \"edges\": ").append(edges()).append(",\n");
    out.append("  \"facade\": ").append(facade(Path.of(args[0]).resolveSibling("facade-calls.txt"))).append("\n}\n");
    Files.writeString(Path.of(args[0]), out.toString());
  }

  static void dataset() {
    Random priceRng = new Random(42L);
    prices = new double[N];
    prices[0] = START;
    for (int i = 1; i < N; i++) {
      prices[i] = prices[i - 1] * (1.0 + priceRng.nextGaussian() * VOLATILITY);
    }
    open = new double[N];
    high = new double[N];
    low = new double[N];
    close = new double[N];
    Random barRng = new Random(43L);
    double last = START;
    for (int i = 0; i < N; i++) {
      double range = last * VOLATILITY * (1 + barRng.nextDouble());
      open[i] = last + (barRng.nextDouble() - 0.5) * range * 0.3;
      high[i] = last + range;
      low[i] = last - range;
      close[i] = low[i] + (high[i] - low[i]) * barRng.nextDouble();
      last = close[i];
    }
    volume = new double[N];
    Random volumeRng = new Random(44L);
    for (int i = 0; i < N; i++) {
      volume[i] = 1_000_000 * (0.5 + volumeRng.nextDouble());
    }
  }

  static String scenario(boolean corrupt) {
    double[] p = prices.clone(), o = open.clone(), h = high.clone(), l = low.clone(),
        c = close.clone(), v = volume.clone();
    if (corrupt) {
      for (Poison poison : POISONS) {
        switch (poison.field) {
          case "price" -> p[poison.bar] = poison.value;
          case "open" -> o[poison.bar] = poison.value;
          case "high" -> h[poison.bar] = poison.value;
          case "low" -> l[poison.bar] = poison.value;
          case "close" -> c[poison.bar] = poison.value;
          case "volume" -> v[poison.bar] = poison.value;
          default -> throw new IllegalStateException(poison.field);
        }
      }
    }
    KurtosisRTIndicator kurtosis = new KurtosisRTIndicator(20);
    VwapRTIndicator vwap = new VwapRTIndicator();
    AdxRTIndicator adx = new AdxRTIndicator(14);
    IchimokuRTIndicator ichimoku = new IchimokuRTIndicator(9, 26, 52);
    YangZhangVolatilityRTIndicator yangZhang = new YangZhangVolatilityRTIndicator(20);
    AtrRTIndicator atr = new AtrRTIndicator(14);
    ObvRTIndicator obv = new ObvRTIndicator();
    MfiRTIndicator mfi = new MfiRTIndicator(14);
    CmfRTIndicator cmf = new CmfRTIndicator(20);
    SuperTrendRTIndicator superTrend = new SuperTrendRTIndicator(10, 3.0);
    ParkinsonVolatilityRTIndicator parkinson = new ParkinsonVolatilityRTIndicator(20);
    GarmanKlassVolatilityRTIndicator garmanKlass = new GarmanKlassVolatilityRTIndicator(20);
    RogersSatchellVolatilityRTIndicator rogersSatchell = new RogersSatchellVolatilityRTIndicator(20);
    AutocorrelationRTIndicator autocorrelation = new AutocorrelationRTIndicator(20);
    HurstExponentRTIndicator hurst = new HurstExponentRTIndicator(20);
    LinearRegressionSlopeRTIndicator slope = new LinearRegressionSlopeRTIndicator(20);
    RollingPercentileRTIndicator percentile = new RollingPercentileRTIndicator(20, 0.95);
    SimpleLinearRegressionRTIndicator regression = new SimpleLinearRegressionRTIndicator(20);
    SkewnessRTIndicator skewness = new SkewnessRTIndicator(20);
    ValueAtRiskRTIndicator var95 = new ValueAtRiskRTIndicator(20);
    ValueAtRiskRTIndicator var99 =
        new ValueAtRiskRTIndicator(20).withConfidenceLevel(0.99).withAnnualizationFactor(252.0);
    ZScoreRTIndicator zScore = new ZScoreRTIndicator(20);
    VarianceRTIndicator variance = new VarianceRTIndicator(20);
    VarianceRTIndicator sampleVariance = new VarianceRTIndicator(20).withSampleVariance(true);

    double[] kurt = new double[N], vw = new double[N], adxMain = new double[N],
        plusDI = new double[N], minusDI = new double[N], tenkan = new double[N],
        kijun = new double[N], senkouA = new double[N], senkouB = new double[N],
        chikou = new double[N], yz = new double[N], atrV = new double[N], obvV = new double[N],
        mfiV = new double[N], cmfV = new double[N], stMain = new double[N], stUpper = new double[N],
        stLower = new double[N], park = new double[N], gk = new double[N], rs = new double[N];
    double[] acf = new double[N], acfPairs = new double[N], hu = new double[N];
    double[] slopeV = new double[N], slopeIntercept = new double[N], slopeMean = new double[N],
        slopeForecast = new double[N];
    double[] pct = new double[N], pctMedian = new double[N], pctMin = new double[N],
        pctMax = new double[N];
    double[] regV = new double[N], regIntercept = new double[N], regR2 = new double[N],
        regSe = new double[N], regMean = new double[N], regForecast = new double[N];
    double[] skewV = new double[N], skewMean = new double[N];
    double[] v95 = new double[N], v95Mean = new double[N], v95Std = new double[N],
        v99 = new double[N], v99Mean = new double[N], v99Std = new double[N];
    double[] zs = new double[N], zsMean = new double[N], zsStd = new double[N];
    double[] varV = new double[N], varMean = new double[N], sampleVarV = new double[N],
        sampleVarMean = new double[N];
    for (int i = 0; i < N; i++) {
      kurt[i] = kurtosis.update(p[i]);
      acf[i] = autocorrelation.update(p[i]);
      acfPairs[i] = autocorrelation.getPairCount();
      hu[i] = hurst.update(p[i]);
      slopeV[i] = slope.update(p[i]);
      slopeIntercept[i] = slope.getIntercept();
      slopeMean[i] = slope.getMean();
      slopeForecast[i] = slope.forecast(5);
      pct[i] = percentile.update(p[i]);
      pctMedian[i] = percentile.getMedian();
      pctMin[i] = percentile.getMin();
      pctMax[i] = percentile.getMax();
      regV[i] = regression.update(p[i]);
      regIntercept[i] = regression.getIntercept();
      regR2[i] = regression.getRSquared();
      regSe[i] = regression.getStandardError();
      regMean[i] = regression.getMean();
      regForecast[i] = regression.forecast(5);
      skewV[i] = skewness.update(p[i]);
      skewMean[i] = skewness.getMean();
      v95[i] = var95.update(p[i]);
      v95Mean[i] = var95.getMeanReturn();
      v95Std[i] = var95.getStdDev();
      v99[i] = var99.update(p[i]);
      v99Mean[i] = var99.getMeanReturn();
      v99Std[i] = var99.getStdDev();
      zs[i] = zScore.update(p[i]);
      zsMean[i] = zScore.getMean();
      zsStd[i] = zScore.getStdDev();
      varV[i] = variance.update(p[i]);
      varMean[i] = variance.getMean();
      sampleVarV[i] = sampleVariance.update(p[i]);
      sampleVarMean[i] = sampleVariance.getMean();
      KlineSnapshot bar =
          new KlineSnapshot(
              INSTRUMENT, KlineInterval.m1, i * 60_000L, o[i], h[i], l[i], c[i], v[i],
              v[i] * c[i], i * 60_000L + 59_999L, 5L, true);
      vw[i] = vwap.updateFrom(bar);
      adxMain[i] = adx.updateFrom(bar);
      plusDI[i] = adx.getPlusDI();
      minusDI[i] = adx.getMinusDI();
      tenkan[i] = ichimoku.updateFrom(bar);
      kijun[i] = ichimoku.getKijunSen();
      senkouA[i] = ichimoku.getSenkouSpanA();
      senkouB[i] = ichimoku.getSenkouSpanB();
      chikou[i] = ichimoku.getChikouSpan();
      yz[i] = yangZhang.updateFrom(bar);
      atrV[i] = atr.updateFrom(bar);
      obvV[i] = obv.updateFrom(bar);
      mfiV[i] = mfi.updateFrom(bar);
      cmfV[i] = cmf.updateFrom(bar);
      stMain[i] = superTrend.updateFrom(bar);
      stUpper[i] = superTrend.getUpperBand();
      stLower[i] = superTrend.getLowerBand();
      park[i] = parkinson.updateFrom(bar);
      gk[i] = garmanKlass.updateFrom(bar);
      rs[i] = rogersSatchell.updateFrom(bar);
    }
    StringBuilder s = new StringBuilder("{\n");
    s.append("      \"kurtosis20\": ").append(array(kurt)).append(",\n");
    s.append("      \"vwap\": ").append(array(vw)).append(",\n");
    s.append("      \"adx14\": {\"main\": ").append(array(adxMain)).append(", \"plusDI\": ")
        .append(array(plusDI)).append(", \"minusDI\": ").append(array(minusDI)).append("},\n");
    s.append("      \"ichimoku\": {\"tenkan\": ").append(array(tenkan)).append(", \"kijun\": ")
        .append(array(kijun)).append(", \"senkouA\": ").append(array(senkouA))
        .append(", \"senkouB\": ").append(array(senkouB)).append(", \"chikou\": ")
        .append(array(chikou)).append("},\n");
    s.append("      \"yangZhang20\": ").append(array(yz)).append(",\n");
    s.append("      \"atr14\": ").append(array(atrV)).append(",\n");
    s.append("      \"obv\": ").append(array(obvV)).append(",\n");
    s.append("      \"mfi14\": ").append(array(mfiV)).append(",\n");
    s.append("      \"cmf20\": ").append(array(cmfV)).append(",\n");
    s.append("      \"superTrend\": {\"main\": ").append(array(stMain)).append(", \"upper\": ")
        .append(array(stUpper)).append(", \"lower\": ").append(array(stLower)).append("},\n");
    s.append("      \"parkinson20\": ").append(array(park)).append(",\n");
    s.append("      \"garmanKlass20\": ").append(array(gk)).append(",\n");
    s.append("      \"rogersSatchell20\": ").append(array(rs)).append(",\n");
    s.append("      \"autocorrelation20\": {\"value\": ").append(array(acf))
        .append(", \"pairCount\": ").append(array(acfPairs)).append("},\n");
    s.append("      \"hurst20\": ").append(array(hu)).append(",\n");
    s.append("      \"linearRegressionSlope20\": {\"slope\": ").append(array(slopeV))
        .append(", \"intercept\": ").append(array(slopeIntercept)).append(", \"mean\": ")
        .append(array(slopeMean)).append(", \"forecast5\": ").append(array(slopeForecast))
        .append("},\n");
    s.append("      \"rollingPercentile20\": {\"value\": ").append(array(pct))
        .append(", \"median\": ").append(array(pctMedian)).append(", \"min\": ")
        .append(array(pctMin)).append(", \"max\": ").append(array(pctMax)).append("},\n");
    s.append("      \"simpleLinearRegression20\": {\"slope\": ").append(array(regV))
        .append(", \"intercept\": ").append(array(regIntercept)).append(", \"rSquared\": ")
        .append(array(regR2)).append(", \"standardError\": ").append(array(regSe))
        .append(", \"mean\": ").append(array(regMean)).append(", \"forecast5\": ")
        .append(array(regForecast)).append("},\n");
    s.append("      \"skewness20\": {\"value\": ").append(array(skewV)).append(", \"mean\": ")
        .append(array(skewMean)).append("},\n");
    s.append("      \"valueAtRisk20\": {\"value\": ").append(array(v95))
        .append(", \"meanReturn\": ").append(array(v95Mean)).append(", \"stdDev\": ")
        .append(array(v95Std)).append(", \"zScore\": ").append(var95.getZScore()).append("},\n");
    s.append("      \"valueAtRisk20Confidence99Annualized252\": {\"value\": ").append(array(v99))
        .append(", \"meanReturn\": ").append(array(v99Mean)).append(", \"stdDev\": ")
        .append(array(v99Std)).append(", \"zScore\": ").append(var99.getZScore()).append("},\n");
    s.append("      \"valueAtRiskZScores\": ").append(zScores()).append(",\n");
    s.append("      \"zScore20\": {\"value\": ").append(array(zs)).append(", \"mean\": ")
        .append(array(zsMean)).append(", \"stdDev\": ").append(array(zsStd)).append("},\n");
    s.append("      \"variance20\": {\"value\": ").append(array(varV)).append(", \"mean\": ")
        .append(array(varMean)).append("},\n");
    s.append("      \"sampleVariance20\": {\"value\": ").append(array(sampleVarV))
        .append(", \"mean\": ").append(array(sampleVarMean)).append("},\n");
    s.append(subjectLines(p, false, "      ")).append("\n    }");
    return s.toString();
  }

  /** The z-score each confidence level of Value at Risk turns into: the inverse normal CDF. */
  static String zScores() {
    double[] levels = {0.1, 0.4, 0.9, 0.95, 0.975, 0.99, 0.999};
    StringJoiner j = new StringJoiner(", ", "{", "}");
    for (double level : levels) {
      double z = new ValueAtRiskRTIndicator(2).withConfidenceLevel(level).getZScore();
      j.add("\"" + level + "\": " + z);
    }
    return j.toString();
  }

  /** Double.toString round-trips; JSON has no NaN or Infinity, which travel as null. */
  static String array(double[] values) {
    StringJoiner j = new StringJoiner(",", "[", "]");
    Arrays.stream(values).forEach(v -> j.add(Double.isFinite(v) ? Double.toString(v) : "null"));
    return j.toString();
  }

  /**
   * Like {@link #array}, but a value that is not finite keeps its kind, as the string "NaN",
   * "Infinity" or "-Infinity" (as the poisons are written): the series of the edge cases can hold
   * all three, and the TypeScript side must tell them apart.
   */
  static String exactArray(double[] values) {
    StringJoiner j = new StringJoiner(",", "[", "]");
    for (double v : values) {
      j.add(
          Double.isNaN(v)
              ? "\"NaN\""
              : Double.isInfinite(v) ? (v > 0 ? "\"Infinity\"" : "\"-Infinity\"") : Double.toString(v));
    }
    return j.toString();
  }

  // ---- the price-fed indicators: the same classes and parameters on the scenarios and on the edges ----

  /** A value read after each tick, beside the one {@code update} returns. */
  record Read(String name, DoubleSupplier supplier) {}

  /**
   * A price-fed indicator with its parameters. {@code earlier} marks the ones ported before the ratios:
   * the scenarios write those in their own loop, the edge cases run all of them.
   */
  record Subject(String key, boolean earlier, Supplier<Map<String, double[]>> run) {}

  static Read read(String name, DoubleSupplier supplier) {
    return new Read(name, supplier);
  }

  /** Whether the indicator reports itself ready, as 1 or 0. */
  static Read ready(RTIndicator indicator) {
    return read("ready", () -> indicator.isReady() ? 1.0 : 0.0);
  }

  /** What an indicator gives on a price series: {@code value} (each update) and each extra reading. */
  static Map<String, double[]> run(double[] prices, DoubleUnaryOperator update, Read... reads) {
    Map<String, double[]> series = new LinkedHashMap<>();
    double[] value = new double[prices.length];
    double[][] extra = new double[reads.length][prices.length];
    for (int i = 0; i < prices.length; i++) {
      value[i] = update.applyAsDouble(prices[i]);
      for (int r = 0; r < reads.length; r++) {
        extra[r][i] = reads[r].supplier().getAsDouble();
      }
    }
    series.put("value", value);
    for (int r = 0; r < reads.length; r++) {
      series.put(reads[r].name(), extra[r]);
    }
    return series;
  }

  static List<Subject> subjects(double[] p) {
    List<Subject> list = new ArrayList<>();
    list.add(new Subject("kurtosis20", true, () -> {
      var i = new KurtosisRTIndicator(20);
      return run(p, i::update, read("mean", i::getMean));
    }));
    list.add(new Subject("autocorrelation20", true, () -> {
      var i = new AutocorrelationRTIndicator(20);
      return run(p, i::update, read("pairCount", i::getPairCount));
    }));
    list.add(new Subject("hurst20", true, () -> run(p, new HurstExponentRTIndicator(20)::update)));
    list.add(new Subject("linearRegressionSlope20", true, () -> {
      var i = new LinearRegressionSlopeRTIndicator(20);
      return run(p, i::update, read("intercept", i::getIntercept), read("mean", i::getMean),
          read("forecast5", () -> i.forecast(5)));
    }));
    list.add(new Subject("rollingPercentile20", true, () -> {
      var i = new RollingPercentileRTIndicator(20, 0.95);
      return run(p, i::update, read("median", i::getMedian), read("min", i::getMin),
          read("max", i::getMax));
    }));
    list.add(new Subject("simpleLinearRegression20", true, () -> {
      var i = new SimpleLinearRegressionRTIndicator(20);
      return run(p, i::update, read("slope", i::getSlope), read("intercept", i::getIntercept),
          read("rSquared", i::getRSquared), read("standardError", i::getStandardError),
          read("mean", i::getMean), read("forecast5", () -> i.forecast(5)));
    }));
    list.add(new Subject("skewness20", true, () -> {
      var i = new SkewnessRTIndicator(20);
      return run(p, i::update, read("mean", i::getMean));
    }));
    list.add(new Subject("valueAtRisk20", true, () -> {
      var i = new ValueAtRiskRTIndicator(20);
      return run(p, i::update, read("meanReturn", i::getMeanReturn), read("stdDev", i::getStdDev));
    }));
    list.add(new Subject("valueAtRisk20Confidence99Annualized252", true, () -> {
      var i = new ValueAtRiskRTIndicator(20).withConfidenceLevel(0.99).withAnnualizationFactor(252.0);
      return run(p, i::update, read("meanReturn", i::getMeanReturn), read("stdDev", i::getStdDev));
    }));
    list.add(new Subject("zScore20", true, () -> {
      var i = new ZScoreRTIndicator(20);
      return run(p, i::update, read("mean", i::getMean), read("stdDev", i::getStdDev));
    }));
    list.add(new Subject("variance20", true, () -> {
      var i = new VarianceRTIndicator(20);
      return run(p, i::update, read("mean", i::getMean));
    }));
    list.add(new Subject("sampleVariance20", true, () -> {
      var i = new VarianceRTIndicator(20).withSampleVariance(true);
      return run(p, i::update, read("mean", i::getMean));
    }));

    list.add(new Subject("calmarRatio20", false, () -> {
      var i = new CalmarRatioRTIndicator(20);
      return run(p, i::update, read("annualizedReturn", i::getAnnualizedReturn),
          read("maxDrawdown", i::getMaxDrawdown), ready(i));
    }));
    list.add(new Subject("calmarRatio20Annualization365", false, () -> {
      var i = new CalmarRatioRTIndicator(20).withAnnualizationFactor(365.0);
      return run(p, i::update, read("annualizedReturn", i::getAnnualizedReturn),
          read("maxDrawdown", i::getMaxDrawdown), ready(i));
    }));
    list.add(new Subject("maxDrawdown", false, () -> {
      var i = new MaxDrawdownRTIndicator();
      return run(p, i::update, read("peak", i::getPeak),
          read("currentDrawdown", i::getCurrentDrawdown), ready(i));
    }));
    list.add(new Subject("omegaRatio20", false, () -> {
      var i = new OmegaRatioRTIndicator(20);
      return run(p, i::update, read("sumGains", i::getSumGains), read("sumLosses", i::getSumLosses),
          ready(i));
    }));
    list.add(new Subject("omegaRatio20Threshold", false, () -> {
      var i = new OmegaRatioRTIndicator(20).withThreshold(0.001);
      return run(p, i::update, read("sumGains", i::getSumGains), read("sumLosses", i::getSumLosses),
          ready(i));
    }));
    list.add(new Subject("sharpeRatio20", false, () -> {
      var i = new SharpeRatioRTIndicator(20);
      return run(p, i::update, read("meanReturn", i::getMeanReturn), read("stdDev", i::getStdDev),
          ready(i));
    }));
    list.add(new Subject("sharpeRatio20RiskFreeAnnualized", false, () -> {
      var i = new SharpeRatioRTIndicator(20).withRiskFreeRate(0.0002)
          .withAnnualizationFactor(Math.sqrt(252.0));
      return run(p, i::update, read("meanReturn", i::getMeanReturn), read("stdDev", i::getStdDev),
          ready(i));
    }));
    list.add(new Subject("sortinoRatio20", false, () -> {
      var i = new SortinoRatioRTIndicator(20);
      return run(p, i::update, read("meanReturn", i::getMeanReturn),
          read("downsideDeviation", i::getDownsideDeviation), ready(i));
    }));
    list.add(new Subject("sortinoRatio20MarAnnualized", false, () -> {
      var i = new SortinoRatioRTIndicator(20).withMAR(0.001).withAnnualizationFactor(Math.sqrt(252.0));
      return run(p, i::update, read("meanReturn", i::getMeanReturn),
          read("downsideDeviation", i::getDownsideDeviation), ready(i));
    }));
    list.add(new Subject("tailRatio20", false, () -> {
      var i = new TailRatioRTIndicator(20);
      return run(p, i::update, read("upperPercentile", i::getUpperPercentile),
          read("lowerPercentile", i::getLowerPercentile), ready(i));
    }));
    list.add(new Subject("tailRatio20Percentiles", false, () -> {
      var i = new TailRatioRTIndicator(20).withPercentiles(0.9, 0.1);
      return run(p, i::update, read("upperPercentile", i::getUpperPercentile),
          read("lowerPercentile", i::getLowerPercentile), ready(i));
    }));
    list.add(new Subject("ulcerIndex20", false, () -> {
      var i = new UlcerIndexRTIndicator(20);
      return run(p, i::update, read("maxDrawdownPercent", i::getMaxDrawdownPercent), ready(i));
    }));
    list.add(new Subject("ewmaVolatilityDefault", false, () -> {
      var i = new EwmaVolatilityRTIndicator();
      return run(p, i::update, read("ewmaVariance", i::getEwmaVariance), ready(i));
    }));
    list.add(new Subject("ewmaVolatilityLambda097Annualized", false, () -> {
      var i = new EwmaVolatilityRTIndicator(0.97).withAnnualizationFactor(Math.sqrt(252.0));
      return run(p, i::update, read("ewmaVariance", i::getEwmaVariance), ready(i));
    }));
    list.add(new Subject("realizedVolatility20", false, () -> {
      var i = new RealizedVolatilityRTIndicator(20);
      return run(p, i::update, read("meanReturn", i::getMeanReturn),
          read("realizedVariance", i::getRealizedVariance), ready(i));
    }));
    list.add(new Subject("realizedVolatility20Annualized", false, () -> {
      var i = new RealizedVolatilityRTIndicator(20).withAnnualizationFactor(Math.sqrt(365.0));
      return run(p, i::update, read("meanReturn", i::getMeanReturn),
          read("realizedVariance", i::getRealizedVariance), ready(i));
    }));
    return list;
  }

  /**
   * The series of the price-fed indicators on {@code p}, one JSON line each, joined by commas. The
   * scenarios write only the indicators that are not {@code earlier}, with {@link #array} (they must
   * not throw); the edge cases write all of them, with the non-finite values told apart, and an
   * indicator that throws is written as {@code {"throws": "<message>"}}.
   */
  static String subjectLines(double[] p, boolean edge, String indent) {
    StringJoiner lines = new StringJoiner(",\n");
    for (Subject subject : subjects(p)) {
      if (subject.earlier() && !edge) {
        continue;
      }
      String body;
      try {
        StringJoiner outputs = new StringJoiner(", ", "{", "}");
        subject.run().get().forEach(
            (name, series) ->
                outputs.add("\"" + name + "\": " + (edge ? exactArray(series) : array(series))));
        body = outputs.toString();
      } catch (RuntimeException e) {
        if (!edge) {
          throw e;
        }
        String message = (e.getClass().getSimpleName() + ": " + e.getMessage()).replace("\\", "\\\\").replace("\"", "\\\"");
        body = "{\"throws\": \"" + message + "\"}";
      }
      lines.add(indent + "\"" + subject.key() + "\": " + body);
    }
    return lines.toString();
  }

  // ---- the edge cases ----

  /** Short synthetic price series that reach the branches the seeded dataset never does. */
  static Map<String, double[]> edgeInputs() {
    Map<String, double[]> edges = new LinkedHashMap<>();
    // forty identical prices: every window is flat
    edges.put("flat", filled(40, i -> 100.0));
    // strictly increasing and strictly decreasing
    edges.put("rampUp", filled(60, i -> 100.0 + 0.5 * i));
    edges.put("rampDown", filled(60, i -> 130.0 - 0.5 * i));
    // alternating up and down by the same step: the mean of the returns is a cancellation
    edges.put("zigzag", filled(60, i -> i % 2 == 0 ? 100.0 : 101.0));
    // shorter than the window
    edges.put("short", new double[] {100.0, 101.0, 99.5, 100.5, 102.0});
    // the price collapses to a very small positive value, stays there, then recovers
    edges.put(
        "collapse",
        filled(
            60,
            i ->
                i < 30 || i >= 45
                    ? 100.0 + 2.0 * Math.sin(0.7 * i)
                    : 1e-8 * (1.0 + 0.1 * (i - 30))));
    // the smallest positive price: the ratio to the previous price underflows to 0, whose log is -Infinity
    edges.put("smallestPrice", filled(40, i -> i == 20 ? Double.MIN_VALUE : 100.0 + 0.1 * i));
    // a zero price in the middle, at the start, and a negative price in the middle
    edges.put("zeroPrice", filled(30, i -> i == 10 ? 0.0 : 100.0 + 3.0 * Math.sin(0.5 * i)));
    edges.put("zeroFirstPrice", filled(30, i -> i == 0 ? 0.0 : 100.0 + 3.0 * Math.sin(0.5 * i)));
    edges.put("negativePrice", filled(30, i -> i == 10 ? -5.0 : 100.0 + 3.0 * Math.sin(0.5 * i)));
    return edges;
  }

  static double[] filled(int n, IntToDoubleFunction f) {
    double[] values = new double[n];
    for (int i = 0; i < n; i++) {
      values[i] = f.applyAsDouble(i);
    }
    return values;
  }

  static String edges() {
    StringJoiner edges = new StringJoiner(",\n", "{\n", "\n  }");
    edgeInputs().forEach(
        (name, p) ->
            edges.add(
                "    \"" + name + "\": {\n      \"price\": " + array(p) + ",\n      \"series\": {\n"
                    + subjectLines(p, true, "        ") + "\n      }\n    }"));
    return edges.toString();
  }
  /**
   * What each call of {@code facade-calls.txt} registers on an empty group through the engine's {@link Pro}: the
   * name, display hint and metadata of every indicator, or that the call throws, or that this build of the
   * engine has no such factory.
   */
  static String facade(Path calls) throws IOException {
    StringJoiner entries = new StringJoiner(",\n", "{\n", "\n  }");
    for (String raw : Files.readAllLines(calls)) {
      String line = raw.strip();
      if (line.isEmpty() || line.startsWith("#")) {
        continue;
      }
      entries.add("    " + jsonString(line) + ": " + facadeCall(line));
    }
    return entries.toString();
  }

  static String facadeCall(String line) {
    String[] tokens = line.split("\\s+");
    List<Object> args = new ArrayList<>();
    for (int i = 1; i < tokens.length; i++) {
      String token = tokens[i];
      if (token.startsWith("\"")) {
        args.add(token.substring(1, token.length() - 1));
      } else if (token.contains(".")) {
        args.add(Double.valueOf(token));
      } else {
        args.add(Integer.valueOf(token));
      }
    }
    Method method = null;
    for (Method candidate : Pro.class.getMethods()) {
      if (candidate.getName().equals(tokens[0])
          && candidate.getParameterCount() == args.size()
          && accepts(candidate.getParameterTypes(), args)) {
        method = candidate;
        break;
      }
    }
    if (method == null) {
      return "{\"missing\": true}";
    }
    InstrumentGroupRTIndicator group = new InstrumentGroupRTIndicator(INSTRUMENT);
    try {
      method.invoke(Pro.on(group), args.toArray());
    } catch (InvocationTargetException e) {
      return "{\"throws\": true}";
    } catch (ReflectiveOperationException e) {
      throw new IllegalStateException(e);
    }
    TreeMap<String, String> registered = new TreeMap<>();
    group
        .getIndicators()
        .forEachPublicable(
            (name, indicator) -> {
              StringJoiner meta = new StringJoiner(", ", "{", "}");
              new TreeMap<>(indicator.getMeta().asMap())
                  .forEach((k, v) -> meta.add(jsonString(k) + ": " + jsonString(v)));
              registered.put(
                  name,
                  "{\"hint\": " + jsonString(String.valueOf(indicator.getDisplayHint())) + ", \"meta\": " + meta + "}");
            });
    StringJoiner out = new StringJoiner(", ", "{\"registered\": {", "}}");
    registered.forEach((name, value) -> out.add(jsonString(name) + ": " + value));
    return out.toString();
  }

  /** An integer argument also fits a double parameter, as it does in a Java call. */
  static boolean accepts(Class<?>[] types, List<Object> args) {
    for (int i = 0; i < types.length; i++) {
      Object arg = args.get(i);
      Class<?> type = types[i];
      boolean fits =
          type == String.class
              ? arg instanceof String
              : type == int.class
                  ? arg instanceof Integer
                  : type == double.class && (arg instanceof Double || arg instanceof Integer);
      if (!fits) {
        return false;
      }
    }
    return true;
  }

  static String jsonString(String value) {
    return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
  }
}
