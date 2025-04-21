import { WeaponConfiguration } from "../Data/WeaponConfiguration";

function ConfigDisplayName(config: WeaponConfiguration) {
  return config.name + " " + config.barrelType + " " + config.ammoType + "";
}

export { ConfigDisplayName };
