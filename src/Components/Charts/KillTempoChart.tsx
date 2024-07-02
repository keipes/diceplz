import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import StringHue, { ConfigAmmoColor } from "../../Util/StringColor.ts";
import {
  GetStatsForConfiguration,
  GetWeaponByName,
} from "../../Data/WeaponData.ts";
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
import {
  RPMSelectorFn,
  SELECTOR_AUTO,
  SELECTOR_BURST,
  SELECTOR_SINGLE,
} from "./TTKChart.tsx";

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
  const [rpmSelector, setRpmSelector] = useState<RPMSelectorFn>(
    () => SELECTOR_AUTO
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
    if (!ammoStat.tacticalReload) {
      console.warn("No tactical reload time for " + ConfigDisplayName(config));
      ammoStat.tacticalReload = 6;
    }
    const stats = GetStatsForConfiguration(config);
    if (rpmSelector === SELECTOR_AUTO && !stats.rpmAuto) continue;
    if (rpmSelector === SELECTOR_BURST && !stats.rpmBurst) continue;
    if (rpmSelector === SELECTOR_SINGLE && !stats.rpmSingle) continue;
    const rpm = rpmSelector(stats) as number;
    const data = [];
    let lastValue = 0;
    let lastRange = 0;
    let range = 0;
    let value = 0;

    for (let dropoff of stats.dropoffs) {
      // calculate rate of kills per second by dividing mag size by bullets to kill and multiplying by RPM and dividing by 60 and rounding to 2 decimal places
      let accuracy = 1;
      accuracy = 0.2;
      const headShotRatio = 0.2;
      let sumProbabilities = 0;
      let sumBTK = 0;
      let btk = Infinity;
      const bestBTK = BTK(config, props.modifiers, dropoff.damage, Infinity);
      let numHeadshots = 0;
      while (btk > bestBTK) {
        let currentBTK = BTK(
          config,
          props.modifiers,
          dropoff.damage,
          numHeadshots
        );
        let probability = Math.pow(headShotRatio, numHeadshots);
        if (numHeadshots === 0) {
          probability = 1 - headShotRatio;
        }
        sumProbabilities += probability;
        sumBTK += currentBTK * probability;
        btk = currentBTK;
        numHeadshots++;
      }
      let averageBTK = sumBTK / sumProbabilities;
      const timeToEmptyMagInSec = (Math.max(ammoStat?.magSize, 1) / rpm) * 60;
      const killsPerMag = (ammoStat?.magSize * accuracy) / averageBTK;
      value = killsPerMag / (timeToEmptyMagInSec + ammoStat.tacticalReload);
      // console.log(
      //   ConfigDisplayName(config) +
      //     " val:" +
      //     value +
      //     " sumBTK:" +
      //     sumBTK +
      //     " sumProb:" +
      //     sumProbabilities +
      //     " avgBTK:" +
      //     averageBTK +
      //     " baseBTK:" +
      //     BTK(config, props.modifiers, dropoff.damage, 0)
      // );
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
  const scales: any = GenerateScales(
    "meters",
    "violence",
    theme.highlightColor
  );
  scales.y.ticks.display = false;
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
    scales,
  };
  return (
    <div className="chart-outer-container">
      <ChartHeader
        title={"Killiness"}
        description="Sustained kill potential. The exact calculation is subject to change, but it's based on the weapon's RPM, magazine size, reload time, and bullets to kill. Higher is better."
      />
      <button
        className={
          rpmSelector === SELECTOR_AUTO
            ? "abs-selector btn-enabled"
            : "abs-selector"
        }
        onClick={() => setRpmSelector(() => SELECTOR_AUTO)}
      >
        Auto
      </button>
      <button
        className={
          rpmSelector === SELECTOR_SINGLE
            ? "abs-selector btn-enabled"
            : "abs-selector"
        }
        onClick={() => setRpmSelector(() => SELECTOR_SINGLE)}
      >
        Single
      </button>
      <button
        className={
          rpmSelector === SELECTOR_BURST
            ? "abs-selector btn-enabled"
            : "abs-selector"
        }
        onClick={() => setRpmSelector(() => SELECTOR_BURST)}
      >
        Burst
      </button>
      <div className="chart-container">
        <Line data={chartData} options={options} />
        <CustomTooltip
          setTooltipHandler={setTooltipHandler}
          useTierList={true}
          invertScaleColors={true}
        />
      </div>
    </div>
  );
}

export default KillTempoChart;
