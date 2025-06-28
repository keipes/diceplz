import { Bar } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { GetStatsForConfiguration } from "../../Data/WeaponData.ts";
import { useContext, useState, useRef } from "react";
import { ConfigDisplayName } from "../../Util/LabelMaker.ts";
import StringHue, { ConfigAmmoColor } from "../../Util/StringColor.ts";
import { SortableWeaponData } from "./SharedTypes.ts";
import ChartHeader from "./ChartHeader.tsx";
import { Settings } from "../../Data/SettingsLoader.ts";
import { ConfiguratorContext, ThemeContext } from "../App.tsx";
import {
  GenerateScales,
  ConfigureChartColors,
} from "../../Util/ChartCommon.ts";
import { useHoverHighlight, useBarChartHoverHandler } from "./HoverContext.tsx";

interface RPMChartProps {
  settings: Settings;
}

function RPMChart(props: RPMChartProps) {
  const theme = useContext(ThemeContext);
  const { currentElementHoverLabels } = useHoverHighlight();
  const chartHoverHandler = useBarChartHoverHandler();
  const chartRef = useRef<any>();
  const [_showAuto, setShowAuto] = useState(true);
  const [_showSingle, setShowSingle] = useState(true);
  const [_showBurst, setShowBurst] = useState(true);
  const labels = [];
  const datasets = [];
  const data = [];
  const burstData = [];
  const burstBackgroundColors = [];
  const backgroundColors = [];
  const singleData = [];
  const singleBackgroundColors = [];
  const weaponData: SortableWeaponData[] = [];
  let seenAuto = false;
  let seenBurst = false;
  let seenSingle = false;
  const configurations = useContext(ConfiguratorContext);
  for (const [_, config] of configurations.weaponConfigurations) {
    if (!config.visible) continue;
    const stats = GetStatsForConfiguration(config);
    seenAuto = seenAuto || typeof stats.rpmAuto === "number";
    seenBurst = seenBurst || typeof stats.rpmBurst === "number";
    seenSingle = seenSingle || typeof stats.rpmSingle === "number";
    weaponData.push({ config: config, stats: stats });
  }
  const showAuto = _showAuto && seenAuto;
  const showSingle = _showSingle && seenSingle;
  const showBurst = _showBurst && seenBurst;
  weaponData.sort((a, b) => {
    const aValues = [];
    const bValues = [];
    if (showAuto) {
      aValues.push(a.stats.rpmAuto || 0);
      bValues.push(b.stats.rpmAuto || 0);
    }
    if (showBurst) {
      aValues.push(a.stats.rpmBurst || 0);
      bValues.push(b.stats.rpmBurst || 0);
    }
    if (showSingle) {
      aValues.push(a.stats.rpmSingle || 0);
      bValues.push(b.stats.rpmSingle || 0);
    }
    return Math.max(...bValues) - Math.max(...aValues);
  });
  for (const wd of weaponData) {
    const stats = wd.stats;
    const config = wd.config;
    const weaponName = ConfigDisplayName(config);
    labels.push(weaponName);
    let color;
    color = ConfigureChartColors(
      config,
      props.settings,
      currentElementHoverLabels,
      theme.highlightColor
    );
    if (showAuto) {
      if (stats.rpmAuto) {
        data.push(stats.rpmAuto);
        backgroundColors.push(color);
      } else {
        data.push(null);
        backgroundColors.push(color);
      }
    }
    if (showBurst) {
      if (stats.rpmBurst) {
        burstData.push(stats.rpmBurst);
        burstBackgroundColors.push(color);
      } else {
        burstData.push(null);
        burstBackgroundColors.push(color);
      }
    }

    if (showSingle) {
      if (stats.rpmSingle) {
        singleData.push(stats.rpmSingle);
        singleBackgroundColors.push(color);
      } else {
        singleData.push(null);
        singleBackgroundColors.push(color);
      }
    }
  }
  if (showAuto) {
    datasets.push({
      label: "Auto",
      data: data,
      backgroundColor: backgroundColors,
      borderWidth: 0,
    });
  }
  if (showBurst) {
    datasets.push({
      label: "Burst",
      data: burstData,
      backgroundColor: burstBackgroundColors,
      borderWidth: 0,
    });
  }

  if (showSingle) {
    datasets.push({
      label: "Single",
      data: singleData,
      backgroundColor: singleBackgroundColors,
      borderWidth: 0,
    });
  }
  const chartData: ChartData<"bar"> = {
    labels: labels,
    datasets: datasets,
  };
  const options: ChartOptions<"bar"> = {
    maintainAspectRatio: false,
    animation: false,
    interaction: {
      intersect: false,
      mode: "index",
    },
    plugins: {
      tooltip: {
        backgroundColor: theme.tooltipBg,
        bodyColor: theme.tooltipBody,
        titleColor: theme.tooltipTitle,
        borderColor: theme.tooltipBg,
        borderWidth: 1,
        multiKeyBackground: theme.tooltipBg,
        callbacks: {
          label: function (ctx) {
            if (ctx.parsed.y == null) {
              return "";
            }
            let label = ctx.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (ctx.parsed.y !== null) {
              label += ctx.parsed.y;
            }
            return label;
          },
          labelColor: function (ctx) {
            // Force the label color indicator to use the original color, not the highlight color
            const config = ctx.dataset.label as any;
            const label = ConfigDisplayName(config);
            if (props.settings.useAmmoColorsForGraph) {
              return {
                borderColor: ConfigAmmoColor(config),
                backgroundColor: ConfigAmmoColor(config),
              };
            } else {
              const originalColor = "hsl(" + StringHue(label) + ", 50%, 50%)";
              return {
                borderColor: originalColor,
                backgroundColor: originalColor,
              };
            }
          },
        },
      },
    },
    scales: GenerateScales("", "rounds", theme.highlightColor),
    onHover: (event, chartElement) => {
      chartHoverHandler(event, chartElement, chartRef, chartData);
    },
  };
  return (
    <div className="chart-outer-container">
      <ChartHeader
        title="Rounds Per Minute"
        description="The number of rounds fired per minute."
      />
      <div>
        <label>
          <input
            type="checkbox"
            checked={_showAuto}
            onChange={(e) => setShowAuto(e.target.checked)}
            disabled={!seenAuto}
          />
          Auto
        </label>
        <label>
          <input
            type="checkbox"
            checked={_showBurst}
            onChange={(e) => setShowBurst(e.target.checked)}
            disabled={!seenBurst}
          />
          Burst
        </label>
        <label>
          <input
            type="checkbox"
            checked={_showSingle}
            onChange={(e) => setShowSingle(e.target.checked)}
            disabled={!seenSingle}
          />
          Single
        </label>
      </div>
      <div className="chart-container">
        <Bar data={chartData} options={options} ref={chartRef} />
      </div>
    </div>
  );
}

export default RPMChart;
