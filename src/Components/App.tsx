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
import { WeaponConfigurations } from "../Data/WeaponConfiguration.ts";
import KillsPerMagChart from "./Charts/KillsPerMagChart.tsx";
import KillTempoChart from "./Charts/KillTempoChart.tsx";

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

interface Theme {
  highlightColor: string;
  tooltipBg: string;
  tooltipTitle: string;
  tooltipBody: string;
  isDarkMode: boolean;
}

const LightTheme: Theme = {
  highlightColor: "black",
  tooltipBg: "white",
  tooltipTitle: "black",
  tooltipBody: "black",
  isDarkMode: false,
};

const DarkTheme: Theme = {
  highlightColor: "white",
  tooltipBg: "black",
  tooltipTitle: "white",
  tooltipBody: "white",
  isDarkMode: true,
};
const ThemeContext = createContext(DarkTheme);

const ConfiguratorContext = createContext(
  new WeaponConfigurations(new Map(), () => {})
);

const SettingsContext = createContext(InitialSettings);

function App() {
  const [modifiers, setModifiers] = useState(DefaultModifiers);
  const [settings, setSettings] = useState(InitialSettings);
  const [bottomPadding, setBottomPadding] = useState(window.innerHeight / 3);

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
  const wpnCfg: WeaponConfigurations = new WeaponConfigurations(
    weaponConfigurations,
    setWeaponConfigurations
  );

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

  const configLoader = new LocalStoreConfigLoader(
    weaponConfigurations,
    setWeaponConfigurations,
    modifiers,
    setModifiers
  );
  const [configuratorOpen, setConfiguratorOpen] = useState(true);

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
      <ConfiguratorContext.Provider value={wpnCfg}>
        <ThemeContext.Provider value={darkMode ? DarkTheme : LightTheme}>
          <SettingsContext.Provider value={settings}>
            <TopNav
              configLoader={configLoader}
              settings={settings}
              setUseAmmoColorsForGraph={(value: boolean) => {
                setSettings(SetUseAmmoColorsForGraph(value));
              }}
              modifiers={modifiers}
              setModifiers={setModifiers}
            />
            <WeaponConfigurator
              open={configuratorOpen}
              setOpen={setConfiguratorOpen}
              setBottomPadding={setBottomPadding}
              modifiers={modifiers}
            />
            <div className={mainContentClass} style={mainContentStyle}>
              <TTKChart
                settings={settings}
                modifiers={modifiers}
                title={"TTK"}
              />
              <KillTempoChart modifiers={modifiers} settings={settings} />
              <BTKChart modifiers={modifiers} settings={settings} />
              <DamageChart modifiers={modifiers} settings={settings} />
              <RPMChart settings={settings} />
              <VelocityChart settings={settings} />
              <ReloadChart settings={settings} />
              <MagazineChart settings={settings} />
              <KillsPerMagChart
                settings={settings}
                modifiers={modifiers}
              ></KillsPerMagChart>
              <div className={"blurb"}>
                <p>
                  Thanks for checking out my 2042 weapon stats page. All weapon
                  stats have been painstakingly collected by Sorrow and others
                  on the Battlefield 2043 Discord server. Links to the source
                  Google Sheet, and Discord Server are in the header bar.
                </p>
              </div>
            </div>
          </SettingsContext.Provider>
        </ThemeContext.Provider>
      </ConfiguratorContext.Provider>
    </>
  );
}

export default App;

export { ThemeContext, ConfiguratorContext, SettingsContext };
export type { WeaponSelections };
