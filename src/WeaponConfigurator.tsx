import "./WeaponConfigurator.css";
import {
  DuplicateWeaponFn,
  RemoveWeaponFn,
  UpdateWeaponFn,
  WeaponConfig,
} from "./App";
import Weapon from "./WeaponConfigurator/Weapon";

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
  return (
    <>
      <div className="wcf-container">
        <div className="wcf-header">
          <span className="material-symbols-outlined">expand_more</span>
        </div>

        <div className="wcf">{weaponsDisplay}</div>
      </div>
    </>
  );
}

export default WeaponConfigurator;
export type { WeaponConfiguration };
