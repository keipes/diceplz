import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import WeaponSelector from './WeaponSelector'
import weaponData from './assets/weapons.json'
import { Line } from 'react-chartjs-2'





// import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  // Legend,
} from 'chart.js';
// import { Line } from 'react-chartjs-2';
// import faker from 'faker';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  // Legend
);
console.log('load')

const cyrb53 = function(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for(let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

const stringHue = function(str) {
  return cyrb53(str) / Math.pow(2, 53) * 255
}

function App() {
  const [selectedWeapon, setSelectedWeapon] = useState('G57'); // Declare a state variable...
  const [selectedWeapons, setSelectedWeapons] = useState({'G57': true, 'AEK-971': true});
  const datasets = [];
  const selectedWeaponsData = [];
  for (const category of Object.keys(weaponData)) {
    let weapons = weaponData[category];
    for (let i = 0; i < weapons.length; i++) {
      let weapon = weapons[i];
      selectedWeaponsData.push(weapon);
    }
  }

  const requiredRanges = {};
  let highestRangeSeen = 0;
  for (let i = 0; i < selectedWeaponsData.length; i++) {
    const weapon = selectedWeaponsData[i];
    for (let index = 0; index < weapon.damage.length; index = index + 2) {
      // range = weapon.damage[index + 1];
      const range = weapon.damage[index + 1];
      requiredRanges[range] = true;
      if (range > highestRangeSeen) {
        highestRangeSeen = range;
      }
      // console.log('require ' + weapon.damage[index + 1])
    }
  }

  let remainder = highestRangeSeen % 10;
  highestRangeSeen += (10 - remainder);

  for (let i = 0; i < selectedWeaponsData.length; i++) {
    const weapon = selectedWeaponsData[i];
    // console.log("selected " + weapon.name);
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
        // data.push(null);
      }
      if (range != highestRangeSeen) {
        data.push(damage);
      }
    }
    datasets.push({
      label: weapon.name,
      data: data,
      fill: false,
      // borderColor: 'rgb(75, 192, 192)',
      borderColor: 'hsl(' + stringHue(weapon.name) + ', 50%, 50%)',
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
    // responsive: true,
    // interaction: {
    //   intersect: false,
    //   axis: 'x'
    // },
    spanGaps: true,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      title: {
        display: true,
        text: () => 'Damage over range',
      },
      tooltip: {
        // enabled: false,
        callbacks: {
          // title: (context) => {
          //   if (context.parsed.x != null) {
          //     return context.parsed.x
          //   }
          //   return 'u'
          // },
          labelColor: (ctx) => {
            console.log(ctx.dataset.label);
            return {
              backgroundColor: 'hsl(' + stringHue(ctx.dataset.label) + ', 50%, 50%)',
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
    // plugins: {

    // },
    stepped: true,
    scales: {
      y: {
        grid: {
          color: 'rgba(75, 192, 192, 0.2)',
        },
        min: 0,
      },
      x: {
        grid: {
          color: 'rgba(75, 192, 192, 0.2)',
        },
        min: 0,
      }
    }
  }
  return (
    <>
      <div>
        <h1>BF2042 Weapon Stats</h1>
        <div className="chart-container">
          <Line data={chartData} options={options}/>
        </div>
        <div className="weapon-selector">
          <WeaponSelector selectedWeapons={selectedWeapons} setSelectedWeapons={setSelectedWeapons}/>
        </div>
      </div>
    </>
  )
}


export default App
