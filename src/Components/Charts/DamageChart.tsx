import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import StringHue from "../../Util/StringColor.ts";
import { GetStatsForConfiguration } from "../../Data/WeaponData.ts";
import { WeaponConfiguration } from "../WeaponConfigurator/WeaponConfigurator.tsx";
import { ConfigDisplayName } from "../../Util/LabelMaker.ts";
import { Modifiers } from "../../Data/ConfigLoader.ts";
import ChartHeader from "./ChartHeader.tsx";

interface DamageChartProps {
  weaponConfigurations: Map<string, WeaponConfiguration>;
  highestRangeSeen: number;
  requiredRanges: Map<number, boolean>;
  modifiers: Modifiers;
}

function DamageChart(props: DamageChartProps) {
  const highestRangeSeen = props.highestRangeSeen;
  const requiredRanges = props.requiredRanges;
  const datasets = [];

  for (const [_id, config] of props.weaponConfigurations) {
    if (!config.visible) continue;
    const stats = GetStatsForConfiguration(config);
    const data = [];
    let lastDamage = 0;
    let lastRange = 0;
    let range = 0;
    let damage = 0;
    for (let dropoff of stats.dropoffs) {
      range = dropoff.range;
      damage =
        dropoff.damage *
        props.modifiers.damageMultiplier *
        props.modifiers.bodyDamageMultiplier;
      damage = Math.round(damage * 100) / 100;
      for (let i = lastRange + 1; i < range; i++) {
        if (requiredRanges.has(i)) {
          data.push(lastDamage);
        } else {
          data.push(null);
        }
      }
      lastDamage = damage;
      lastRange = range;
      data.push(damage);
    }
    if (damage > 0) {
      for (let i = range + 1; i < highestRangeSeen; i++) {
        if (requiredRanges.has(i)) {
          data.push(damage);
        } else {
          data.push(null);
        }
      }
      if (range != highestRangeSeen) {
        data.push(damage);
      }
    }
    const label = ConfigDisplayName(config);
    datasets.push({
      label: label,
      data: data,
      fill: false,
      borderColor: "hsl(" + StringHue(label) + ", 50%, 50%)",
      tension: 0.1,
      stepped: true,
    });
  }

  const labels = [];
  for (let i = 0; i <= highestRangeSeen; i++) {
    if (requiredRanges.has(i) || i == highestRangeSeen) {
      labels.push(i);
    } else {
      labels.push("");
    }
  }
  const chartData: ChartData<"line"> = {
    labels: labels,
    datasets: datasets,
  };
  const options: ChartOptions<"line"> = {
    maintainAspectRatio: false,
    animation: false,
    spanGaps: true,
    interaction: {
      intersect: false,
      mode: "index",
    },
    plugins: {
      tooltip: {
        itemSort: function (a, b) {
          return (b.raw as number) - (a.raw as number);
        },
        callbacks: {
          labelColor: (ctx) => {
            return {
              borderColor: "white",
              backgroundColor:
                "hsl(" + StringHue(ctx.dataset.label) + ", 50%, 50%)",
            };
          },
          label: function (ctx) {
            let label = ctx.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (ctx.parsed.y !== null) {
              label += ctx.parsed.y;
            }
            return label;
          },
        },
      },
    },
    // stepped: true,
    scales: {
      y: {
        title: {
          display: true,
          text: "damage",
          color: "white",
        },
        grid: {
          color: "rgba(75, 192, 192, 0.2)",
        },
        min: 0,
        ticks: {
          color: "white",
          // beginAtZero: true,
        },
      },
      x: {
        title: {
          display: true,
          text: "meters",
          color: "white",
        },
        grid: {
          color: "rgba(75, 192, 192, 0.2)",
        },
        min: 0,
        ticks: {
          color: "white",
          // beginAtZero: true,
          autoSkip: false,
        },
      },
    },
  };
  return (
    <div className="chart-outer-container">
      <ChartHeader
        title="Damage"
        description="Weapon damage changes with distance through a step-function damage drop-off, altering values at distinct ranges instead of a gradual decrease or increase."
      />
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

export default DamageChart;
