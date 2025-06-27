import { KillsPerMag } from "../../../../Util/Conversions";
import { WeaponConfiguration } from "../../WeaponConfigurator";
import { OptimizerContext } from "./types";

export class KillsPerMagOptimizer {
  /**
   * Maximizes kills per magazine at a specific range
   */
  static maximizeAtRange(
    { configurator, modifiers }: OptimizerContext,
    range: number
  ): void {
    configurator.Maximize((config, stat) => {
      const statConfig: WeaponConfiguration = {
        name: config.name,
        barrelType: stat.barrelType,
        ammoType: stat.ammoType,
        visible: config.visible,
      };
      return KillsPerMag(statConfig, modifiers, range);
    });
  }
}
