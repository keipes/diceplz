import { useState } from "react";
import "./App.css";
import DamageChart from "./Charts/DamageChart.tsx";
import TTKChart from "./Charts/TTKChart.tsx";
import RPMChart from "./Charts/RPMChart.tsx";
import WeaponConfigurator, {
  WeaponConfiguration,
} from "./WeaponConfigurator/WeaponConfigurator.tsx";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  BarElement,
  BarController,
  // Legend,
} from "chart.js";
import {
  GetCategoryWeapons,
  GetStatsForConfiguration,
  WeaponCategories,
  WeaponStats,
} from "./WeaponData.ts";
import VelocityChart from "./Charts/VelocityChart.tsx";
import TopNav from "./Nav/TopNav.tsx";
import { LocalStoreConfigLoader, Modifiers } from "./Data/ConfigLoader.ts";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  BarElement,
  BarController
  // Legend
);

interface WeaponSelections {
  ammoType: string;
  barrelType: string;
}

interface AddWeaponFn {
  (config: WeaponConfiguration): void;
}

interface BulkAddWeaponFn {
  (config: WeaponConfiguration[]): void;
}

interface DuplicateWeaponFn {
  (id: string): void;
}

interface RemoveWeaponFn {
  (id: string): void;
}

interface UpdateWeaponFn {
  (id: string, config: WeaponConfiguration): void;
}

interface ResetFn {
  (): void;
}

interface WeaponConfig {
  AddWeapon: AddWeaponFn;
  BulkAddWeapon: BulkAddWeaponFn;
  RemoveWeapon: RemoveWeaponFn;
  DuplicateWeapon: DuplicateWeaponFn;
  UpdateWeapon: UpdateWeaponFn;
  Reset: ResetFn;
}

const initialSelectedWeapons = new Map<string, WeaponSelections>();

const CONFIG_STORAGE_KEY = "configurations";
let initialConfigurations = new Map<string, WeaponConfiguration>();
let useLocalStorage = false; //location.hostname === "localhost";
if (useLocalStorage) {
  const cached = localStorage.getItem(CONFIG_STORAGE_KEY);
  if (cached) {
    initialConfigurations = new Map(JSON.parse(cached));
  }
}

const initialStoredConfigs: string[] = [];
function App() {
  const [selectedWeapons, setSelectedWeapons] = useState(
    initialSelectedWeapons
  );
  const [modifiers, setModifiers] = useState({
    healthMultiplier: 1,
    damageMultiplier: 1,
    bodyDamageMultiplier: 1,
  });

  // these functions are a hack until I want to modify all the props below to
  // just pass the Modifiers object
  interface Assigner {
    (modifiers: Modifiers): void;
  }
  const assign = (assigner: Assigner) => {
    const newModifiers = structuredClone(modifiers);
    assigner(newModifiers);
    setModifiers(newModifiers);
  };
  const healthMultiplier = modifiers.healthMultiplier;
  const setHealthMultiplier = (multiplier: number) =>
    assign((m) => (m.healthMultiplier = multiplier));
  const damageMultiplier = modifiers.damageMultiplier;
  const setDamageMultiplier = (multiplier: number) =>
    assign((m) => (m.damageMultiplier = multiplier));
  const bodyDamageMultiplier = modifiers.bodyDamageMultiplier;
  const setBodyDamageMultiplier = (multiplier: number) =>
    assign((m) => (m.bodyDamageMultiplier = multiplier));

  const [weaponConfigurations, _setWeaponConfigurations] = useState(new Map());

  const [storedConfigs, setStoredConfigs] = useState(initialStoredConfigs);
  const configLoader = new LocalStoreConfigLoader(
    weaponConfigurations,
    _setWeaponConfigurations,
    modifiers,
    setModifiers
  );
  const [configuratorOpen, setConfiguratorOpen] = useState(true);
  const setWeaponConfigurations = (
    configurations: Map<string, WeaponConfiguration>
  ) => {
    if (useLocalStorage) {
      localStorage.setItem(
        CONFIG_STORAGE_KEY,
        JSON.stringify(Array.from(configurations.entries()))
      );
    }
    _setWeaponConfigurations(configurations);
  };

  function BulkAddWeapon(configs: WeaponConfiguration[]) {
    const configurations = new Map(weaponConfigurations);
    for (const config of configs) {
      let id = crypto.randomUUID();
      while (configurations.has(id)) {
        console.warn("Duplicate UUID generated.");
        id = crypto.randomUUID();
      }
      configurations.set(id, config);
    }
    setWeaponConfigurations(configurations);
  }
  function AddWeapon(config: WeaponConfiguration) {
    const configurations = new Map(weaponConfigurations);
    let id = crypto.randomUUID();
    while (configurations.has(id)) {
      console.warn("Duplicate UUID generated.");
      id = crypto.randomUUID();
    }
    configurations.set(id, config);
    setWeaponConfigurations(configurations);
  }

  function DuplicateWeapon(id: string) {
    const config = weaponConfigurations.get(id);
    if (config) {
      const cloned = JSON.parse(JSON.stringify(config));
      AddWeapon(cloned);
    }
  }
  function RemoveWeapon(id: string) {
    const configurations = new Map(weaponConfigurations);
    configurations.delete(id);
    setWeaponConfigurations(configurations);
  }
  function UpdateWeapon(id: string, config: WeaponConfiguration) {
    const configurations = new Map(weaponConfigurations);
    configurations.set(id, config);
    setWeaponConfigurations(configurations);
  }
  function Reset() {
    setWeaponConfigurations(new Map());
  }
  const wpnCfg = {
    AddWeapon: AddWeapon,
    DuplicateWeapon: DuplicateWeapon,
    RemoveWeapon: RemoveWeapon,
    UpdateWeapon: UpdateWeapon,
    BulkAddWeapon: BulkAddWeapon,
    Reset: Reset,
  };

  // const oldLocalStorageSetting =
  //   localStorage.getItem("useLocalStorage") == "true";
  // const [useLocalStorage, setUseLocalStorage] = useState(
  //   oldLocalStorageSetting
  // );
  const selectedWeaponStats = new Map<string, WeaponStats>();
  for (const category of WeaponCategories) {
    const weapons = GetCategoryWeapons(category);
    for (let weapon of weapons) {
      const selected = selectedWeapons.get(weapon.name);
      if (selected) {
        for (const stat of weapon.stats) {
          if (
            stat.barrelType == selected.barrelType &&
            stat.ammoType == selected.ammoType
          ) {
            selectedWeaponStats.set(weapon.name, stat);
          }
        }
      }
    }
  }
  const requiredRanges = new Map<number, boolean>();
  let highestRangeSeen = 0;
  for (const [_, config] of weaponConfigurations) {
    if (!config.visible) continue;
    const stat = GetStatsForConfiguration(config);
    for (const dropoff of stat.dropoffs) {
      requiredRanges.set(dropoff.range, true);
      if (dropoff.range > highestRangeSeen) {
        highestRangeSeen = dropoff.range;
      }
    }
  }
  let remainder = highestRangeSeen % 10;
  highestRangeSeen += 10 - remainder;
  // function handleHealthMultiplier(e) {
  //   setHealthMultiplier(e.target.value);
  // }
  const selectedWeaponsData = selectedWeaponStats;
  let mainContentClass = "main-content";
  if (!configuratorOpen) {
    mainContentClass += " configurator-closed";
  }
  return (
    <>
      <TopNav
        weaponConfig={wpnCfg}
        healthMultiplier={healthMultiplier}
        setHealthMultiplier={setHealthMultiplier}
        damageMultiplier={damageMultiplier}
        setDamageMultiplier={setDamageMultiplier}
        bodyDamageMultiplier={bodyDamageMultiplier}
        setBodyDamageMultiplier={setBodyDamageMultiplier}
        configLoader={configLoader}
        // configs={configLoader.listConfigs()}
      />
      <WeaponConfigurator
        configurations={weaponConfigurations}
        weaponConfig={wpnCfg}
        open={configuratorOpen}
        setOpen={setConfiguratorOpen}
      />
      <div className={mainContentClass}>
        <TTKChart
          selectedWeapons={selectedWeapons}
          selectedWeaponsData={selectedWeaponsData}
          weaponConfigurations={weaponConfigurations}
          requiredRanges={requiredRanges}
          highestRangeSeen={highestRangeSeen}
          rpmSelector={"rpmAuto"}
          healthMultiplier={healthMultiplier}
          damageMultiplier={damageMultiplier * bodyDamageMultiplier}
          title={"TTK Auto"}
        />
        <TTKChart
          selectedWeapons={selectedWeapons}
          selectedWeaponsData={selectedWeaponsData}
          weaponConfigurations={weaponConfigurations}
          requiredRanges={requiredRanges}
          highestRangeSeen={highestRangeSeen}
          rpmSelector={"rpmSingle"}
          healthMultiplier={healthMultiplier}
          damageMultiplier={damageMultiplier * bodyDamageMultiplier}
          title={"TTK Single"}
        />
        <TTKChart
          selectedWeapons={selectedWeapons}
          selectedWeaponsData={selectedWeaponsData}
          weaponConfigurations={weaponConfigurations}
          requiredRanges={requiredRanges}
          highestRangeSeen={highestRangeSeen}
          rpmSelector={"rpmBurst"}
          healthMultiplier={healthMultiplier}
          damageMultiplier={damageMultiplier * bodyDamageMultiplier}
          title={"TTK Burst"}
        />
        <DamageChart
          selectedWeapons={selectedWeapons}
          selectedWeaponsData={selectedWeaponsData}
          weaponConfigurations={weaponConfigurations}
          requiredRanges={requiredRanges}
          highestRangeSeen={highestRangeSeen}
          damageMultiplier={damageMultiplier * bodyDamageMultiplier}
        />
        <RPMChart
          selectedWeapons={selectedWeapons}
          selectedWeaponsData={selectedWeaponsData}
          weaponConfigurations={weaponConfigurations}
        />
        <VelocityChart
          selectedWeapons={selectedWeapons}
          selectedWeaponsData={selectedWeaponsData}
          weaponConfigurations={weaponConfigurations}
        />
      </div>
    </>
  );
}

export default App;
export type {
  WeaponSelections,
  AddWeaponFn,
  DuplicateWeaponFn,
  RemoveWeaponFn,
  UpdateWeaponFn,
  WeaponConfig,
};
