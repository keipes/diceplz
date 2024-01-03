import { Line } from "react-chartjs-2";
import StringHue from "../StringColor.ts";
import { GetStatsForConfiguration, WeaponStats } from "../WeaponData.ts";
import { WeaponSelections } from "../App.tsx";
import { WeaponConfiguration } from "../WeaponConfigurator/WeaponConfigurator.tsx";
import { ConfigDisplayName } from "../LabelMaker.ts";

interface TTKChartProps {
  selectedWeapons: Map<string, WeaponSelections>;
  weaponConfigurations: Map<String, WeaponConfiguration>;
  highestRangeSeen: number;
  requiredRanges: Map<number, boolean>;
  selectedWeaponsData: [WeaponStats];
  rpmSelector: string;
  title: string;
  healthMultiplier: number;
  damageMultiplier: number;
}

const damageToTTK = function (
  weapon: WeaponStats,
  damage: number,
  rpmSelector: string,
  healthMultiplier: number
) {
  const btk = Math.ceil((healthMultiplier * 100) / damage);
  return Math.round((1000 / (weapon[rpmSelector] / 60)) * (btk - 1));
};

function TTKChart(props: TTKChartProps) {
  const highestRangeSeen = props.highestRangeSeen;
  const requiredRanges = props.requiredRanges;
  // const selectedWeaponsData = props.selectedWeaponsData;
  const datasets = [];
  // for (let i = 0; i < selectedWeaponsData.length; i++) {

  for (const [id, config] of props.weaponConfigurations) {
    if (!config.visible) continue;
    const weaponName = config.name;
    const stats = GetStatsForConfiguration(config);
    // for (const [weaponName, stats] of selectedWeaponsData) {
    //   const weapon = selectedWeaponsData[i];
    const data = [];
    let lastDamage = 0;
    let lastRange = 0;
    let range = 0;
    let damage = 0;
    for (let dropoff of stats.dropoffs) {
      range = dropoff.range;
      damage = dropoff.damage * props.damageMultiplier;
      for (let i = lastRange + 1; i < range; i++) {
        if (requiredRanges.has(i)) {
          data.push(
            damageToTTK(
              stats,
              lastDamage,
              props.rpmSelector,
              props.healthMultiplier
            )
          );
        } else {
          data.push(null);
        }
      }
      lastDamage = damage;
      lastRange = range;
      data.push(
        damageToTTK(stats, damage, props.rpmSelector, props.healthMultiplier)
      );
    }
    if (damage > 0) {
      for (let i = range + 1; i < highestRangeSeen; i++) {
        if (requiredRanges.has(i)) {
          data.push(
            damageToTTK(
              stats,
              damage,
              props.rpmSelector,
              props.healthMultiplier
            )
          );
        } else {
          data.push(null);
        }
      }
      if (range != highestRangeSeen) {
        data.push(
          damageToTTK(stats, damage, props.rpmSelector, props.healthMultiplier)
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
          text: "ms",
          color: "white",
        },
        grid: {
          color: "rgba(75, 192, 192, 0.2)",
        },
        min: 0,
        ticks: {
          color: "white", // not 'fontColor:' anymore
          // fontSize: 18,
          // font: {
          //   size: 18, // 'size' now within object 'font {}'
          // },
          // stepSize: 1,
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
          color: "white", // not 'fontColor:' anymore
          // fontSize: 18,
          // font: {
          //   size: 18, // 'size' now within object 'font {}'
          // },
          // stepSize: 1,
          beginAtZero: true,
          autoSkip: false,
        },
      },
    },
  };
  return (
    <div className="chart-outer-container">
      <h2>{props.title}</h2>
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

export default TTKChart;
