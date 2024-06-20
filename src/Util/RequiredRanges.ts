import { WeaponConfiguration } from "../Components/WeaponConfigurator/WeaponConfigurator";
import { GetStatsForConfiguration } from "../Data/WeaponData";

interface DamageConverter {
  (config: WeaponConfiguration, damage: number): number;
}

const RequiredRanges = function (
  configurations: Map<String, WeaponConfiguration>,
  converter: DamageConverter
): Set<number> {
  const values = new Set<number>();
  let highestRangeSeen = 0;
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
      if (dropoff.range > highestRangeSeen) {
        highestRangeSeen = dropoff.range;
      }
    }
  }
  for (let i = 0; i < 150; i++) {
    values.add(i);
  }
  values.add(highestRangeSeen);
  return values;
};

export default RequiredRanges;
