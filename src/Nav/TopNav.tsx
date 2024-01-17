import { WeaponConfig } from "../App";
import {
  ConfigLoader,
  DefaultModifiers,
  Modifiers,
} from "../Data/ConfigLoader";
import {
  GetCategoryWeapons,
  GetInitialStatsForWeapon,
  WeaponCategories,
} from "../WeaponData";
import "./TopNav.css";
import { useState } from "react";

import settingsSvg from "../icons/settings_FILL0_wght400_GRAD0_opsz24.svg";
import infoSvg from "../icons/info_FILL0_wght400_GRAD0_opsz24.svg";
import deleteSvg from "../icons/delete_FILL0_wght400_GRAD0_opsz24.svg";

interface SetModifiersFn {
  (modifiers: Modifiers): void;
}

interface NavProps {
  weaponConfig: WeaponConfig;
  configLoader: ConfigLoader;
  modifiers: Modifiers;
  setModifiers: SetModifiersFn;
}

function TopNav(props: NavProps) {
  const [saveFocused, setSaveFocused] = useState(false);
  const [saveInputValue, setSaveInputValue] = useState("");
  // const [configsList, setConfigsList] = useState(
  //   useMemo(() => props.configLoader.listConfigs(), [])
  // );
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
            const stats = GetInitialStatsForWeapon(weapon);
            props.weaponConfig.AddWeapon({
              name: weapon.name,
              visible: true,
              barrelType: stats.barrelType,
              ammoType: stats.ammoType,
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
                    const stats = GetInitialStatsForWeapon(weapon);
                    toAdd.push({
                      name: weapon.name,
                      visible: true,
                      barrelType: stats.barrelType,
                      ammoType: stats.ammoType,
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

  let saveDialogue = (
    <span className="save-config">Save Current Configuration</span>
  );
  const configLoader = props.configLoader;
  const loadable = [];

  const configs = configLoader.listConfigs();
  configs.sort(Intl.Collator().compare);
  for (const name of configs) {
    loadable.push(
      <div className="config-loader-container" key={name}>
        <div
          className="config-name"
          onClick={() => {
            configLoader.loadConfig(name);
          }}
        >
          {name}
        </div>
        <div>
          <img
            className={"config-delete svg-white svg-hover-red"}
            src={deleteSvg}
            onClick={() => {
              configLoader.deleteConfig(name);
            }}
            alt="delete"
          />
        </div>
      </div>
    );
  }
  if (saveFocused) {
    saveDialogue = (
      <form
        action=""
        onSubmit={(e) => {
          e.preventDefault();
          if (saveInputValue == "") {
            configLoader.saveConfig("Unnamed");
          } else {
            configLoader.saveConfig(saveInputValue);
          }
          // setConfigsList(configLoader.listConfigs());
          setSaveInputValue("");
        }}
      >
        <input
          value={saveInputValue}
          autoFocus
          type="text"
          onChange={(e) => {
            setSaveInputValue(e.target.value);
          }}
        />
      </form>
    );
  }
  weaponSelectDropdowns.push(
    <li className="top-nav-weapon-select " key="save load">
      <div className="top-nav-label select-save-load">SAVE / LOAD</div>
      <div className="weapon-select-dropdown-container">
        <ul className="weapon-select-dropdown">
          <div
            className="weapon-select-add-all"
            onClick={() => {
              setSaveFocused(true);
            }}
            onBlur={() => {
              setSaveFocused(false);
              setSaveInputValue("");
            }}
          >
            {saveDialogue}
          </div>
          <div className="weapon-select-items-container-saveload">
            {loadable}
          </div>
        </ul>
      </div>
    </li>
  );
  weaponSelectDropdowns.push(
    <li className="top-nav-weapon-select" key="settings">
      <div className="top-nav-label">
        {" "}
        <img
          className={"top-nav-icon svg-white svg-hover-blue"}
          src={settingsSvg}
          alt="settings"
        />
      </div>
      <div className="weapon-select-dropdown-container">
        <ul className="weapon-select-dropdown">
          <div
            className="weapon-select-add-all"
            onClick={() => {
              props.setModifiers(DefaultModifiers);
            }}
          >
            Reset
          </div>
          <div className="weapon-select-items-container-settings">
            <li className="weapon-select-item">
              {" "}
              <div>
                <label htmlFor="health-multiplier">
                  Soldier Max Health Multiplier:{" "}
                </label>
                <input
                  type="number"
                  className="modifier-multiplier-input"
                  id="health-multiplier"
                  name="health-multiplier"
                  step="0.1"
                  min="0.1"
                  max="10"
                  value={props.modifiers.healthMultiplier}
                  onChange={(e) => {
                    const cloned = structuredClone(props.modifiers);
                    cloned.healthMultiplier = parseFloat(e.target.value);
                    props.setModifiers(cloned);
                  }}
                />
              </div>
            </li>
            <li className="weapon-select-item">
              <div>
                <label htmlFor="damage-multiplier">Damage Multiplier: </label>
                <input
                  type="number"
                  className="modifier-multiplier-input"
                  id="damage-multiplier"
                  name="damage-multiplier"
                  step="0.1"
                  min="0.1"
                  max="5"
                  value={props.modifiers.damageMultiplier}
                  onChange={(e) => {
                    const cloned = structuredClone(props.modifiers);
                    cloned.damageMultiplier = parseFloat(e.target.value);
                    props.setModifiers(cloned);
                  }}
                />
              </div>
            </li>
            <li className="weapon-select-item">
              <div>
                <label htmlFor="body-damage-multiplier">
                  Body Damage Multiplier:{" "}
                </label>
                <input
                  className="modifier-multiplier-input"
                  type="number"
                  id="body-damage-multiplier"
                  name="body-damage-multiplier"
                  step="0.1"
                  min="0"
                  max="4"
                  value={props.modifiers.bodyDamageMultiplier}
                  onChange={(e) => {
                    const cloned = structuredClone(props.modifiers);
                    cloned.bodyDamageMultiplier = parseFloat(e.target.value);
                    props.setModifiers(cloned);
                  }}
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
        <img
          className={"top-nav-icon svg-white svg-hover-blue"}
          src={infoSvg}
          alt="info"
        />
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
            <a href="https://diceplz.com">
              <h1
                className="top-nav-title"
                onClick={() => window.location.reload()}
              >
                DP
              </h1>
            </a>
          </li>
          {weaponSelectDropdowns}
        </ul>
      </div>
    </>
  );
}

export default TopNav;
