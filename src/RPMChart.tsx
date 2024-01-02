import { Bar, Line } from "react-chartjs-2";
import StringHue from "./StringColor.ts";
import { GetStatsForConfiguration, WeaponStats } from "./WeaponData.ts";
import { WeaponSelections } from "./App.tsx";
import { useState } from "react";
import "./RPMChart.css";
import { WeaponConfiguration } from "./WeaponConfigurator.tsx";

interface RPMChartProps {
  selectedWeapons: Map<string, WeaponSelections>;
  selectedWeaponsData: Map<string, WeaponStats>;
  weaponConfigurations: Map<String, WeaponConfiguration>;
}

function RPMChart(props: RPMChartProps) {
  const [showAuto, setShowAuto] = useState(true);
  const [showSingle, setShowSingle] = useState(true);
  const [showBurst, setShowBurst] = useState(true);
  const labels = [];
  const datasets = [];
  const data = [];
  const burstData = [];
  const burstBackgroundColors = [];
  const backgroundColors = [];
  const singleData = [];
  const singleBackgroundColors = [];
  const weaponData = [];
  for (const [_, config] of props.weaponConfigurations) {
    if (!config.visible) continue;
    const stats = GetStatsForConfiguration(config);
    weaponData.push([config.name, stats]);
  }
  weaponData.sort((a, b) => {
    const aValues = [];
    const bValues = [];
    if (showAuto) {
      aValues.push(a[1].rpmAuto || 0);
      bValues.push(b[1].rpmAuto || 0);
    }
    if (showBurst) {
      aValues.push(a[1].rpmBurst || 0);
      bValues.push(b[1].rpmBurst || 0);
    }
    if (showSingle) {
      aValues.push(a[1].rpmSingle || 0);
      bValues.push(b[1].rpmSingle || 0);
    }
    return Math.max(...bValues) - Math.max(...aValues);
  });
  for (const [weaponName, stats] of weaponData) {
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
  const chartData = {
    labels: labels,
    datasets: datasets,
  };
  const options = {
    maintainAspectRatio: false,
    animation: false,
    spanGaps: true,
    interaction: {
      intersect: false,
      mode: "index",
    },
    plugins: {
      tooltip: {
        //   itemSort: function(a, b) {
        //     return b.raw - a.raw;
        //   },
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
    stepped: true,
    scales: {
      y: {
        title: {
          display: true,
          text: "rpm",
        },
        grid: {
          color: "rgba(38, 255, 223, 0.1)",
        },
        min: 0,
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
      },
    },
  };
  let autoClass = "abs-selector";
  let burstClass = "abs-selector";
  let singleClass = "abs-selector";
  if (showAuto) autoClass += " enabled";
  if (showBurst) burstClass += " enabled";
  if (showSingle) singleClass += " enabled";
  return (
    <div>
      <h2>RPM</h2>
      <div className="button-container">
        <button className={autoClass} onClick={(_) => setShowAuto(!showAuto)}>
          Auto
        </button>
        <button
          className={burstClass}
          onClick={(_) => setShowBurst(!showBurst)}
        >
          Burst
        </button>
        <button
          className={singleClass}
          onClick={(_) => setShowSingle(!showSingle)}
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
