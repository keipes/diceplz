import { GetWeaponByName } from "../../Data/WeaponData.ts";
import { WeaponConfig } from "../App.tsx";
import { WeaponConfiguration } from "./WeaponConfigurator.tsx";
import { ConfigHSL } from "../../Util/StringColor.ts";

import {
  ContentCopyIcon,
  DeleteIcon,
  VisibilityIcon,
  VisibilityOffIcon,
} from "../Icons.tsx";
import {} from "../Icons.tsx";
interface WeaponProps {
  id: string;
  config: WeaponConfiguration;
  weaponConfig: WeaponConfig;
}

function Weapon(props: WeaponProps) {
  const weapon = GetWeaponByName(props.config.name);
  let selectedBarrelInitial = "";
  let selectedAmmoInitial = "";
  for (const stat of weapon.stats) {
    if (stat.barrelType == "Factory") {
      selectedBarrelInitial = "Factory";
    }
    if (stat.ammoType == "Standard") {
      selectedAmmoInitial = "Standard";
    }
    if (stat.ammoType == "Standard Bolts") {
      selectedAmmoInitial = "Standard";
    }
  }
  // fall back to initial if none exists
  if (selectedBarrelInitial == "" && weapon.stats.length > 0) {
    selectedBarrelInitial = weapon.stats[0].barrelType;
  }
  if (selectedAmmoInitial == "" && weapon.stats.length > 0) {
    selectedAmmoInitial = weapon.stats[0].ammoType;
  }

  const seenBarrels = new Set<string>();
  const barrelOptions = [];
  const seenAmmo = new Set<string>();
  const ammoOptions = [];

  const style = {
    borderColor: ConfigHSL(props.config),
  };
  const nameStyle = {
    color: ConfigHSL(props.config),
  };

  for (const stat of weapon.stats) {
    if (stat.barrelType == props.config.barrelType) {
      if (!seenAmmo.has(stat.ammoType)) {
        // shouldn't need to do this
        ammoOptions.push(
          <option
            value={stat.ammoType}
            key={stat.ammoType}
            className="wcf-selector-option"
          >
            {stat.ammoType}
          </option>
        );
        seenAmmo.add(stat.ammoType);
      }
    }
    if (!seenBarrels.has(stat.barrelType)) {
      barrelOptions.push(
        <option
          value={stat.barrelType}
          key={stat.barrelType}
          className="wcf-selector-option"
        >
          {stat.barrelType}
        </option>
      );
      seenBarrels.add(stat.barrelType);
    }
  }

  let config = props.config;

  let visibility = "visibility";
  if (!config.visible) {
    visibility += "_off";
  }
  let visibilitySvg;
  if (config.visible) {
    visibilitySvg = <VisibilityIcon alt="toggle visibility" />;
  } else {
    visibilitySvg = <VisibilityOffIcon alt="toggle visibility" />;
  }
  return (
    <div className="wcf-weapon" style={style}>
      <div className="wcf-header">
        <div className="wcf-header-item wcf-name" style={nameStyle}>
          {config.name}
        </div>

        <span
          className={
            "config-delete wcf-header-item wcf-header-button wcf-duplicate svg-white svg-hover-blue"
          }
          onClick={() => {
            props.weaponConfig.DuplicateWeapon(props.id);
          }}
        >
          <ContentCopyIcon alt="duplicate" />
        </span>
        <span
          className={
            "wcf-header-item wcf-header-button wcf-visibility svg-white svg-hover-blue"
          }
          onClick={() => {
            const cloned = JSON.parse(JSON.stringify(props.config));
            cloned.visible = !cloned.visible;
            props.weaponConfig.UpdateWeapon(props.id, cloned);
          }}
        >
          {visibilitySvg}
        </span>
        <span
          className={
            "wcf-header-item wcf-header-button wcf-close svg-white svg-hover-red"
          }
          onClick={() => {
            props.weaponConfig.RemoveWeapon(props.id);
          }}
        >
          <DeleteIcon />
        </span>
      </div>

      <div className="wcf-weapon-selector">
        <label htmlFor="barrel" className="wcf-selector-label">
          BL
        </label>
        <span></span>
        <select
          className="wcf-selector-select"
          value={props.config.barrelType}
          name="barrel"
          id="barrel"
          onChange={(e) => {
            const cloned = JSON.parse(JSON.stringify(props.config));
            cloned.barrelType = e.target.value;
            props.weaponConfig.UpdateWeapon(props.id, cloned);
          }}
          onClick={(e) => e.stopPropagation()}
          disabled={seenBarrels.size < 2}
        >
          {barrelOptions}
        </select>
      </div>
      <div className="wcf-weapon-selector">
        <label htmlFor="barrel" className="wcf-selector-label">
          AM
        </label>
        <span></span>
        <select
          className={"wcf-selector-select wcf-selector-ammo-" + props.config.ammoType.replace(/\s/g, '').toLowerCase()}
          value={props.config.ammoType}
          name="ammo"
          id="ammo"
          onChange={(e) => {
            const cloned = JSON.parse(JSON.stringify(props.config));
            cloned.ammoType = e.target.value;
            props.weaponConfig.UpdateWeapon(props.id, cloned);
          }}
          onClick={(e) => e.stopPropagation()}
          disabled={seenAmmo.size < 2}
        >
          {ammoOptions}
        </select>
      </div>
    </div>
  );
}

export default Weapon;
