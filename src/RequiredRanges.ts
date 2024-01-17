import { WeaponConfiguration } from "./WeaponConfigurator/WeaponConfigurator";
import { GetStatsForConfiguration } from "./WeaponData";

interface DamageConverter {
  (config: WeaponConfiguration, damage: number): number;
}

const RequiredRanges = function (
  configurations: Map<String, WeaponConfiguration>,
  converter: DamageConverter
): Set<number> {
  const values = new Set<number>();
  for (const [_, configuration] of configurations) {
    const stat = GetStatsForConfiguration(configuration);
    const seenConvertedDamages = new Set<number>();

    for (const dropoff of stat.dropoffs) {
      const convertedDamage = converter(configuration, dropoff.damage);
      if (seenConvertedDamages.has(convertedDamage)) {
      } else {
        values.add(dropoff.range);
        seenConvertedDamages.add(convertedDamage);
      }
    }
  }
  return values;
};

export default RequiredRanges;
