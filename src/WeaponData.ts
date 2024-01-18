import { WeaponConfiguration } from "./WeaponConfigurator/WeaponConfigurator";
import _weaponData from "./assets/weapons.json";
const weaponData: WeaponDataJSON = _weaponData;

interface WeaponDataJSON {
  categories: WeaponCategory[];
}

interface WeaponCategory {
  name: string;
  weapons: Weapon[];
}

interface AmmoStat {
  magazineSize?: number;
  tacticalReload?: number;
  emptyReload?: number;
  headshotMultiplier?: number;
  pelletCount?: number;
}

interface Weapon {
  name: string;
  stats: WeaponStats[];
  ammoStats?: Record<string, AmmoStat | undefined>;
}
interface WeaponStats {
  barrelType: string;
  ammoType: string;
  dropoffs: DamageRange[];
  rpmSingle?: number;
  rpmBurst?: number;
  rpmAuto?: number;
  velocity?: number;
}

interface DamageRange {
  damage: number;
  range: number;
}

// interface WeaponStats extends WeaponStatsRaw {
//   name: string;
// }

interface CategorySelectorFn {}
const CategorySelectors: Map<string, CategorySelectorFn> = new Map();
const CategoriesByString: Map<string, WeaponCategory> = new Map();
const WeaponCategories: string[] = [];
for (const category of weaponData.categories) {
  WeaponCategories.push(category.name);
  CategoriesByString.set(category.name, category);
}

for (const category of WeaponCategories) {
  CategorySelectors.set(category, () => {});
}

function GetCategoryWeapons(category: string): Weapon[] {
  const categoryData = CategoriesByString.get(category);
  if (categoryData) {
    return categoryData.weapons;
  }
  throw new Error("Undefined category: " + String(category));
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
  let returnVal;
  for (const stat of weapon.stats) {
    if (
      stat.barrelType == config.barrelType &&
      stat.ammoType == config.ammoType
    ) {
      if (returnVal) {
        console.warn("duplicate stat info " + weapon.name);
      }
      returnVal = stat;
      //   return stat;
    }
  }
  if (returnVal) return returnVal;
  throw new Error("no stats for config");
}

function GetInitialStatsForWeapon(weapon: Weapon) {
  for (const stat of weapon.stats) {
    if (
      (weapon.name == "BFP.50" || weapon.name == "M44") &&
      stat.barrelType == "Factory" &&
      stat.ammoType == "High Power"
    ) {
      return stat;
    }
    if (
      weapon.name == "BG57" &&
      stat.barrelType == "Factory" &&
      stat.ammoType == "Close Combat"
    ) {
      return stat;
    }
    if (
      (weapon.name == "SUPER 500" ||
        weapon.name == "12M AUTO" ||
        weapon.name == "MCS-880" ||
        weapon.name == "NVK-S22") &&
      stat.barrelType == "Factory" &&
      stat.ammoType == "#01 Buckshot"
    ) {
      return stat;
    }
    if (
      weapon.name == "GHOSTMAKER R10" &&
      stat.barrelType == "Factory" &&
      stat.ammoType == "Standard Bolt"
    ) {
      return stat;
    }
    if (
      weapon.name == "BSV-M" &&
      stat.barrelType == "Factory" &&
      stat.ammoType == "Subsonic"
    ) {
      return stat;
    }
    if (stat.barrelType == "Factory" && stat.ammoType == "Standard") {
      return stat;
    }
  }
  return weapon.stats[0];
}

export {
  WeaponCategories,
  GetCategoryWeapons,
  GetWeaponByName,
  GetStatsForConfiguration,
  GetInitialStatsForWeapon,
  // WeaponStats,
};

export type { Weapon, WeaponStats, DamageRange };
