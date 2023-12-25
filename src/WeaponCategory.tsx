import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'
import './WeaponSelector.css'
import Weapon from './Weapon'
// import { Line } from 'react-chartjs-2'
import weaponData from './assets/weapons.json'



interface WeaponCategoryProps {
    title: string,
    selectedWeapons: {string: boolean},
    setSelectedWeapons: Function
}

function WeaponCategory(props: WeaponCategoryProps) {
  // let categories = [];
  // for (const category of Object.keys(weaponData)) {
  //   categories.push(<WeaponCategory title={category}/>)
  // }

  let weaponElements = [];
  let weapons = weaponData[props.title];
  for (let i = 0; i < weapons.length; i++) {
    let weapon = weapons[i];
    weaponElements.push(<Weapon name={weapon.name} key={weapon.name} selectedWeapons={props.selectedWeapons} setSelectedWeapons={props.setSelectedWeapons}/>)
    // console.log(weapon.name);
    // store a flattened version of the weapon data so we can retrieve weapon data with only a name,
    // rather than a name and a category
    // weaponsMap[weapon.name] = weapon;
  }

  return (
    <div className="weapon-category">
      <h3>{props.title}</h3>
      {weaponElements}
      {/* <Weapon name="gunny gun"/> */}
    </div>
  )
}


export default WeaponCategory
