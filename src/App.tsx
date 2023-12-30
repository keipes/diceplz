import { SyntheticEvent, useState } from 'react'
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
  // initialSelectedWeapons.set('AEK-971', {
  //   ammoType: 'Standard',
  //   barrelType: 'Factory'
  // });
  const [selectedWeapons, setSelectedWeapons] = useState(initialSelectedWeapons);
  const [healthMultiplier, setHealthMultiplier] = useState(1);
  const [damageMultiplier, setDamageMultiplier] = useState(1);
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
            // if (selectedWeaponStats.has(weapon.name)) {
            //   console.warn('Already have stats for ' + weapon.name);
            // }
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
  // let remainder = highestRangeSeen % 10;
  // highestRangeSeen += (10 - remainder);
  function changeLocalStorage(_: SyntheticEvent) {
    if (useLocalStorage) {
      // disabling storage, so clear all stored data
      localStorage.clear();
    } else {
      localStorage.setItem('useLocalStorage', 'true');
    }
    setUseLocalStorage(!useLocalStorage);
  }
  function handleHealthMultiplier(e) {
    console.log(e.target.value);
    setHealthMultiplier(e.target.value);
  }
  const selectedWeaponsData = selectedWeaponStats;
  return (
    <>
      <div>
        <h1>BF2042 Weapon Stats</h1>
        <div className='disclosure'>
          <p>Weapon stats are from <a href="https://docs.google.com/spreadsheets/d/1UQsYeC3LiFEvgBt18AarXYvFN3DWzFN3DqRnyRHC0wc/edit#gid=1516150144">Sorrow's Scribbles</a> as of patch 6.2.0</p>
          <p>Shotgun damage doesn't consider number of pellets yet.</p>
        </div>

        <div className="weapon-selector">
          <WeaponSelector selectedWeapons={selectedWeapons} setSelectedWeapons={setSelectedWeapons}/>
        </div>
        <div>
          <label htmlFor="health-multiplier">Soldier Max Health Multiplier: </label>
          <input type="number" id="health-multiplier" name="health-multiplier" step="0.1" min="0.1" max="10" value={healthMultiplier} onChange={handleHealthMultiplier}/>
        </div>
        <div>
          <label htmlFor="damage-multiplier">Damage Multiplier: </label>
          <input type="number" id="damage-multiplier" name="damage-multiplier" step="0.1" min="0.1" max="5" value={damageMultiplier} onChange={e => setDamageMultiplier(parseFloat(e.target.value))}/>
        </div>
        <TTKChart selectedWeapons={selectedWeapons}
          selectedWeaponsData={selectedWeaponsData}
          requiredRanges={requiredRanges}
          highestRangeSeen={highestRangeSeen}
          rpmSelector={'rpmAuto'}
          healthMultiplier={healthMultiplier}
          damageMultiplier={damageMultiplier}
          title={'TTK Auto'}/>
        <TTKChart selectedWeapons={selectedWeapons}
          selectedWeaponsData={selectedWeaponsData}
          requiredRanges={requiredRanges}
          highestRangeSeen={highestRangeSeen}
          rpmSelector={'rpmSingle'}
          healthMultiplier={healthMultiplier}
          damageMultiplier={damageMultiplier}
          title={'TTK Single'}/>
        <TTKChart selectedWeapons={selectedWeapons}
          selectedWeaponsData={selectedWeaponsData}
          requiredRanges={requiredRanges}
          highestRangeSeen={highestRangeSeen}
          rpmSelector={'rpmBurst'}
          healthMultiplier={healthMultiplier}
          damageMultiplier={damageMultiplier}
          title={'TTK Burst'}/>
        <DamageChart selectedWeapons={selectedWeapons}
          selectedWeaponsData={selectedWeaponsData}
          requiredRanges={requiredRanges}
          highestRangeSeen={highestRangeSeen}
          damageMultiplier={damageMultiplier}/>
      </div>
    </>
  )
}


export default App
export type {
  WeaponSelections
}