import { useState } from 'react';
import StringHue from '../StringColor.ts'
import { GetWeaponByName } from '../WeaponData.ts';
import { WeaponSelections } from '../App.tsx';
import { WeaponConfiguration } from '../WeaponConfigurator.tsx';


interface WeaponProps {
    config: WeaponConfiguration
}

function Weapon(props: WeaponProps) {
  const weapon = GetWeaponByName(props.config.name);
  let selectedBarrelInitial = '';
  let selectedAmmoInitial = '';
  for (const stat of weapon.stats) {
    if (stat.barrelType == 'Factory') {
      selectedBarrelInitial = 'Factory';
    }
    if (stat.ammoType == 'Standard') {
      selectedAmmoInitial = 'Standard';
    }
    if (stat.ammoType == 'Standard Bolts') {
      selectedAmmoInitial = 'Standard';
    }
  }
  // fall back to initial if none exists
  if (selectedBarrelInitial == '' && weapon.stats.length > 0) {
    selectedBarrelInitial = weapon.stats[0].barrelType;
  }
  if (selectedAmmoInitial == '' && weapon.stats.length > 0) {
    selectedAmmoInitial = weapon.stats[0].ammoType;
  }

  const [selectedBarrel, setSelectedBarrel] = useState(selectedBarrelInitial);
  const [selectedAmmo, setSelectedAmmo] = useState(selectedAmmoInitial);
  const clickHandler = (o) => {
    const newSelectedWeapons = new Map<string, WeaponSelections>(props.selectedWeapons);
    if (!newSelectedWeapons.delete(props.name)) {
      newSelectedWeapons.set(props.name, {
        ammoType: selectedAmmo,
        barrelType: selectedBarrel
      });
    }
    props.setSelectedWeapons(newSelectedWeapons);
  }

  function barrelChangeHandler(e) {
    setSelectedBarrel(e.target.value);
    if (props.selectedWeapons.has(props.name)) {
      const newSelectedWeapons = new Map<string, WeaponSelections>(props.selectedWeapons);
      newSelectedWeapons.set(props.name, {
        ammoType: selectedAmmo,
        barrelType: e.target.value
      });
      props.setSelectedWeapons(newSelectedWeapons);
    }
  }
  function ammoChangeHandler(e) {
    setSelectedAmmo(e.target.value);
    if (props.selectedWeapons.has(props.name)) {
      const newSelectedWeapons = new Map<string, WeaponSelections>(props.selectedWeapons);
      newSelectedWeapons.set(props.name, {
        ammoType: e.target.value,
        barrelType: selectedBarrel
      });
      props.setSelectedWeapons(newSelectedWeapons);
    }
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


  let config = props.config;

  let visibility = 'visibility';
  if (!config.visible) {
    visibility += '_off';
  }
  return (
            <div className="wcf-weapon">
                <div className="wcf-header">
                    <div className="wcf-header-item wcf-name">{config.name}</div>
                    <span className="wcf-header-item wcf-header-button wcf-duplicate material-symbols-outlined">content_copy</span>
                    <span className="wcf-header-item wcf-header-button wcf-visibility material-symbols-outlined">{visibility}</span>
                    <span className="wcf-header-item wcf-header-button wcf-close material-symbols-outlined">delete</span>
                </div>

            <select value={selectedBarrel} name="barrel" id="barrel" onChange={barrelChangeHandler} onClick={e => e.stopPropagation()} disabled={seenBarrels.size < 2}>
                {barrelOptions}
            </select>
            <select value={selectedAmmo} name="ammo" id="ammo" onChange={ammoChangeHandler} onClick={e => e.stopPropagation()} disabled={seenAmmo.size < 2}>
                {ammoOptions}
            </select>
        </div>
  )
}


export default Weapon
