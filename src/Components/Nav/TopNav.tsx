import {
  ConfigLoader,
  DefaultModifiers,
  Modifiers,
} from "../../Data/ConfigLoader";
import { Settings } from "../../Data/SettingsLoader";
import {
  GetCategoryWeapons,
  GetInitialStatsForWeapon,
  WeaponCategories,
} from "../../Data/WeaponData";
import "./TopNav.css";
import { useContext, useState } from "react";

import {
  SettingsIcon,
  DeleteIcon,
  DiscordMarkWhite,
  DiscordMarkBlack,
  DiscordMarkBlue,
  GoogleSheetsLogo,
} from "../Icons";
import { ConfiguratorContext, ThemeContext } from "../App";

interface SetModifiersFn {
  (modifiers: Modifiers): void;
}

interface BooleanVoidFn {
  (value: boolean): void;
}

interface NavProps {
  configLoader: ConfigLoader;
  setUseAmmoColorsForGraph: BooleanVoidFn;
  settings: Settings;
  modifiers: Modifiers;
  setModifiers: SetModifiersFn;
}

function TopNav(props: NavProps) {
  const [saveFocused, setSaveFocused] = useState(false);
  const [saveInputValue, setSaveInputValue] = useState("");
  const theme = useContext(ThemeContext);
  const configurator = useContext(ConfiguratorContext);
  const weaponSelectDropdowns = [];
  for (const category of WeaponCategories) {
    const weaponSelectItems = [];
    let weapons = GetCategoryWeapons(category);
    weapons.sort((a, b) => {
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });
    for (const weapon of weapons) {
      weaponSelectItems.push(
        <div
          className="weapon-select-item"
          key={weapon.name}
          onClick={() => {
            const stats = GetInitialStatsForWeapon(weapon);
            configurator.AddWeapon({
              name: weapon.name,
              visible: true,
              barrelType: stats.barrelType,
              ammoType: stats.ammoType,
            });
          }}
        >
          {weapon.name}
        </div>
      );
    }
    weaponSelectDropdowns.push(
      <li className="nav-item" key={category}>
        <div className="nav-label nav-hover-highlight">
          {category.toUpperCase()}
        </div>
        <div className="weapon-select-dropdown-container">
          <div className="weapon-select-dropdown">
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
                configurator.BulkAddWeapon(toAdd);
              }}
            >
              Add All
            </div>
            <div className="weapon-select-items-container">
              {weaponSelectItems}
            </div>
          </div>
        </div>
      </li>
    );
    // // load a default category of weapons if we're in development
    // if (
    //   category == "Assault Rifles" &&
    //   window.location.hostname === "localhost"
    // ) {
    //   useEffect(() => {
    //     const toAdd = [];
    //     for (const weapon of weapons) {
    //       if (weapon.stats.length == 0) {
    //         console.warn("no stats for " + weapon.name);
    //       } else {
    //         const stats = GetInitialStatsForWeapon(weapon);
    //         toAdd.push({
    //           name: weapon.name,
    //           visible: true,
    //           barrelType: stats.barrelType,
    //           ammoType: stats.ammoType,
    //         });

    //         configurator.BulkAddWeapon(toAdd);
    //       }
    //     }
    //   }, []);
    // }
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
          <span
            className={"config-delete svg-white svg-hover-red"}
            onClick={() => {
              configLoader.deleteConfig(name);
            }}
          >
            <DeleteIcon alt="delete" />
          </span>
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
    <li className="nav-item " key="save load">
      <div className="nav-label select-save-load nav-hover-highlight">
        SAVE / LOAD
      </div>
      <div className="weapon-select-dropdown-container">
        <div className="weapon-select-dropdown">
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
        </div>
      </div>
    </li>
  );
  weaponSelectDropdowns.push(
    <li className="nav-item" key="settings">
      <div className="nav-label">
        {" "}
        <span className={"nav-icon svg-white svg-hover-blue"}>
          <SettingsIcon alt="settings" />
        </span>
      </div>
      <div className="weapon-select-dropdown-container">
        <div className="weapon-select-dropdown">
          <div
            className="weapon-select-add-all"
            onClick={() => {
              props.setModifiers(DefaultModifiers);
            }}
          >
            Reset
          </div>
          <div className="weapon-select-items-container-settings">
            <div className="weapon-select-item">
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
            </div>
            <div className="weapon-select-item">
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
            </div>
            <div className="weapon-select-item">
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
            </div>
            <div className="weapon-select-item">
              <div>
                <label htmlFor="body-armor">Players Wear Body Armor: </label>
                <input
                  className="modifier-input-checkbox"
                  type="checkbox"
                  id="body-armor"
                  name="body-armor"
                  checked={props.modifiers.bodyArmor}
                  onChange={(e) => {
                    const cloned = structuredClone(props.modifiers);
                    cloned.bodyArmor = e.target.checked;
                    props.setModifiers(cloned);
                  }}
                />
              </div>
            </div>
            <div className="weapon-select-item">
              <div>
                <label htmlFor="alternate-weapon-colors">
                  Assign Graph Colors By Ammo Type:{" "}
                </label>
                <input
                  type="checkbox"
                  className="modifier-input-checkbox"
                  id="alternate-weapon-colors"
                  name="alternate-weapon-colors"
                  checked={props.settings.useAmmoColorsForGraph}
                  onChange={(e) => {
                    props.setUseAmmoColorsForGraph(e.target.checked);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  );

  // google sheets link
  weaponSelectDropdowns.push(
    <li className="nav-item" key="sheets-logo">
      <div className="nav-label">
        <a href="https://docs.google.com/spreadsheets/d/1jNUxS27k9Qsx6SlnqBRV7eM92kp6_KYWQs_2rTBbRdg">
          <span className="nav-icon">
            <GoogleSheetsLogo />
          </span>
        </a>
      </div>
    </li>
  );

  // discord link
  weaponSelectDropdowns.push(
    <li className="nav-item" key="discord-logo">
      <div className="nav-label">
        <a href="https://discord.gg/2043">
          <span className="nav-icon nav-item-hide-hover">
            {theme.isDarkMode ? (
              <DiscordMarkWhite alt="Discord" />
            ) : (
              <DiscordMarkBlack alt="Discord" />
            )}
          </span>
          <span className="nav-icon nav-item-hide-no-hover">
            <DiscordMarkBlue alt="Discord" />
          </span>
        </a>
      </div>
    </li>
  );
  // patch label
  weaponSelectDropdowns.push(
    <li className="nav-item" key="patch-label">
      <div className="nav-label nav-label-patch">8.9.0</div>
    </li>
  );
  return (
    <>
      <div className="nav">
        <ul className="nav-list">
          <li className="nav-title" key="123">
            <a href="https://diceplz.com">
              <h1
                className="nav-title"
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
