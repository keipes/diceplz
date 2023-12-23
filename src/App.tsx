import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import weapons from './assets/weapons.json'
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
  Legend,
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




function App() {
  // const [count, setCount] = useState(0)

  const [selectedWeapon, setSelectedWeapon] = useState('G57'); // Declare a state variable...

  // console.log(weapons)
  console.log(selectedWeapon)

  const weaponNames = [];
  for (const key of Object.keys(weapons)) {
    // console.log(key);
    weaponNames.push(key);
  }

  const weapon = weapons[selectedWeapon];
  // console.log(weapons)
  // console.log(weapons[selectedWeapon])

  const labels = [];
  const data = [];
  for (let index = 0; index < weapon.damage.length; index = index + 2) {
    // const element = array[index];
    data.push(weapon.damage[index])
    labels.push(weapon.damage[index + 1])
  }
  const chartData = {
    // labels: [0, 29, 40],
    labels: labels,
    datasets: [{
      label: 'Gun',
      // data: [30, 20, 15],
      data: data,
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  }

  
  const options = {
    scales: {
      y: {
        grid: {
          color: 'rgba(75, 192, 192, 0.2)',
        },
        min: 0
      },
      x: {
        grid: {
          color: 'rgba(75, 192, 192, 0.2)',
        },
        min: 0
      }
    }
  }
  return (
    <>
      <div>
      <select name="weapons" id="weapons" onChange={e => setSelectedWeapon(e.target.value)} value={selectedWeapon}>
        {weaponNames.map(name => (<option value={name}>{name}</option>))}
        {/* <option value="volvo">Volvo</option>
        <option value="saab">Saab</option>
        <option value="mercedes">Mercedes</option>
        <option value="audi">Audi</option> */}
      </select>
      <div className="chart-container">
        <Line data={chartData} options={options}/>
        </div>
      </div>
    </>
  )
}

export default App
