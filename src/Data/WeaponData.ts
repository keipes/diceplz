import { WeaponConfiguration } from "../Components/WeaponConfigurator/WeaponConfigurator";
import { ConfigDisplayName } from "../Util/LabelMaker";
import _weaponData from "../assets/weapons.json";
const weaponData: WeaponDataJSON = _weaponData;

interface WeaponDataJSON {
  categories: WeaponCategory[];
}

interface WeaponCategory {
  name: string;
  weapons: Weapon[];
}

interface AmmoStat {
  magSize?: number;
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
const dummyStat: WeaponStats = {
  barrelType: "Factory",
  ammoType: "Standard",
  dropoffs: [{ damage: 0, range: 0 }],
  rpmBurst: 0,
  rpmSingle: 0,
  rpmAuto: 0,
};

const statCache: any = {};
function GetStatsForConfiguration(config: WeaponConfiguration): WeaponStats {
  const cacheKey = ConfigDisplayName(config);
  if (statCache[cacheKey]) {
    return statCache[cacheKey];
  } else {
    const weapon = GetWeaponByName(config.name);
    for (const stat of weapon.stats) {
      if (
        stat.barrelType == config.barrelType &&
        stat.ammoType == config.ammoType
      ) {
        if (statCache[cacheKey]) {
          console.warn("duplicate stat info " + weapon.name);
        }
        statCache[cacheKey] = stat;
      }
    }
    if (!statCache[cacheKey]) {
      console.error(
        "No stats for config! Using dummy! " + ConfigDisplayName(config)
      );
      statCache[cacheKey] = dummyStat;
    }
    return statCache[cacheKey];
  }
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

interface WeaponProcessor {
  (weapon: Weapon): void;
}
function AllWeaponsProcessor(processor: WeaponProcessor) {
  for (const category of WeaponCategories) {
    for (const weapon of GetCategoryWeapons(category)) {
      processor(weapon);
    }
  }
}

function AllWeaponDropoffRangeFrequencies() {
  const ranges = new Map();
  AllWeaponsProcessor((weapon) => {
    for (const stat of weapon.stats) {
      for (const dropoff of stat.dropoffs) {
        if (ranges.has(dropoff.range)) {
          ranges.set(dropoff.range, ranges.get(dropoff.range) + 1);
        } else {
          ranges.set(dropoff.range, 1);
        }
      }
    }
  });
  let keys = [...ranges.keys()];
  keys.sort((a, b) => a - b);
  for (const key of keys) {
    console.log(key + " " + ranges.get(key));
  }
}

// function AllBestConfigurations() {
//   AllWeaponsProcessor((weapon) => {

//   });
//   AllWeaponsProcessor((weapon) => {
//     let best = weapon.stats[0];
//     for (const stat of weapon.stats) {
//       if (stat.rpmAuto && stat.rpmAuto > best.rpmAuto!) {
//         best = stat;
//       }
//     }
//     console.log(weapon.name + " " + best.rpmAuto);
//   });
// }

export {
  WeaponCategories,
  GetCategoryWeapons,
  GetWeaponByName,
  GetStatsForConfiguration,
  GetInitialStatsForWeapon,
  AllWeaponsProcessor,
  AllWeaponDropoffRangeFrequencies,
  // WeaponStats,
};

export type { Weapon, WeaponStats, DamageRange };
