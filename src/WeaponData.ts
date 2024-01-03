import { WeaponConfiguration } from "./WeaponConfigurator/WeaponConfigurator";
import weaponData from "./assets/weapons.json";

interface Weapon {
  name: string;
  stats: WeaponStats[];
}

interface WeaponStats {
  name: string;
  barrelType: string;
  ammoType: string;
  dropoffs: DamageRange[];
  rpmSingle: number;
  rpmBurst: number;
  rpmAuto: number;
  velocity: number;
}

interface DamageRange {
  damage: number;
  range: number;
}

const WeaponCategories: string[] = Object.keys(weaponData);
function GetCategoryWeapons(category: string): Weapon[] {
  return weaponData[category];
}

const weaponsByName = new Map<string, Weapon>();
for (const category of WeaponCategories) {
  for (const weapon of GetCategoryWeapons(category)) {
    weaponsByName.set(weapon.name, weapon);
  }
}
function GetWeaponByName(name: string): Weapon {
  return weaponsByName.get(name)!;
}

function GetStatsForConfiguration(config: WeaponConfiguration) {
  const weapon = GetWeaponByName(config.name);
  for (const stat of weapon.stats) {
    if (
      stat.barrelType == config.barrelType &&
      stat.ammoType == config.ammoType
    ) {
      return stat;
    }
  }
  throw new Error("no stats for config");
}

export {
  WeaponCategories,
  GetCategoryWeapons,
  GetWeaponByName,
  GetStatsForConfiguration,
  // WeaponStats,
};

export type { Weapon, WeaponStats, DamageRange };
