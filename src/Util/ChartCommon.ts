//@ts-nocheck
import StringHue, { ConfigAmmoColor } from "./StringColor";
import { ConfigDisplayName } from "./LabelMaker";
import { Settings } from "../Data/SettingsLoader";
import { WeaponConfiguration } from "../Components/WeaponConfigurator/WeaponConfigurator";

function GenerateScales(xAxisLabel: string, yAxisLabel: string, color: string) {
  return {
    y: {
      title: {
        display: yAxisLabel !== "",
        text: yAxisLabel,
        color: color,
      },
      grid: {
        color: "rgba(75, 192, 192, 0.2)",
      },
      // min: 0,
      ticks: {
        color: color,
      },
    },
    x: {
      title: {
        display: xAxisLabel !== "",
        text: xAxisLabel,
        color: color,
      },
      grid: {
        color: "rgba(75, 192, 192, 0.2)",
      },
      min: 0,
      ticks: {
        color: color,
        autoSkip: true,
        callback: function (val: any, index: number): string {
          // if the label can be parsed into an int, only use every 10th label, otherwise just return the label as-is
          // since these are usually just configuration name strings
          const label = this.getLabelForValue(val);
          if (Number.isNaN(parseInt(label))) {
            return label;
          } else {
            return index % 10 === 0 ? label : "";
          }
        },
        // stepSize: 1,
        // min: 0,
        // max: 150,
      },
    },
  };
}

function ConfigureChartColors(
  config: WeaponConfiguration,
  settings: Settings,
  currentElementHoverLabels: Set<string>,
  highlightColor: string
): string {
  const label = ConfigDisplayName(config);
  if (currentElementHoverLabels.has(label)) {
    return highlightColor;
  } else if (settings.useAmmoColorsForGraph) {
    return ConfigAmmoColor(config);
  } else {
    return "hsl(" + StringHue(label) + ", 50%, 50%)";
  }
}

export { GenerateScales, ConfigureChartColors };
