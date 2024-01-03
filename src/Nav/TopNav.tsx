import { AddWeaponFn, WeaponConfig } from "../App";
import { GetCategoryWeapons, WeaponCategories } from "../WeaponData";
import "./TopNav.css";

interface NavProps {
  weaponConfig: WeaponConfig;
}

function TopNav(props: NavProps) {
  const weaponSelectDropdowns = [];
  for (const category of WeaponCategories) {
    const weaponSelectItems = [];
    let weapons = GetCategoryWeapons(category);
    weapons.sort((a, b) => {
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });
    for (const weapon of weapons) {
      weaponSelectItems.push(
        <li
          className="weapon-select-item"
          key={weapon.name}
          onClick={() => {
            props.weaponConfig.AddWeapon({
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
        <div className="top-nav-label">{category.toUpperCase()}</div>
        <div className="weapon-select-dropdown-container">
          <ul className="weapon-select-dropdown">
            <div
              className="weapon-select-add-all"
              onClick={() => {
                const toAdd = [];
                for (const weapon of weapons) {
                  if (weapon.stats.length == 0) {
                    console.warn("no stats for " + weapon.name);
                  } else {
                    toAdd.push({
                      name: weapon.name,
                      visible: true,
                      barrelType: weapon.stats[0].barrelType,
                      ammoType: weapon.stats[0].ammoType,
                    });
                  }
                }
                props.weaponConfig.BulkAddWeapon(toAdd);
              }}
            >
              Add All
            </div>
            <div className="weapon-select-items-container">
              {weaponSelectItems}
            </div>
          </ul>
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
        </ul>
      </div>
    </>
  );
}

export default TopNav;
