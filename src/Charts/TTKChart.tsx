import { Line } from "react-chartjs-2";
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
  (stats: WeaponStats): number;
}

const damageToTTK = function (
  stats: WeaponStats,
  damage: number,
  rpmSelector: RPMSelectorFn,
  healthMultiplier: number
) {
  const btk = Math.ceil((healthMultiplier * 100) / damage);
  return Math.round((1000 / (rpmSelector(stats) / 60)) * (btk - 1));
};

const FIREMODE_AUTO = "auto";
const FIREMODE_BURST = "burst";
const FIREMODE_SINGLE = "single";
const SELECTOR_AUTO: RPMSelectorFn = (stats: WeaponStats) => stats.rpmAuto;
const SELECTOR_BURST: RPMSelectorFn = (stats: WeaponStats) => stats.rpmBurst;
const SELECTOR_SINGLE: RPMSelectorFn = (stats: WeaponStats) => stats.rpmSingle;

function TTKChart(props: TTKChartProps) {
  const [selectedFireMode, setSelectedFireMode] = useState(FIREMODE_AUTO);
  let autoClass = "abs-selector";
  let burstClass = "abs-selector";
  let singleClass = "abs-selector";
  let rpmSelector: RPMSelectorFn = (_) => {
    throw new Error("Undefined weapon selector.");
  };
  switch (selectedFireMode) {
    case FIREMODE_AUTO:
      autoClass += " enabled";
      rpmSelector = SELECTOR_AUTO;
      break;
    case FIREMODE_BURST:
      burstClass += " enabled";
      rpmSelector = SELECTOR_BURST;
      break;
    case FIREMODE_SINGLE:
      singleClass += " enabled";
      rpmSelector = SELECTOR_SINGLE;
      break;
  }
  const highestRangeSeen = props.highestRangeSeen;
  const requiredRanges = props.requiredRanges;
  const datasets = [];

  for (const [id, config] of props.weaponConfigurations) {
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
    for (let dropoff of stats.dropoffs) {
      range = dropoff.range;
      let pelletMultiplier = 1;
      if (weapon.pelletCounts && weapon.pelletCounts[config.ammoType]) {
        pelletMultiplier = weapon.pelletCounts[config.ammoType];
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
  const chartData = {
    labels: labels,
    datasets: datasets,
  };
  const options = {
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
          return b.raw - a.raw;
        },
        callbacks: {
          labelColor: (ctx) => {
            return {
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
    stepped: true,
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
          beginAtZero: true,
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
          beginAtZero: true,
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
        >
          Auto
        </button>
        <button
          className={burstClass}
          onClick={(_) => setSelectedFireMode(FIREMODE_BURST)}
        >
          Burst
        </button>
        <button
          className={singleClass}
          onClick={(_) => setSelectedFireMode(FIREMODE_SINGLE)}
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
