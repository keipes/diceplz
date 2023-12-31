import { Bar, Line } from 'react-chartjs-2'
import StringHue from './StringColor.ts'
import { WeaponStats } from './WeaponData.ts';
import { WeaponSelections } from './App.tsx';
import { useState } from 'react';
import './VelocityChart.css'

interface VelocityChartProps {
    selectedWeapons: Map<string, WeaponSelections>,
    selectedWeaponsData: Map<string, WeaponStats>,
}

function VelocityChart(props: VelocityChartProps) {
    const selectedWeaponsData = props.selectedWeaponsData;
    const labels = [];
    const datasets = [];
    const data = [];
    const backgroundColors = [];

    const weaponData = Array.from(selectedWeaponsData.entries());
    weaponData.sort((a, b) => {
        return b[1].velocity - a[1].velocity
    });
    console.log(weaponData[0])
    for (const [weaponName, stats] of weaponData) {
        labels.push(weaponName);
        backgroundColors.push('hsl(' + StringHue(weaponName) + ', 50%, 50%)');
        data.push(stats.velocity);
    }
    datasets.push({
    label: 'Velocity',
    data: data,
    backgroundColor: backgroundColors,
    borderWidth: 0
    });
    const chartData = {
      labels: labels,
      datasets: datasets
    }
    const options = {
      maintainAspectRatio: false,
      animation: false,
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
            label: function(ctx) {
                if (ctx.parsed.y == null) {
                    return '';
                }
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
            text: 'm/s'
          },
          grid: {
            color: 'rgba(38, 255, 223, 0.1)',
          },
          min: 0,
        },
        x: {
          title: {
            display: false,
            text: 'weapon'
          },
          grid: {
            color: 'rgba(38, 255, 223, 0.1)',
          },
          min: 0,
        }
      }
    }
    return (
        <div>
            <h2>Velocity</h2>
            <div className="chart-container">
                <Bar data={chartData} options={options}/>
            </div>
        </div>
    )
}

export default VelocityChart
