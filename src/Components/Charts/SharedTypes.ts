import { WeaponConfiguration } from "../../Data/WeaponConfiguration";
import { GetWeaponByName, WeaponStats } from "../../Data/WeaponData";

interface SortableWeaponData {
  config: WeaponConfiguration;
  stats: WeaponStats;
}

function GetCapacity(sWeapon: SortableWeaponData) {
  const weapon = GetWeaponByName(sWeapon.config.name);
  if (weapon.ammoStats) {
    const ammoStat = weapon.ammoStats[sWeapon.config.ammoType];
    if (ammoStat) {
      if (ammoStat.magSize) {
        return ammoStat.magSize;
      }
    }
  }
  return 0;
}

export type { SortableWeaponData };
export { GetCapacity };
