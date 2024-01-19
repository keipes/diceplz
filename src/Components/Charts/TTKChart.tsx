import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import StringHue from "../../Util/StringColor.ts";
import {
  GetStatsForConfiguration,
  WeaponStats,
} from "../../Data/WeaponData.ts";
import { WeaponConfiguration } from "../WeaponConfigurator/WeaponConfigurator.tsx";
import { ConfigDisplayName } from "../../Util/LabelMaker.ts";
import { Modifiers } from "../../Data/ConfigLoader.ts";
import { useState } from "react";
import RequiredRanges from "../../Util/RequiredRanges.ts";
import { TTK } from "../../Util/Conversions.ts";
import "./TTKChart.css";
import ChartHeader from "./ChartHeader.tsx";

interface TTKChartProps {
  weaponConfigurations: Map<String, WeaponConfiguration>;
  highestRangeSeen: number;
  requiredRanges: Map<number, boolean>;
  rpmSelector: string;
  title: string;
  modifiers: Modifiers;
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
    datasets.push({
      label: label,
      data: data,
      fill: false,
      borderColor: "hsl(" + StringHue(label) + ", 50%, 50%)",
      stepped: true,
    });
  }
  const labels = [];
  for (let i = 0; i <= highestRangeSeen; i++) {
    if (requiredRanges.has(i) || i == highestRangeSeen) {
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
          labelColor: (ctx) => {
            return {
              borderColor: "white",
              backgroundColor:
                "hsl(" + StringHue(ctx.dataset.label) + ", 50%, 50%)",
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
        },
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: "milliseconds",
          color: "white",
        },
        grid: {
          color: "rgba(75, 192, 192, 0.2)",
        },
        min: 0,
        ticks: {
          color: "white",
        },
      },
      x: {
        title: {
          display: true,
          text: "meters",
          color: "white",
        },
        grid: {
          color: "rgba(75, 192, 192, 0.2)",
        },
        min: 0,
        ticks: {
          color: "white",
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
