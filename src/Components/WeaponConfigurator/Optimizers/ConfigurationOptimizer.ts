import {
  GetAmmoStat,
  GetStatsForConfiguration,
  GetWeaponByName,
  OnlyStatsWithBiggestMags,
  StatMatchFilter,
  StatMatchMask,
  StatsMatch,
  Weapon,
  WeaponStats,
} from "../../../Data/WeaponData";
import { ConfigDisplayName } from "../../../Util/LabelMaker";
import { OptimizerContext } from "./types";

interface SeenStats {
  weapon: Weapon;
  stats: WeaponStats;
}

export class ConfigurationOptimizer {
  /**
   * Adds all configurations for currently selected weapons with deduplication options
   */
  static addAllConfigurationsForSelected(
    { configurator }: OptimizerContext,
    onlyLargestMag: boolean = true,
    ignoreAP: boolean = true
  ): void {
    if (onlyLargestMag) {
      const ammoDedupeStrFn = (ammoType: string) =>
        ammoType
          .replace(" Extended", "")
          .replace(" Beltfed", "")
          .replace(" Drum", "");

      const weaponMap = new Map<string, Map<string, SeenStats[]>>();
      const ignoreMask = StatMatchMask.FromFilters(
        StatMatchFilter.AmmoType,
        StatMatchFilter.MagSize,
        StatMatchFilter.TacticalReload,
        StatMatchFilter.EmptyReload
      );

      configurator.ForEach((config) => {
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

      configurator.Select((weapon, stat) => {
        if (
          ignoreAP &&
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
                stat.ammoType === seenStat.stats.ammoType &&
                stat.barrelType === seenStat.stats.barrelType
              ) {
                return true;
              }
            }
          }
        }
        return false;
      });
    } else {
      configurator.Select((_w, _s) => {
        return true;
      });
    }
  }

  /**
   * Removes lower capacity ammo types if stats match
   */
  static removeLowerCapacityDuplicates({
    configurator,
  }: OptimizerContext): void {
    let toFilter = [];
    for (let [_, config] of configurator.weaponConfigurations) {
      toFilter.push({
        weapon: GetWeaponByName(config.name),
        stat: GetStatsForConfiguration(config),
      });
    }

    const filtered = OnlyStatsWithBiggestMags(toFilter);
    const seen = new Set<string>();

    for (const stat of filtered) {
      seen.add(
        ConfigDisplayName({
          name: stat.weapon.name,
          barrelType: stat.stat.barrelType,
          ammoType: stat.stat.ammoType,
          visible: true,
        })
      );
    }

    configurator.Filter((config) => seen.has(ConfigDisplayName(config)));
  }
}
