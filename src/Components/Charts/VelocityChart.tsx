import { Bar } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { GetStatsForConfiguration } from "../../Data/WeaponData.ts";
import { ConfigDisplayName } from "../../Util/LabelMaker.ts";
import StringHue, { ConfigAmmoColor } from "../../Util/StringColor.ts";
import { SortableWeaponData } from "./SharedTypes.ts";
import ChartHeader from "./ChartHeader.tsx";
import { Settings } from "../../Data/SettingsLoader.ts";
import { useContext, useRef } from "react";
import { ConfiguratorContext, ThemeContext } from "../App.tsx";
import {
  GenerateScales,
  ConfigureChartColors,
} from "../../Util/ChartCommon.ts";
import { useHoverHighlight, useBarChartHoverHandler } from "./HoverContext.tsx";

interface VelocityChartProps {
  settings: Settings;
}

function VelocityChart(props: VelocityChartProps) {
  const theme = useContext(ThemeContext);
  const { currentElementHoverLabels } = useHoverHighlight();
  const chartHoverHandler = useBarChartHoverHandler();
  const chartRef = useRef<any>();
  const labels = [];
  const datasets = [];
  const data = [];
  const backgroundColors = [];
  const weaponData: SortableWeaponData[] = [];
  const configurations = useContext(ConfiguratorContext);
  for (const [_, config] of configurations.weaponConfigurations) {
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
    backgroundColors.push(
      ConfigureChartColors(
        wd.config,
        props.settings,
        currentElementHoverLabels,
        theme.highlightColor
      )
    );
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
        backgroundColor: theme.tooltipBg,
        bodyColor: theme.tooltipBody,
        titleColor: theme.tooltipTitle,
        borderColor: theme.tooltipBg,
        borderWidth: 1,
        multiKeyBackground: theme.tooltipBg,
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
          labelColor: function (ctx) {
            // Force the label color indicator to use the original color, not the highlight color
            const hoveredLabel = chartData.labels?.[ctx.dataIndex] as string;
            if (props.settings.useAmmoColorsForGraph) {
              // Find the config by label to get the original color
              for (const [_, config] of configurations.weaponConfigurations) {
                if (ConfigDisplayName(config) === hoveredLabel) {
                  return {
                    borderColor: ConfigAmmoColor(config),
                    backgroundColor: ConfigAmmoColor(config),
                  };
                }
              }
            } else {
              const originalColor =
                "hsl(" + StringHue(hoveredLabel) + ", 50%, 50%)";
              return {
                borderColor: originalColor,
                backgroundColor: originalColor,
              };
            }
            return {
              borderColor: theme.tooltipBody,
              backgroundColor: theme.tooltipBody,
            };
          },
        },
      },
    },
    scales: GenerateScales("", "m / s", theme.highlightColor),
    onHover: (event, chartElement) => {
      chartHoverHandler(event, chartElement, chartRef, chartData);
    },
  };
  return (
    <div className="chart-outer-container">
      <ChartHeader title="Velocity" description="Muzzle velocity." />
      <div className="chart-container">
        <Bar data={chartData} options={options} ref={chartRef} />
      </div>
    </div>
  );
}

export default VelocityChart;
