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
  const [count, setCount] = useState(0)
  console.log(weapons)

  const weaponNames = [];
  for (const key of Object.keys(weapons)) {
    console.log(key);
    weaponNames.push(key);
  }
  const chartData = {
    labels: [0, 29, 40],
    datasets: [{
      label: 'Gun',
      data: [30, 20, 15],
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
          // display: false,
        },
        min: 0
      },
      x: {
        grid: {
          color: 'rgba(75, 192, 192, 0.2)',
          // display: false
        },
        min: 0
      }
    }
  }
  return (
    <>
      <div>
      <select name="weapons" id="weapons">
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
