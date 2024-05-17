import { Bar } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import StringHue, { ConfigAmmoColor } from "../../Util/StringColor.ts";
import { GetStatsForConfiguration } from "../../Data/WeaponData.ts";
import "./VelocityChart.css";
import { WeaponConfiguration } from "../WeaponConfigurator/WeaponConfigurator.tsx";
import { ConfigDisplayName } from "../../Util/LabelMaker.ts";
import { SortableWeaponData } from "./SharedTypes.ts";
import ChartHeader from "./ChartHeader.tsx";
import { Settings } from "../../Data/SettingsLoader.ts";

interface VelocityChartProps {
  weaponConfigurations: Map<string, WeaponConfiguration>;
  settings: Settings;
}

function VelocityChart(props: VelocityChartProps) {
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
    return (b.stats.velocity || 0) - (a.stats.velocity || 0);
  });
  for (const wd of weaponData) {
    // if (wd.stats.velocity === undefined) continue;
    let velocity = wd.stats.velocity;
    if (velocity === undefined) velocity = 1;
    const label = ConfigDisplayName(wd.config);
    labels.push(label);
    if (props.settings.useAmmoColorsForGraph) {
      backgroundColors.push(ConfigAmmoColor(wd.config));
    } else {
      backgroundColors.push("hsl(" + StringHue(label) + ", 50%, 50%)");
    }
    data.push(velocity);
  }
  datasets.push({
    label: "Velocity",
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
          text: "m / s",
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
      <ChartHeader title="Velocity" description="Muzzle velocity." />
      <div className="chart-container">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

export default VelocityChart;
