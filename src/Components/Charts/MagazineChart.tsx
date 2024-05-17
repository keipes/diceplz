import { Bar } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import StringHue, { ConfigAmmoColor } from "../../Util/StringColor.ts";
import {
  GetStatsForConfiguration,
  GetWeaponByName,
} from "../../Data/WeaponData.ts";
// import "./MagazineChart.css";
import { WeaponConfiguration } from "../WeaponConfigurator/WeaponConfigurator.tsx";
import { ConfigDisplayName } from "../../Util/LabelMaker.ts";
import { SortableWeaponData } from "./SharedTypes.ts";
import ChartHeader from "./ChartHeader.tsx";
import { Settings } from "../../Data/SettingsLoader.ts";

interface MagazineChartProps {
  weaponConfigurations: Map<string, WeaponConfiguration>;
  settings: Settings;
}

function MagazineChart(props: MagazineChartProps) {
  const labels = [];
  const datasets = [];
  const data = [];
  const backgroundColors = [];
  const weaponData: SortableWeaponData[] = [];
  for (const [_, config] of props.weaponConfigurations) {
    if (!config.visible) continue;
    const stats = GetStatsForConfiguration(config);
    weaponData.push({ config: config, stats: stats });
  }
  weaponData.sort((a, b) => {
    // const aValues: number[] = [];
    // const bValues: number[] = [];
    const aWeapon = GetWeaponByName(a.config.name);
    let aCapacity = 0;
    if (aWeapon.ammoStats) {
      const ammoStat = aWeapon.ammoStats[a.config.ammoType];
      if (ammoStat) {
        if (ammoStat.magSize) {
          aCapacity = ammoStat.magSize;
        }
      }
    }
    const bWeapon = GetWeaponByName(b.config.name);
    let bCapacity = 0;
    if (bWeapon.ammoStats) {
      const ammoStat = bWeapon.ammoStats[a.config.ammoType];
      if (ammoStat) {
        if (ammoStat.magSize) {
          bCapacity = ammoStat.magSize;
        }
      }
    }
    return bCapacity - aCapacity;
    // return Math.max(...aValues) - Math.max(...bValues);
    // return (b.stats.velocity || 0) - (a.stats.velocity || 0);
  });
  for (const wd of weaponData) {
    const weapon = GetWeaponByName(wd.config.name);
    if (!weapon.ammoStats) continue;
    const ammoStat = weapon.ammoStats[wd.config.ammoType];
    if (!ammoStat) continue;
    if (!ammoStat.magSize) continue;
    let velocity = wd.stats.velocity;
    if (velocity === undefined) velocity = 1;
    const label = ConfigDisplayName(wd.config);
    labels.push(label);
    if (props.settings.useAmmoColorsForGraph) {
      backgroundColors.push(ConfigAmmoColor(wd.config));
    } else {
      backgroundColors.push("hsl(" + StringHue(label) + ", 50%, 50%)");
    }
    data.push(ammoStat.magSize);
  }
  datasets.push({
    label: "Rounds",
    data: data,
    backgroundColor: backgroundColors,
    borderWidth: 0,
  });
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
        itemSort: function (a, b) {
          return (b.raw as number) - (a.raw as number);
        },
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
    },
  };
  return (
    <div className="chart-outer-container">
      <ChartHeader
        title="Magazine Size"
        description="The number of rounds in a magazine. Still working on these, some ammo options (extended, drum) are missing."
      />
      <div className="chart-container">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

export default MagazineChart;
