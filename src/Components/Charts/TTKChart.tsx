import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import StringHue, { ConfigAmmoColor } from "../../Util/StringColor.ts";
import {
  GetStatsForConfiguration,
  WeaponStats,
} from "../../Data/WeaponData.ts";
import { ConfigDisplayName } from "../../Util/LabelMaker.ts";
import { Modifiers } from "../../Data/ConfigLoader.ts";
import { useContext, useState } from "react";
import RequiredRanges from "../../Util/RequiredRanges.ts";
import { TTK } from "../../Util/Conversions.ts";
import ChartHeader from "./ChartHeader.tsx";
import { Settings } from "../../Data/SettingsLoader.ts";
import { ConfiguratorContext, ThemeContext } from "../App.tsx";
import { GenerateScales } from "../../Util/ChartCommon.ts";
import { CustomTooltip, useTooltipHandler } from "./CustomTooltip.tsx";

interface TTKChartProps {
  title: string;
  modifiers: Modifiers;
  settings: Settings;
}

interface RPMSelectorFn {
  (stats: WeaponStats): number | undefined;
}

const FIREMODE_AUTO = "auto";
const FIREMODE_BURST = "burst";
const FIREMODE_SINGLE = "single";
const SELECTOR_AUTO: RPMSelectorFn = (stats: WeaponStats) => stats.rpmAuto;
const SELECTOR_BURST: RPMSelectorFn = (stats: WeaponStats) => stats.rpmBurst;
const SELECTOR_SINGLE: RPMSelectorFn = (stats: WeaponStats) => stats.rpmSingle;

function TTKChart(props: TTKChartProps) {
  const [_selectedFireMode, setSelectedFireMode] = useState(FIREMODE_AUTO);
  const theme = useContext(ThemeContext);

  let rpmSelector: RPMSelectorFn = (_) => {
    throw new Error("Undefined weapon selector.");
  };

  const datasets = [];
  let seenAuto = false;
  let seenBurst = false;
  let seenSingle = false;
  let selectedFireMode = _selectedFireMode;
  const configurations = useContext(ConfiguratorContext);
  for (const [_id, config] of configurations.weaponConfigurations) {
    const stats = GetStatsForConfiguration(config);
    seenAuto = seenAuto || typeof stats.rpmAuto === "number";
    seenBurst = seenBurst || typeof stats.rpmBurst === "number";
    seenSingle = seenSingle || typeof stats.rpmSingle === "number";
  }
  switch (_selectedFireMode) {
    case FIREMODE_AUTO:
      if (!seenAuto) {
        if (seenBurst) {
          selectedFireMode = FIREMODE_BURST;
        } else if (seenSingle) {
          selectedFireMode = FIREMODE_SINGLE;
        }
      }
      break;
    case FIREMODE_BURST:
      if (!seenBurst) {
        if (seenAuto) {
          selectedFireMode = FIREMODE_AUTO;
        } else if (seenSingle) {
          selectedFireMode = FIREMODE_SINGLE;
        }
      }
      break;
    case FIREMODE_SINGLE:
      if (!seenSingle) {
        if (seenAuto) {
          selectedFireMode = FIREMODE_AUTO;
        } else if (seenBurst) {
          selectedFireMode = FIREMODE_BURST;
        }
      }
      break;
  }
  switch (selectedFireMode) {
    case FIREMODE_AUTO:
      rpmSelector = SELECTOR_AUTO;
      break;
    case FIREMODE_BURST:
      rpmSelector = SELECTOR_BURST;
      break;
    case FIREMODE_SINGLE:
      rpmSelector = SELECTOR_SINGLE;
      break;
  }
  const requiredRanges = RequiredRanges(
    configurations.weaponConfigurations,
    (config, damage) => {
      const stat = GetStatsForConfiguration(config);
      return TTK(config, props.modifiers, damage, rpmSelector(stat) || 0);
    }
  );
  const highestRangeSeen = Math.max(...requiredRanges);
  for (const [_id, config] of configurations.weaponConfigurations) {
    if (!config.visible) continue;
    const stats = GetStatsForConfiguration(config);
    seenAuto = seenAuto || typeof stats.rpmAuto === "number";
    seenBurst = seenBurst || typeof stats.rpmBurst === "number";
    seenSingle = seenSingle || typeof stats.rpmSingle === "number";
  }
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
      range = dropoff.range;
      damage = dropoff.damage;
      for (let i = lastRange + 1; i < range; i++) {
        const rpm = rpmSelector(stats);
        if (requiredRanges.has(i) && rpm) {
          data.push(TTK(config, props.modifiers, lastDamage, rpm));
        } else {
          data.push(null);
        }
      }
      lastDamage = damage;
      lastRange = range;
      const rpm = rpmSelector(stats);
      if (requiredRanges.has(dropoff.range) && rpm) {
        data.push(TTK(config, props.modifiers, damage, rpm));
      } else {
        data.push(null);
      }
    }
    if (damage > 0) {
      for (let i = range + 1; i < highestRangeSeen; i++) {
        const rpm = rpmSelector(stats);
        if (requiredRanges.has(i) && rpm) {
          data.push(TTK(config, props.modifiers, damage, rpm));
        } else {
          data.push(null);
        }
      }
      if (range != highestRangeSeen) {
        const rpm = rpmSelector(stats);
        if (rpm) {
          data.push(TTK(config, props.modifiers, damage, rpm));
        } else {
          data.push(null);
        }
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
  let [tooltipHandler, setTooltipHandler] = useTooltipHandler();
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
    scales: GenerateScales("meters", "milliseconds", theme.highlightColor),
  };

  return (
    <div className="chart-outer-container">
      <ChartHeader
        title={props.title}
        description="TTK (Time to Kill) is determined by the formula: TTK = (BTK - 1) / (RPM * 60 / 1000). This considers the Bullets to Kill (BTK), subtracting 1, and dividing by the weapon's Rate of Fire (RPM) converted to rounds per second. The result indicates the time it takes to eliminate an opponent with the weapon, incorporating both damage and firing rate."
      />
      <div className="button-container">
        <button
          className={
            selectedFireMode === FIREMODE_AUTO
              ? "abs-selector btn-enabled"
              : "abs-selector"
          }
          onClick={(_) => setSelectedFireMode(FIREMODE_AUTO)}
          disabled={!seenAuto}
        >
          Auto
        </button>
        <button
          className={
            selectedFireMode === FIREMODE_BURST
              ? "abs-selector btn-enabled"
              : "abs-selector"
          }
          onClick={(_) => setSelectedFireMode(FIREMODE_BURST)}
          disabled={!seenBurst}
        >
          Burst
        </button>
        <button
          className={
            selectedFireMode === FIREMODE_SINGLE
              ? "abs-selector btn-enabled"
              : "abs-selector"
          }
          onClick={(_) => setSelectedFireMode(FIREMODE_SINGLE)}
          disabled={!seenSingle}
        >
          Single
        </button>
      </div>
      <div className="chart-container">
        <Line data={chartData} options={options} />
        <CustomTooltip
          setTooltipHandler={setTooltipHandler}
          invertScaleColors={true}
        />
      </div>
    </div>
  );
}

export type { RPMSelectorFn };
export { SELECTOR_AUTO, SELECTOR_BURST, SELECTOR_SINGLE };
export default TTKChart;
