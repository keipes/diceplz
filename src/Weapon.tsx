// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'
// import './WeaponSelector.css'
// import weapons from './assets/weapons.json'
// import { Line } from 'react-chartjs-2'
import StringHue from './StringColor.ts'


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
  let className = "weapon";
  let style = {};
  if (props.selectedWeapons[props.name]) {
    className += ' selected-weapon'
    style.backgroundColor = 'hsl(' + StringHue(props.name) + ', 50%, 50%)'
  } else {
    style.backgroundColor = 'hsl(' + StringHue(props.name) + ', 50%, 50%)'
  }
  return (
    <div className={className} onClick={clickHandler} style={style}>
      {props.name}
      {/* <div onClick={clickHandler} style={style}>{props.name}</div> */}
    </div>
  )
}


export default Weapon
