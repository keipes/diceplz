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
  magSize: number;
  tacticalReload?: number;
  emptyReload?: number;
  headshotMultiplier: number;
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

function GetAmmoStat(weapon: Weapon, stat: WeaponStats): AmmoStat | null {
  if (weapon.ammoStats) {
    const ammoStat = weapon.ammoStats[stat.ammoType];
    if (ammoStat) {
      return ammoStat;
    }
  }
  return null;
}

// bad bad bad - time complexity is O(n) for each call - better to iterate through dropoffs in caller
function GetDropoffForRange(
  config: WeaponConfiguration,
  range: number
): DamageRange {
  const stat = GetStatsForConfiguration(config);
  for (const dropoff of stat.dropoffs) {
    if (dropoff.range >= range) {
      return dropoff;
    }
  }
  return stat.dropoffs[stat.dropoffs.length - 1];
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

// // <hack>
// // Add in the DFR reload times since they're not in Sorrow's google sheet yet
// const DFR_RELOAD_TIMES = {
//   Standard: { Tactical: 2.54, Empty: 2.57 },
//   "Standard Extended": { Tactical: 2.75, Empty: 2.68 },
//   "Standard Beltfed": { Tactical: 5.87, Empty: 5.9 },
//   "Armor Piercing": { Tactical: 7.09, Empty: 7.17 },
//   "High Power": { Tactical: 2.64, Empty: 2.82 },
//   "High Power Beltfed": { Tactical: 7.17, Empty: 7.05 },
//   Subsonic: { Tactical: 2.72, Empty: 2.78 },
//   "Subsonic Beltfed": { Tactical: 5.95, Empty: 5.87 },
// };
// AllWeaponsProcessor((weapon) => {
//   if (weapon.name == "DFR STRIFE") {
//     console.log(weapon);
//     for (const [key, value] of Object.entries(weapon.ammoStats as Object)) {
//       console.log(key);
//       const newData: any = DFR_RELOAD_TIMES[key];
//       if (newData) {
//         if (!value.tacticalReload || !value.emptyReload) {
//           value.tacticalReload = newData.Tactical;
//           value.emptyReload = newData.Empty;
//         } else {
//           console.warn("Had existing reload time data for " + key);
//         }
//       } else {
//         if (!value.tacticalReload || !value.emptyReload) {
//           console.warn("No updated DFR reload data for " + key);
//         }
//       }
//     }
//   }
// });
// // </hack>

enum StatMatchFilter {
  MagSize = Math.pow(2, 0),
  TacticalReload = Math.pow(2, 1),
  EmptyReload = Math.pow(2, 2),
  AmmoType = Math.pow(2, 3),
}

class StatMatchMask {
  private mask: number;
  constructor() {
    this.mask = 0;
  }

  static FromFilters(...filters: StatMatchFilter[]) {
    const mask = new StatMatchMask();
    for (const filter of filters) {
      mask.AddFilter(filter);
    }
    return mask;
  }

  public AddFilter(filter: StatMatchFilter) {
    this.mask |= filter;
  }
  public RemoveFilter(filter: StatMatchFilter) {
    this.mask &= ~filter;
  }
  public ContainsFilter(filter: StatMatchFilter) {
    return (this.mask & filter) === filter;
  }
}
function StatsMatch(
  weaponA: Weapon,
  statA: WeaponStats,
  weaponB: Weapon,
  statB: WeaponStats,
  ignore: StatMatchMask
) {
  if (!ignore.ContainsFilter(StatMatchFilter.AmmoType)) {
    if (statA.ammoType !== statB.ammoType) {
      return false;
    }
  }
  if (statA.barrelType !== statB.barrelType) {
    return false;
  }
  if (statA.velocity !== statB.velocity) {
    return false;
  }
  if (statA.rpmAuto !== statB.rpmAuto) {
    return false;
  }
  if (statA.rpmBurst !== statB.rpmBurst) {
    return false;
  }
  if (statA.rpmSingle !== statB.rpmSingle) {
    return false;
  }
  if (statA.dropoffs.length !== statB.dropoffs.length) {
    return false;
  }
  for (let i = 0; i < statA.dropoffs.length; i++) {
    if (statA.dropoffs[i].range !== statB.dropoffs[i].range) {
      return false;
    }
    if (statA.dropoffs[i].damage !== statB.dropoffs[i].damage) {
      return false;
    }
  }
  const ammoStatA = GetAmmoStat(weaponA, statA);
  const ammoStatB = GetAmmoStat(weaponB, statB);
  if (!ignore.ContainsFilter(StatMatchFilter.MagSize)) {
    if (ammoStatA?.magSize !== ammoStatB?.magSize) {
      return false;
    }
  }
  if (!ignore.ContainsFilter(StatMatchFilter.TacticalReload)) {
    if (ammoStatA?.tacticalReload !== ammoStatB?.tacticalReload) {
      return false;
    }
  }
  if (!ignore.ContainsFilter(StatMatchFilter.EmptyReload)) {
    if (ammoStatA?.emptyReload !== ammoStatB?.emptyReload) {
      return false;
    }
  }
  if (ammoStatA?.headshotMultiplier !== ammoStatB?.headshotMultiplier) {
    return false;
  }
  if (ammoStatA?.pelletCount !== ammoStatB?.pelletCount) {
    return false;
  }
  return true;
}

export {
  WeaponCategories,
  GetCategoryWeapons,
  GetWeaponByName,
  GetStatsForConfiguration,
  GetAmmoStat,
  GetInitialStatsForWeapon,
  AllWeaponsProcessor,
  AllWeaponDropoffRangeFrequencies,
  GetDropoffForRange,
  StatsMatch,
  StatMatchFilter,
  StatMatchMask,
  // WeaponStats,
};

export type { Weapon, WeaponStats, DamageRange, AmmoStat };
