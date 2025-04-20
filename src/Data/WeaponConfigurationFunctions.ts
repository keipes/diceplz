import { WeaponConfigurations } from "./WeaponConfiguration";
import {
  StatMatchMask,
  StatMatchFilter,
  GetWeaponByName,
  StatsMatch,
  GetAmmoStat,
  Weapon,
  WeaponStats,
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
  config.Select((weapon, stat) => {
    if (stat.ammoType.indexOf("Armor Piercing") >= 0) {
      return false;
    }
    return true;
  });
};
