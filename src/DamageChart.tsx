import { Line } from 'react-chartjs-2'
import StringHue from './StringColor.ts'
import { DamageMultiplier } from './Values.ts';
import { WeaponStats } from './WeaponData.ts';

interface WeaponData {
    damage: [number],
    name: string
}

interface DamageChartProps {
    selectedWeapons: {string: boolean},
    highestRangeSeen: number,
    requiredRanges: [number],
    selectedWeaponsData: [WeaponStats]
}

function DamageChart(props: DamageChartProps) {
    const highestRangeSeen = props.highestRangeSeen;
    const requiredRanges = props.requiredRanges;
    const selectedWeaponsData = props.selectedWeaponsData;
    const datasets = [];
    for (const [weaponName, stats] of selectedWeaponsData) {
    // for (let i = 0; i < selectedWeaponsData.length; i++) {
    //   const weapon = stats;
      const data = [];
      let lastDamage = 0;
      let lastRange = 0;
      let range = 0;
      let damage = 0;
      for (let dropoff of stats.dropoffs) {
    //   for (let i = 0; i < stats.dropoffs.length; i = i + 1) {
        range = dropoff.range;
        damage = dropoff.damage;
        damage = Math.round(damage * 100) / 100
        for (let i = lastRange + 1; i < range; i++) {
          if (requiredRanges[i]) {
            data.push(lastDamage);
          } else {
            data.push(null);
          }
        }
        lastDamage = damage;
        lastRange = range;
        data.push(damage);
      }
      if (damage > 0) {
        for (let i = range + 1; i < highestRangeSeen; i++) {
          if (requiredRanges[i]) {
            data.push(damage);
          } else {
            data.push(null);
          }
        }
        if (range != highestRangeSeen) {
          data.push(damage);
        }
      }
      datasets.push({
        label: weaponName,
        data: data,
        fill: false,
        borderColor: 'hsl(' + StringHue(weaponName) + ', 50%, 50%)',
        tension: 0.1
      })
    }
  
    const labels = [];
    for (let i = 0; i <= highestRangeSeen; i++) {
      if (requiredRanges[i] || i == highestRangeSeen) {
        labels.push(i);
      } else {
        labels.push('');
      }
    }
    const chartData = {
      labels: labels,
      datasets: datasets
    }
    const options = {
      maintainAspectRatio: false,
      animation: {
        duration: 0
      },
      spanGaps: true,
      interaction: {
        intersect: false,
        mode: 'index',
      },
      plugins: {
        tooltip: {
          itemSort: function(a, b) {
            return b.raw - a.raw;
          },
          callbacks: {
            labelColor: (ctx) => {
              return {
                backgroundColor: 'hsl(' + StringHue(ctx.dataset.label) + ', 50%, 50%)',
              }
            },
            label: function(ctx) {
              let label = ctx.dataset.label || '';
              if (label) {
                  label += ': ';
              }
              if (ctx.parsed.y !== null) {
                  label += ctx.parsed.y
              }
              return label;
          }
          }
        }
      },
      stepped: true,
      scales: {
        y: {
          title: {
            display: true,
            text: 'damage'
          },
          grid: {
            color: 'rgba(75, 192, 192, 0.2)',
          },
          min: 0,
        },
        x: {
          title: {
            display: true,
            text: 'range'
          },
          grid: {
            color: 'rgba(75, 192, 192, 0.2)',
          },
          min: 0,
        }
      }
    }
    return (
        <div>
            <h2>Damage</h2>
            <div className="chart-container">
            <Line data={chartData} options={options}/>
            </div>
        </div>

    )
}


export default DamageChart
