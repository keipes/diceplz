import { Bar } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import StringHue, { ConfigAmmoColor } from "../../Util/StringColor.ts";
import { GetStatsForConfiguration } from "../../Data/WeaponData.ts";
import { useContext, useState } from "react";
import "./RPMChart.css";
import { WeaponConfiguration } from "../WeaponConfigurator/WeaponConfigurator.tsx";
import { ConfigDisplayName } from "../../Util/LabelMaker.ts";
import { SortableWeaponData } from "./SharedTypes.ts";
import ChartHeader from "./ChartHeader.tsx";
import { Settings } from "../../Data/SettingsLoader.ts";
import { ThemeContext } from "../App.tsx";
import { GenerateScales } from "../../Util/ChartCommon.ts";

interface RPMChartProps {
  weaponConfigurations: Map<string, WeaponConfiguration>;
  settings: Settings;
}

function RPMChart(props: RPMChartProps) {
  const theme = useContext(ThemeContext);
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
  for (const [_, config] of props.weaponConfigurations) {
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
    if (props.settings.useAmmoColorsForGraph) {
      color = ConfigAmmoColor(config);
    } else {
      color = "hsl(" + StringHue(weaponName) + ", 50%, 50%)"
    }
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
        burstBackgroundColors.push(
          color
        );
      } else {
        burstData.push(null);
        burstBackgroundColors.push(
          color
        );
      }
    }

    if (showSingle) {
      if (stats.rpmSingle) {
        singleData.push(stats.rpmSingle);
        singleBackgroundColors.push(
          color
        );
      } else {
        singleData.push(null);
        singleBackgroundColors.push(
          color
        );
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
        },
      },
    },
    scales: GenerateScales("", "rounds", theme.highlightColor)
  };
  return (
    <div className="chart-outer-container">
      <ChartHeader
        title="Rounds Per Minute"
        description="The number of rounds fired per minute."
      />
      <div className="button-container">
        <button
          className={showAuto ? "abs-selector btn-enabled" : "abs-selector"}
          onClick={(_) => setShowAuto(!showAuto)}
          disabled={!seenAuto}
        >
          Auto
        </button>
        <button
          className={showBurst ? "abs-selector btn-enabled" : "abs-selector"}
          onClick={(_) => setShowBurst(!showBurst)}
          disabled={!seenBurst}
        >
          Burst
        </button>
        <button
          className={showSingle ? "abs-selector btn-enabled" : "abs-selector"}
          onClick={(_) => setShowSingle(!showSingle)}
          disabled={!seenSingle}
        >
          Single
        </button>
      </div>
      <div className="chart-container">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

export default RPMChart;
