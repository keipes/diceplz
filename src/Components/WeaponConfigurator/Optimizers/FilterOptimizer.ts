import {
  GetStatsForConfiguration,
  GetWeaponByName,
} from "../../../Data/WeaponData";
import { OptimizerContext } from "./types";

export class FilterOptimizer {
  /**
   * Selects all suppressed + subsonic configurations for stealth builds
   */
  static selectStealthConfigurations({ configurator }: OptimizerContext): void {
    configurator.Select((_, stat) => {
      if (stat.ammoType === "Subsonic") {
        const suppressedBarrels = {
          "6KU": true,
          "Type 4": true,
          PB: true,
          GAR45: true,
          Factory: true,
        };
        return (
          suppressedBarrels[
            stat.barrelType as keyof typeof suppressedBarrels
          ] || false
        );
      }
      return false;
    });
  }

  /**
   * Selects configurations with velocity > 1000m/s
   */
  static selectHighVelocityConfigurations({
    configurator,
  }: OptimizerContext): void {
    configurator.Select((_, stat) => {
      return !!(stat.velocity && stat.velocity > 1000);
    });
  }

  /**
   * Filters current configurations to only include subsonic ammo
   */
  static filterSubsonicOnly({ configurator }: OptimizerContext): void {
    configurator.Filter((config) => /ubsonic/.test(config.ammoType));
  }

  /**
   * Filters configurations to only include magazine capacity >= specified size
   */
  static filterByMagazineCapacity(
    { configurator }: OptimizerContext,
    minCapacity: number = 30
  ): void {
    configurator.Filter((config) => {
      const weapon = GetWeaponByName(config.name);
      const stat = GetStatsForConfiguration(config);
      if (weapon.ammoStats && weapon.ammoStats[stat.ammoType]) {
        const data = weapon.ammoStats[stat.ammoType];
        return !!(data && data.magSize && data.magSize >= minCapacity);
      }
      return false;
    });
  }

  /**
   * Maximizes RPM for specified fire mode
   */
  static maximizeRPM(
    { configurator }: OptimizerContext,
    fireMode: "auto" | "burst" | "single"
  ): void {
    configurator.Maximize((_, stat) => {
      switch (fireMode) {
        case "auto":
          return stat.rpmAuto || 0;
        case "burst":
          return stat.rpmBurst || 0;
        case "single":
          return stat.rpmSingle || 0;
        default:
          return 0;
      }
    });
  }

  /**
   * Maximizes velocity
   */
  static maximizeVelocity({ configurator }: OptimizerContext): void {
    configurator.Maximize((_, stat) => {
      return stat.velocity || 0;
    });
  }

  /**
   * Maximizes magazine capacity
   */
  static maximizeMagazineCapacity({ configurator }: OptimizerContext): void {
    configurator.Maximize((config, stat) => {
      const weapon = GetWeaponByName(config.name);
      if (weapon.ammoStats) {
        const data = weapon.ammoStats[stat.ammoType];
        return data && data.magSize ? data.magSize : 0;
      }
      return 0;
    });
  }
}
