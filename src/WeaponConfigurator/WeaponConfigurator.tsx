import "./WeaponConfigurator.css";
import { WeaponConfig } from "../App";
import Weapon from "./Weapon";

interface WeaponConfiguratorProps {
  configurations: Map<string, WeaponConfiguration>;
  weaponConfig: WeaponConfig;
  open: boolean;
  setOpen: SetOpenFn;
}

interface SetOpenFn {
  (visible: boolean): void;
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
  function toggle() {
    props.setOpen(!props.open);
  }

  let containerClass = "wcf-container";
  let expansionSymbol = "expand_more";
  if (!props.open) {
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
