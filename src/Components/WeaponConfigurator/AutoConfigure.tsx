import { Modifiers } from "../../Data/ConfigLoader";
import { GetWeaponByName } from "../../Data/WeaponData";
import { KillsPerMag, TTK } from "../../Util/Conversions";
import { ConfiguratorContext } from "../App";
import "./AutoConfigure.css";
import {
  MouseEventHandler,
  ReactElement,
  useContext,
  useState,
  MouseEvent,
} from "react";
import { WeaponConfiguration } from "./WeaponConfigurator";

interface AutoConfigureProps {
  modifiers: Modifiers;
}

function AutoConfigure(props: AutoConfigureProps) {
  const clickClass = "wcf-config-action hover-blue";
  const [ttkInputRange, setTTKInputRange] = useState(30);
  const configurator = useContext(ConfiguratorContext);

  function minimizeTTK(range: number) {
    configurator.Maximizer((config, stat) => {
      let damage = 0;
      for (let i = 0; i < stat.dropoffs.length; i++) {
        if (stat.dropoffs[i].range > range) {
          break;
        }
        damage = stat.dropoffs[i].damage;
      }
      return -TTK(
        config,
        props.modifiers,
        damage,
        stat.rpmAuto ? stat.rpmAuto : 0
      );
    });
  }
  function getRangeScorer(range: number): MouseEventHandler {
    return (_: MouseEvent<HTMLElement>) => {
      minimizeTTK(range);
    };
  }
  function maximizeKillsPerMag(range: number) {
    configurator.Maximizer((config, stat) => {
      let statConfig: WeaponConfiguration = {
        name: config.name,
        barrelType: stat.barrelType,
        ammoType: stat.ammoType,
        visible: config.visible,
      };
      return KillsPerMag(statConfig, props.modifiers, range);
    });
  }
  function getKillsPerMagScorer(range: number): MouseEventHandler {
    return (_: MouseEvent<HTMLElement>) => {
      maximizeKillsPerMag(range);
    };
  }
  return (
    <>
      <Configurer>
        <>
          {"Minimize TTK at "}
          <span className={clickClass} onClick={getRangeScorer(0)}>
            <>(0m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getRangeScorer(10)}>
            <>(10m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getRangeScorer(20)}>
            <>(20m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getRangeScorer(30)}>
            <>(30m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getRangeScorer(40)}>
            <>(40m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getRangeScorer(50)}>
            <>(50m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getRangeScorer(40)}>
            <>(75m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getRangeScorer(50)}>
            <>(100m)</>
          </span>
          {" or "}
          <span className={clickClass} onClick={getRangeScorer(150)}>
            <>(150m)</>
          </span>
          {" range."}
        </>
      </Configurer>
      <Configurer>
        <>
          {"Maximize Kills Per Mag at "}
          <span className={clickClass} onClick={getKillsPerMagScorer(0)}>
            <>(0m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getKillsPerMagScorer(10)}>
            <>(10m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getKillsPerMagScorer(20)}>
            <>(20m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getKillsPerMagScorer(30)}>
            <>(30m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getKillsPerMagScorer(40)}>
            <>(40m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getKillsPerMagScorer(50)}>
            <>(50m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getKillsPerMagScorer(40)}>
            <>(75m)</>
          </span>
          {", "}
          <span className={clickClass} onClick={getKillsPerMagScorer(50)}>
            <>(100m)</>
          </span>
          {" or "}
          <span className={clickClass} onClick={getKillsPerMagScorer(150)}>
            <>(150m)</>
          </span>
          {" range."}
        </>
      </Configurer>
      <Configurer>
        <>
          <span className={clickClass} onClick={getRangeScorer(ttkInputRange)}>
            {"Minimize TTK at "}
          </span>
          <input
            type="number"
            value={ttkInputRange}
            onChange={(e) => {
              setTTKInputRange(parseFloat(e.target.value));
              minimizeTTK(ttkInputRange);
            }}
            min={0}
            max={150}
            step={1}
          ></input>
          {" meters."}
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              configurator.Selector((stat) => {
                if (stat.ammoType == "Subsonic") {
                  if (
                    { "6KU": true, "Type 4": true, PB: true, GAR45: true }[
                      stat.barrelType
                    ]
                  ) {
                    return true;
                  }
                }
                return false;
              });
            }}
          >
            {
              "Stealthify (select all suppressed+subsonic configurations for selected weapons, remove weapon if no stealth option exists)."
            }
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              configurator.Selector((_) => {
                return true;
              });
            }}
          >
            {"Add all configurations for currently selected weapons."}
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          {"Maxmize RPM "}
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              configurator.Maximizer((_, stat) => {
                return stat.rpmAuto ? stat.rpmAuto : 0;
              });
            }}
          >
            {"(Auto)"}
          </span>
          {", "}
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              configurator.Maximizer((_, stat) => {
                return stat.rpmBurst ? stat.rpmBurst : 0;
              });
            }}
          >
            {"(Burst)"}
          </span>
          {", "}
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              configurator.Maximizer((_, stat) => {
                return stat.rpmSingle ? stat.rpmSingle : 0;
              });
            }}
          >
            {"(Single)"}
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              configurator.Maximizer((_, stat) => {
                return stat.velocity ? stat.velocity : 0;
              });
            }}
          >
            {"Maximize Velocity"}
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              configurator.Maximizer((config, stat) => {
                const weapon = GetWeaponByName(config.name);
                if (weapon.ammoStats) {
                  const data = weapon.ammoStats[stat.ammoType];
                  return data && data.magSize ? data.magSize : 0;
                }
                return 0;
                // return stat.velocity ? stat.velocity : 0;
              });
            }}
          >
            {"Maximize Magazine Capacity"}
          </span>
        </>
      </Configurer>
    </>
  );
}

interface ConfigurerProps {
  children: ReactElement;
}

function Configurer(props: ConfigurerProps) {
  return (
    <>
      <div>{props.children}</div>
    </>
  );
}

export default AutoConfigure;
