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
import { AverageTTK, TTK } from "../../Util/Conversions.ts";
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
  let [includeTravelTime, setIncludeTravelTime] = useState(false);
  let [includeFirstShotDelay, _setIncludeFirstShotDelay] = useState(false);
  let [numHeadshots, setNumHeadshots] = useState(0);
  let [previousNumHeadshots, setPreviousNumHeadshots] = useState(numHeadshots);
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
      // return TTK(config, props.modifiers, damage, rpmSelector(stat) || 0);
      return AverageTTK(
        config,
        props.modifiers,
        damage,
        rpmSelector(stat) || 0,
        numHeadshots,
        false
      );
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
    let currentDropoff = -1;
    let ttk = Infinity;
    for (let i = 0; i <= highestRangeSeen; i++) {
      if (stats.dropoffs.length > currentDropoff + 1) {
        if (i >= stats.dropoffs[currentDropoff + 1].range) {
          currentDropoff++;
          ttk = TTK(
            config,
            props.modifiers,
            stats.dropoffs[currentDropoff].damage,
            rpmSelector(stats) || 0,
            numHeadshots,
            includeFirstShotDelay
          );
        }
      }
      if (requiredRanges.has(i)) {
        if (includeTravelTime) {
          let velocity = 600;
          if (stats.velocity) {
            velocity = stats.velocity;
          }
          data.push(ttk + (i / velocity) * 1000);
        } else {
          data.push(ttk);
        }
      } else {
        data.push(null);
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
      borderWidth: 1.5,
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
          return (a.raw as number) - (b.raw as number);
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
      <div>
        <label>
          {" Fire Mode "}
          <select
            value={selectedFireMode}
            onChange={(e) => setSelectedFireMode(e.target.value)}
          >
            {seenAuto && <option value={FIREMODE_AUTO}>{"Auto"}</option>}
            {seenBurst && <option value={FIREMODE_BURST}>{"Burst"}</option>}
            {seenSingle && <option value={FIREMODE_SINGLE}>{"Single"}</option>}
          </select>
        </label>
        <label>
          {" Num Headshots "}
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
        <label>
          <input
            type="checkbox"
            checked={includeTravelTime}
            onChange={(e) => setIncludeTravelTime(e.target.checked)}
          />
          {"Include Travel Time"}
        </label>
      </div>
      <div className="chart-container">
        <Line data={chartData} options={options} />
        <CustomTooltip
          setTooltipHandler={setTooltipHandler}
          invertScaleColors={false}
          decimalPlaces={0}
        />
      </div>
    </div>
  );
}

export type { RPMSelectorFn };
export { SELECTOR_AUTO, SELECTOR_BURST, SELECTOR_SINGLE };
export default TTKChart;
