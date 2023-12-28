// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'
// import './WeaponSelector.css'
// import weapons from './assets/weapons.json'
// import { Line } from 'react-chartjs-2'
// import StringHue from './StringColor.ts'
// import weaponData from './assets/weapons.json'
import { Line } from 'react-chartjs-2'
import StringHue from './StringColor.ts'

interface WeaponData {
    damage: [number],
    name: string
}

interface DamageChartProps {
    selectedWeapons: {string: boolean},
    highestRangeSeen: number,
    requiredRanges: [number],
    selectedWeaponsData: [WeaponData]
}

function DamageChart(props: DamageChartProps) {
    const highestRangeSeen = props.highestRangeSeen;
    const requiredRanges = props.requiredRanges;
    const selectedWeaponsData = props.selectedWeaponsData;
    const datasets = [];
    for (let i = 0; i < selectedWeaponsData.length; i++) {
      const weapon = selectedWeaponsData[i];
      const data = [];
      let lastDamage = 0;
      let lastRange = 0;
      let range = 0;
      let damage = 0;
      for (let index = 0; index < weapon.damage.length; index = index + 2) {
        range = weapon.damage[index + 1]
        damage = weapon.damage[index];
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
        label: weapon.name,
        data: data,
        fill: false,
        borderColor: 'hsl(' + StringHue(weapon.name) + ', 50%, 50%)',
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
