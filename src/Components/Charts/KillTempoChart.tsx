import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import StringHue, { ConfigAmmoColor } from "../../Util/StringColor.ts";
import {
  GetStatsForConfiguration,
  GetWeaponByName,
} from "../../Data/WeaponData.ts";
import { ConfigDisplayName } from "../../Util/LabelMaker.ts";
import { Modifiers } from "../../Data/ConfigLoader.ts";
import { AverageBTK, AverageTTK, BTK } from "../../Util/Conversions.ts";
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
import { MinMaxScores, MinMaxValues } from "../../Util/MinMaxValues.ts";

interface KillTempoChartProps {
  modifiers: Modifiers;
  settings: Settings;
}

interface KillTempoDatum {
  config: any;
  killsPerSecond: number;
  killsPerMag: number;
  timeToEmptyMagInSec: number;
  tacticalReload: number;
  ttk: number;
  averageBTK: number;
  range: number;
}

function KillTempoChart(props: KillTempoChartProps) {
  const theme = useContext(ThemeContext);
  const datasets = [];
  const configurations = useContext(ConfiguratorContext);
  const minMaxRanges = structuredClone(MinMaxValues);
  const minMaxValues = structuredClone(MinMaxScores);
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

  const myData: KillTempoDatum[][] = [];
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
    myData.push([]);
    let lastDatum: KillTempoDatum = {
      config,
      killsPerSecond: 0,
      killsPerMag: 0,
      timeToEmptyMagInSec: 0,
      tacticalReload: 0,
      ttk: 0,
      averageBTK: 0,
      range: 0,
    };
    for (let dropoff of stats.dropoffs) {
      // calculate rate of kills per second by dividing mag size by bullets to kill and multiplying by RPM and dividing by 60 and rounding to 2 decimal places
      let accuracy = 1;
      accuracy = 0.2;
      const headShotRatio = 0.2;
      let averageBTK = AverageBTK(
        config,
        props.modifiers,
        dropoff.damage,
        headShotRatio
      );

      const timeToEmptyMagInSec = (ammoStat?.magSize, 1 / rpm) * 60;
      const killsPerMag = (ammoStat?.magSize * accuracy) / averageBTK;
      const ttk = AverageTTK(
        config,
        props.modifiers,
        dropoff.damage,
        rpm,
        accuracy
      );
      // const killsPerSecond =
      //   killsPerMag / (timeToEmptyMagInSec + ammoStat.tacticalReload);
      const killsPerSecond = timeToEmptyMagInSec / ammoStat.tacticalReload;
      const datum = {
        config,
        killsPerSecond,
        killsPerMag,
        timeToEmptyMagInSec,
        tacticalReload: ammoStat.tacticalReload,
        ttk,
        averageBTK,
        range: dropoff.range,
        // value,
      };
      for (let i = lastDatum.range + 1; i < dropoff.range; i++) {
        let _datum = structuredClone(lastDatum);
        _datum.range = i;
        myData[myData.length - 1].push(_datum);
      }
      // datum.range = dropoff.range;
      lastDatum = datum;
      myData[myData.length - 1].push(datum);

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
      // range = dropoff.range;
      // for (let i = lastRange + 1; i < range; i++) {
      //   if (requiredRanges.has(i)) {
      //     data.push(lastValue);
      //   } else {
      //     data.push(null);
      //   }
      // }
      // lastValue = value;
      // lastRange = range;
      // if (requiredRanges.has(range)) {
      //   data.push(lastValue);
      // } else {
      //   data.push(null);
      // }
    }
    for (let i = lastDatum.range + 1; i <= highestRangeSeen; i++) {
      const _datum = structuredClone(lastDatum);
      _datum.range = i;
      myData[myData.length - 1].push(_datum);
    }
    // if (lastDatum.range != highestRangeSeen) {
    //   myData[myData.length - 1].push(lastDatum);
    // }

    // const label = ConfigDisplayName(config);
    // if (props.settings.useAmmoColorsForGraph) {
    //   configColors.set(label, ConfigAmmoColor(config));
    // } else {
    //   configColors.set(label, "hsl(" + StringHue(label) + ", 50%, 50%)");
    // }
    // datasets.push({
    //   label: config as unknown as string,
    //   data: data,
    //   fill: false,
    //   borderColor: configColors.get(label),
    //   tension: 0.1,
    //   stepped: true,
    // });
  }
  // console.log(myData);

  for (const dataset of myData) {
    for (const datum of dataset) {
      if (!minMaxRanges[datum.range]) {
        minMaxRanges[datum.range] = {
          minTTK: Infinity,
          maxTTK: 0,
          minBTK: Infinity,
          maxBTK: 0,
          minKPS: Infinity,
          maxKPS: 0,
        };
      }
      if (datum.ttk < minMaxRanges[datum.range].minTTK) {
        minMaxRanges[datum.range].minTTK = datum.ttk;
      }
      if (datum.ttk > minMaxRanges[datum.range].maxTTK) {
        minMaxRanges[datum.range].maxTTK = datum.ttk;
      }
      if (datum.averageBTK < minMaxRanges[datum.range].minBTK) {
        minMaxRanges[datum.range].minBTK = datum.averageBTK;
      }
      if (datum.averageBTK > minMaxRanges[datum.range].maxBTK) {
        minMaxRanges[datum.range].maxBTK = datum.averageBTK;
      }
      if (datum.killsPerSecond < minMaxRanges[datum.range].minKPS) {
        minMaxRanges[datum.range].minKPS = datum.killsPerSecond;
      }
      if (datum.killsPerSecond > minMaxRanges[datum.range].maxKPS) {
        minMaxRanges[datum.range].maxKPS = datum.killsPerSecond;
      }
    }
  }
  // setMinMaxRanges(minMaxRanges);
  // console.log(minMaxRanges);
  const valueFn = (datum: KillTempoDatum): number => {
    const minMax = minMaxRanges[datum.range];
    let ttkScore =
      (minMax.maxTTK - datum.ttk) / (minMax.maxTTK - minMax.minTTK);
    let btk = datum.averageBTK;
    // let btkScore = (btk - minMax.minBTK) / (minMax.maxBTK - minMax.minBTK);
    let btkScore = (minMax.maxBTK - btk) / (minMax.maxBTK - minMax.minBTK);
    let kps = datum.killsPerSecond;
    let kpsScore = (kps - minMax.minKPS) / (minMax.maxKPS - minMax.minKPS);
    if (datum.range === 148) {
      // console.log(
      //   ConfigDisplayName(datum.config) +
      //     " minTTK: " +
      //     minMax.minTTK +
      //     " maxTTK: " +
      //     minMax.maxTTK +
      //     " ttk: " +
      //     datum.ttk +
      //     " ttkScore: " +
      //     ttkScore
      // );
      // console.log(
      //   ConfigDisplayName(datum.config) +
      //     " minBTK: " +
      //     minMax.minBTK +
      //     " maxBTK: " +
      //     minMax.maxBTK +
      //     " btk: " +
      //     datum.averageBTK +
      //     " btkScore: " +
      //     btkScore
      // );
      // console.log(
      //   ConfigDisplayName(datum.config) +
      //     " kps: " +
      //     kps +
      //     " kpsScore: " +
      //     kpsScore +
      //     " minKPS: " +
      //     minMax.minKPS +
      //     " maxKPS: " +
      //     minMax.maxKPS
      // );
    }
    const weights: any = {
      ttk: 2, //2,
      btk: 2, //2,
      kps: 1,
    };
    // let ttkWeight = 2;
    // let btkWeight = 2;
    // let kpsWeight = 1;
    // let sumWeights = (weights.ttk + weights.btk + weights.kps) / 3;

    let sumWeights = 0;
    for (const key in weights) {
      sumWeights += weights[key];
    }
    let score =
      (weights.ttk / sumWeights) * ttkScore +
      (weights.btk / sumWeights) * btkScore +
      (weights.kps / sumWeights) * kpsScore;
    return score;
  };

  for (const dataset of myData) {
    for (const datum of dataset) {
      if (!minMaxValues[datum.range]) {
        minMaxValues[datum.range] = {
          minScore: Infinity,
          maxScore: 0,
        };
      }
      const value = valueFn(datum);
      if (value < minMaxValues[datum.range].minScore) {
        minMaxValues[datum.range].minScore = value;
      }
      if (value > minMaxValues[datum.range].maxScore) {
        minMaxValues[datum.range].maxScore = value;
      }
    }
  }
  console.log(minMaxRanges);
  // console.log(minMaxValues);
  for (const dataset of myData) {
    let data = [];
    for (const datum of dataset) {
      const value = valueFn(datum);
      // const minMax = minMaxValues[datum.range];
      // const relativeValue =
      //   (value - minMax.minScore) / (minMax.maxScore - minMax.minScore);
      // data.push(relativeValue);
      data.push(value);
    }
    const config = dataset[0].config;
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
  // scales.y.ticks.display = false;
  // scales.y.max = 1;
  // scales.y.min = 0;
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
          useChartBoundsForScoring={true}
        />
      </div>
    </div>
  );
}

export default KillTempoChart;
