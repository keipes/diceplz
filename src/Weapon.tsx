import { useState } from 'react';
import StringHue from './StringColor.ts'
import { GetWeaponByName } from './WeaponData.ts';
import { WeaponSelections } from './App.tsx';


interface WeaponProps {
    name: string,
    selectedWeapons: {string: boolean},
    setSelectedWeapons: Function
}

function Weapon(props: WeaponProps) {
  const weapon = GetWeaponByName(props.name);
  let selectedBarrelInitial = '';
  let selectedAmmoInitial = '';
  if (weapon.stats.length > 0) {
    selectedBarrelInitial = weapon.stats[0].barrelType;
    selectedAmmoInitial = weapon.stats[0].ammoType;
  }
  const [selectedBarrel, setSelectedBarrel] = useState(selectedBarrelInitial);
  const [selectedAmmo, setSelectedAmmo] = useState(selectedAmmoInitial);
  const clickHandler = (o) => {
    const newSelectedWeapons = new Map<string, WeaponSelections>();
    // let newSelectedWeapons = {};
    let add = true;
    for (const [name, selections] of props.selectedWeapons) {
      console.log('...');
      console.log(name);
      console.log(selections);
      if (name == props.name) {
          add = false;
      } else {
          // newSelectedWeapons[name] = selections;
          newSelectedWeapons.set(name, selections);
      }
    }
    if (add) {
        // newSelectedWeapons[props.name] = {
        //   ammoType: selectedAmmo,
        //   barrelType: selectedBarrel
        // };
        newSelectedWeapons.set(props.name, {
          ammoType: selectedAmmo,
          barrelType: selectedBarrel
        });
    }
    props.setSelectedWeapons(newSelectedWeapons);
  }

  function barrelChangeHandler(e) {
    setSelectedBarrel(e.target.value);
  }
  function ammoChangeHandler(e) {
    setSelectedAmmo(e.target.value);
  }
  let className = "weapon";
  let style = {};
  if (props.selectedWeapons.has(props.name)) {
    className += ' selected-weapon'
    style.backgroundColor = 'hsl(' + StringHue(props.name) + ', 50%, 50%)'
  } else {
    style.backgroundColor = 'hsl(' + StringHue(props.name) + ', 50%, 50%)'
  }

  const seenBarrels = new Set<string>();
  const barrelOptions = [];
  const seenAmmo = new Set<string>();
  const ammoOptions = [];

  for (const stat of weapon.stats) {
    if (stat.barrelType == selectedBarrel) {
      if (!seenAmmo.has(stat.ammoType)) { // shouldn't need to do this
        ammoOptions.push(<option value={stat.ammoType} key={stat.ammoType}>{stat.ammoType}</option>)
        seenAmmo.add(stat.ammoType)
      }
    }
    if (!seenBarrels.has(stat.barrelType)) {
      barrelOptions.push(<option value={stat.barrelType} key={stat.barrelType}>{stat.barrelType}</option>);
      seenBarrels.add(stat.barrelType)
    }
  }

  return (
    <div className={className} onClick={clickHandler} style={style}>
      {props.name}
      <div>
        <select value={selectedBarrel} name="barrel" id="barrel" onChange={barrelChangeHandler} onClick={e => e.stopPropagation()} disabled={seenBarrels.size < 2}>
          {barrelOptions}
        </select>
        <select value={selectedAmmo} name="ammo" id="ammo" onChange={ammoChangeHandler} onClick={e => e.stopPropagation()} disabled={seenAmmo.size < 2}>
          {ammoOptions}
        </select>
      </div>
    </div>
  )
}


export default Weapon
