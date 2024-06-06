import { createContext, useEffect, useState } from "react";
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
  GetStatsForConfiguration,
  GetWeaponByName,
  WeaponStats,
} from "../Data/WeaponData.ts";
import VelocityChart from "./Charts/VelocityChart.tsx";
import TopNav from "./Nav/TopNav.tsx";
import {
  DefaultModifiers,
  LocalStoreConfigLoader,
} from "../Data/ConfigLoader.ts";
import BTKChart from "./Charts/BTKChart.tsx";
import ReloadChart from "./Charts/ReloadChart.tsx";
import MagazineChart from "./Charts/MagazineChart.tsx";
import {
  InitialSettings,
  SetUseAmmoColorsForGraph,
} from "../Data/SettingsLoader.ts";

import "../Util/CustomPositioner.ts";

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

interface StatScorer {
  (config: WeaponConfiguration, stats: WeaponStats): number;
}

interface MaximizingFn {
  (scorer: StatScorer): void;
}

interface WeaponConfig {
  AddWeapon: AddWeaponFn;
  BulkAddWeapon: BulkAddWeaponFn;
  RemoveWeapon: RemoveWeaponFn;
  DuplicateWeapon: DuplicateWeaponFn;
  UpdateWeapon: UpdateWeaponFn;
  Reset: ResetFn;
  Maximize: MaximizingFn;
}

interface Theme {
  highlightColor: string;
  tooltipBg: string;
  tooltipTitle: string;
  tooltipBody: string;
}

const LightTheme: Theme = {
  highlightColor: "black",
  tooltipBg: "white",
  tooltipTitle: "black",
  tooltipBody: "black",
};

const DarkTheme: Theme = {
  highlightColor: "white",
  tooltipBg: "black",
  tooltipTitle: "white",
  tooltipBody: "white",
};
const ThemeContext = createContext(DarkTheme);

interface Configuration {
  Maximizer: MaximizingFn;
}

const DefaultConfiguratorContext: Configuration = {
  Maximizer: (_: StatScorer) => {
    throw new Error("not implemented");
  },
};
const ConfiguratorContext = createContext(DefaultConfiguratorContext);

function App() {
  const [modifiers, setModifiers] = useState(DefaultModifiers);
  const [settings, setSettings] = useState(InitialSettings);
  const [bottomPadding, setBottomPadding] = useState(window.innerHeight / 3);
  const [weaponConfigurations, _setWeaponConfigurations] = useState(new Map());
  const [darkMode, setDarkMode] = useState(
    !(
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches
    )
  );
  useEffect(() => {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (event) => {
        setDarkMode(event.matches);
      });
  }, []);
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

  function MaximizingFn(scoreStat: StatScorer) {
    const configurations = new Map();
    let differed = false;
    for (let [id, config] of weaponConfigurations) {
      const cloned = JSON.parse(JSON.stringify(config));
      configurations.set(id, cloned);
      const weapon = GetWeaponByName(config.name);
      let score = -Infinity;
      for (const stat of weapon.stats) {
        const _score = scoreStat(config, stat);
        if (
          _score > score ||
          (_score === score &&
            ((stat.barrelType == "Factory" &&
              cloned.barrelType !== "Factory") ||
              (stat.ammoType == "Standard" && cloned.ammoType !== "Standard")))
        ) {
          score = _score;
          cloned.barrelType = stat.barrelType;
          cloned.ammoType = stat.ammoType;
        }
      }
      if (
        cloned.barrelType !== config.barrelType ||
        cloned.ammoType != config.ammoType
      ) {
        differed = true;
      }
    }
    if (differed) {
      setWeaponConfigurations(configurations);
    }
  }

  let configurerr: Configuration = {
    Maximizer: MaximizingFn,
  };

  const wpnCfg = {
    AddWeapon: AddWeapon,
    DuplicateWeapon: DuplicateWeapon,
    RemoveWeapon: RemoveWeapon,
    UpdateWeapon: UpdateWeapon,
    BulkAddWeapon: BulkAddWeapon,
    Reset: Reset,
    Maximize: MaximizingFn,
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

  // function GetAllOptimalAtEveryRange() {
  //   const scores: number[] = [];
  //   const ranges: WeaponConfiguration[] = [];
  //   for (let [_, config] of weaponConfigurations) {
  //     const weapon = GetWeaponByName(config.name);
  //     for (const stat of weapon.stats) {
  //       let dropoffIndex = 0;
  //       let ttk = TTK(
  //         config,
  //         {
  //           healthMultiplier: 1,
  //           damageMultiplier: 1,
  //           bodyDamageMultiplier: 1,
  //         },
  //         stat.dropoffs[0].damage,
  //         stat.rpmAuto ? stat.rpmAuto : 0
  //       );
  //       for (let i = 0; i <= highestRangeSeen; i++) {
  //         let dropoff = stat.dropoffs[dropoffIndex];
  //         if (
  //           dropoffIndex < stat.dropoffs.length - 1 &&
  //           stat.dropoffs[dropoffIndex + 1].range >= i
  //         ) {
  //           dropoffIndex++;
  //           dropoff = stat.dropoffs[dropoffIndex];
  //           ttk = TTK(
  //             config,
  //             {
  //               healthMultiplier: 1,
  //               damageMultiplier: 1,
  //               bodyDamageMultiplier: 1,
  //             },
  //             dropoff.damage,
  //             stat.rpmAuto ? stat.rpmAuto : 0
  //           );
  //         }
  //         if (scores[i] === undefined || ttk < scores[i]) {
  //           // TODO: prefer standard barrel and ammo if scores are equal
  //           const cloned = JSON.parse(JSON.stringify(config));
  //           cloned.ammoType = stat.ammoType;
  //           cloned.barrelType = stat.barrelType;
  //           scores[i] = ttk;
  //           ranges[i] = cloned;
  //         }
  //       }
  //     }
  //   }
  //   console.log(scores);
  //   const seen = new Set();
  //   const optimalConfigs: WeaponConfiguration[] = [];
  //   ranges.filter((value, index, arr) => {
  //     let configName = ConfigDisplayName(value);
  //     if (!seen.has(configName)) {
  //       seen.add(configName);
  //       optimalConfigs.push(value);
  //       return true;
  //     }
  //     return false;
  //   });
  //   console.log(ranges);
  //   console.log(seen);
  //   console.log([...new Set(ranges)]);
  //   console.log(optimalConfigs);
  // }
  // GetAllOptimalAtEveryRange();

  // let remainder = highestRangeSeen % 100;
  // highestRangeSeen += 100 - remainder;
  let mainContentClass = "main-content";
  if (!configuratorOpen) {
    mainContentClass += " configurator-closed";
  }
  const mainContentStyle = {
    paddingBottom: bottomPadding + "px",
  };
  if (!configuratorOpen) {
    mainContentStyle.paddingBottom = "2.5vh";
  }
  return (
    <>
      <ConfiguratorContext.Provider value={configurerr}>
        <ThemeContext.Provider value={darkMode ? DarkTheme : LightTheme}>
          <TopNav
            weaponConfig={wpnCfg}
            configLoader={configLoader}
            settings={settings}
            setUseAmmoColorsForGraph={(value: boolean) => {
              setSettings(SetUseAmmoColorsForGraph(value));
            }}
            modifiers={modifiers}
            setModifiers={setModifiers}
          />
          <WeaponConfigurator
            configurations={weaponConfigurations}
            weaponConfig={wpnCfg}
            open={configuratorOpen}
            setOpen={setConfiguratorOpen}
            setBottomPadding={setBottomPadding}
          />
          <div className={mainContentClass} style={mainContentStyle}>
            <TTKChart
              weaponConfigurations={weaponConfigurations}
              requiredRanges={requiredRanges}
              highestRangeSeen={highestRangeSeen}
              settings={settings}
              rpmSelector={"rpmAuto"}
              modifiers={modifiers}
              title={"TTK"}
            />
            <BTKChart
              weaponConfigurations={weaponConfigurations}
              requiredRanges={requiredRanges}
              highestRangeSeen={highestRangeSeen}
              modifiers={modifiers}
              settings={settings}
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
              settings={settings}
            />
            <RPMChart
              weaponConfigurations={weaponConfigurations}
              settings={settings}
            />
            <VelocityChart
              weaponConfigurations={weaponConfigurations}
              settings={settings}
            />
            <ReloadChart
              weaponConfigurations={weaponConfigurations}
              settings={settings}
            />
            <MagazineChart
              weaponConfigurations={weaponConfigurations}
              settings={settings}
            />
          </div>
        </ThemeContext.Provider>
      </ConfiguratorContext.Provider>
    </>
  );
}

export default App;

export { ThemeContext, ConfiguratorContext };
export type {
  WeaponSelections,
  AddWeaponFn,
  DuplicateWeaponFn,
  RemoveWeaponFn,
  UpdateWeaponFn,
  WeaponConfig,
  StatScorer,
};
