import { useState } from 'react'
import './App.css'
import WeaponSelector from './WeaponSelector'
import weaponData from './assets/weapons.json'
import DamageChart from './DamageChart.tsx'
import TTKChart from './TTKChart.tsx';
import TTKChartBurst from './TTKChartBurst.tsx';
import TTKChartFullAuto from './TTKChartAuto.tsx';

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
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  // Legend
);

function App() {
  const [selectedWeapons, setSelectedWeapons] = useState({'AEK-971': true});
  const oldLocalStorageSetting = localStorage.getItem('useLocalStorage') == 'true';
  const [useLocalStorage, setUseLocalStorage] = useState(oldLocalStorageSetting);
  const selectedWeaponsData = [];
  for (const category of Object.keys(weaponData)) {
    let weapons = weaponData[category];
    for (let i = 0; i < weapons.length; i++) {
      let weapon = weapons[i];
      if (selectedWeapons[weapon.name]) {
        selectedWeaponsData.push(weapon);
      }
    }
  }
  const requiredRanges = {};
  let highestRangeSeen = 0;
  for (let i = 0; i < selectedWeaponsData.length; i++) {
    const weapon = selectedWeaponsData[i];
    for (let index = 0; index < weapon.damage.length; index = index + 2) {
      const range = weapon.damage[index + 1];
      requiredRanges[range] = true;
      if (range > highestRangeSeen) {
        highestRangeSeen = range;
      }
    }
  }

  let remainder = highestRangeSeen % 10;
  highestRangeSeen += (10 - remainder);
  function changeLocalStorage(e) {
    // console.log(e.target.value);
    if (useLocalStorage) {
      // disabling storage, so clear all stored data
      localStorage.clear();
    } else {
      localStorage.setItem('useLocalStorage', 'true');
    }
    setUseLocalStorage(!useLocalStorage);
  }
  return (
    <>
      <div>
        <h1>BF2042 Weapon Stats</h1>
        <div>
          <label>
            <input type="checkbox" checked={useLocalStorage} onChange={changeLocalStorage}/>
            Use local storage to persist my selections.
          </label>
        </div>
        <div className="weapon-selector">
          <WeaponSelector selectedWeapons={selectedWeapons} setSelectedWeapons={setSelectedWeapons}/>
        </div>
        <TTKChart selectedWeapons={selectedWeapons} selectedWeaponsData={selectedWeaponsData} requiredRanges={requiredRanges} highestRangeSeen={highestRangeSeen}/>
        <TTKChartBurst selectedWeapons={selectedWeapons} selectedWeaponsData={selectedWeaponsData} requiredRanges={requiredRanges} highestRangeSeen={highestRangeSeen}/>
        <TTKChartFullAuto selectedWeapons={selectedWeapons} selectedWeaponsData={selectedWeaponsData} requiredRanges={requiredRanges} highestRangeSeen={highestRangeSeen}/>
        <DamageChart selectedWeapons={selectedWeapons} selectedWeaponsData={selectedWeaponsData} requiredRanges={requiredRanges} highestRangeSeen={highestRangeSeen}/>
      </div>
    </>
  )
}


export default App
