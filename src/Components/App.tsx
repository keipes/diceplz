import { createContext, useEffect, useState, useMemo } from "react";
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
  DEFAULT_SESSION_CONFIG_NAME,
  LoadInitialSessionData,
  LocalStoreConfigLoader,
  SessionStoreConfigLoader,
} from "../Data/ConfigLoader.ts";
import BTKChart from "./Charts/BTKChart.tsx";
import ReloadChart from "./Charts/ReloadChart.tsx";
import MagazineChart from "./Charts/MagazineChart.tsx";
import {
  InitialSettings,
  SetUseAmmoColorsForGraph,
} from "../Data/SettingsLoader.ts";

import "../Util/CustomPositioner.ts";
import "../Util/DropoffInteractionMode.ts";
import { WeaponConfigurations } from "../Data/WeaponConfiguration.ts";
import KillsPerMagChart from "./Charts/KillsPerMagChart.tsx";
// import KillTempoChart from "./Charts/KillTempoChart.tsx";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import TierList from "./TierList/TierList.tsx";
import DPSChart from "./Charts/DPSChart.tsx";
import { HoverHighlightProvider } from "./Charts/HoverContext.tsx";
import { ChartContainer } from "./Charts/LazyChart.tsx";

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
const [configs, mods] = LoadInitialSessionData();

function App() {
  const [modifiers, setModifiers] = useState(mods);
  const [settings, setSettings] = useState(InitialSettings);
  const [bottomPadding, setBottomPadding] = useState(window.innerHeight / 3);
  const [weaponConfigurations, _setWeaponConfigurations] = useState(configs);
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
  const wpnCfg: WeaponConfigurations = useMemo(
    () =>
      new WeaponConfigurations(weaponConfigurations, setWeaponConfigurations),
    [weaponConfigurations, setWeaponConfigurations]
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
  useEffect(
    () =>
      new SessionStoreConfigLoader(
        weaponConfigurations,
        setWeaponConfigurations,
        modifiers,
        setModifiers
      ).saveConfig(DEFAULT_SESSION_CONFIG_NAME),
    [weaponConfigurations, modifiers]
  );

  const configLoader = new LocalStoreConfigLoader(
    weaponConfigurations,
    setWeaponConfigurations,
    modifiers,
    setModifiers
  );

  const [configuratorOpen, setConfiguratorOpen] = useState(true);
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

  const indexContent = (
    <>
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
        <ChartContainer maxConcurrentCharts={3}>
          <TTKChart settings={settings} modifiers={modifiers} title={"TTK"} />
          <BTKChart modifiers={modifiers} settings={settings} />
          <DamageChart modifiers={modifiers} settings={settings} />
          <DPSChart modifiers={modifiers} settings={settings} />
          <KillsPerMagChart settings={settings} modifiers={modifiers} />
          <RPMChart settings={settings} />
          <VelocityChart settings={settings} />
          <ReloadChart settings={settings} />
          <MagazineChart settings={settings} />
        </ChartContainer>
        {/* <KillTempoChart modifiers={modifiers} settings={settings} /> */}
        <div className={"blurb"}>
          <p>
            Thanks for checking out my 2042 weapon stats page. All weapon stats
            have been painstakingly collected by Sorrow and others on the
            Battlefield 2043 Discord server. Links to the source Google Sheet,
            and Discord Server are in the header bar.
          </p>
        </div>
      </div>
    </>
  );
  const router = createBrowserRouter([
    {
      path: "/",
      element: indexContent,
    },
    {
      path: "tiers/ar",
      element: <TierList />,
    },
  ]);
  return (
    <>
      <ConfiguratorContext.Provider value={wpnCfg}>
        <ThemeContext.Provider value={darkMode ? DarkTheme : LightTheme}>
          <SettingsContext.Provider value={settings}>
            <HoverHighlightProvider>
              <RouterProvider router={router} />
            </HoverHighlightProvider>
          </SettingsContext.Provider>
        </ThemeContext.Provider>
      </ConfiguratorContext.Provider>
    </>
  );
}

export default App;

export { ThemeContext, ConfiguratorContext, SettingsContext };
export type { WeaponSelections };
