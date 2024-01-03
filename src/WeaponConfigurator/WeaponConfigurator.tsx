import "./WeaponConfigurator.css";
import {
  DuplicateWeaponFn,
  RemoveWeaponFn,
  UpdateWeaponFn,
  WeaponConfig,
} from "../App";
import Weapon from "./Weapon";
import { useState } from "react";

interface WeaponConfiguratorProps {
  configurations: Map<String, WeaponConfiguration>;
  //   duplicateWeapon: DuplicateWeaponFn;
  //   removeWeapon: RemoveWeaponFn;
  //   updateWeapon: UpdateWeaponFn;
  weaponConfig: WeaponConfig;
}

interface WeaponConfiguration {
  name: string;
  visible: boolean;
  barrelType: string;
  ammoType: string;
}

function WeaponConfigurator(props: WeaponConfiguratorProps) {
  const weaponsDisplay = [];
  for (const [id, config] of props.configurations) {
    weaponsDisplay.push(
      <Weapon
        id={id}
        config={config}
        key={id}
        weaponConfig={props.weaponConfig}
      />
    );
  }
  const [open, setOpen] = useState(true);
  function toggle() {
    setOpen(!open);
  }

  let containerClass = "wcf-container";
  let expansionSymbol = "expand_more";
  if (!open) {
    expansionSymbol = "expand_less";
    containerClass = "wcf-container-closed";
  }

  return (
    <>
      <div className={containerClass}>
        <div className="wcf-header-bar">
          <span></span>
          <span
            className="configurator-toggle material-symbols-outlined"
            onClick={toggle}
          >
            {expansionSymbol}
          </span>
          <span
            className="configurator-clear-all"
            onClick={props.weaponConfig.Reset}
          >
            Clear All
          </span>
        </div>
        <div className="wcf-scrollable">
          <div className="wcf">{weaponsDisplay}</div>
        </div>
      </div>
    </>
  );
}

export default WeaponConfigurator;
export type { WeaponConfiguration };
