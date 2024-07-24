import { GetCategoryWeapons, WeaponCategories } from "../../Data/WeaponData";
import { WeaponConfiguration } from "../WeaponConfigurator/WeaponConfigurator";

import {
  MetricEvaluator,
  StatEvaluator,
} from "../MetricAggregation/Aggregator";
import { BTK2, TTK2 } from "../../Util/Conversions";
import { DefaultModifiers } from "../../Data/ConfigLoader";

function GatherTiers(
  minRange: number,
  maxRange: number,
  _numTiers: number
): WeaponConfiguration[][] {
  let weapons = [];
  for (const category of WeaponCategories) {
    for (const weapon of GetCategoryWeapons(category)) {
      weapons.push(weapon);
    }
  }
  let evaluators: StatEvaluator[] = [
    (_w, _s, dropoff, ammoStats) => {
      return {
        name: "BTK",
        value: BTK2(DefaultModifiers, dropoff.damage, 0, ammoStats),
      };
    },
    (_w, _s, dropoff, ammoStats) => {
      return {
        name: "BTK All HS",
        value: BTK2(DefaultModifiers, dropoff.damage, Infinity, ammoStats),
      };
    },
    (_w, stats, dropoff, ammoStats) => {
      return {
        name: "TTK",
        value: TTK2(
          DefaultModifiers,
          dropoff.damage,
          stats.rpmAuto || stats.rpmSingle || stats.rpmBurst || 0,
          0,
          ammoStats
        ),
      };
    },
    (_weapon, stats, dropoff, ammoStats) => {
      // if (weapon.name == "DXR-1" && dropoff.range > 60) {
      //   let ttk = TTK2(
      //     DefaultModifiers,
      //     dropoff.damage,
      //     stats.rpmAuto || stats.rpmSingle || stats.rpmBurst || 0,
      //     Infinity,
      //     ammoStats
      //   );
      //   // console.log("DXR-1 " + ttk);
      // }
      return {
        name: "TTK All HS",
        value: TTK2(
          DefaultModifiers,
          dropoff.damage,
          stats.rpmAuto || stats.rpmSingle || stats.rpmBurst || 0,
          Infinity,
          ammoStats
        ),
      };
    },
  ];
  let metrics = new MetricEvaluator(minRange, maxRange, evaluators, weapons);
  let range = 150;
  let weaponIndex = 4;
  let metrics2 = metrics.GetMetricsForWeapon(
    weapons[weaponIndex],
    weapons[weaponIndex].stats[0],
    range
  );
  console.log(metrics2);
  for (let i = 0; i < metrics.aggregated[0].length; i++) {
    for (let j = 0; j < metrics.aggregated.length; j++) {
      console.log(metrics.aggregated[j][i]);
    }
    // console.log(metrics.aggregated[0][i]);
    // console.log(metrics.aggregated[1][i]);
  }

  return [];
}

export { GatherTiers };
