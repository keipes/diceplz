import { useState } from 'react'
import './App.css'
import WeaponSelector from './WeaponSelector'
import DamageChart from './DamageChart.tsx'
import TTKChart from './TTKChart.tsx';

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
import { GetCategoryWeapons, WeaponCategories, WeaponStats } from './WeaponData.ts'
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  // Legend
);

interface WeaponSelections {
  ammoType: string, barrelType: string
}

function App() {
  const initialSelectedWeapons = new Map<string, WeaponSelections>();
  initialSelectedWeapons.set('AEK-971', {
    ammoType: 'Standard',
    barrelType: 'Factory'
  });
  const [selectedWeapons, setSelectedWeapons] = useState(initialSelectedWeapons);
  // const [selectedWeapons, setSelectedWeapons] = useState({'AEK-971': {
  //   ammoType: 'Standard',
  //   barrelType: 'Factory'
  // }});
  const oldLocalStorageSetting = localStorage.getItem('useLocalStorage') == 'true';
  const [useLocalStorage, setUseLocalStorage] = useState(oldLocalStorageSetting);
  const selectedWeaponStats = new Map<string, WeaponStats>();
  for (const category of WeaponCategories) {
    const weapons = GetCategoryWeapons(category);
    for (let weapon of weapons) {
      const selected = selectedWeapons.get(weapon.name);
      if (selected) {
        for (const stat of weapon.stats) {
          if (stat.barrelType == selected.barrelType && stat.ammoType == selected.ammoType) {
            if (selectedWeaponStats.get(weapon.name)) {
              console.warn('Already have stats for ' + weapon.name);
            }
            selectedWeaponStats.set(weapon.name, stat);
          }
        }
      }
    }
  }
  const requiredRanges = new Map<number, boolean>();
  let highestRangeSeen = 0;
  for (const  [name, stat] of selectedWeaponStats) {
    for (const dropoff of stat.dropoffs) {
      requiredRanges.set(dropoff.range, true);
      if (dropoff.range > highestRangeSeen) {
        highestRangeSeen = dropoff.range;
      }
    }
  }
  let remainder = highestRangeSeen % 10;
  highestRangeSeen += (10 - remainder);
  function changeLocalStorage(e) {
    if (useLocalStorage) {
      // disabling storage, so clear all stored data
      localStorage.clear();
    } else {
      localStorage.setItem('useLocalStorage', 'true');
    }
    setUseLocalStorage(!useLocalStorage);
  }
  const selectedWeaponsData = selectedWeaponStats;
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
        <TTKChart selectedWeapons={selectedWeapons} selectedWeaponsData={selectedWeaponsData} requiredRanges={requiredRanges} highestRangeSeen={highestRangeSeen} rpmSelector={'rpmAuto'} title={'TTK Auto'}/>
        <TTKChart selectedWeapons={selectedWeapons} selectedWeaponsData={selectedWeaponsData} requiredRanges={requiredRanges} highestRangeSeen={highestRangeSeen} rpmSelector={'rpmSingle'} title={'TTK Single'}/>
        <TTKChart selectedWeapons={selectedWeapons} selectedWeaponsData={selectedWeaponsData} requiredRanges={requiredRanges} highestRangeSeen={highestRangeSeen} rpmSelector={'rpmBurst'} title={'TTK Burst'}/>
        <DamageChart selectedWeapons={selectedWeapons} selectedWeaponsData={selectedWeaponsData} requiredRanges={requiredRanges} highestRangeSeen={highestRangeSeen}/>
      </div>
    </>
  )
}


export default App
export type {
  WeaponSelections
}