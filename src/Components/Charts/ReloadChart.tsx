import { Bar } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import {
  GetStatsForConfiguration,
  GetWeaponByName,
} from "../../Data/WeaponData.ts";
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

interface ReloadChartProps {
  settings: Settings;
}

function ReloadChart(props: ReloadChartProps) {
  const theme = useContext(ThemeContext);
  const { currentElementHoverLabels } = useHoverHighlight();
  const chartHoverHandler = useBarChartHoverHandler();
  const chartRef = useRef<any>();
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
  const configurations = useContext(ConfiguratorContext);
  for (const [_, config] of configurations.weaponConfigurations) {
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
      const ammoStat = bWeapon.ammoStats[b.config.ammoType];
      if (ammoStat) {
        if (showEmpty && ammoStat.emptyReload) {
          bValues.push(ammoStat.emptyReload);
        }
        if (showTactical && ammoStat.tacticalReload) {
          bValues.push(ammoStat.tacticalReload);
        }
      }
    }
    let aMax = Math.max(...aValues);
    if (aMax == -Infinity) {
      aMax = Infinity;
    }
    let bMax = Math.max(...bValues);
    if (bMax == -Infinity) {
      bMax = Infinity;
    }
    return aMax - bMax;
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
    let color;
    color = ConfigureChartColors(
      config,
      props.settings,
      currentElementHoverLabels,
      theme.highlightColor
    );
    if (showEmpty) {
      if (ammoStats && ammoStats.emptyReload) {
        data.push(ammoStats.emptyReload);
        backgroundColors.push(color);
      } else {
        data.push(null);
        backgroundColors.push(color);
      }
    }
    if (showTactical) {
      if (ammoStats && ammoStats.tacticalReload) {
        tacticalData.push(ammoStats.tacticalReload);
        tacticalBackgroundColors.push(color);
      } else {
        tacticalData.push(null);
        tacticalBackgroundColors.push(color);
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
    scales: GenerateScales("", "seconds", theme.highlightColor),
    onHover: (event, chartElement) => {
      chartHoverHandler(event, chartElement, chartRef, chartData);
    },
  };
  return (
    <div className="chart-outer-container">
      <ChartHeader
        title="Reload Time"
        description="Time to reload the weapon. Empty reload is when the weapon is completely out of ammo. Tactical reload is when the weapon still has ammo in the magazine."
      />
      <div>
        <label>
          <input
            type="checkbox"
            checked={_showEmpty}
            onChange={(e) => setShowEmpty(e.target.checked)}
          />
          Empty
        </label>
        <label>
          <input
            type="checkbox"
            checked={_showTactical}
            onChange={(e) => setShowTactical(e.target.checked)}
          />
          Tactical
        </label>
      </div>
      <div className="chart-container">
        <Bar data={chartData} options={options} ref={chartRef} />
      </div>
    </div>
  );
}

export default memo(ReloadChart, (prevProps, nextProps) => {
  return (
    prevProps.settings.useAmmoColorsForGraph ===
    nextProps.settings.useAmmoColorsForGraph
  );
});
