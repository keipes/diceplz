import {
  getGlobalMinMax,
  getKillTempoForConfigurations,
  getMinMaxRanges,
  getMinMaxScores,
  getValueFn,
} from "../Components/Charts/KillTempoChart";
import { SELECTOR_AUTO } from "../Components/Charts/TTKChart";
import { WeaponConfiguration } from "../Components/WeaponConfigurator/WeaponConfigurator";
import { DefaultModifiers } from "../Data/ConfigLoader";
import { WeaponConfigurations } from "../Data/WeaponConfiguration";
import { AllWeaponsProcessor } from "../Data/WeaponData";

interface MinMaxValue {
  minTTK: number;
  maxTTK: number;
  minBTK: number;
  maxBTK: number;
  minKPS: number;
  maxKPS: number;
}

interface MinMaxScore {
  minScore: number;
  maxScore: number;
}

let _configs = new Map<string, WeaponConfiguration>();

let _setConfigs = (configs: Map<string, WeaponConfiguration>) => {
  for (const [name, config] of configs) {
    _configs.set(name, config);
  }
  // console.log(configs);
  // _configs = configs;
};

const excludeWeapons: Set<string> = new Set([
  "12M AUTO",
  "MCS-880", //
  "NVK-S22", //
  "GHOSTMAKER R10", //
  "NTW-50", //
  "DFR STRIFE", // no reload time available from sorrow yet
  "SUPER 500", // no reload time available from sorrow yet
  "GVT 45-70", // no reload time available from sorrow yet
]);
const configurator = new WeaponConfigurations(_configs, _setConfigs);
AllWeaponsProcessor((weapon) => {
  if (!excludeWeapons.has(weapon.name)) {
    configurator.AddWeapon({
      name: weapon.name,
      barrelType: weapon.stats[0].barrelType,
      ammoType: weapon.stats[0].ammoType,
      visible: true,
    });
    // console.log("Adding weapon to global stats: " + weapon.name);
  } else {
    console.log("Excluding weapon from global stats: " + weapon.name);
  }
  // console.log(configurator.weaponConfigurations);
  // configurator.Select((_name, _stat) => true);
});

const killTempos = getKillTempoForConfigurations(
  configurator,
  DefaultModifiers,
  SELECTOR_AUTO,
  150
);
const compareToAllWeapons = true;
const rangeRelative = true;
const values = getMinMaxRanges(killTempos, compareToAllWeapons);
const globalMinMax = getGlobalMinMax(values);
const valueFn = getValueFn(values, globalMinMax, rangeRelative);
const scores = getMinMaxScores(killTempos, valueFn, compareToAllWeapons);

export type { MinMaxValue, MinMaxScore };
export { values as MinMaxValues, scores as MinMaxScores };
