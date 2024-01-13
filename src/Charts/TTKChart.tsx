import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import StringHue from "../StringColor.ts";
import {
  GetStatsForConfiguration,
  GetWeaponByName,
  WeaponStats,
} from "../WeaponData.ts";
import { WeaponConfiguration } from "../WeaponConfigurator/WeaponConfigurator.tsx";
import { ConfigDisplayName } from "../LabelMaker.ts";
import { Modifiers } from "../Data/ConfigLoader.ts";
import { useState } from "react";

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

const damageToTTK = function (
  stats: WeaponStats,
  damage: number,
  rpmSelector: RPMSelectorFn,
  healthMultiplier: number
) {
  const btk = Math.ceil((healthMultiplier * 100) / damage);
  const rpm = rpmSelector(stats);
  if (rpm === undefined) {
    return null;
  }
  return Math.round((1000 / (rpm / 60)) * (btk - 1));
};

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
  const requiredRanges = props.requiredRanges;
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

  for (const [_id, config] of props.weaponConfigurations) {
    if (!config.visible) continue;
    const stats = GetStatsForConfiguration(config);
    const weapon = GetWeaponByName(config.name);
    const data = [];
    let lastDamage = 0;
    let lastRange = 0;
    let range = 0;
    let damage = 0;
    const damageMultiplier =
      props.modifiers.damageMultiplier * props.modifiers.bodyDamageMultiplier;
    seenAuto = seenAuto || typeof stats.rpmAuto === "number";
    seenBurst = seenBurst || typeof stats.rpmBurst === "number";
    seenSingle = seenSingle || typeof stats.rpmSingle === "number";
    for (let dropoff of stats.dropoffs) {
      range = dropoff.range;
      let pelletMultiplier = 1;
      if (weapon.pelletCounts) {
        const pelletCount = weapon.pelletCounts[config.ammoType];
        if (pelletCount !== undefined) {
          pelletMultiplier = pelletCount;
        }
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
      damage = dropoff.damage * damageMultiplier * pelletMultiplier;
      for (let i = lastRange + 1; i < range; i++) {
        if (requiredRanges.has(i)) {
          data.push(
            damageToTTK(
              stats,
              lastDamage,
              rpmSelector,
              props.modifiers.healthMultiplier
            )
          );
        } else {
          data.push(null);
        }
      }
      lastDamage = damage;
      lastRange = range;
      data.push(
        damageToTTK(
          stats,
          damage,
          rpmSelector,
          props.modifiers.healthMultiplier
        )
      );
    }
    if (damage > 0) {
      for (let i = range + 1; i < highestRangeSeen; i++) {
        if (requiredRanges.has(i)) {
          data.push(
            damageToTTK(
              stats,
              damage,
              rpmSelector,
              props.modifiers.healthMultiplier
            )
          );
        } else {
          data.push(null);
        }
      }
      if (range != highestRangeSeen) {
        data.push(
          damageToTTK(
            stats,
            damage,
            rpmSelector,
            props.modifiers.healthMultiplier
          )
        );
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
      <h2>{props.title}</h2>
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
