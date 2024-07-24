import { DamageRange, WeaponStats, Weapon } from "../../Data/WeaponData";
import { AmmoStat } from "../../Data/WeaponData";

interface StatEvaluator {
  (
    weapon: Weapon,
    stats: WeaponStats,
    dropoff: DamageRange,
    ammoStats: AmmoStat | undefined
  ): MetricPartial;
}

interface MetricPartial {
  name: string;
  value: number;
}

interface Metric extends MetricPartial {
  range: number;
  weapon: Weapon;
  stats: WeaponStats;
  dropoff: DamageRange;
  ammoStats: AmmoStat | undefined;
}

interface AggregatedMetric {
  name: string;
  range: number;
  min: Metric;
  max: Metric;
  mean: number;
  median: number;
  mode: number;
}

interface Metrics {
  metrics: Metric[][][];
  aggregated: AggregatedMetric[][];
  GetMetricsForWeapon: (
    weapon: Weapon,
    stats: WeaponStats,
    range: number
  ) => Metric[];
}

class MetricEvaluator implements Metrics {
  metrics: Metric[][][];
  aggregated: AggregatedMetric[][];

  private weapons: Weapon[];

  private weaponOffsets: number[][];
  constructor(
    minRange: number,
    maxRange: number,
    evaluators: StatEvaluator[],
    weapons: Weapon[]
  ) {
    let metrics: Metric[][][] = [];
    let weaponOffsets: number[][] = [];
    for (let r = 0; r <= maxRange - minRange; r++) {
      let offset = 0;
      let range = r + minRange;
      weaponOffsets.push([]);
      for (let w = 0; w < weapons.length; w++) {
        weaponOffsets[r][w] = offset;
        for (let s = 0; s < weapons[w].stats.length; s++) {
          offset++;
          let stats = weapons[w].stats[s];
          let ammoStats = weapons[w].ammoStats?.[stats.ammoType];
          let currentDropoff = 0;
          if (
            stats.dropoffs.length > currentDropoff + 1 &&
            range >= stats.dropoffs[currentDropoff + 1].range
          ) {
            currentDropoff++;
          }
          for (let e = 0; e < evaluators.length; e++) {
            if (!metrics[e]) {
              metrics[e] = [];
            }
            if (!metrics[e][r]) {
              metrics[e][r] = [];
            }

            metrics[e][r].push({
              ...evaluators[e](
                weapons[w],
                stats,
                stats.dropoffs[currentDropoff],
                ammoStats
              ),
              range,
              weapon: weapons[w],
              stats,
              dropoff: stats.dropoffs[currentDropoff],
              ammoStats,
            });
          }
        }
      }
    }
    let aggregated: AggregatedMetric[][] = [];
    for (let i = 0; i < metrics.length; i++) {
      aggregated[i] = [];
      for (let j = 0; j < metrics[i].length; j++) {
        aggregated[i][j] = aggregateMetrics(metrics[i][j]);
      }
    }
    this.weapons = weapons;
    this.metrics = metrics;
    this.aggregated = aggregated;
    this.weaponOffsets = weaponOffsets;
  }

  GetMetricsForWeapon(
    weapon: Weapon,
    stats: WeaponStats,
    range: number
  ): Metric[] {
    let weaponIndex =
      this.weaponOffsets[range][this.weapons.indexOf(weapon)] +
      weapon.stats.indexOf(stats);
    let metrics = [];
    for (let i = 0; i < this.metrics.length; i++) {
      metrics.push(this.metrics[i][range][weaponIndex]);
    }
    return metrics;
  }
}

function aggregateMetrics(metrics: Metric[]): AggregatedMetric {
  const name = metrics[0].name;
  const [values, counts, sum, min, max] = countValues(metrics);
  return {
    name,
    mean: sum / metrics.length,
    min,
    max,
    range: metrics[0].range,
    median: median(values),
    mode: mode(counts),
  };
}

function countValues(metrics: Metric[]): any[] {
  const name = metrics[0].name;
  const values = [];
  const counts = new Map<number, number>();
  let sum = 0;
  let min = metrics[0];
  let max = metrics[0];
  for (let metric of metrics) {
    if (name !== metric.name) {
      throw console.error("Metrics must have the same name");
    }
    if (metric.range !== metrics[0].range) {
      throw console.error("Metrics must have the same range");
    }
    values.push(metric.value);
    counts.set(metric.value, (counts.get(metric.value) || 0) + 1);
    sum += metric.value;
    if (metric.value < min.value) {
      min = metric;
    }
    if (metric.value > max.value) {
      max = metric;
    }
  }
  return [values, counts, sum, min, max];
}

function median(values: number[]): number {
  const sorted = values.slice().sort();
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function mode(counts: Map<number, number>): number {
  const maxCount = Math.max(...counts.values());
  return [...counts.entries()].find(([, count]) => count === maxCount)![0];
}

export type { StatEvaluator, Metric, AggregatedMetric };
export { MetricEvaluator };
