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
  // Title,
  // Tooltip,
  // Legend,
} from 'chart.js';
// import { Line } from 'react-chartjs-2';
// import faker from 'faker';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  // Title,
  // Tooltip,
  // Legend
);





// const weaponsMap = {};
// for (const category of Object.keys(weaponData)) {
//   // console.log(key);
//   // console.log(category);
//   let weapons = weaponData[category];
//   for (let i = 0; i < weapons.length; i++) {
//     let weapon = weapons[i];
//     // console.log(weapon.name);
//     // store a flattened version of the weapon data so we can retrieve weapon data with only a name,
//     // rather than a name and a category
//     weaponsMap[weapon.name] = weapon;
//   }
// }


function App() {

  const [selectedWeapon, setSelectedWeapon] = useState('G57'); // Declare a state variable...


  const [selectedWeapons, setSelectedWeapons] = useState({'G57': true, 'AEK-971': true});

  const datasets = [];
  const labels = [];

  // const weaponNames = [];
  for (const category of Object.keys(weaponData)) {
    // weaponNames.push(category);
    let weapons = weaponData[category];
    for (let i = 0; i < weapons.length; i++) {
      let weapon = weapons[i];

      if (selectedWeapons[weapon.name]) {
        console.log("selected " + weapon.name);
        const data = [];
        let range = 0;
        let damage = 0;
        for (let index = 0; index < weapon.damage.length; index = index + 2) {
          range = weapon.damage[index + 1]
          damage = weapon.damage[index]
          data.push(damage)
          labels.push(range)
        }
        if (damage > 0) {
          data.push(damage)
          labels.push(100)
        }

        datasets.push({
          label: 'Gun',
          data: data,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        })
      }
      // console.log(weapon.name);
      // store a flattened version of the weapon data so we can retrieve weapon data with only a name,
      // rather than a name and a category
      // weaponsMap[weapon.name] = weapon;
    }
  }
  console.log(datasets.length);

  // const weapon = weaponData["Sidearms"][0];
  // const labels = [];
  // const data = [];
  // let range = 0;
  // let damage = 0;
  // for (let index = 0; index < weapon.damage.length; index = index + 2) {
  //   range = weapon.damage[index + 1]
  //   damage = weapon.damage[index]
  //   data.push(damage)
  //   labels.push(range)
  // }
  // if (damage > 0) {
  //   data.push(damage)
  //   labels.push(100)
  // }
  const chartData = {
    // labels: labels,
    labels: [0, 20, 40, 100],
    datasets: datasets
  }

  
  const options = {
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
