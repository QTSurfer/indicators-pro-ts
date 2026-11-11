import com.wualabs.qtsurfer.engine.core.KlineInterval;
import com.wualabs.qtsurfer.engine.core.KlineSnapshot;
import com.wualabs.qtsurfer.engine.core.instrument.Instrument;
import com.wualabs.qtsurfer.engine.indicators.averages.pro.AlmaRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.averages.pro.DemaRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.averages.pro.EnvelopesRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.averages.pro.FramaRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.averages.pro.LeastSquaresMovingAverageRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.averages.pro.McGinleyDynamicRTIndicator;
import com.wualabs.qtsurfer.engine.core.MarketSnapshot;
import com.wualabs.qtsurfer.engine.indicators.core.RichRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.helpers.group.InstrumentGroupRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.momentum.pro.AdaptiveFisherTransformRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.momentum.pro.ChandeForecastOscillatorRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.momentum.pro.CmoRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.momentum.pro.ConnorsRsiRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.momentum.pro.CoppockCurveRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.momentum.pro.DetrendedPriceOscillatorRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.momentum.pro.FisherTransformRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.momentum.pro.KnowSureThingRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.momentum.pro.MomentumRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.momentum.pro.RocRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.momentum.pro.TrixRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.momentum.pro.TrueStrengthIndexRTIndicator;
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
import com.wualabs.qtsurfer.engine.indicators.trend.pro.AroonRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.trend.pro.ChandeKrollStopRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.trend.pro.ChandelierExitRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.trend.pro.DonchianChannelRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.trend.pro.EfficiencyRatioRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.trend.pro.IchimokuRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.trend.pro.ParabolicSarRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.trend.pro.SuperTrendRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.trend.pro.VortexRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.volatility.AtrRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.volatility.pro.ChoppinessIndexRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.volatility.pro.KeltnerChannelRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.volatility.pro.MassIndexRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.volatility.pro.NatrRTIndicator;
import com.wualabs.qtsurfer.engine.indicators.volatility.pro.RelativeVolatilityIndexRTIndicator;
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
import java.util.function.BooleanSupplier;
import java.util.function.DoubleUnaryOperator;
import java.util.function.Function;
import java.util.function.IntFunction;
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
 *
 * <p>{@code barEdges} does the same for the indicators that read whole bars: synthetic series of
 * open, high, low, close and volume (rising, falling, flat, zero-range and inverted bars, gaps, zero
 * volume, a collapse, a series shorter than any window, a bar of zeros, a negative price, prices near
 * the largest double, and a bar with one field at a time set to NaN, +Infinity and -Infinity, in the
 * middle of a series and as the first bar), written as inputs, with the series every bar-fed
 * indicator gives on each.
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

  /** Usage: {@code Oracle.java <output.json> <facade-calls.txt>}: writes one JSON document to the first path. */
  public static void main(String[] args) throws Exception {
    if (args.length != 2) {
      System.err.println("usage: Oracle.java <output.json> <facade-calls.txt>");
      System.exit(2);
    }
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
    out.append("  \"barEdges\": ").append(barEdges()).append(",\n");
    out.append("  \"facade\": ").append(facade(Path.of(args[1]))).append("\n}\n");
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
    s.append(subjectLines(p, false, "      ")).append(",\n");
    s.append(barSubjectLines(new Bars(o, h, l, c, v), false, "      ")).append("\n    }");
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
   * "Infinity" or "-Infinity" (as the poisons are written): the series of the price-fed indicators
   * (the edge cases, and the corrupt scenario) can hold all three, and the TypeScript side must tell
   * them apart.
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

  /** A boolean read after each tick, as 1 or 0. */
  static Read flag(String name, BooleanSupplier supplier) {
    return read(name, () -> supplier.getAsBoolean() ? 1.0 : 0.0);
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

    list.add(new Subject("alma20", false, () -> {
      var i = new AlmaRTIndicator(20);
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("alma20Offset05", false, () -> {
      var i = new AlmaRTIndicator(20, 0.5, 6.0);
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("alma20Sigma3", false, () -> {
      var i = new AlmaRTIndicator(20, 0.85, 3.0);
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("dema20", false, () -> {
      var i = new DemaRTIndicator(20);
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("envelopesDefault", false, () -> {
      var i = new EnvelopesRTIndicator();
      return run(p, i::update, read("upper", i::getUpper), read("lower", i::getLower), ready(i));
    }));
    list.add(new Subject("envelopes20Percentage5", false, () -> {
      var i = new EnvelopesRTIndicator(20, 5.0);
      return run(p, i::update, read("upper", i::getUpper), read("lower", i::getLower), ready(i));
    }));
    list.add(new Subject("framaDefault", false, () -> {
      var i = new FramaRTIndicator();
      return run(p, i::update, read("fractalDimension", i::getFractalDimension),
          read("alpha", i::getAlpha), read("periods", i::getPeriods), ready(i));
    }));
    list.add(new Subject("frama7", false, () -> {
      var i = new FramaRTIndicator(7);
      return run(p, i::update, read("fractalDimension", i::getFractalDimension),
          read("alpha", i::getAlpha), read("periods", i::getPeriods), ready(i));
    }));
    list.add(new Subject("leastSquaresMovingAverageDefault", false, () -> {
      var i = new LeastSquaresMovingAverageRTIndicator();
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("leastSquaresMovingAverage10", false, () -> {
      var i = new LeastSquaresMovingAverageRTIndicator(10);
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("mcGinleyDynamicDefault", false, () -> {
      var i = new McGinleyDynamicRTIndicator();
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("mcGinleyDynamic5", false, () -> {
      var i = new McGinleyDynamicRTIndicator(5);
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("momentumDefault", false, () -> {
      var i = new MomentumRTIndicator();
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("momentum3", false, () -> {
      var i = new MomentumRTIndicator(3);
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("rocDefault", false, () -> {
      var i = new RocRTIndicator();
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("roc3", false, () -> {
      var i = new RocRTIndicator(3);
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("cmoDefault", false, () -> {
      var i = new CmoRTIndicator();
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("cmo5", false, () -> {
      var i = new CmoRTIndicator(5);
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("detrendedPriceOscillatorDefault", false, () -> {
      var i = new DetrendedPriceOscillatorRTIndicator();
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("detrendedPriceOscillator7", false, () -> {
      var i = new DetrendedPriceOscillatorRTIndicator(7);
      return run(p, i::update, ready(i));
    }));

    list.add(new Subject("chandeForecastOscillatorDefault", false, () -> {
      var i = new ChandeForecastOscillatorRTIndicator();
      return run(p, i::update, read("lsmaValue", i::getLsmaValue), ready(i));
    }));
    list.add(new Subject("chandeForecastOscillator5", false, () -> {
      var i = new ChandeForecastOscillatorRTIndicator(5);
      return run(p, i::update, read("lsmaValue", i::getLsmaValue), ready(i));
    }));
    list.add(new Subject("connorsRsiDefault", false, () -> {
      var i = new ConnorsRsiRTIndicator();
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("connorsRsi5_3_20", false, () -> {
      var i = new ConnorsRsiRTIndicator(5, 3, 20);
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("connorsRsi2_4_8", false, () -> {
      var i = new ConnorsRsiRTIndicator(2, 4, 8);
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("coppockCurveDefault", false, () -> {
      var i = new CoppockCurveRTIndicator();
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("coppockCurve8_5_4", false, () -> {
      var i = new CoppockCurveRTIndicator(8, 5, 4);
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("fisherTransformDefault", false, () -> {
      var i = new FisherTransformRTIndicator();
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("fisherTransform5", false, () -> {
      var i = new FisherTransformRTIndicator(5);
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("adaptiveFisherTransformDefault", false, () -> {
      var i = new AdaptiveFisherTransformRTIndicator();
      return run(p, i::update, read("efficiencyRatio", i::getEfficiencyRatio),
          read("adaptivePeriod", i::getAdaptivePeriod), ready(i));
    }));
    list.add(new Subject("adaptiveFisherTransform5_3_9", false, () -> {
      var i = new AdaptiveFisherTransformRTIndicator(5, 3, 9);
      return run(p, i::update, read("efficiencyRatio", i::getEfficiencyRatio),
          read("adaptivePeriod", i::getAdaptivePeriod), ready(i));
    }));
    list.add(new Subject("knowSureThingDefault", false, () -> {
      var i = new KnowSureThingRTIndicator();
      return run(p, i::update, read("signal", i::getSignal), ready(i));
    }));
    list.add(new Subject("knowSureThing3Weighted", false, () -> {
      var i = new KnowSureThingRTIndicator(
          new int[] {3, 5, 7}, new int[] {2, 3, 4}, new double[] {1.5, 2.5, 0.5}, 4);
      return run(p, i::update, read("signal", i::getSignal), ready(i));
    }));
    list.add(new Subject("trixDefault", false, () -> {
      var i = new TrixRTIndicator();
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("trix5", false, () -> {
      var i = new TrixRTIndicator(5);
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("trueStrengthIndexDefault", false, () -> {
      var i = new TrueStrengthIndexRTIndicator();
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("trueStrengthIndex5_3", false, () -> {
      var i = new TrueStrengthIndexRTIndicator(5, 3);
      return run(p, i::update, ready(i));
    }));

    list.add(new Subject("efficiencyRatioDefault", false, () -> {
      var i = new EfficiencyRatioRTIndicator();
      return run(p, i::update, read("direction", i::getDirection), read("volatility", i::getVolatility),
          ready(i));
    }));
    list.add(new Subject("efficiencyRatio3", false, () -> {
      var i = new EfficiencyRatioRTIndicator(3);
      return run(p, i::update, read("direction", i::getDirection), read("volatility", i::getVolatility),
          ready(i));
    }));
    list.add(new Subject("efficiencyRatio1", false, () -> {
      var i = new EfficiencyRatioRTIndicator(1);
      return run(p, i::update, read("direction", i::getDirection), read("volatility", i::getVolatility),
          ready(i));
    }));
    list.add(new Subject("relativeVolatilityIndexDefault", false, () -> {
      var i = new RelativeVolatilityIndexRTIndicator();
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("relativeVolatilityIndex5_3", false, () -> {
      var i = new RelativeVolatilityIndexRTIndicator(5, 3);
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("relativeVolatilityIndex2_1", false, () -> {
      var i = new RelativeVolatilityIndexRTIndicator(2, 1);
      return run(p, i::update, ready(i));
    }));

    // The indicators that read whole bars, fed a price through update(double): the bar has every field
    // equal to the price (the Mass Index takes the price as the range itself)
    list.add(new Subject("aroon5AsPrice", false, () -> {
      var i = new AroonRTIndicator(5);
      return run(p, i::update, read("up", i::getAroonUp), read("down", i::getAroonDown), ready(i));
    }));
    list.add(new Subject("chandeKrollStop5AsPrice", false, () -> {
      var i = new ChandeKrollStopRTIndicator(4, 1.5, 3, 2);
      return run(p, i::update, read("stopShort", i::getStopShort), ready(i));
    }));
    list.add(new Subject("chandelierExit5AsPrice", false, () -> {
      var i = new ChandelierExitRTIndicator(5, 2.0);
      return run(p, i::update, read("shortExit", i::getShortExit), ready(i));
    }));
    list.add(new Subject("donchianChannel5AsPrice", false, () -> {
      var i = new DonchianChannelRTIndicator(5);
      return run(p, i::update, read("upper", i::getUpper), read("lower", i::getLower), ready(i));
    }));
    list.add(new Subject("parabolicSarDefaultAsPrice", false, () -> {
      var i = new ParabolicSarRTIndicator();
      return run(p, i::update, flag("upTrend", i::isUpTrend), ready(i));
    }));
    list.add(new Subject("vortex5AsPrice", false, () -> {
      var i = new VortexRTIndicator(5);
      return run(p, i::update, read("viPlus", i::getVIPlus), read("viMinus", i::getVIMinus), ready(i));
    }));
    list.add(new Subject("choppinessIndex5AsPrice", false, () -> {
      var i = new ChoppinessIndexRTIndicator(5);
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("keltnerChannel5_3_2AsPrice", false, () -> {
      var i = new KeltnerChannelRTIndicator(5, 3, 2.0);
      return run(p, i::update, read("upper", i::getUpper), read("lower", i::getLower), ready(i));
    }));
    list.add(new Subject("massIndex5_3AsPrice", false, () -> {
      var i = new MassIndexRTIndicator(5, 3);
      return run(p, i::update, ready(i));
    }));
    list.add(new Subject("natr5AsPrice", false, () -> {
      var i = new NatrRTIndicator(5);
      return run(p, i::update, ready(i));
    }));
    return list;
  }

  /**
   * The series of the price-fed indicators on {@code p}, one JSON line each, joined by commas. The
   * scenarios write only the indicators that are not {@code earlier} (they must not throw); the edge
   * cases write all of them, and an indicator that throws is written as {@code {"throws":
   * "<message>"}}. Both write a value that is not finite with {@link #exactArray}, as NaN, Infinity or
   * -Infinity: an indicator that does not leave a non-finite price out can give any of the three on
   * the corrupt scenario.
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
            (name, series) -> outputs.add("\"" + name + "\": " + exactArray(series)));
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
  // ---- the bar-fed indicators: the same classes and parameters on the scenarios and on the bar edges ----

  /** A series of bars: the five fields, one value per bar. */
  record Bars(double[] open, double[] high, double[] low, double[] close, double[] volume) {
    int length() {
      return close.length;
    }

    KlineSnapshot at(int i) {
      return new KlineSnapshot(
          INSTRUMENT, KlineInterval.m1, i * 60_000L, open[i], high[i], low[i], close[i], volume[i],
          volume[i] * close[i], i * 60_000L + 59_999L, 5L, true);
    }
  }

  /**
   * A bar-fed indicator with its parameters. {@code scenarios} says whether the two scenarios run it
   * (the ones ported earlier have their own series there, and a few variants only matter
   * on the edge cases); the bar edges run all of them.
   */
  record BarSubject(String key, boolean scenarios, Function<Bars, Map<String, double[]>> run) {}

  /** What a bar-fed indicator gives on a series of bars: {@code value} (after each bar) and each extra reading. */
  static Map<String, double[]> runBars(
      Bars bars, RichRTIndicator<MarketSnapshot> indicator, Read... reads) {
    int n = bars.length();
    Map<String, double[]> series = new LinkedHashMap<>();
    double[] value = new double[n];
    double[][] extra = new double[reads.length][n];
    for (int i = 0; i < n; i++) {
      indicator.updateFrom(bars.at(i));
      value[i] = indicator.getValue();
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

  static List<BarSubject> barSubjects() {
    List<BarSubject> list = new ArrayList<>();
    // ported earlier (and ATR, which several of the new ones build on): only the bar edges run them
    list.add(new BarSubject("adx14", false, b -> {
      var i = new AdxRTIndicator(14);
      return runBars(b, i, read("plusDI", i::getPlusDI), read("minusDI", i::getMinusDI), ready(i));
    }));
    list.add(new BarSubject("ichimoku9_26_52", false, b -> {
      var i = new IchimokuRTIndicator(9, 26, 52);
      return runBars(b, i, read("kijun", i::getKijunSen), read("senkouA", i::getSenkouSpanA),
          read("senkouB", i::getSenkouSpanB), read("chikou", i::getChikouSpan),
          flag("tenkanKijunReady", i::isTenkanKijunReady), ready(i));
    }));
    list.add(new BarSubject("superTrend10_3", false, b -> {
      var i = new SuperTrendRTIndicator(10, 3.0);
      return runBars(b, i, read("upper", i::getUpperBand), read("lower", i::getLowerBand),
          flag("upTrend", i::isUpTrend), ready(i));
    }));
    list.add(new BarSubject("atr14", false, b -> {
      var i = new AtrRTIndicator(14);
      return runBars(b, i, ready(i));
    }));
    list.add(new BarSubject("cmf20", false, b -> {
      var i = new CmfRTIndicator(20);
      return runBars(b, i, ready(i));
    }));
    list.add(new BarSubject("mfi14", false, b -> {
      var i = new MfiRTIndicator(14);
      return runBars(b, i, ready(i));
    }));
    list.add(new BarSubject("obv", false, b -> {
      var i = new ObvRTIndicator();
      return runBars(b, i, ready(i));
    }));
    list.add(new BarSubject("vwap", false, b -> {
      var i = new VwapRTIndicator();
      return runBars(b, i, ready(i));
    }));
    list.add(new BarSubject("parkinson20", false, b -> {
      var i = new ParkinsonVolatilityRTIndicator(20);
      return runBars(b, i, read("variance", i::getParkinsonVariance), ready(i));
    }));
    list.add(new BarSubject("garmanKlass20", false, b -> {
      var i = new GarmanKlassVolatilityRTIndicator(20);
      return runBars(b, i, read("variance", i::getGarmanKlassVariance), ready(i));
    }));
    list.add(new BarSubject("rogersSatchell20", false, b -> {
      var i = new RogersSatchellVolatilityRTIndicator(20);
      return runBars(b, i, read("variance", i::getRogersSatchellVariance), ready(i));
    }));
    list.add(new BarSubject("yangZhang20", false, b -> {
      var i = new YangZhangVolatilityRTIndicator(20);
      return runBars(b, i, read("variance", i::getYangZhangVariance), ready(i));
    }));

    list.add(new BarSubject("aroonDefault", true, b -> {
      var i = new AroonRTIndicator();
      return runBars(b, i, read("up", i::getAroonUp), read("down", i::getAroonDown), ready(i));
    }));
    list.add(new BarSubject("aroon5", true, b -> {
      var i = new AroonRTIndicator(5);
      return runBars(b, i, read("up", i::getAroonUp), read("down", i::getAroonDown), ready(i));
    }));
    list.add(new BarSubject("chandeKrollStopDefault", true, b -> {
      var i = new ChandeKrollStopRTIndicator();
      return runBars(b, i, read("stopLong", i::getStopLong), read("stopShort", i::getStopShort), ready(i));
    }));
    list.add(new BarSubject("chandeKrollStop5_2_5_4_3", true, b -> {
      var i = new ChandeKrollStopRTIndicator(5, 2.5, 4, 3);
      return runBars(b, i, read("stopLong", i::getStopLong), read("stopShort", i::getStopShort), ready(i));
    }));
    list.add(new BarSubject("chandeKrollStopMultiplier0", false, b -> {
      var i = new ChandeKrollStopRTIndicator(3, 0.0, 4, 2);
      return runBars(b, i, read("stopLong", i::getStopLong), read("stopShort", i::getStopShort), ready(i));
    }));
    list.add(new BarSubject("chandeKrollStopHugeMultiplier", false, b -> {
      var i = new ChandeKrollStopRTIndicator(3, 1e308, 4, 2);
      return runBars(b, i, read("stopLong", i::getStopLong), read("stopShort", i::getStopShort), ready(i));
    }));
    list.add(new BarSubject("chandelierExitDefault", true, b -> {
      var i = new ChandelierExitRTIndicator();
      return runBars(b, i, read("longExit", i::getLongExit), read("shortExit", i::getShortExit), ready(i));
    }));
    list.add(new BarSubject("chandelierExit5_1_5", true, b -> {
      var i = new ChandelierExitRTIndicator(5, 1.5);
      return runBars(b, i, read("longExit", i::getLongExit), read("shortExit", i::getShortExit), ready(i));
    }));
    list.add(new BarSubject("chandelierExitMultiplier0", false, b -> {
      var i = new ChandelierExitRTIndicator(4, 0.0);
      return runBars(b, i, read("longExit", i::getLongExit), read("shortExit", i::getShortExit), ready(i));
    }));
    list.add(new BarSubject("chandelierExitHugeMultiplier", false, b -> {
      var i = new ChandelierExitRTIndicator(3, 1e308);
      return runBars(b, i, read("longExit", i::getLongExit), read("shortExit", i::getShortExit), ready(i));
    }));
    list.add(new BarSubject("donchianChannelDefault", true, b -> {
      var i = new DonchianChannelRTIndicator();
      return runBars(b, i, read("upper", i::getUpper), read("lower", i::getLower),
          read("middle", i::getMiddle), ready(i));
    }));
    list.add(new BarSubject("donchianChannel5", true, b -> {
      var i = new DonchianChannelRTIndicator(5);
      return runBars(b, i, read("upper", i::getUpper), read("lower", i::getLower), ready(i));
    }));
    list.add(new BarSubject("parabolicSarDefault", true, b -> {
      var i = new ParabolicSarRTIndicator();
      return runBars(b, i, flag("upTrend", i::isUpTrend), ready(i));
    }));
    list.add(new BarSubject("parabolicSar005_05", true, b -> {
      var i = new ParabolicSarRTIndicator(0.05, 0.5);
      return runBars(b, i, flag("upTrend", i::isUpTrend), ready(i));
    }));
    list.add(new BarSubject("parabolicSarMaxBelowStep", false, b -> {
      var i = new ParabolicSarRTIndicator(0.1, 0.05);
      return runBars(b, i, flag("upTrend", i::isUpTrend), ready(i));
    }));
    list.add(new BarSubject("vortexDefault", true, b -> {
      var i = new VortexRTIndicator();
      return runBars(b, i, read("viPlus", i::getVIPlus), read("viMinus", i::getVIMinus), ready(i));
    }));
    list.add(new BarSubject("vortex3", true, b -> {
      var i = new VortexRTIndicator(3);
      return runBars(b, i, read("viPlus", i::getVIPlus), read("viMinus", i::getVIMinus), ready(i));
    }));
    list.add(new BarSubject("choppinessIndexDefault", true, b -> {
      var i = new ChoppinessIndexRTIndicator();
      return runBars(b, i, ready(i));
    }));
    list.add(new BarSubject("choppinessIndex5", true, b -> {
      var i = new ChoppinessIndexRTIndicator(5);
      return runBars(b, i, ready(i));
    }));
    list.add(new BarSubject("choppinessIndex1", false, b -> {
      var i = new ChoppinessIndexRTIndicator(1);
      return runBars(b, i, ready(i));
    }));
    list.add(new BarSubject("keltnerChannelDefault", true, b -> {
      var i = new KeltnerChannelRTIndicator();
      return runBars(b, i, read("upper", i::getUpper), read("lower", i::getLower),
          read("middle", i::getMiddle), ready(i));
    }));
    list.add(new BarSubject("keltnerChannel5_3_2", true, b -> {
      var i = new KeltnerChannelRTIndicator(5, 3, 2.0);
      return runBars(b, i, read("upper", i::getUpper), read("lower", i::getLower), ready(i));
    }));
    list.add(new BarSubject("keltnerChannelMultiplier0", false, b -> {
      var i = new KeltnerChannelRTIndicator(5, 3, 0.0);
      return runBars(b, i, read("upper", i::getUpper), read("lower", i::getLower), ready(i));
    }));
    list.add(new BarSubject("keltnerChannelHugeMultiplier", false, b -> {
      var i = new KeltnerChannelRTIndicator(3, 3, 1e308);
      return runBars(b, i, read("upper", i::getUpper), read("lower", i::getLower), ready(i));
    }));
    list.add(new BarSubject("massIndexDefault", true, b -> {
      var i = new MassIndexRTIndicator();
      return runBars(b, i, ready(i));
    }));
    list.add(new BarSubject("massIndex5_3", true, b -> {
      var i = new MassIndexRTIndicator(5, 3);
      return runBars(b, i, ready(i));
    }));
    list.add(new BarSubject("massIndex1_1", false, b -> {
      var i = new MassIndexRTIndicator(1, 1);
      return runBars(b, i, ready(i));
    }));
    list.add(new BarSubject("natr14", true, b -> {
      var i = new NatrRTIndicator(14);
      return runBars(b, i, ready(i));
    }));
    list.add(new BarSubject("natr3", true, b -> {
      var i = new NatrRTIndicator(3);
      return runBars(b, i, ready(i));
    }));
    return list;
  }

  /**
   * The series of the bar-fed indicators on {@code bars}, one JSON line each, joined by commas. The
   * scenarios write only the indicators marked {@code scenarios}; the bar edges write all of them, and
   * one that throws is written as {@code {"throws": "<message>"}}.
   */
  static String barSubjectLines(Bars bars, boolean edge, String indent) {
    StringJoiner lines = new StringJoiner(",\n");
    for (BarSubject subject : barSubjects()) {
      if (!subject.scenarios() && !edge) {
        continue;
      }
      String body;
      try {
        StringJoiner outputs = new StringJoiner(", ", "{", "}");
        subject.run().apply(bars).forEach(
            (name, series) -> outputs.add("\"" + name + "\": " + exactArray(series)));
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

  // ---- the bar edges ----

  static final String[] FIELDS = {"open", "high", "low", "close", "volume"};

  /** A series of {@code n} bars; {@code bar} gives the open, high, low, close and volume of bar i. */
  static Bars series(int n, IntFunction<double[]> bar) {
    double[][] f = new double[5][n];
    for (int i = 0; i < n; i++) {
      double[] b = bar.apply(i);
      for (int k = 0; k < 5; k++) {
        f[k][i] = b[k];
      }
    }
    return new Bars(f[0], f[1], f[2], f[3], f[4]);
  }

  /** A copy of the bars with the field {@code field} of bar {@code bar} set to {@code value}. */
  static Bars with(Bars b, int bar, int field, double value) {
    double[][] f = {b.open().clone(), b.high().clone(), b.low().clone(), b.close().clone(), b.volume().clone()};
    f[field][bar] = value;
    return new Bars(f[0], f[1], f[2], f[3], f[4]);
  }

  static double waveClose(int i) {
    return 100.0 + 5.0 * Math.sin(0.4 * i) + 0.1 * i;
  }

  /** An ordinary bar: a wave with a drift, the high and low a little outside the open and the close. */
  static double[] waveBar(int i) {
    double o = i == 0 ? 100.0 : waveClose(i - 1);
    double c = waveClose(i);
    double h = Math.max(o, c) + 0.5 + 0.25 * Math.abs(Math.sin(1.3 * i));
    double l = Math.min(o, c) - 0.5 - 0.25 * Math.abs(Math.cos(1.1 * i));
    return new double[] {o, h, l, c, 1000.0 + 100.0 * Math.cos(0.7 * i)};
  }

  static double gapClose(int i) {
    int level = (i / 12) % 3;
    return 100.0 + (level == 1 ? 25.0 : level == 2 ? -20.0 : 0.0) + 2.0 * Math.sin(0.5 * i);
  }

  static double nearMaxClose(int i) {
    return 1.7e308 * (1.0 - 0.0005 * (i % 9));
  }

  /** Synthetic series of bars that reach the branches the seeded dataset never does. */
  static Map<String, Bars> barEdgeInputs() {
    Map<String, Bars> edges = new LinkedHashMap<>();
    // a steady rise and a steady fall, the high and the low a fixed distance around the close
    edges.put("rising", series(70, i -> {
      double c = 100.0 + 0.5 * i;
      return new double[] {c - 0.25, c + 0.3, c - 0.3, c, 1000.0 + 10.0 * i};
    }));
    edges.put("falling", series(70, i -> {
      double c = 150.0 - 0.5 * i;
      return new double[] {c + 0.25, c + 0.3, c - 0.3, c, 1000.0 + 10.0 * i};
    }));
    // the ordinary wave, as it is
    edges.put("wave", series(80, Oracle::waveBar));
    // flat bars: open = high = low = close
    edges.put("flat", series(60, i -> new double[] {100.0, 100.0, 100.0, 100.0, 1000.0}));
    // zero-range bars (high = low = close) among ordinary ones
    edges.put("zeroRange", series(70, i -> {
      double[] b = waveBar(i);
      if (i % 4 == 2) {
        b[1] = b[3];
        b[2] = b[3];
      }
      return b;
    }));
    // gaps: the level jumps up by 25 and down by 45 between bars
    edges.put("gaps", series(72, i -> {
      double c = gapClose(i);
      double o = i == 0 ? 100.0 : gapClose(i - 1);
      return new double[] {o, Math.max(o, c) + 0.4, Math.min(o, c) - 0.4, c, 1000.0 + 5.0 * i};
    }));
    // bars whose high is below their low, the first one and a stretch in the middle
    edges.put("highBelowLow", series(70, i -> {
      double[] b = waveBar(i);
      if (i == 0 || (i >= 30 && i < 35)) {
        double high = b[1];
        b[1] = b[2] - 1.0;
        b[2] = high + 1.0;
      }
      return b;
    }));
    // no volume at all, and no volume for a stretch longer than the windows
    edges.put("zeroVolume", series(60, i -> {
      double[] b = waveBar(i);
      b[4] = 0.0;
      return b;
    }));
    edges.put("zeroVolumeStretch", series(70, i -> {
      double[] b = waveBar(i);
      if (i >= 10 && i < 50) {
        b[4] = 0.0;
      }
      return b;
    }));
    // the price collapses to a very small positive value, stays there, then recovers
    edges.put("collapse", series(60, i -> {
      double c = i < 30 || i >= 45 ? 100.0 + 2.0 * Math.sin(0.7 * i) : 1e-8 * (1.0 + 0.1 * (i - 30));
      double pc = i == 0 ? 100.0 : (i - 1 < 30 || i - 1 >= 45 ? 100.0 + 2.0 * Math.sin(0.7 * (i - 1)) : 1e-8 * (1.0 + 0.1 * (i - 31)));
      double o = i == 0 ? 100.0 : pc;
      return new double[] {o, Math.max(o, c) * 1.005, Math.min(o, c) * 0.995, c, 1000.0};
    }));
    // fewer bars than any window
    edges.put("short", series(5, i -> {
      double[] closes = {100.0, 101.0, 99.5, 100.5, 102.0};
      double o = i == 0 ? 100.0 : closes[i - 1];
      return new double[] {o, closes[i] + 0.5, closes[i] - 0.5, closes[i], 1000.0};
    }));
    // the smallest positive price, as a whole bar
    edges.put("smallestPrice", series(40, i -> {
      double c = i == 20 ? Double.MIN_VALUE : 100.0 + 0.1 * i;
      double o = i == 0 ? 100.0 : i - 1 == 20 ? Double.MIN_VALUE : 100.0 + 0.1 * (i - 1);
      if (i == 20) {
        return new double[] {c, c, c, c, 1000.0};
      }
      return new double[] {o, Math.max(o, c) + 0.2, Math.min(o, c) - 0.2, c, 1000.0};
    }));
    // a bar of zeros in the middle, a bar of zeros at the start, and a negative price in the middle
    edges.put("zeroBar", series(40, i -> i == 10 ? new double[] {0.0, 0.0, 0.0, 0.0, 1000.0} : waveBar(i)));
    edges.put("zeroFirstBar", series(40, i -> i == 0 ? new double[] {0.0, 0.0, 0.0, 0.0, 1000.0} : waveBar(i)));
    edges.put("negativePrice", series(40, i -> i == 10 ? new double[] {-5.0, -4.0, -6.0, -5.0, 1000.0} : waveBar(i)));
    // a range that overflows: high = the largest double and low = its opposite, for three bars
    edges.put("overflowRange", series(40, i -> {
      double[] b = waveBar(i);
      if (i >= 20 && i < 23) {
        b[1] = Double.MAX_VALUE;
        b[2] = -Double.MAX_VALUE;
      }
      return b;
    }));
    // prices near the largest double: the sums and distances that overflow
    edges.put("nearMax", series(40, i -> {
      double c = nearMaxClose(i);
      double o = i == 0 ? 1.7e308 : nearMaxClose(i - 1);
      return new double[] {o, Math.max(o, c) * 1.0001, Math.min(o, c) * 0.9999, c, 1000.0};
    }));
    edges.put("nearMaxAlternating", series(40, i -> {
      double sign = i % 2 == 0 ? 1.0 : -1.0;
      double c = sign * nearMaxClose(i);
      double o = i == 0 ? 100.0 : -sign * nearMaxClose(i - 1);
      return new double[] {o, 1.7e308 * 1.0001, -1.7e308 * 1.0001, c, 1000.0};
    }));

    // each field in turn set to NaN, +Infinity and -Infinity: in the middle of an ordinary series, and as its first bar
    Bars wave = series(50, Oracle::waveBar);
    Bars waveStart = series(30, Oracle::waveBar);
    String[] kinds = {"NaN", "Infinity", "NegInfinity"};
    double[] values = {Double.NaN, Double.POSITIVE_INFINITY, Double.NEGATIVE_INFINITY};
    for (int field = 0; field < 5; field++) {
      String name = Character.toUpperCase(FIELDS[field].charAt(0)) + FIELDS[field].substring(1);
      for (int k = 0; k < 3; k++) {
        edges.put("poison" + name + kinds[k], with(wave, 25, field, values[k]));
      }
    }
    for (int field = 0; field < 5; field++) {
      String name = Character.toUpperCase(FIELDS[field].charAt(0)) + FIELDS[field].substring(1);
      for (int k = 0; k < 3; k++) {
        edges.put("poisonFirst" + name + kinds[k], with(waveStart, 0, field, values[k]));
      }
    }
    return edges;
  }

  static String barEdges() {
    StringJoiner edges = new StringJoiner(",\n", "{\n", "\n  }");
    barEdgeInputs().forEach(
        (name, b) ->
            edges.add(
                "    \"" + name + "\": {\n"
                    + "      \"open\": " + exactArray(b.open()) + ",\n"
                    + "      \"high\": " + exactArray(b.high()) + ",\n"
                    + "      \"low\": " + exactArray(b.low()) + ",\n"
                    + "      \"close\": " + exactArray(b.close()) + ",\n"
                    + "      \"volume\": " + exactArray(b.volume()) + ",\n"
                    + "      \"series\": {\n"
                    + barSubjectLines(b, true, "        ") + "\n      }\n    }"));
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
      } else if (token.startsWith("[")) {
        args.add(facadeArray(token));
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
      method.invoke(Pro.on(group), converted(method.getParameterTypes(), args));
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

  /**
   * An array token such as {@code [10,15,20]}: an {@code int[]}, or a {@code double[]} when any of its numbers has a
   * decimal point. The empty array {@code []} is an {@code int[]}.
   */
  static Object facadeArray(String token) {
    String inner = token.substring(1, token.length() - 1).strip();
    if (inner.isEmpty()) {
      return new int[0];
    }
    String[] parts = inner.split(",");
    if (inner.contains(".")) {
      double[] values = new double[parts.length];
      for (int i = 0; i < parts.length; i++) {
        values[i] = Double.parseDouble(parts[i].strip());
      }
      return values;
    }
    int[] values = new int[parts.length];
    for (int i = 0; i < parts.length; i++) {
      values[i] = Integer.parseInt(parts[i].strip());
    }
    return values;
  }

  /**
   * An integer argument also fits a double parameter, as it does in a Java call, and an {@code int[]} a {@code
   * double[]} one, so that a line can write {@code [1,2]} for weights.
   */
  static boolean accepts(Class<?>[] types, List<Object> args) {
    for (int i = 0; i < types.length; i++) {
      Object arg = args.get(i);
      Class<?> type = types[i];
      boolean fits =
          type == String.class
              ? arg instanceof String
              : type == int.class
                  ? arg instanceof Integer
                  : type == double.class
                      ? arg instanceof Double || arg instanceof Integer
                      : type == int[].class
                          ? arg instanceof int[]
                          : type == double[].class && (arg instanceof double[] || arg instanceof int[]);
      if (!fits) {
        return false;
      }
    }
    return true;
  }

  /** The arguments as the method takes them: reflection widens an {@code int} to a {@code double}, not an array. */
  static Object[] converted(Class<?>[] types, List<Object> args) {
    Object[] out = args.toArray();
    for (int i = 0; i < types.length; i++) {
      if (types[i] == double[].class && out[i] instanceof int[] ints) {
        out[i] = Arrays.stream(ints).asDoubleStream().toArray();
      }
    }
    return out;
  }

  static String jsonString(String value) {
    return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
  }
}
