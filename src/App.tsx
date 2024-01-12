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
import { GetStatsForConfiguration } from "./WeaponData.ts";
import VelocityChart from "./Charts/VelocityChart.tsx";
import TopNav from "./Nav/TopNav.tsx";
import {
  DefaultModifiers,
  LocalStoreConfigLoader,
} from "./Data/ConfigLoader.ts";
import BTKChart from "./Charts/BTKChart.tsx";
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

function App() {
  const [modifiers, setModifiers] = useState(DefaultModifiers);

  const [weaponConfigurations, _setWeaponConfigurations] = useState(new Map());
  const setWeaponConfigurations = (
    configurations: Map<string, WeaponConfiguration>
  ) => {
    _setWeaponConfigurations(
      new Map(
        [...configurations].sort((a, b) => {
          return Intl.Collator().compare(a[1].name, b[1].name);
        })
      )
    );
  };
  const configLoader = new LocalStoreConfigLoader(
    weaponConfigurations,
    setWeaponConfigurations,
    modifiers,
    setModifiers
  );
  const [configuratorOpen, setConfiguratorOpen] = useState(true);

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
  if (requiredRanges.size == 1) {
    highestRangeSeen = 100;
    requiredRanges.set(highestRangeSeen, true);
  }
  let remainder = highestRangeSeen % 100;
  // highestRangeSeen += 100 - remainder;
  let mainContentClass = "main-content";
  if (!configuratorOpen) {
    mainContentClass += " configurator-closed";
  }
  return (
    <>
      <TopNav
        weaponConfig={wpnCfg}
        configLoader={configLoader}
        modifiers={modifiers}
        setModifiers={setModifiers}
      />
      <WeaponConfigurator
        configurations={weaponConfigurations}
        weaponConfig={wpnCfg}
        open={configuratorOpen}
        setOpen={setConfiguratorOpen}
      />
      <div className={mainContentClass}>
        <TTKChart
          weaponConfigurations={weaponConfigurations}
          requiredRanges={requiredRanges}
          highestRangeSeen={highestRangeSeen}
          rpmSelector={"rpmAuto"}
          modifiers={modifiers}
          title={"Time To Kill"}
        />
        <BTKChart
          weaponConfigurations={weaponConfigurations}
          requiredRanges={requiredRanges}
          highestRangeSeen={highestRangeSeen}
          modifiers={modifiers}
        />
        {/* <TTKChart
          weaponConfigurations={weaponConfigurations}
          requiredRanges={requiredRanges}
          highestRangeSeen={highestRangeSeen}
          rpmSelector={"rpmSingle"}
          modifiers={modifiers}
          title={"TTK Single"}
        />
        <TTKChart
          weaponConfigurations={weaponConfigurations}
          requiredRanges={requiredRanges}
          highestRangeSeen={highestRangeSeen}
          rpmSelector={"rpmBurst"}
          modifiers={modifiers}
          title={"TTK Burst"}
        /> */}
        <DamageChart
          weaponConfigurations={weaponConfigurations}
          requiredRanges={requiredRanges}
          highestRangeSeen={highestRangeSeen}
          modifiers={modifiers}
        />

        <RPMChart weaponConfigurations={weaponConfigurations} />
        <VelocityChart weaponConfigurations={weaponConfigurations} />
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
