import { Bar } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import StringHue from "../StringColor.ts";
import { GetStatsForConfiguration } from "../WeaponData.ts";
import { useState } from "react";
import "./RPMChart.css";
import { WeaponConfiguration } from "../WeaponConfigurator/WeaponConfigurator.tsx";
import { ConfigDisplayName } from "../LabelMaker.ts";
import { SortableWeaponData } from "./SharedTypes.ts";
import ChartHeader from "./ChartHeader.tsx";

interface RPMChartProps {
  weaponConfigurations: Map<string, WeaponConfiguration>;
}

function RPMChart(props: RPMChartProps) {
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
    if (showAuto) {
      if (stats.rpmAuto) {
        data.push(stats.rpmAuto);
        backgroundColors.push("hsl(" + StringHue(weaponName) + ", 50%, 50%)");
      } else {
        data.push(null);
        backgroundColors.push("hsl(" + StringHue(weaponName) + ", 50%, 50%)");
      }
    }
    if (showBurst) {
      if (stats.rpmBurst) {
        burstData.push(stats.rpmBurst);
        burstBackgroundColors.push(
          "hsl(" + StringHue(weaponName) + ", 50%, 50%)"
        );
      } else {
        burstData.push(null);
        burstBackgroundColors.push(
          "hsl(" + StringHue(weaponName) + ", 50%, 50%)"
        );
      }
    }

    if (showSingle) {
      if (stats.rpmSingle) {
        singleData.push(stats.rpmSingle);
        singleBackgroundColors.push(
          "hsl(" + StringHue(weaponName) + ", 50%, 50%)"
        );
      } else {
        singleData.push(null);
        singleBackgroundColors.push(
          "hsl(" + StringHue(weaponName) + ", 50%, 50%)"
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
    scales: {
      y: {
        title: {
          display: true,
          text: "rounds",
          color: "white",
        },
        grid: {
          color: "rgba(38, 255, 223, 0.1)",
        },
        min: 0,
        ticks: {
          color: "white",
        },
      },
      x: {
        title: {
          display: false,
          text: "weapon",
        },
        grid: {
          color: "rgba(38, 255, 223, 0.1)",
        },
        min: 0,
        ticks: {
          color: "white",
        },
      },
    },
  };
  let autoClass = "abs-selector";
  let burstClass = "abs-selector";
  let singleClass = "abs-selector";
  if (showAuto) autoClass += " btn-enabled";
  if (showBurst) burstClass += " btn-enabled";
  if (showSingle) singleClass += " btn-enabled";
  return (
    <div className="chart-outer-container">
      <ChartHeader
        title="Rounds Per Minute"
        description="The number of rounds fired per minute."
      />
      <div className="button-container">
        <button
          className={autoClass}
          onClick={(_) => setShowAuto(!showAuto)}
          disabled={!seenAuto}
        >
          Auto
        </button>
        <button
          className={burstClass}
          onClick={(_) => setShowBurst(!showBurst)}
          disabled={!seenBurst}
        >
          Burst
        </button>
        <button
          className={singleClass}
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
