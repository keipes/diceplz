import { WeaponConfiguration } from "./WeaponConfigurator/WeaponConfigurator";

function ConfigDisplayName(config: WeaponConfiguration) {
  return config.name + " " + config.barrelType + " " + config.ammoType + "";
}

export { ConfigDisplayName };
