import { Line } from "react-chartjs-2";
import {
  ChartType,
  Interaction,
  InteractionItem,
  TooltipPositionerFunction,
  type ChartData,
  type ChartOptions,
  type InteractionModeFunction,
} from "chart.js";
import StringHue, { ConfigAmmoColor } from "../../Util/StringColor.ts";
import {
  GetStatsForConfiguration,
  WeaponStats,
} from "../../Data/WeaponData.ts";
import { WeaponConfiguration } from "../WeaponConfigurator/WeaponConfigurator.tsx";
import { ConfigDisplayName } from "../../Util/LabelMaker.ts";
import { Modifiers } from "../../Data/ConfigLoader.ts";
import { useContext, useState } from "react";
import RequiredRanges from "../../Util/RequiredRanges.ts";
import { TTK } from "../../Util/Conversions.ts";
import "./TTKChart.css";
import ChartHeader from "./ChartHeader.tsx";
import { Settings } from "../../Data/SettingsLoader.ts";
import { ThemeContext } from "../App.tsx";
// import { getRelativePosition } from "chart.js/helpers";

// declare module 'chart.js' {
//   interface InteractionModeMap {
//     myCustomMode: InteractionModeFunction;
//   }
// }

// /**
//  * Custom interaction mode
//  * @function Interaction.modes.myCustomMode
//  * @param {Chart} chart - the chart we are returning items from
//  * @param {Event} e - the event we are find things at
//  * @param {InteractionOptions} options - options to use
//  * @param {boolean} [useFinalPosition] - use final element position (animation target)
//  * @return {InteractionItem[]} - items that are found
//  */
// //import { Chart } from 'chart.js'; // Import the Chart type

// Interaction.modes.myCustomMode = function(chart, e, options, useFinalPosition) { // Add the Chart type to the chart parameter
//   const position = getRelativePosition(e, chart);

//   const items: InteractionItem[] = [];
//   Interaction.evaluateInteractionItems(chart, 'x', position, (element, datasetIndex, index) => {
//     if (element.inXRange(position.x, useFinalPosition) && myCustomLogic(element)) {
//       items.push({element, datasetIndex, index});
//     }
//   });
//   return items;
// };
declare module "chart.js" {
  interface TooltipPositionerMap {
    myCustomPositioner: TooltipPositionerFunction<ChartType>;
  }
}

import { Tooltip } from "chart.js";

/**
 * Custom positioner
 * @function Tooltip.positioners.myCustomPositioner
 * @param elements {Chart.Element[]} the tooltip elements
 * @param eventPosition {Point} the position of the event in canvas coordinates
 * @returns {TooltipPosition} the tooltip position
 */
Tooltip.positioners.myCustomPositioner = function (elements, eventPosition) {
  // A reference to the tooltip model
  const tooltip = this;

  /* ... */
  const padding = tooltip.chart.width / 80;
  let offset = tooltip.width / 2 + padding;
  if (eventPosition.x + tooltip.width + padding > tooltip.chart.width) {
    offset = -offset;
  }
  return {
    x: eventPosition.x + offset,
    y: tooltip.chart.chartArea.bottom,
    xAlign: "center",
    yAlign: "bottom",
    // You may also include xAlign and yAlign to override those tooltip options.
  };
};

interface TTKChartProps {
  weaponConfigurations: Map<String, WeaponConfiguration>;
  highestRangeSeen: number;
  requiredRanges: Map<number, boolean>;
  rpmSelector: string;
  title: string;
  modifiers: Modifiers;
  settings: Settings;
}

interface RPMSelectorFn {
  (stats: WeaponStats): number | undefined;
}

const FIREMODE_AUTO = "auto";
const FIREMODE_BURST = "burst";
const FIREMODE_SINGLE = "single";
const SELECTOR_AUTO: RPMSelectorFn = (stats: WeaponStats) => stats.rpmAuto;
const SELECTOR_BURST: RPMSelectorFn = (stats: WeaponStats) => stats.rpmBurst;
const SELECTOR_SINGLE: RPMSelectorFn = (stats: WeaponStats) => stats.rpmSingle;

function TTKChart(props: TTKChartProps) {
  const [_selectedFireMode, setSelectedFireMode] = useState(FIREMODE_AUTO);
  const theme = useContext(ThemeContext);

  let autoClass = "abs-selector";
  let burstClass = "abs-selector";
  let singleClass = "abs-selector";
  let rpmSelector: RPMSelectorFn = (_) => {
    throw new Error("Undefined weapon selector.");
  };

  const highestRangeSeen = props.highestRangeSeen;
  const datasets = [];
  let seenAuto = false;
  let seenBurst = false;
  let seenSingle = false;
  let selectedFireMode = _selectedFireMode;
  for (const [_id, config] of props.weaponConfigurations) {
    const stats = GetStatsForConfiguration(config);
    seenAuto = seenAuto || typeof stats.rpmAuto === "number";
    seenBurst = seenBurst || typeof stats.rpmBurst === "number";
    seenSingle = seenSingle || typeof stats.rpmSingle === "number";
  }
  switch (_selectedFireMode) {
    case FIREMODE_AUTO:
      if (!seenAuto) {
        if (seenBurst) {
          selectedFireMode = FIREMODE_BURST;
        } else if (seenSingle) {
          selectedFireMode = FIREMODE_SINGLE;
        }
      }
      break;
    case FIREMODE_BURST:
      if (!seenBurst) {
        if (seenAuto) {
          selectedFireMode = FIREMODE_AUTO;
        } else if (seenSingle) {
          selectedFireMode = FIREMODE_SINGLE;
        }
      }
      break;
    case FIREMODE_SINGLE:
      if (!seenSingle) {
        if (seenAuto) {
          selectedFireMode = FIREMODE_AUTO;
        } else if (seenBurst) {
          selectedFireMode = FIREMODE_BURST;
        }
      }
      break;
  }
  switch (selectedFireMode) {
    case FIREMODE_AUTO:
      if (seenAuto) autoClass += " enabled";
      rpmSelector = SELECTOR_AUTO;
      break;
    case FIREMODE_BURST:
      if (seenBurst) burstClass += " enabled";
      rpmSelector = SELECTOR_BURST;
      break;
    case FIREMODE_SINGLE:
      if (seenSingle) singleClass += " enabled";
      rpmSelector = SELECTOR_SINGLE;
      break;
  }
  const requiredRanges = RequiredRanges(
    props.weaponConfigurations,
    (config, damage) => {
      const stat = GetStatsForConfiguration(config);
      return TTK(config, props.modifiers, damage, rpmSelector(stat) || 0);
    }
  );
  for (const [_id, config] of props.weaponConfigurations) {
    if (!config.visible) continue;
    const stats = GetStatsForConfiguration(config);
    seenAuto = seenAuto || typeof stats.rpmAuto === "number";
    seenBurst = seenBurst || typeof stats.rpmBurst === "number";
    seenSingle = seenSingle || typeof stats.rpmSingle === "number";
  }
  const configColors = new Map();
  for (const [_id, config] of props.weaponConfigurations) {
    if (!config.visible) continue;
    const stats = GetStatsForConfiguration(config);
    const data = [];
    let lastDamage = 0;
    let lastRange = 0;
    let range = 0;
    let damage = 0;
    for (let dropoff of stats.dropoffs) {
      range = dropoff.range;
      damage = dropoff.damage;
      for (let i = lastRange + 1; i < range; i++) {
        const rpm = rpmSelector(stats);
        if (requiredRanges.has(i) && rpm) {
          data.push(TTK(config, props.modifiers, lastDamage, rpm));
        } else {
          data.push(null);
        }
      }
      lastDamage = damage;
      lastRange = range;
      const rpm = rpmSelector(stats);
      if (requiredRanges.has(dropoff.range) && rpm) {
        data.push(TTK(config, props.modifiers, damage, rpm));
      } else {
        data.push(null);
      }
    }
    if (damage > 0) {
      for (let i = range + 1; i < highestRangeSeen; i++) {
        const rpm = rpmSelector(stats);
        if (requiredRanges.has(i) && rpm) {
          data.push(TTK(config, props.modifiers, damage, rpm));
        } else {
          data.push(null);
        }
      }
      if (range != highestRangeSeen) {
        const rpm = rpmSelector(stats);
        if (rpm) {
          data.push(TTK(config, props.modifiers, damage, rpm));
        } else {
          data.push(null);
        }
      }
    }
    const label = ConfigDisplayName(config);
    if (props.settings.useAmmoColorsForGraph) {
      configColors.set(label, ConfigAmmoColor(config));
    } else {
      configColors.set(label, "hsl(" + StringHue(label) + ", 50%, 50%)");
    }
    datasets.push({
      label: label,
      data: data,
      fill: false,
      borderColor: configColors.get(label),
      stepped: true,
    });
  }
  const labels = [];
  for (let i = 0; i <= highestRangeSeen; i++) {
    if ((requiredRanges.has(i) && i % 10 == 0) || i == highestRangeSeen) {
      labels.push(i);
    } else {
      labels.push("");
    }
  }
  const chartData: ChartData<"line"> = {
    labels: labels,
    datasets: datasets,
  };
  const options: ChartOptions<"line"> = {
    maintainAspectRatio: false,
    animation: false,
    spanGaps: true,
    // events: {
    onHover: (event, activeElements) => {
      const element = activeElements[0];
      if (element) {
        // console.log(element);
        // element.datasetIndex;
        // const _data = data[element.datasetIndex];
        // const dataset = element.dataset;
        // const index = element.dataIndex;
        // const label = dataset.label;
        // const value = dataset.data[index];
        // console.log(label, index, value);
      }
    },
    // },
    elements: {
      point: {
        radius: 0,
        // hitRadius: 0,
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
      // axis: "x",
    },
    hover: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      tooltip: {
        filter: function (tooltipItem, index, array, data) {
          // console.log(tooltipItem.raw);
          // console.log(index);
          // console.log(array);
          // console.log(data);
          // console.log("----");
          return true;
          // return tooltipItem.value !== null;
        },
        intersect: false,
        position: "myCustomPositioner",
        backgroundColor: theme.tooltipBg,
        bodyColor: theme.tooltipBody,
        titleColor: theme.tooltipTitle,
        itemSort: function (a, b) {
          return (b.raw as number) - (a.raw as number);
        },
        callbacks: {
          labelColor: (ctx) => {
            return {
              borderColor: theme.highlightColor,
              backgroundColor: configColors.get(ctx.dataset.label),
            };
          },
          label: function (ctx) {
            let label = ctx.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (ctx.parsed.y !== null) {
              label += ctx.parsed.y;
            }
            return label;
          },
          title: function (ctx) {
            // console.log(ctx[0].dataIndex);
            // console.log(ctx[0].label);
            return String(ctx[0].label ? ctx[0].label : ctx[0].dataIndex);
          },
        },
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: "milliseconds",
          color: theme.highlightColor,
        },
        grid: {
          color: "rgba(75, 192, 192, 0.2)",
        },
        // min: 0,
        ticks: {
          color: theme.highlightColor,
        },
      },
      x: {
        title: {
          display: true,
          text: "meters",
          color: theme.highlightColor,
        },
        grid: {
          color: "rgba(75, 192, 192, 0.2)",
        },
        min: 0,
        ticks: {
          color: theme.highlightColor,
          autoSkip: false,
        },
      },
    },
  };

  return (
    <div className="chart-outer-container">
      <ChartHeader
        title={props.title}
        description="TTK (Time to Kill) is determined by the formula: TTK = (BTK - 1) / (RPM * 60 / 1000). This considers the Bullets to Kill (BTK), subtracting 1, and dividing by the weapon's Rate of Fire (RPM) converted to rounds per second. The result indicates the time it takes to eliminate an opponent with the weapon, incorporating both damage and firing rate."
      />
      <div className="button-container">
        <button
          className={autoClass}
          onClick={(_) => setSelectedFireMode(FIREMODE_AUTO)}
          disabled={!seenAuto}
        >
          Auto
        </button>
        <button
          className={burstClass}
          onClick={(_) => setSelectedFireMode(FIREMODE_BURST)}
          disabled={!seenBurst}
        >
          Burst
        </button>
        <button
          className={singleClass}
          onClick={(_) => setSelectedFireMode(FIREMODE_SINGLE)}
          disabled={!seenSingle}
        >
          Single
        </button>
      </div>
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

export default TTKChart;
