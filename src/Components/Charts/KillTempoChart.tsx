import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import StringHue, { ConfigAmmoColor } from "../../Util/StringColor.ts";
import {
  GetStatsForConfiguration,
  GetWeaponByName,
} from "../../Data/WeaponData.ts";
import { ConfigDisplayName } from "../../Util/LabelMaker.ts";
import { Modifiers } from "../../Data/ConfigLoader.ts";
import { BTK, TTK } from "../../Util/Conversions.ts";
import RequiredRanges from "../../Util/RequiredRanges.ts";
import ChartHeader from "./ChartHeader.tsx";
import { Settings } from "../../Data/SettingsLoader.ts";
import { useContext } from "react";
import { ConfiguratorContext, ThemeContext } from "../App.tsx";
import { GenerateScales } from "../../Util/ChartCommon.ts";
import { CustomTooltip, useTooltipHandler } from "./CustomTooltip.tsx";

interface KillTempoChartProps {
  modifiers: Modifiers;
  settings: Settings;
}

function KillTempoChart(props: KillTempoChartProps) {
  const theme = useContext(ThemeContext);
  const datasets = [];
  const configurations = useContext(ConfiguratorContext);
  const requiredRanges = RequiredRanges(
    configurations.weaponConfigurations,
    (config, damage) => {
      return BTK(config, props.modifiers, damage);
    }
  );
  let [tooltipHandler, setTooltipHandler] = useTooltipHandler();
  const highestRangeSeen = Math.max(...requiredRanges);
  const configColors = new Map();
  for (const [_id, config] of configurations.weaponConfigurations) {
    if (!config.visible) continue;
    const weapon = GetWeaponByName(config.name);
    if (!weapon.ammoStats) continue;
    const ammoStat = weapon.ammoStats[config.ammoType];
    if (!ammoStat) continue;
    if (!ammoStat.magSize) continue;
    if (!ammoStat.tacticalReload) continue;
    const stats = GetStatsForConfiguration(config);
    // if (!stats.rpmAuto) continue;
    // const rpm = stats.rpmAuto;
    if (!stats.rpmSingle) continue;
    const rpm = stats.rpmSingle;
    const data = [];
    let lastValue = 0;
    let lastRange = 0;
    let range = 0;
    let value = 0;

    for (let dropoff of stats.dropoffs) {
      // calculate rate of kills per second by dividing mag size by bullets to kill and multiplying by RPM and dividing by 60 and rounding to 2 decimal places
      value = ammoStat?.magSize / BTK(config, props.modifiers, dropoff.damage);
      const ttk = TTK(config, props.modifiers, dropoff.damage, rpm);
      const killsPerMag =
        ammoStat?.magSize / BTK(config, props.modifiers, dropoff.damage);
      const timeToEmptyMagInSec = (ammoStat?.magSize / rpm) * 60;
      // const reloadTime = weapon.reloadTime;
      const killsPerSecond = killsPerMag / timeToEmptyMagInSec;
      const killTempo =
        killsPerMag / (timeToEmptyMagInSec + ammoStat.tacticalReload);
      value = killTempo;
      value = killsPerSecond / ammoStat.tacticalReload;
      value =
        ((killsPerSecond * (timeToEmptyMagInSec / ammoStat.tacticalReload)) /
          ttk) *
        1000;
      value = Math.round(value * 100) / 100;
      range = dropoff.range;
      for (let i = lastRange + 1; i < range; i++) {
        if (requiredRanges.has(i)) {
          data.push(lastValue);
        } else {
          data.push(null);
        }
      }
      lastValue = value;
      lastRange = range;
      if (requiredRanges.has(range)) {
        data.push(lastValue);
      } else {
        data.push(null);
      }
    }
    if (value > 0) {
      for (let i = range + 1; i < highestRangeSeen; i++) {
        if (requiredRanges.has(i)) {
          data.push(value);
        } else {
          data.push(null);
        }
      }
      if (range != highestRangeSeen) {
        data.push(value);
      }
    }
    const label = ConfigDisplayName(config);
    if (props.settings.useAmmoColorsForGraph) {
      configColors.set(label, ConfigAmmoColor(config));
    } else {
      configColors.set(label, "hsl(" + StringHue(label) + ", 50%, 50%)");
    }
    datasets.push({
      label: config,
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
        // external: externalTooltipHandler,
        external: tooltipHandler,
        // backgroundColor: theme.tooltipBg,
        // bodyColor: theme.tooltipBody,
        // titleColor: theme.tooltipTitle,
        position: "eventXPositioner",
        itemSort: function (a, b) {
          return (b.raw as number) - (a.raw as number);
        },
        callbacks: {
          //   labelColor: (ctx) => {
          //     return {
          //       borderColor: theme.highlightColor,
          //       backgroundColor: configColors.get(ctx.dataset.label),
          //     };
          //   },
          //   title: function (ctx) {
          //     const index = ctx[0].dataIndex;
          //     return index == highestRangeSeen
          //       ? String(ctx[0].dataIndex) + "+ meters"
          //       : String(ctx[0].dataIndex) + " meters";
          //   },
          label: function (ctx) {
            return [ctx.dataset.label, ctx.parsed.y];
            // let label = ctx.dataset.label || "";
            // const value = ctx.parsed.y;
            // if (label) {
            //   label += "$$$$";
            // }
            // if (ctx.parsed.y !== null) {
            //   label += ctx.parsed.y;
            // }
            // return [label, "foobar"];
          },
        },
      },
    },
    scales: GenerateScales("meters", "bullets", theme.highlightColor),
  };
  return (
    <div className="chart-outer-container">
      <ChartHeader title={"Killiness"} description="" />
      <div className="chart-container">
        <Line data={chartData} options={options} />
        <CustomTooltip setTooltipHandler={setTooltipHandler} />
      </div>
    </div>
  );
}

export default KillTempoChart;
