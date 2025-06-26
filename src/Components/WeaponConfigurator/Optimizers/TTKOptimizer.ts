import { GetWeaponByName } from "../../../Data/WeaponData";
import { DamageAtRangeFromStat, TTK } from "../../../Util/Conversions";
import { OptimizerContext, RPMSelector } from "./types";

export class TTKOptimizer {
  /**
   * Minimizes TTK at a specific range by selecting optimal configurations
   */
  static minimizeTTKAtRange(
    { configurator, modifiers }: OptimizerContext,
    range: number
  ): void {
    configurator.Maximize((config, stat) => {
      let damage = 0;
      for (let i = 0; i < stat.dropoffs.length; i++) {
        if (stat.dropoffs[i].range > range) {
          break;
        }
        damage = stat.dropoffs[i].damage;
      }
      return -TTK(config, modifiers, damage, stat.rpmAuto ? stat.rpmAuto : 0);
    });
  }

  /**
   * Finds and selects configurations that are within 110% of the best TTK
   * at any range for the current weapon set
   */
  static findBestTTKConfigurations(
    { configurator, modifiers }: OptimizerContext,
    rpmSelector: RPMSelector
  ): void {
    const minTtkAtRange = new Map<number, number>();
    let lowestEndTTK = Infinity;
    let highestRangeSeen = 0;
    const r_ranges = new Set<number>();

    // Collect all possible ranges
    configurator.ForEach((config) => {
      GetWeaponByName(config.name).stats.forEach((stat) => {
        for (let i = 0; i < stat.dropoffs.length; i++) {
          r_ranges.add(stat.dropoffs[i].range);
        }
      });
    });

    // Calculate minimum TTK at each range
    configurator.ForEach((config) => {
      GetWeaponByName(config.name).stats.forEach((stat) => {
        for (const rr_range of r_ranges) {
          const damage = DamageAtRangeFromStat(stat, rr_range);
          const ttk = TTK(config, modifiers, damage, rpmSelector(stat));

          if (rr_range > highestRangeSeen) {
            highestRangeSeen = rr_range;
          }

          if (
            !minTtkAtRange.has(rr_range) ||
            minTtkAtRange.get(rr_range)! > ttk
          ) {
            minTtkAtRange.set(rr_range, ttk);
          }
        }

        const ttk = TTK(
          config,
          modifiers,
          stat.dropoffs[stat.dropoffs.length - 1].damage,
          rpmSelector(stat)
        );
        if (ttk < lowestEndTTK) {
          lowestEndTTK = ttk;
        }
      });
    });

    // Sort ranges and normalize TTK values
    const ranges = Array.from(minTtkAtRange.keys());
    ranges.sort((a, b) => b - a);

    let lowestTTK = 10000;
    for (const range of ranges) {
      let ttk = minTtkAtRange.get(range);
      if (ttk && ttk < lowestTTK) {
        lowestTTK = ttk;
      } else if (ttk && ttk > lowestTTK) {
        minTtkAtRange.set(range, lowestTTK);
      }
    }

    ranges.sort((a, b) => a - b);

    // Select configurations within 110% of best TTK
    configurator.Select((weapon, stat) => {
      for (const range of ranges) {
        const damage = DamageAtRangeFromStat(stat, range);
        const ttk = TTK(
          {
            name: weapon.name,
            barrelType: stat.barrelType,
            ammoType: stat.ammoType,
            visible: true,
          },
          modifiers,
          damage,
          rpmSelector(stat)
        );
        const minTtk = minTtkAtRange.get(range) || Infinity;
        const pctTtk = ttk / minTtk;

        if (pctTtk < 1.1) {
          console.log(
            `Selected ${weapon.name} ${stat.barrelType} ${stat.ammoType} at ${range}m ttk=${ttk} minTTK=${minTtk} pctTTK=${pctTtk}`
          );
          return true;
        }
      }
      return false;
    });
  }

  /**
   * RPM selector for automatic fire
   */
  static automaticRPMSelector: RPMSelector = (stat) =>
    stat.rpmAuto ? stat.rpmAuto : 0;

  /**
   * RPM selector for single fire
   */
  static singleFireRPMSelector: RPMSelector = (stat) =>
    stat.rpmSingle ? stat.rpmSingle : 0;
}
