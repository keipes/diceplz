import { Bar } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import {
  GetStatsForConfiguration,
  GetWeaponByName,
} from "../../Data/WeaponData.ts";
// import "./MagazineChart.css";
import { ConfigDisplayName } from "../../Util/LabelMaker.ts";
import StringHue, { ConfigAmmoColor } from "../../Util/StringColor.ts";
import { SortableWeaponData } from "./SharedTypes.ts";
import ChartHeader from "./ChartHeader.tsx";
import { Settings } from "../../Data/SettingsLoader.ts";
import { useContext, useRef, useMemo, memo } from "react";
import { ConfiguratorContext, ThemeContext } from "../App.tsx";
import {
  GenerateScales,
  ConfigureChartColors,
} from "../../Util/ChartCommon.ts";
import { useHoverHighlight, useBarChartHoverHandler } from "./HoverContext.tsx";

interface MagazineChartProps {
  settings: Settings;
}

function MagazineChart(props: MagazineChartProps) {
  const theme = useContext(ThemeContext);
  const { currentElementHoverLabels } = useHoverHighlight();
  const chartHoverHandler = useBarChartHoverHandler();
  const chartRef = useRef<any>();
  const configurations = useContext(ConfiguratorContext);

  // Memoize weapon data processing to avoid recalculation on every render
  const weaponData = useMemo(() => {
    const data: SortableWeaponData[] = [];
    for (const [_, config] of configurations.weaponConfigurations) {
      if (!config.visible) continue;
      const stats = GetStatsForConfiguration(config);
      data.push({ config: config, stats: stats });
    }

    data.sort((a, b) => {
      const aWeapon = GetWeaponByName(a.config.name);
      let aCapacity = 0;
      if (aWeapon.ammoStats) {
        const ammoStat = aWeapon.ammoStats[a.config.ammoType];
        if (ammoStat && ammoStat.magSize) {
          aCapacity = ammoStat.magSize;
        }
      }
      const bWeapon = GetWeaponByName(b.config.name);
      let bCapacity = 0;
      if (bWeapon.ammoStats) {
        const ammoStat = bWeapon.ammoStats[b.config.ammoType];
        if (ammoStat && ammoStat.magSize) {
          bCapacity = ammoStat.magSize;
        }
      }
      return bCapacity - aCapacity;
    });

    return data;
  }, [configurations.weaponConfigurations]);

  // Memoize chart data to avoid recalculation unless dependencies change
  const chartData = useMemo((): ChartData<"bar"> => {
    const labels = [];
    const data = [];
    const backgroundColors = [];

    for (const wd of weaponData) {
      const weapon = GetWeaponByName(wd.config.name);
      if (!weapon.ammoStats) continue;
      const ammoStat = weapon.ammoStats[wd.config.ammoType];
      if (!ammoStat || !ammoStat.magSize) continue;

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
      data.push(ammoStat.magSize);
    }

    return {
      labels: labels,
      datasets: [
        {
          label: "Rounds",
          data: data,
          backgroundColor: backgroundColors,
          borderWidth: 0,
        },
      ],
    };
  }, [
    weaponData,
    props.settings,
    currentElementHoverLabels,
    theme.highlightColor,
  ]);

  // Memoize chart options to avoid recreating on every render
  const options = useMemo((): ChartOptions<"bar"> => {
    return {
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
      scales: GenerateScales("", "rounds", theme.highlightColor),
      onHover: (event, chartElement) => {
        chartHoverHandler(event, chartElement, chartRef, chartData);
      },
    };
  }, [
    theme,
    chartData,
    props.settings,
    configurations.weaponConfigurations,
    chartHoverHandler,
  ]);

  return (
    <div className="chart-outer-container">
      <ChartHeader
        title="Magazine Size"
        description="The number of rounds in a magazine. Still working on these, some ammo options (extended, drum) are missing."
      />
      <div className="chart-container">
        <Bar data={chartData} options={options} ref={chartRef} />
      </div>
    </div>
  );
}

export default memo(MagazineChart, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.settings.useAmmoColorsForGraph ===
    nextProps.settings.useAmmoColorsForGraph
  );
});
