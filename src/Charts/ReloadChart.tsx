import { Bar } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import StringHue from "../StringColor.ts";
import { GetStatsForConfiguration, GetWeaponByName } from "../WeaponData.ts";
import { useState } from "react";
// import "./ReloadChart.css";
import { WeaponConfiguration } from "../WeaponConfigurator/WeaponConfigurator.tsx";
import { ConfigDisplayName } from "../LabelMaker.ts";
import { SortableWeaponData } from "./SharedTypes.ts";

interface ReloadChartProps {
  weaponConfigurations: Map<string, WeaponConfiguration>;
}

function ReloadChart(props: ReloadChartProps) {
  const [_showEmpty, setShowEmpty] = useState(true);
  const [_showTactical, setShowTactical] = useState(true);
  const labels = [];
  const datasets = [];
  const data = [];
  const tacticalData = [];
  const tacticalBackgroundColors = [];
  const backgroundColors = [];
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
  const showEmpty = _showEmpty && seenAuto;
  const showTactical = _showTactical && seenBurst;
  weaponData.sort((a, b) => {
    const aValues: number[] = [];
    const bValues: number[] = [];

    const aWeapon = GetWeaponByName(a.config.name);
    // let aTime = 0;
    if (aWeapon.ammoStats) {
      const ammoStat = aWeapon.ammoStats[a.config.ammoType];
      if (ammoStat) {
        if (showEmpty && ammoStat.emptyReload) {
          aValues.push(ammoStat.emptyReload);
        }
        if (showTactical && ammoStat.tacticalReload) {
          aValues.push(ammoStat.tacticalReload);
        }
        // aTime = ammoStat.emptyReload;
      }
    }
    // let bTime = 0;
    const bWeapon = GetWeaponByName(b.config.name);
    if (bWeapon.ammoStats) {
      const ammoStat = bWeapon.ammoStats[a.config.ammoType];
      if (ammoStat) {
        if (showEmpty && ammoStat.emptyReload) {
          bValues.push(ammoStat.emptyReload);
        }
        if (showTactical && ammoStat.tacticalReload) {
          bValues.push(ammoStat.tacticalReload);
        }
        // bTime = ammoStat.emptyReload;
      }
    }
    // return aTime - bTime;
    // if (showEmpty) {
    //   aValues.push(a.stats.rpmAuto || 0);
    //   bValues.push(b.stats.rpmAuto || 0);
    // }
    // if (showTactical) {
    //   aValues.push(a.stats.rpmBurst || 0);
    //   bValues.push(b.stats.rpmBurst || 0);
    // }
    return Math.max(...aValues) - Math.max(...bValues);
  });
  for (const wd of weaponData) {
    const config = wd.config;
    const weaponName = ConfigDisplayName(config);
    labels.push(weaponName);
    const weapon = GetWeaponByName(config.name);
    let ammoStats;
    if (weapon.ammoStats) {
      ammoStats = weapon.ammoStats[config.ammoType];
    }
    if (showEmpty) {
      if (ammoStats && ammoStats.emptyReload) {
        data.push(ammoStats.emptyReload);
        backgroundColors.push("hsl(" + StringHue(weaponName) + ", 50%, 50%)");
      } else {
        data.push(null);
        backgroundColors.push("hsl(" + StringHue(weaponName) + ", 50%, 50%)");
      }
    }
    if (showTactical) {
      if (ammoStats && ammoStats.tacticalReload) {
        tacticalData.push(ammoStats.tacticalReload);
        tacticalBackgroundColors.push(
          "hsl(" + StringHue(weaponName) + ", 50%, 50%)"
        );
      } else {
        tacticalData.push(null);
        tacticalBackgroundColors.push(
          "hsl(" + StringHue(weaponName) + ", 50%, 50%)"
        );
      }
    }
  }
  if (showEmpty) {
    datasets.push({
      label: "Empty",
      data: data,
      backgroundColor: backgroundColors,
      borderWidth: 0,
    });
  }
  if (showTactical) {
    datasets.push({
      label: "Tactical",
      data: tacticalData,
      backgroundColor: tacticalBackgroundColors,
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
          text: "seconds",
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
  let emptyClass = "abs-selector";
  let tacticalClass = "abs-selector";
  if (showEmpty) emptyClass += " btn-enabled";
  if (showTactical) tacticalClass += " btn-enabled";
  return (
    <div className="chart-outer-container">
      <h2>Reload Time</h2>
      <div className="button-container">
        <button
          className={emptyClass}
          onClick={(_) => setShowEmpty(!showEmpty)}
          disabled={!seenAuto}
        >
          Empty
        </button>
        <button
          className={tacticalClass}
          onClick={(_) => setShowTactical(!showTactical)}
          disabled={!seenBurst}
        >
          Tactical
        </button>
      </div>
      <div className="chart-container">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

export default ReloadChart;
