// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'
// import './WeaponSelector.css'
// import weapons from './assets/weapons.json'
// import { Line } from 'react-chartjs-2'


interface WeaponProps {
    name: string,
    selectedWeapons: {string: boolean},
    setSelectedWeapons: Function
}

function Weapon(props: WeaponProps) {

  const clickHandler = (o) => {
    let newSelectedWeapons = {};
    let add = true;
    for (const selectedWeapon of Object.keys(props.selectedWeapons)) {
        if (selectedWeapon == props.name) {
            add = false;
        } else {
            newSelectedWeapons[selectedWeapon] = true;
        }
    }
    if (add) {
        newSelectedWeapons[props.name] = true;
    }
    props.setSelectedWeapons(newSelectedWeapons);
    // console.log(props.selectedWeapons);
    // console.log(o.target.value);
  }
  return (
    <div className="weapon">
      <p onClick={clickHandler}>{props.name}</p>
    </div>
  )
}


export default Weapon
