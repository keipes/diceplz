import { AddWeaponFn } from "../App";
import { GetCategoryWeapons, WeaponCategories } from "../WeaponData";

interface NavProps {
  addWeapon: AddWeaponFn;
}

function TopNav(props: NavProps) {
  const weaponSelectDropdowns = [];
  for (const category of WeaponCategories) {
    const weaponSelectItems = [];
    for (const weapon of GetCategoryWeapons(category)) {
      weaponSelectItems.push(
        <li
          className="weapon-select-item"
          key={weapon.name}
          onClick={() => {
            props.addWeapon({
              name: weapon.name,
              visible: true,
              barrelType: weapon.stats[0].barrelType,
              ammoType: weapon.stats[0].ammoType,
            });
          }}
        >
          {weapon.name}
        </li>
      );
    }
    weaponSelectDropdowns.push(
      <li className="top-nav-weapon-select" key={category}>
        <div className="top-nav-label">{category}</div>
        <div className="weapon-select-dropdown-container">
          <ul className="weapon-select-dropdown">{weaponSelectItems}</ul>
        </div>
      </li>
    );
  }
  return (
    <>
      <div className="top-nav">
        <ul>
          <li>
            <h1 className="top-nav-title">DicePlz</h1>
          </li>
          {weaponSelectDropdowns}
          {/* <li className="top-nav-weapon-select">
            <div className="top-nav-label">SMG</div>
            <div className="weapon-select-dropdown-container">
              <ul className="weapon-select-dropdown">
                <li className="weapon-select-item">PBX-45</li>
                <li className="weapon-select-item">PP-2000</li>
              </ul>
            </div>
          </li>
          <li className="top-nav-weapon-select">
            <div className="top-nav-label">Assault Rifles</div>
            <div className="weapon-select-dropdown-container">
              <ul className="weapon-select-dropdown">
                <li className="weapon-select-item">M5A3</li>
                <li className="weapon-select-item">ACW-R</li>
              </ul>
            </div>
          </li> */}
        </ul>
      </div>
    </>
  );
}

export default TopNav;
