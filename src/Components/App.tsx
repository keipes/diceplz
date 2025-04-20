import { createContext, useEffect, useState } from "react";
import "./App.css";
import DamageChart from "./Charts/DamageChart.tsx";
import TTKChart from "./Charts/TTKChart.tsx";
import RPMChart from "./Charts/RPMChart.tsx";
import ConfigBar from "./WeaponConfigurator/ConfigBar/ConfigBar.tsx";
// import WeaponConfigurator, {
//   WeaponConfiguration,
// } from "./WeaponConfigurator/WeaponConfigurator.tsx";

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
import Sidebar from "./WeaponConfigurator/Sidebar.tsx";
import Resizer from "./WeaponConfigurator/Resizer.tsx";

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
  const [sidebarWidth, setSidebarWidth] = useState(540);
  const [configBarWidth, setConfigBarWidth] = useState(300);
  const [weaponConfigurations, _setWeaponConfigurations] = useState(configs);
  const [sidebarDragging, setSidebarDragging] = useState(false);
  const [configBarDragging, setConfigBarDragging] = useState(false);
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

  let mainContentClass = "main-content";
  if (sidebarDragging || configBarDragging) {
    mainContentClass += " dragging";
  }
  const charts: JSX.Element[] = [];
  if (!sidebarDragging && !configBarDragging) {
    // <TTKChart settings={settings} modifiers={modifiers} title={"TTK"} />,
    // <BTKChart modifiers={modifiers} settings={settings} />,
    // <DamageChart modifiers={modifiers} settings={settings} />,
    // <KillsPerMagChart settings={settings} modifiers={modifiers} />,
    // <RPMChart settings={settings} />,
    // <VelocityChart settings={settings} />,
    // <ReloadChart settings={settings} />,
    // <MagazineChart settings={settings} />,
    charts.push(
      <TTKChart settings={settings} modifiers={modifiers} title={"TTK"} />
    );
    charts.push(<BTKChart modifiers={modifiers} settings={settings} />);
    charts.push(<DamageChart modifiers={modifiers} settings={settings} />);
    charts.push(<KillsPerMagChart settings={settings} modifiers={modifiers} />);
    charts.push(<RPMChart settings={settings} />);
    charts.push(<VelocityChart settings={settings} />);
    charts.push(<ReloadChart settings={settings} />);
    charts.push(<MagazineChart settings={settings} />);
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
      <Sidebar width={sidebarWidth} dragging={sidebarDragging} />
      <Resizer
        setSidebarWidth={setSidebarWidth}
        setDragging={setSidebarDragging}
        rightHandSide={false}
      />
      {/* <div className="app-container"> */}
      <div className={mainContentClass}>
        {charts}
        {/* <KillTempoChart modifiers={modifiers} settings={settings} /> */}
      </div>
      {/* <Resizer
        setSidebarWidth={setConfigBarWidth}
        setDragging={setConfigBarDragging}
        rightHandSide={true}
      />
      <ConfigBar width={configBarWidth} dragging={configBarDragging} /> */}
      {/* </div> */}
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
            <RouterProvider router={router} />
          </SettingsContext.Provider>
        </ThemeContext.Provider>
      </ConfiguratorContext.Provider>
    </>
  );
}

export default App;

export { ThemeContext, ConfiguratorContext, SettingsContext };
export type { WeaponSelections };
