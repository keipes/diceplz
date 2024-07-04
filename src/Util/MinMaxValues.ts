import {
  getGlobalMinMax,
  getKillTempoForConfigurations,
  getMinMaxRanges,
  getMinMaxScores,
  getValueFn,
} from "../Components/Charts/KillTempoChart";
import {
  RPMSelectorFn,
  SELECTOR_AUTO,
  SELECTOR_BURST,
  SELECTOR_SINGLE,
} from "../Components/Charts/TTKChart";
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

let MinMaxValuesAuto: MinMaxValue[] = [];
let MinMaxValuesBurst: MinMaxValue[] = [];
let MinMaxValuesSingle: MinMaxValue[] = [];
let MinMaxScoresAuto: MinMaxScore[] = [];
let MinMaxScoresBurst: MinMaxScore[] = [];
let MinMaxScoresSingle: MinMaxScore[] = [];

const SESSION_MIN_MAX_STORAGE_KEY = "min-max-data";
const sessionData = sessionStorage.getItem(SESSION_MIN_MAX_STORAGE_KEY);
if (sessionData) {
  const data = JSON.parse(sessionData);
  MinMaxValuesAuto = data[0];
  MinMaxValuesBurst = data[1];
  MinMaxValuesSingle = data[2];
  MinMaxScoresAuto = data[3];
  MinMaxScoresBurst = data[4];
  MinMaxScoresSingle = data[5];
  console.log("Loaded min-max data from session storage.");
} else {
  const excludeWeapons: Set<string> = new Set([
    "12M AUTO",
    "MCS-880", //
    "NVK-S22", //
    "GHOSTMAKER R10", //
    "NTW-50", //
    "DFR STRIFE", // no reload time available from sorrow yet
    "SUPER 500", // no reload time available from sorrow yet
    "GVT 45-70", // no reload time available from sorrow yet
    "RORSCH MK-4", // bug with kill tempo data need to fix
    "DM7", // bug with kill tempo data need to fix
    "DXR-1", // bug with kill tempo data need to fix
    "XCE BAR", // bug with kill tempo data need to fix
  ]);
  let _configs = new Map<string, WeaponConfiguration>();

  let _setConfigs = (configs: Map<string, WeaponConfiguration>) => {
    for (const [name, config] of configs) {
      _configs.set(name, config);
    }
  };
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
      console.debug("Excluding weapon from global stats: " + weapon.name);
    }
  });
  configurator.Select((_name, _stat) => true);
  const selectors = [SELECTOR_AUTO, SELECTOR_BURST, SELECTOR_SINGLE];
  for (const selector of selectors) {
    const killTempos = getKillTempoForConfigurations(
      configurator,
      DefaultModifiers,
      selector,
      150
    );
    const excludeGlobalMinMaxData = true;
    const rangeRelative = true;
    const values = getMinMaxRanges(
      killTempos,
      selector,
      excludeGlobalMinMaxData
    );
    const globalMinMax = getGlobalMinMax(values);
    const valueFn = getValueFn(values, globalMinMax, rangeRelative);
    const scores = getMinMaxScores(
      killTempos,
      valueFn,
      selector,
      excludeGlobalMinMaxData
    );
    if (selector === SELECTOR_AUTO) {
      MinMaxValuesAuto = values;
      MinMaxScoresAuto = scores;
    } else if (selector === SELECTOR_BURST) {
      MinMaxValuesBurst = values;
      MinMaxScoresBurst = scores;
    } else if (selector === SELECTOR_SINGLE) {
      MinMaxValuesSingle = values;
      MinMaxScoresSingle = scores;
    }
  }
  sessionStorage.setItem(
    SESSION_MIN_MAX_STORAGE_KEY,
    JSON.stringify([
      MinMaxValuesAuto,
      MinMaxValuesBurst,
      MinMaxValuesSingle,
      MinMaxScoresAuto,
      MinMaxScoresBurst,
      MinMaxScoresSingle,
    ])
  );
}

function GetMinMaxValues(selector: RPMSelectorFn): MinMaxValue[] {
  if (selector === SELECTOR_AUTO) {
    return MinMaxValuesAuto;
  } else if (selector === SELECTOR_BURST) {
    return MinMaxValuesBurst;
  } else if (selector === SELECTOR_SINGLE) {
    return MinMaxValuesSingle;
  } else {
    throw new Error("Invalid selector.");
  }
}

function GetMinMaxScores(selector: RPMSelectorFn): MinMaxScore[] {
  if (selector === SELECTOR_AUTO) {
    return MinMaxScoresAuto.slice();
  } else if (selector === SELECTOR_BURST) {
    return MinMaxScoresBurst.slice();
  } else if (selector === SELECTOR_SINGLE) {
    return MinMaxScoresSingle.slice();
  } else {
    throw new Error("Invalid selector.");
  }
}

export type { MinMaxValue, MinMaxScore };
export { GetMinMaxValues, GetMinMaxScores };
