import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import {
  GetStatsForConfiguration,
  WeaponStats,
} from "../../Data/WeaponData.ts";
import { Modifiers } from "../../Data/ConfigLoader.ts";
import { useContext, useState, useRef, useMemo, memo } from "react";
import RequiredRanges from "../../Util/RequiredRanges.ts";
import { AverageTTK, TTK } from "../../Util/Conversions.ts";
import ChartHeader from "./ChartHeader.tsx";
import { Settings } from "../../Data/SettingsLoader.ts";
import { ConfiguratorContext, ThemeContext } from "../App.tsx";
import {
  GenerateScales,
  ConfigureChartColors,
} from "../../Util/ChartCommon.ts";
import { CustomTooltip, useTooltipHandler } from "./CustomTooltip.tsx";
import { useHoverHighlight, useChartHoverHandler } from "./HoverContext.tsx";
import { ConfigDisplayName } from "../../Util/LabelMaker.ts";

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
  const { currentElementHoverLabels } = useHoverHighlight();
  const chartHoverHandler = useChartHoverHandler();
  const configurations = useContext(ConfiguratorContext);

  // Memoize fire mode calculations
  const fireModeData = useMemo(() => {
    let seenAuto = false;
    let seenBurst = false;
    let seenSingle = false;

    for (const [_id, config] of configurations.weaponConfigurations) {
      const stats = GetStatsForConfiguration(config);
      seenAuto = seenAuto || typeof stats.rpmAuto === "number";
      seenBurst = seenBurst || typeof stats.rpmBurst === "number";
      seenSingle = seenSingle || typeof stats.rpmSingle === "number";
    }

    return { seenAuto, seenBurst, seenSingle };
  }, [configurations.weaponConfigurations]);

  // Memoize selected fire mode
  const selectedFireMode = useMemo(() => {
    let mode = _selectedFireMode;
    const { seenAuto, seenBurst, seenSingle } = fireModeData;

    switch (_selectedFireMode) {
      case FIREMODE_AUTO:
        if (!seenAuto) {
          if (seenBurst) mode = FIREMODE_BURST;
          else if (seenSingle) mode = FIREMODE_SINGLE;
        }
        break;
      case FIREMODE_BURST:
        if (!seenBurst) {
          if (seenAuto) mode = FIREMODE_AUTO;
          else if (seenSingle) mode = FIREMODE_SINGLE;
        }
        break;
      case FIREMODE_SINGLE:
        if (!seenSingle) {
          if (seenAuto) mode = FIREMODE_AUTO;
          else if (seenBurst) mode = FIREMODE_BURST;
        }
        break;
    }
    return mode;
  }, [_selectedFireMode, fireModeData]);

  // Memoize RPM selector
  const rpmSelector = useMemo((): RPMSelectorFn => {
    switch (selectedFireMode) {
      case FIREMODE_AUTO:
        return SELECTOR_AUTO;
      case FIREMODE_BURST:
        return SELECTOR_BURST;
      case FIREMODE_SINGLE:
        return SELECTOR_SINGLE;
      default:
        return (_) => {
          throw new Error("Undefined weapon selector.");
        };
    }
  }, [selectedFireMode]);

  // Memoize required ranges calculation
  const requiredRanges = useMemo(() => {
    return RequiredRanges(
      configurations.weaponConfigurations,
      (config, damage) => {
        const stat = GetStatsForConfiguration(config);
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
  }, [
    configurations.weaponConfigurations,
    props.modifiers,
    rpmSelector,
    numHeadshots,
  ]);

  // Memoize chart data calculation
  const chartData = useMemo((): ChartData<"line"> => {
    const datasets = [];
    const highestRangeSeen = Math.max(...requiredRanges);

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
        stepped: false,
        temsion: 0,
        borderWidth: currentElementHoverLabels.has(ConfigDisplayName(config)) ? 4 : 1.5,
        order: currentElementHoverLabels.has(ConfigDisplayName(config)) ? -1000 : 0,
      });
    }

    const labels = [];
    for (let i = 0; i <= Math.max(...requiredRanges); i++) {
      if (requiredRanges.has(i) || i == Math.max(...requiredRanges)) {
        labels.push(i);
      } else {
        labels.push("");
      }
    }

    return {
      labels: labels,
      datasets: datasets,
    };
  }, [
    configurations.weaponConfigurations,
    props.modifiers,
    props.settings,
    rpmSelector,
    numHeadshots,
    includeFirstShotDelay,
    includeTravelTime,
    requiredRanges,
    currentElementHoverLabels,
    theme.highlightColor,
  ]);

  let [tooltipHandler, setTooltipHandler] = useTooltipHandler();
  let chartRef = useRef<any>();

  // Memoize chart options
  const options = useMemo((): ChartOptions<"line"> => {
    return {
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
      onHover: (event, chartElement) => {
        chartHoverHandler(event, chartElement, chartRef, chartData);
      },
    };
  }, [tooltipHandler, theme.highlightColor, chartHoverHandler, chartData]);

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
            {<option value={FIREMODE_AUTO}>{"Auto"}</option>}
            {<option value={FIREMODE_BURST}>{"Burst"}</option>}
            {<option value={FIREMODE_SINGLE}>{"Single"}</option>}
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
        <Line data={chartData} options={options} ref={chartRef} />
        <CustomTooltip
          setTooltipHandler={setTooltipHandler}
          invertScaleColors={true}
          decimalPlaces={0}
          currentHighlightedLabels={currentElementHoverLabels}
        />
      </div>
    </div>
  );
}

export type { RPMSelectorFn };
export { SELECTOR_AUTO, SELECTOR_BURST, SELECTOR_SINGLE };
export default memo(TTKChart, (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.settings.useAmmoColorsForGraph ===
      nextProps.settings.useAmmoColorsForGraph &&
    JSON.stringify(prevProps.modifiers) === JSON.stringify(nextProps.modifiers)
  );
});
