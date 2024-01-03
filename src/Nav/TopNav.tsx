import { AddWeaponFn, WeaponConfig } from "../App";
import { GetCategoryWeapons, WeaponCategories } from "../WeaponData";
import "./TopNav.css";

interface NumSetterFn {
  (value: number): void;
}

interface NavProps {
  weaponConfig: WeaponConfig;
  healthMultiplier: number;
  setHealthMultiplier: NumSetterFn;
  damageMultiplier: number;
  setDamageMultiplier: NumSetterFn;
  bodyDamageMultiplier: number;
  setBodyDamageMultiplier: NumSetterFn;
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

  weaponSelectDropdowns.push(
    <li className="top-nav-weapon-select" key="settings">
      <div className="top-nav-label">
        {" "}
        <span className="material-symbols-outlined">settings</span>
      </div>
      <div className="weapon-select-dropdown-container">
        <ul className="weapon-select-dropdown">
          <div className="weapon-select-items-container-settings">
            <li className="weapon-select-item">
              {" "}
              <div>
                <label htmlFor="health-multiplier">
                  Soldier Max Health Multiplier:{" "}
                </label>
                <input
                  type="number"
                  id="health-multiplier"
                  name="health-multiplier"
                  step="0.1"
                  min="0.1"
                  max="10"
                  value={props.healthMultiplier}
                  onChange={(e) =>
                    props.setHealthMultiplier(parseFloat(e.target.value))
                  }
                />
              </div>
            </li>
            <li className="weapon-select-item">
              <div>
                <label htmlFor="damage-multiplier">Damage Multiplier: </label>
                <input
                  type="number"
                  id="damage-multiplier"
                  name="damage-multiplier"
                  step="0.1"
                  min="0.1"
                  max="5"
                  value={props.damageMultiplier}
                  onChange={(e) =>
                    props.setDamageMultiplier(parseFloat(e.target.value))
                  }
                />
              </div>
            </li>
            <li className="weapon-select-item">
              <div>
                <label htmlFor="body-damage-multiplier">
                  Body Damage Multiplier:{" "}
                </label>
                <input
                  type="number"
                  id="body-damage-multiplier"
                  name="body-damage-multiplier"
                  step="0.1"
                  min="0"
                  max="4"
                  value={props.bodyDamageMultiplier}
                  onChange={(e) =>
                    props.setBodyDamageMultiplier(parseFloat(e.target.value))
                  }
                />
              </div>
            </li>
          </div>
        </ul>
      </div>
    </li>
  );

  weaponSelectDropdowns.push(
    <li className="top-nav-weapon-select" key="info">
      <div className="top-nav-label">
        {" "}
        <span className="material-symbols-outlined">info</span>
      </div>
      <div className="weapon-select-dropdown-container">
        <ul className="weapon-select-dropdown">
          <div className="weapon-select-items-container-settings">
            <div className="disclosure">
              <p>
                Weapon stats are from{" "}
                <a href="https://docs.google.com/spreadsheets/d/1UQsYeC3LiFEvgBt18AarXYvFN3DWzFN3DqRnyRHC0wc/edit#gid=1516150144">
                  Sorrow's Scribbles
                </a>{" "}
                as of patch 6.2.0
              </p>
            </div>
          </div>
        </ul>
      </div>
    </li>
  );

  return (
    <>
      <div className="top-nav">
        <ul>
          <li className="top-nav-title-container" key="123">
            <h1 className="top-nav-title">DicePlz</h1>
          </li>
          {weaponSelectDropdowns}
        </ul>
      </div>
    </>
  );
}

export default TopNav;
