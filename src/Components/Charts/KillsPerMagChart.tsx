import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import StringHue, { ConfigAmmoColor } from "../../Util/StringColor.ts";
import { GetStatsForConfiguration } from "../../Data/WeaponData.ts";
import { ConfigDisplayName } from "../../Util/LabelMaker.ts";
import { Modifiers } from "../../Data/ConfigLoader.ts";
import { BTK } from "../../Util/Conversions.ts";
import RequiredRanges from "../../Util/RequiredRanges.ts";
import ChartHeader from "./ChartHeader.tsx";
import { Settings } from "../../Data/SettingsLoader.ts";
import { useContext } from "react";
import { ConfiguratorContext, ThemeContext } from "../App.tsx";
import { GenerateScales } from "../../Util/ChartCommon.ts";
import { GetCapacity } from "./SharedTypes.ts";
import { CustomTooltip, useTooltipHandler } from "./CustomTooltip.tsx";

interface KillsPerMagChartProps {
  modifiers: Modifiers;
  settings: Settings;
}

function KillsPerMagChart(props: KillsPerMagChartProps) {
  const [tooltipHandler, setTooltipHandler] = useTooltipHandler();
  const theme = useContext(ThemeContext);
  const datasets = [];
  const configurations = useContext(ConfiguratorContext);
  const requiredRanges = RequiredRanges(
    configurations.weaponConfigurations,
    (config, damage) => {
      return BTK(config, props.modifiers, damage);
    }
  );
  const highestRangeSeen = Math.max(...requiredRanges);
  const configColors = new Map();
  for (const [_id, config] of configurations.weaponConfigurations) {
    if (!config.visible) continue;
    const stats = GetStatsForConfiguration(config);
    const data = [];
    let lastDamage = 0;
    let lastRange = 0;
    let range = 0;
    let damage = 0;
    for (let dropoff of stats.dropoffs) {
      damage = Math.floor(
        GetCapacity({
          config: config,
          stats: stats,
        }) / BTK(config, props.modifiers, dropoff.damage)
      );
      range = dropoff.range;
      for (let i = lastRange + 1; i < range; i++) {
        if (requiredRanges.has(i)) {
          data.push(lastDamage);
        } else {
          data.push(null);
        }
      }
      lastDamage = damage;
      lastRange = range;
      if (requiredRanges.has(range)) {
        data.push(lastDamage);
      } else {
        data.push(null);
      }
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
    if (props.settings.useAmmoColorsForGraph) {
      configColors.set(label, ConfigAmmoColor(config));
    } else {
      configColors.set(label, "hsl(" + StringHue(label) + ", 50%, 50%)");
    }
    datasets.push({
      label: config as unknown as string,
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
        enabled: false,
        external: tooltipHandler,
        position: "eventXPositioner",
        itemSort: function (a, b) {
          return (b.raw as number) - (a.raw as number);
        },
        callbacks: {
          label: function (ctx) {
            return [ctx.dataset.label, ctx.parsed.y] as unknown as string;
          },
        },
      },
    },
    scales: GenerateScales("meters", "kills", theme.highlightColor),
  };
  return (
    <div className="chart-outer-container">
      <ChartHeader
        title={"Kills Per Magazine"}
        description="floor(magazine capacity / bullets to kill)"
      />
      <div className="chart-container">
        <Line data={chartData} options={options} />
        <CustomTooltip
          setTooltipHandler={setTooltipHandler}
          invertScaleColors={false}
        />
      </div>
    </div>
  );
}

export default KillsPerMagChart;
