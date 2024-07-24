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
import { useContext, useState } from "react";
import { ConfiguratorContext, ThemeContext } from "../App.tsx";
import { GenerateScales } from "../../Util/ChartCommon.ts";
import { CustomTooltip, useTooltipHandler } from "./CustomTooltip.tsx";

interface BTKChartProps {
  modifiers: Modifiers;
  settings: Settings;
}

function BTKChart(props: BTKChartProps) {
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
  const [numHeadshots, setNumHeadshots] = useState(0);
  const [previousNumHeadshots, setPreviousNumHeadshots] =
    useState(numHeadshots);
  for (const [_id, config] of configurations.weaponConfigurations) {
    if (!config.visible) continue;
    const stats = GetStatsForConfiguration(config);
    const data = [];
    let lastDamage = 0;
    let lastRange = 0;
    let range = 0;
    let damage = 0;
    for (let dropoff of stats.dropoffs) {
      damage = BTK(config, props.modifiers, dropoff.damage, numHeadshots);
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
      tension: 0,
      borderWidth: 1.5,
      stepped: false,
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
  const [tooltipHandler, setTooltipHandler] = useTooltipHandler();
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
          return (a.raw as number) - (b.raw as number);
        },
        callbacks: {
          label: function (ctx) {
            return [ctx.dataset.label, ctx.parsed.y] as unknown as string;
          },
        },
      },
    },
    scales: GenerateScales("meters", "bullets", theme.highlightColor),
  };
  return (
    <div className="chart-outer-container">
      <ChartHeader
        title={"BTK"}
        description="BTK (Bullets to Kill) is calculated by dividing the target's health
          points by the weapon's damage per bullet. The result, rounded up to
          the nearest whole number, represents the minimum bullets needed to
          eliminate the target. For instance, if a weapon deals 25 damage per
          bullet and the target has 100 health points, the BTK would be 4."
      />
      <div>
        <label>
          {"Num Headshots "}
          <input
            type="number"
            value={numHeadshots}
            onChange={(e) => setNumHeadshots(parseFloat(e.target.value))}
            max={10}
            min={0}
            step={1}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={numHeadshots === 10}
            onChange={(e) => {
              setPreviousNumHeadshots(numHeadshots);
              setNumHeadshots(e.target.checked ? 10 : previousNumHeadshots);
            }}
          />
          {"All Headshots"}
        </label>
      </div>
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

export default BTKChart;
