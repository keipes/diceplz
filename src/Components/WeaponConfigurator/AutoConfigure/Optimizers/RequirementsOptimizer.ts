import { GetAmmoStat } from "../../../../Data/WeaponData";
import { BTK2, TTK } from "../../../../Util/Conversions";
import { OptimizerContext } from "./types";

export interface BTKRequirements {
  maxBTK: number;
  range: number;
  weaponCategory: string;
  numHeadshots: number;
}

export interface TTKRequirements {
  maxTTK: number;
  range: number;
  weaponCategory: string;
  numHeadshots: number;
}

export class RequirementsOptimizer {
  /**
   * Selects all weapons that meet BTK requirements
   */
  static selectWeaponsByBTKRequirement(
    { configurator, modifiers }: OptimizerContext,
    requirements: BTKRequirements
  ): void {
    configurator.SelectFromAllWeaponsInCategory(
      requirements.weaponCategory,
      (weapon, stat) => {
        let damageAtRequiredRange = 0;
        for (const dropoff of stat.dropoffs) {
          if (dropoff.range <= requirements.range) {
            damageAtRequiredRange = dropoff.damage;
          } else {
            break;
          }
        }

        const ammoStats = GetAmmoStat(weapon, stat);
        if (!ammoStats) {
          console.warn(`No ammo stats for ${weapon.name} ${stat.ammoType}`);
          return false;
        }

        const btk = BTK2(
          modifiers,
          damageAtRequiredRange,
          requirements.numHeadshots,
          ammoStats
        );

        return btk <= requirements.maxBTK;
      }
    );
  }

  /**
   * Selects all weapons that meet TTK requirements
   */
  static selectWeaponsByTTKRequirement(
    { configurator, modifiers }: OptimizerContext,
    requirements: TTKRequirements
  ): void {
    configurator.SelectFromAllWeaponsInCategory(
      requirements.weaponCategory,
      (weapon, stat) => {
        let damageAtRequiredRange = 0;
        for (const dropoff of stat.dropoffs) {
          if (dropoff.range <= requirements.range) {
            damageAtRequiredRange = dropoff.damage;
          } else {
            break;
          }
        }

        const ammoStats = GetAmmoStat(weapon, stat);
        if (!ammoStats) {
          console.warn(`No ammo stats for ${weapon.name} ${stat.ammoType}`);
          return false;
        }

        const rpm = Math.max(
          stat.rpmAuto || 0,
          stat.rpmSingle || 0,
          stat.rpmBurst || 0
        );

        const ttk = TTK(
          {
            name: weapon.name,
            barrelType: stat.barrelType,
            ammoType: stat.ammoType,
            visible: true,
          },
          modifiers,
          damageAtRequiredRange,
          rpm
        );

        console.log(
          `TTK: ${ttk} Required: ${requirements.maxTTK} ${weapon.name} ${stat.ammoType}`
        );

        return ttk <= requirements.maxTTK;
      }
    );
  }
}
