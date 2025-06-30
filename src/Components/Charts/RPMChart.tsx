import { Bar } from "../../Charts/chartjs/Bar";
import type { ChartData, ChartOptions } from "chart.js";
import { GetStatsForConfiguration } from "../../Data/WeaponData.ts";
import { useContext, useState, useRef, useMemo, memo } from "react";
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
  const configurations = useContext(ConfiguratorContext);

  // Memoize weapon data processing
  const { weaponData, fireModeAvailability } = useMemo(() => {
    const data: SortableWeaponData[] = [];
    let seenAuto = false;
    let seenBurst = false;
    let seenSingle = false;

    for (const [_, config] of configurations.weaponConfigurations) {
      if (!config.visible) continue;
      const stats = GetStatsForConfiguration(config);
      seenAuto = seenAuto || typeof stats.rpmAuto === "number";
      seenBurst = seenBurst || typeof stats.rpmBurst === "number";
      seenSingle = seenSingle || typeof stats.rpmSingle === "number";
      data.push({ config: config, stats: stats });
    }

    return {
      weaponData: data,
      fireModeAvailability: { seenAuto, seenBurst, seenSingle },
    };
  }, [configurations.weaponConfigurations]);

  const { seenAuto, seenBurst, seenSingle } = fireModeAvailability;
  const showAuto = _showAuto && seenAuto;
  const showSingle = _showSingle && seenSingle;
  const showBurst = _showBurst && seenBurst;

  // Memoize chart data calculation
  const chartData = useMemo((): ChartData<"bar"> => {
    const sortedWeaponData = [...weaponData].sort((a, b) => {
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

    const labels = [];
    const datasets = [];
    const data = [];
    const burstData = [];
    const burstBackgroundColors = [];
    const backgroundColors = [];
    const singleData = [];
    const singleBackgroundColors = [];

    for (const wd of sortedWeaponData) {
      const stats = wd.stats;
      const config = wd.config;
      const weaponName = ConfigDisplayName(config);
      labels.push(weaponName);

      const color = ConfigureChartColors(
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

    return {
      labels: labels,
      datasets: datasets,
    };
  }, [
    weaponData,
    showAuto,
    showBurst,
    showSingle,
    props.settings,
    currentElementHoverLabels,
    theme.highlightColor,
  ]);

  // Memoize chart options
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
    };
  }, [theme, props.settings, chartData]);
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
        <Bar
          config={{
            type: "bar",
            data: chartData,
            options: options,
          }}
          chartRef={chartRef}
          enableHover={true}
          hoverHandler={chartHoverHandler}
        />
      </div>
    </div>
  );
}

export default memo(RPMChart, (prevProps, nextProps) => {
  return (
    prevProps.settings.useAmmoColorsForGraph ===
    nextProps.settings.useAmmoColorsForGraph
  );
});
