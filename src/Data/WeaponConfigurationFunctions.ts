import {
  WeaponConfigurations,
  WeaponConfigurationStats,
  WeaponConfiguration,
} from "./WeaponConfiguration";
import {
  StatMatchMask,
  StatMatchFilter,
  GetWeaponByName,
  StatsMatch,
  GetAmmoStat,
  Weapon,
  WeaponStats,
  GetInitialStatsForWeapon,
  GetStatsForConfiguration,
  BaseAmmoType,
} from "./WeaponData";

interface SeenStats {
  weapon: Weapon;
  stats: WeaponStats;
}
export const AddAllConfigurations = (config: WeaponConfigurations) => {
  const allConfigsOnlyLargestMag = true;
  const allConfigsIgnoreAP = true;
  if (allConfigsOnlyLargestMag) {
    const ammoDedupeStrFn = (ammoType: string) =>
      ammoType
        .replace(" Extended", "")
        .replace(" Beltfed", "")
        .replace(" Drum", "");
    const weaponMap = new Map<string, Map<String, SeenStats[]>>();
    const ignoreMask = StatMatchMask.FromFilters(
      StatMatchFilter.AmmoType,
      StatMatchFilter.MagSize,
      StatMatchFilter.TacticalReload,
      StatMatchFilter.EmptyReload
    );
    config.ForEach((config) => {
      const weapon = GetWeaponByName(config.name);
      let seenAmmoTypes = weaponMap.get(weapon.name);
      if (!seenAmmoTypes) {
        seenAmmoTypes = new Map<string, SeenStats[]>();
        weaponMap.set(weapon.name, seenAmmoTypes);
      }
      for (const stat of weapon.stats) {
        const ammoDedupeStr = ammoDedupeStrFn(stat.ammoType);

        let seenStats = seenAmmoTypes.get(ammoDedupeStr);
        if (!seenStats) {
          seenStats = [];
          seenAmmoTypes.set(ammoDedupeStr, seenStats);
        }
        let includeStat = true;

        const newStats = seenStats.filter((seenStat) => {
          if (
            StatsMatch(
              seenStat.weapon,
              seenStat.stats,
              weapon,
              stat,
              ignoreMask
            )
          ) {
            const seenAmmoStat = GetAmmoStat(seenStat.weapon, seenStat.stats);
            const ammoStat = GetAmmoStat(weapon, stat);
            if (seenAmmoStat && ammoStat) {
              if (seenAmmoStat.magSize < ammoStat.magSize) {
                return false;
              }
            }
            includeStat = false;
          }
          return true;
        });
        if (includeStat) {
          newStats.push({ weapon, stats: stat });
        }
        seenAmmoTypes.set(ammoDedupeStr, newStats);
      }
    });
    config.Select((weapon, stat) => {
      if (
        allConfigsIgnoreAP &&
        stat.ammoType.indexOf("Armor Piercing") >= 0 &&
        weapon.name !== "NTW-50"
      ) {
        return false;
      }
      let seenAmmoTypes = weaponMap.get(weapon.name);
      if (seenAmmoTypes) {
        let ammoDedupeStr = ammoDedupeStrFn(stat.ammoType);
        let seenStats = seenAmmoTypes.get(ammoDedupeStr);
        if (seenStats) {
          for (const seenStat of seenStats) {
            if (
              stat.ammoType == seenStat.stats.ammoType &&
              stat.barrelType == seenStat.stats.barrelType
            ) {
              return true;
            }
          }
        }
      }
      return false;
    });
  } else {
    config.Select((_w, _s) => {
      return true;
    });
  }
};

export const ResetWeaponConfigurations = (config: WeaponConfigurations) => {
  const currentWeapons = new Set<string>();
  config.ForEachWeapon((weapon) => {
    currentWeapons.add(weapon.name);
  });

  const seenWeapons = new Set<string>();
  config.SelectWeapons((weapon) => {
    if (currentWeapons.has(weapon.name) && !seenWeapons.has(weapon.name)) {
      const weaponData = GetWeaponByName(weapon.name);
      const basicStats = GetInitialStatsForWeapon(weaponData);
      if (
        weapon.ammoType === basicStats.ammoType &&
        weapon.barrelType === basicStats.barrelType
      ) {
        seenWeapons.add(weapon.name);
        return true;
      }
    }
    return false;
  });
};

const AmmoTypeComparator = (a: string, b: string) => {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
};

export const AmmoTypes = (configurations: WeaponConfigurations) => {
  const ammoTypes = new Set<string>();
  configurations.ForEach((config) => {
    const weapon = GetWeaponByName(config.name);
    for (const stat of weapon.stats) {
      ammoTypes.add(stat.ammoType);
    }
  });
  return Array.from(ammoTypes).sort(AmmoTypeComparator);
};

export const BaseAmmoTypes = (configurations: WeaponConfigurations) => {
  const baseAmmoTypes = new Set<string>();
  AmmoTypes(configurations).forEach((ammoType) => {
    const baseAmmoType = BaseAmmoType(ammoType);
    if (baseAmmoType) {
      baseAmmoTypes.add(baseAmmoType);
    }
  });
  return Array.from(baseAmmoTypes).sort(AmmoTypeComparator);
};

export const SelectAmmo = (
  configurations: WeaponConfigurations,
  ammoType: string
) => {
  const seenWeapons = new Set<string>();
  const weapons = new Array<WeaponConfiguration>();
  configurations.ForEach((config) => {
    seenWeapons.add(config.name);
  });
  seenWeapons.forEach((weaponName) => {
    const weapon = GetWeaponByName(weaponName);
    let addedAny = false;
    const stats = weapon.stats;
    for (const stat of stats) {
      if (stat.ammoType.indexOf(ammoType) >= 0) {
        const newConfig = {
          name: weapon.name,
          barrelType: stat.barrelType,
          ammoType: stat.ammoType,
          visible: true,
        };
        weapons.push(newConfig);
        addedAny = true;
      }
    }
    if (!addedAny) {
      const newConfig = {
        name: weapon.name,
        barrelType: stats[0].barrelType,
        ammoType: stats[0].ammoType,
        visible: false,
      };
      weapons.push(newConfig);
    }
  });
  configurations.Reset();
  configurations.BulkAddWeapon(weapons);
  configurations.Dedupe();
};

// const Weapons = function(config: WeaponConfigurations) {
//   const weapons = new Map<string, WeaponConfiguration>();
//   config.ForEach((weapon) => {
//     weapons.set(weapon.name, weapon);
//   });
//   return weapons;
// }
