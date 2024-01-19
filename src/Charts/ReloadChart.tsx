import { Bar } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import StringHue from "../StringColor.ts";
import { GetStatsForConfiguration, GetWeaponByName } from "../WeaponData.ts";
import { useState } from "react";
// import "./ReloadChart.css";
import { WeaponConfiguration } from "../WeaponConfigurator/WeaponConfigurator.tsx";
import { ConfigDisplayName } from "../LabelMaker.ts";
import { SortableWeaponData } from "./SharedTypes.ts";
import ChartHeader from "./ChartHeader.tsx";

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
  let seenEmpty = false;
  let seenTactical = false;
  for (const [_, config] of props.weaponConfigurations) {
    if (!config.visible) continue;
    const stats = GetStatsForConfiguration(config);
    weaponData.push({ config: config, stats: stats });
    const weapon = GetWeaponByName(config.name);
    if (weapon.ammoStats) {
      const ammoStat = weapon.ammoStats[config.ammoType];
      if (ammoStat) {
        if (ammoStat.emptyReload) {
          seenEmpty = true;
        }
        if (ammoStat.tacticalReload) {
          seenTactical = true;
        }
      }
    }
  }
  const showEmpty = _showEmpty && seenEmpty;
  const showTactical = _showTactical && seenTactical;
  weaponData.sort((a, b) => {
    const aValues: number[] = [];
    const bValues: number[] = [];
    const aWeapon = GetWeaponByName(a.config.name);
    if (aWeapon.ammoStats) {
      const ammoStat = aWeapon.ammoStats[a.config.ammoType];
      if (ammoStat) {
        if (showEmpty && ammoStat.emptyReload) {
          aValues.push(ammoStat.emptyReload);
        }
        if (showTactical && ammoStat.tacticalReload) {
          aValues.push(ammoStat.tacticalReload);
        }
      }
    }
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
      }
    }
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
      <ChartHeader
        title="Reload Time"
        description="Time to reload the weapon. Empty reload is when the weapon is completely out of ammo. Tactical reload is when the weapon still has ammo in the magazine."
      />
      <div className="button-container">
        <button
          className={emptyClass}
          onClick={(_) => setShowEmpty(!showEmpty)}
          disabled={!seenEmpty}
        >
          Empty
        </button>
        <button
          className={tacticalClass}
          onClick={(_) => setShowTactical(!showTactical)}
          disabled={!seenTactical}
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
