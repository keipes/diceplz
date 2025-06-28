import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
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
import { useContext, useState, useRef, memo } from "react";
import { ConfiguratorContext, ThemeContext } from "../App.tsx";
import {
  GenerateScales,
  ConfigureChartColors,
} from "../../Util/ChartCommon.ts";
import { CustomTooltip, useTooltipHandler } from "./CustomTooltip.tsx";
import {
  RPMSelectorFn,
  SELECTOR_AUTO,
  SELECTOR_BURST,
  SELECTOR_SINGLE,
} from "./TTKChart.tsx";
import {
  GetMinMaxScores,
  GetMinMaxValues,
  MinMaxScore,
  MinMaxValue,
} from "../../Util/MinMaxValues.ts";
import { WeaponConfigurations } from "../../Data/WeaponConfiguration.ts";
import { useHoverHighlight, useChartHoverHandler } from "./HoverContext.tsx";

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

function getKillTempoForConfigurations(
  configs: WeaponConfigurations,
  modifiers: Modifiers,
  rpmSelector: RPMSelectorFn,
  maxRange: number,
  includeTravelTime = false
): KillTempoDatum[][] {
  const data: KillTempoDatum[][] = [];
  for (const [_id, config] of configs.weaponConfigurations) {
    const killTempoData = getKillTempo(
      config,
      modifiers,
      rpmSelector,
      maxRange,
      includeTravelTime
    );
    if (killTempoData.length !== maxRange + 1) {
      const stats = GetStatsForConfiguration(config);
      if (rpmSelector === SELECTOR_AUTO && !stats.rpmAuto) continue;
      if (rpmSelector === SELECTOR_BURST && !stats.rpmBurst) continue;
      if (rpmSelector === SELECTOR_SINGLE && !stats.rpmSingle) continue;
      console.error(
        "Kill tempo data length mismatch for " +
          ConfigDisplayName(config) +
          " " +
          killTempoData.length +
          " " +
          maxRange
      );
    } else {
      data.push(killTempoData);
    }
  }
  return data;
}

function getMinMaxRanges(
  data: KillTempoDatum[][],
  rpmSelector: RPMSelectorFn,
  excludeGlobalMinMaxData?: boolean
): MinMaxValue[] {
  let minMaxRanges: MinMaxValue[] = [];
  if (!excludeGlobalMinMaxData) {
    minMaxRanges = GetMinMaxValues(rpmSelector);
  }
  for (const dataset of data) {
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
  return minMaxRanges;
}

function getMinMaxScores(
  data: KillTempoDatum[][],
  valueFn: (datum: KillTempoDatum) => number,
  rpmSelector: RPMSelectorFn,
  excludeGlobalMinMaxData?: boolean
): MinMaxScore[] {
  let minMaxScores: MinMaxScore[] = [];
  if (!excludeGlobalMinMaxData) {
    minMaxScores = GetMinMaxScores(rpmSelector);
  }
  for (const dataset of data) {
    for (const datum of dataset) {
      if (!minMaxScores[datum.range]) {
        minMaxScores[datum.range] = {
          minScore: Infinity,
          maxScore: 0,
        };
      }
      const value = valueFn(datum);
      if (value < minMaxScores[datum.range].minScore) {
        minMaxScores[datum.range].minScore = value;
      }
      if (value > minMaxScores[datum.range].maxScore) {
        minMaxScores[datum.range].maxScore = value;
      }
    }
  }
  return minMaxScores;
}

function getGlobalMinMaxScores(scores: MinMaxScore[]): MinMaxScore {
  const global: MinMaxScore = {
    minScore: Infinity,
    maxScore: 0,
  };
  // let globalMaxScore = 0;
  // let globalMinScore = Infinity;
  for (const mmr of Object.values(scores)) {
    if (mmr.maxScore > global.maxScore) {
      global.maxScore = mmr.maxScore;
    }
    if (mmr.minScore < global.minScore) {
      global.minScore = mmr.minScore;
    }
  }
  return global;
}

function getValueFn(
  minMaxRanges: MinMaxValue[],
  globalMinMax: MinMaxValue,
  rangeRelative: boolean
) {
  const valueFn = (datum: KillTempoDatum): number => {
    const minMax: MinMaxValue = rangeRelative
      ? minMaxRanges[datum.range]
      : globalMinMax;
    let ttkScore =
      minMax.maxTTK === minMax.minTTK
        ? 1
        : (minMax.maxTTK - datum.ttk) / (minMax.maxTTK - minMax.minTTK);
    let btk = datum.averageBTK;
    let btkScore =
      minMax.maxBTK === minMax.minBTK
        ? 1
        : (minMax.maxBTK - btk) / (minMax.maxBTK - minMax.minBTK);
    let kps = datum.killsPerSecond;
    let kpsScore =
      minMax.maxKPS === minMax.minKPS
        ? 1
        : (kps - minMax.minKPS) / (minMax.maxKPS - minMax.minKPS);
    const weights: any = {
      ttk: 3, //2,
      btk: 2, //2,
      kps: 1,
    };
    let sumWeights = 0;
    for (const key in weights) {
      sumWeights += weights[key];
    }
    let score =
      (weights.ttk / sumWeights) * ttkScore +
      (weights.btk / sumWeights) * btkScore +
      (weights.kps / sumWeights) * kpsScore;
    if (Number.isNaN(score) || score < 0 || score > 1) {
      console.warn("bad score");
    }
    return score;
  };
  return valueFn;
}

function getRelativeScore(
  datum: KillTempoDatum,
  minMax: MinMaxScore[],
  valueFn: (datum: KillTempoDatum) => number
): number {
  const value = valueFn(datum);
  const scores = minMax[datum.range];
  const score = (value - scores.minScore) / (scores.maxScore - scores.minScore);
  return score;
}

function getKillTempo(
  config: any,
  modifiers: Modifiers,
  rpmSelector: RPMSelectorFn,
  maxRange: number,
  includeTravelTime = false
): KillTempoDatum[] {
  const ACCURACY = 0.2;
  const HEADSHOT_RATIO = 0.2;
  const data: KillTempoDatum[] = [];
  if (!config.visible) return data;
  const weapon = GetWeaponByName(config.name);
  if (!weapon.ammoStats) return data;
  const ammoStat = weapon.ammoStats[config.ammoType];
  if (!ammoStat) return data;
  if (!ammoStat.magSize) return data;

  const stats = GetStatsForConfiguration(config);
  if (rpmSelector === SELECTOR_AUTO && !stats.rpmAuto) return data;
  if (rpmSelector === SELECTOR_BURST && !stats.rpmBurst) return data;
  if (rpmSelector === SELECTOR_SINGLE && !stats.rpmSingle) return data;
  const rpm = rpmSelector(stats) as number;
  let currentDropoff = 0;
  for (let i = 0; i <= maxRange; i++) {
    if (
      stats.dropoffs.length > currentDropoff + 1 &&
      i >= stats.dropoffs[currentDropoff + 1].range
    ) {
      currentDropoff++;
    }
    let averageBTK = AverageBTK(
      config,
      modifiers,
      stats.dropoffs[currentDropoff].damage,
      HEADSHOT_RATIO
    );
    const timeToEmptyMagInSec = (ammoStat?.magSize / rpm) * 60;
    const killsPerMag = (ammoStat?.magSize * ACCURACY) / averageBTK;
    let velocity = 600;
    if (stats.velocity) {
      velocity = stats.velocity;
    }
    const travelTime = includeTravelTime ? (i / velocity) * 1000 : 0;
    // const travelTime = i / stats.velocity? || 0;
    const ttk =
      AverageTTK(
        config,
        modifiers,
        stats.dropoffs[currentDropoff].damage,
        rpm,
        ACCURACY,
        true
      ) + travelTime;
    const killsPerSecond = killsPerMag;
    data.push({
      config,
      killsPerSecond,
      killsPerMag,
      timeToEmptyMagInSec,
      tacticalReload: ammoStat.tacticalReload || 6,
      ttk,
      averageBTK,
      range: i,
    });
  }
  return data;
}

function getGlobalMinMax(minMaxRanges: MinMaxValue[]): MinMaxValue {
  let global: MinMaxValue = {
    maxTTK: 0,
    minTTK: Infinity,
    maxBTK: 0,
    minBTK: Infinity,
    maxKPS: 0,
    minKPS: Infinity,
  };
  for (const mmr of Object.values(minMaxRanges)) {
    if (mmr.maxTTK > global.maxTTK) {
      global.maxTTK = mmr.maxTTK;
    }
    if (mmr.maxBTK > global.maxBTK) {
      global.maxBTK = mmr.maxBTK;
    }
    if (mmr.minTTK < global.minTTK) {
      global.minTTK = mmr.minTTK;
    }
    if (mmr.minBTK < global.minBTK) {
      global.minBTK = mmr.minBTK;
    }
    if (mmr.minKPS < global.minKPS) {
      global.minKPS = mmr.minKPS;
    }
    if (mmr.maxKPS > global.maxKPS) {
      global.maxKPS = mmr.maxKPS;
    }
  }
  return global;
}

function KillTempoChart(props: KillTempoChartProps) {
  const theme = useContext(ThemeContext);
  const { currentElementHoverLabels } = useHoverHighlight();
  const chartHoverHandler = useChartHoverHandler();
  const chartRef = useRef<any>();
  const datasets = [];
  const configurations = useContext(ConfiguratorContext);
  const [rpmSelector, setRpmSelector] = useState<RPMSelectorFn>(
    () => SELECTOR_AUTO
  );
  const [includeTravelTime, setIncludeTravelTime] = useState(false);
  let minMaxRanges = GetMinMaxValues(rpmSelector);
  let minMaxValues = GetMinMaxScores(rpmSelector);
  const relative = false;
  const requiredRanges = RequiredRanges(
    configurations.weaponConfigurations,
    (config, damage) => {
      return BTK(config, props.modifiers, damage);
    }
  );

  let [tooltipHandler, setTooltipHandler] = useTooltipHandler();
  const highestRangeSeen = Math.max(...requiredRanges);
  const onlyVisibleConfigs: WeaponConfigurations = new WeaponConfigurations(
    new Map(),
    () => {}
  );
  for (const [id, config] of configurations.weaponConfigurations) {
    if (config.visible) {
      onlyVisibleConfigs.weaponConfigurations.set(id, config);
    }
  }
  const myData: KillTempoDatum[][] = getKillTempoForConfigurations(
    onlyVisibleConfigs,
    props.modifiers,
    rpmSelector,
    highestRangeSeen,
    includeTravelTime
  );
  minMaxRanges = getMinMaxRanges(myData, rpmSelector);
  const globalMinMax: MinMaxValue = getGlobalMinMax(minMaxRanges);
  const valueFn = getValueFn(minMaxRanges, globalMinMax, false);
  minMaxValues = getMinMaxScores(myData, valueFn, rpmSelector);
  for (const dataset of myData) {
    let data = [];
    for (const datum of dataset) {
      const value = valueFn(datum);
      if (relative) {
        const relativeValue = getRelativeScore(datum, minMaxValues, valueFn);
        data.push(relativeValue);
      } else {
        data.push(value);
      }
    }
    const config = dataset[0].config;
    datasets.push({
      label: config as unknown as string,
      data: data,
      fill: false,
      borderColor: ConfigureChartColors(
        config,
        props.settings,
        currentElementHoverLabels,
        theme.highlightColor
      ),
      tension: 0,
      stepped: false,
      borderWidth: currentElementHoverLabels.has(ConfigDisplayName(config)) ? 4 : 1.5,
      order: currentElementHoverLabels.has(ConfigDisplayName(config)) ? -1000 : 0,
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
  // scales.y.max = globalMinMaxScores.maxScore;
  // scales.y.min = globalMinMaxScores.minScore;
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
    onHover: (event, chartElement) => {
      chartHoverHandler(event, chartElement, chartRef, chartData);
    },
  };
  return (
    <div className="chart-outer-container">
      <ChartHeader
        title={"Killiness"}
        description="Sustained kill potential. The exact calculation is subject to change, but it's based on the weapon's RPM, magazine size, reload time, and bullets to kill. Higher is better."
      />
      <div>
        <label>
          {"Fire Mode: "}
          <select
            value={
              rpmSelector === SELECTOR_AUTO
                ? "Auto"
                : rpmSelector === SELECTOR_BURST
                ? "Burst"
                : "Single"
            }
            onChange={(e) =>
              setRpmSelector(
                e.target.value === "Auto"
                  ? () => SELECTOR_AUTO
                  : e.target.value === "Burst"
                  ? () => SELECTOR_BURST
                  : () => SELECTOR_SINGLE
              )
            }
          >
            <option value={"Auto"}>Auto</option>
            <option value={"Burst"}>Burst</option>
            <option value={"Single"}>Single</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={includeTravelTime}
            onChange={(e) => setIncludeTravelTime(e.target.checked)}
          />
          {" Include Travel Time"}
        </label>
      </div>
      <div className="chart-container">
        <Line data={chartData} options={options} ref={chartRef} />
        <CustomTooltip
          setTooltipHandler={setTooltipHandler}
          currentHighlightedLabels={currentElementHoverLabels}
          useTierList={true}
          invertScaleColors={true}
          // useChartBoundsForScoring={true}
          max={1}
          min={0}
          decimalPlaces={0}
          scores={minMaxValues}
        />
      </div>
    </div>
  );
}

export {
  getKillTempoForConfigurations,
  getKillTempo,
  KillTempoChart,
  getMinMaxRanges,
  getGlobalMinMax,
  getMinMaxScores,
  getRelativeScore,
  getGlobalMinMaxScores,
  getValueFn,
};
export default memo(KillTempoChart, (prevProps, nextProps) => {
  return (
    prevProps.settings.useAmmoColorsForGraph ===
      nextProps.settings.useAmmoColorsForGraph &&
    JSON.stringify(prevProps.modifiers) === JSON.stringify(nextProps.modifiers)
  );
});
