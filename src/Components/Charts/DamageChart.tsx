import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import StringHue, { ConfigAmmoColor } from "../../Util/StringColor.ts";
import { GetStatsForConfiguration } from "../../Data/WeaponData.ts";
import { WeaponConfiguration } from "../WeaponConfigurator/WeaponConfigurator.tsx";
import { ConfigDisplayName } from "../../Util/LabelMaker.ts";
import { Modifiers } from "../../Data/ConfigLoader.ts";
import ChartHeader from "./ChartHeader.tsx";
import { Settings } from "../../Data/SettingsLoader.ts";
import { ThemeContext } from "../App.tsx";
import { useContext } from "react";
import { GenerateScales } from "../../Util/ChartCommon.ts";

interface DamageChartProps {
  weaponConfigurations: Map<string, WeaponConfiguration>;
  highestRangeSeen: number;
  requiredRanges: Map<number, boolean>;
  modifiers: Modifiers;
  settings: Settings;
}

function DamageChart(props: DamageChartProps) {
  const theme = useContext(ThemeContext);
  const highestRangeSeen = props.highestRangeSeen;
  const requiredRanges = props.requiredRanges;
  const datasets = [];
  const configColors = new Map();
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
          data.push(lastDamage);
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
          data.push(damage);
        }
      }
      if (range != highestRangeSeen) {
        data.push(damage);
      }
    }
    const label = ConfigDisplayName(config);
    if (props.settings.useAmmoColorsForGraph) {
      configColors.set(label, ConfigAmmoColor(config));
    } else {
      configColors.set(label, "hsl(" + StringHue(label) + ", 50%, 50%)");
    }
    datasets.push({
      label: label,
      data: data,
      fill: false,
      borderColor: configColors.get(label),
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
    elements: {
      point: {
        radius: 0,
      },
    },
    plugins: {
      tooltip: {
        // boxHeight: 20,
        backgroundColor: theme.tooltipBg,
        bodyColor: theme.tooltipBody,
        titleColor: theme.tooltipTitle,
        position: "myCustomPositioner",
        itemSort: function (a, b) {
          return (b.raw as number) - (a.raw as number);
        },
        callbacks: {
          labelColor: (ctx) => {
            return {
              borderColor: theme.highlightColor,
              backgroundColor: configColors.get(ctx.dataset.label),
            };
          },
          title: function (ctx) {
            const index = ctx[0].dataIndex;
            return index == highestRangeSeen
              ? String(ctx[0].dataIndex) + "+ meters"
              : String(ctx[0].dataIndex) + " meters";
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
    scales: GenerateScales("meters", "damage", theme.highlightColor),
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
