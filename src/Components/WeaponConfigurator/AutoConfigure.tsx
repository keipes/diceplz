import { Modifiers } from "../../Data/ConfigLoader";
import { GetWeaponByName } from "../../Data/WeaponData";
import { BTK, KillsPerMag, TTK } from "../../Util/Conversions";
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
    configurator.Maximize((config, stat) => {
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
    configurator.Maximize((config, stat) => {
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

  function bestTTKFinder(rpmSelector: (stat: any) => number) {
    const ttks = new Map<number, number>();
    let lowestEndTTK = Infinity;
    let highestRangeSeen = 0;
    configurator.ForEach((config) => {
      GetWeaponByName(config.name).stats.forEach((stat) => {
        for (let i = 0; i < stat.dropoffs.length; i++) {
          const ttk = TTK(
            config,
            props.modifiers,
            stat.dropoffs[i].damage,
            rpmSelector(stat)
          );
          const range = stat.dropoffs[i].range;
          if (range > highestRangeSeen) {
            highestRangeSeen = range;
          }
          if (!ttks.has(range) || ttks.get(range)! > ttk) {
            ttks.set(range, ttk);
          }
        }
        const ttk = TTK(
          config,
          props.modifiers,
          stat.dropoffs[stat.dropoffs.length - 1].damage,
          rpmSelector(stat)
        );
        if (ttk < lowestEndTTK) {
          lowestEndTTK = ttk;
        }
      });
    });
    // console.log(highestRangeSeen);
    // console.log(lowestEndTTK);
    let keys = Array.from(ttks.keys());
    keys.sort((a, b) => b - a);
    let lowestTTK = 10000;
    for (const key of keys) {
      let ttk = ttks.get(key);
      if (ttk && ttk < lowestTTK) {
        lowestTTK = ttk;
      } else if (ttk && ttk > lowestTTK) {
        ttks.set(key, lowestTTK);
      }
    }
    configurator.Select((name, stat) => {
      for (const dropoff of stat.dropoffs) {
        const ttk = TTK(
          {
            name: name,
            barrelType: stat.barrelType,
            ammoType: stat.ammoType,
            visible: true,
          },
          props.modifiers,
          dropoff.damage,
          rpmSelector(stat)
        );
        const pctTtk = (ttks.get(dropoff.range) || Infinity) / ttk;
        // console.log(pctTtk);
        if (pctTtk > 0.9) {
          // if (ttk === ttks.get(dropoff.range)) {
          if (dropoff.range == highestRangeSeen && ttk > lowestEndTTK) {
            console.log(
              "Did not select " + name + " at " + dropoff.range + "m."
            );
            return false;
          }
          console.log("Selected " + name + " at " + dropoff.range + "m.");
          return true;
        }
      }
      return false;
    });
  }
  function btkSelector(requiredBTK: number, endRange: number) {
    configurator.Select((name, stat) => {
      let lowestEndTTK = Infinity;
      for (const dropoff of stat.dropoffs) {
        if (dropoff.range > endRange) {
          break;
        }
        const btk = BTK(
          {
            name: name,
            barrelType: stat.barrelType,
            ammoType: stat.ammoType,
            visible: true,
          },
          props.modifiers,
          dropoff.damage
        );
        lowestEndTTK = btk;
      }
      if (lowestEndTTK <= requiredBTK) {
        return true;
      }
      return false;
    });
  }

  function ttkSelector(requiredTTK: number, endRange: number) {
    configurator.Select((name, stat) => {
      let highestEndTTK = -Infinity;
      for (const dropoff of stat.dropoffs) {
        if (dropoff.range > endRange) {
          break;
        }
        const ttk = TTK(
          {
            name: name,
            barrelType: stat.barrelType,
            ammoType: stat.ammoType,
            visible: true,
          },
          props.modifiers,
          dropoff.damage,
          stat.rpmAuto ? stat.rpmAuto : 0
        );
        if (ttk > highestEndTTK) {
          highestEndTTK = ttk;
        }
      }
      if (highestEndTTK <= requiredTTK) {
        return true;
      }
      return false;
    });
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
              configurator.Select((_, stat) => {
                if (stat.ammoType == "Subsonic") {
                  if (
                    {
                      "6KU": true,
                      "Type 4": true,
                      PB: true,
                      GAR45: true,
                      Factory: true,
                    }[stat.barrelType]
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
              configurator.Select((_) => {
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
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              bestTTKFinder((stat) => (stat.rpmAuto ? stat.rpmAuto : 0));
            }}
          >
            {
              "Select configurations which are within 90% of the best ttk of all weapons at some range. (Automatic Fire)"
            }
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              bestTTKFinder((stat) => (stat.rpmSingle ? stat.rpmSingle : 0));
            }}
          >
            {
              "Select configurations which are within 90% of the best ttk of all weapons at some range. (Single Fire)"
            }
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              btkSelector(4, 10);
            }}
          >
            {"Select all 4BTK@10m configurations for current weapons."}
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              btkSelector(4, 20);
            }}
          >
            {"Select all 4BTK@20m configurations for current weapons."}
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              btkSelector(4, 30);
            }}
          >
            {"Select all 4BTK@30m configurations for current weapons."}
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              btkSelector(5, 74);
            }}
          >
            {"Select all 5BTK@74m configurations for current weapons."}
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              btkSelector(5, 151);
            }}
          >
            {"Select all 5BTK@151m configurations for current weapons."}
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              btkSelector(5, 30);
            }}
          >
            {"Select all 5BTK@30m configurations for current weapons."}
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              btkSelector(6, 151);
            }}
          >
            {"Select all 6BTK@151m configurations for current weapons."}
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              ttkSelector(400, 151);
            }}
          >
            {"Select all 400ms@151m configurations for current weapons."}
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              ttkSelector(350, 99);
            }}
          >
            {"Select all 350ms@99m configurations for current weapons."}
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              ttkSelector(335, 74);
            }}
          >
            {"Select all 335ms@74m configurations for current weapons."}
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              ttkSelector(335, 49);
            }}
          >
            {"Select all 320ms@49m configurations for current weapons."}
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              ttkSelector(300, 39);
            }}
          >
            {"Select all 300ms@39m configurations for current weapons."}
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              configurator.Filter((config) => /ubsonic/.test(config.ammoType));
            }}
          >
            {"Select subsonic ammo from current configurations."}
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              configurator.Select((_, stat) => {
                if (stat.dropoffs.length > 1 && stat.dropoffs[1].range > 99) {
                  return true;
                }
                return false;
              });
            }}
          >
            {"Select meter dropoff configurations for current weapons."}
          </span>
        </>
      </Configurer>
      <Configurer>
        <>
          {"Maxmize RPM "}
          <span
            className={clickClass}
            onClick={(_: MouseEvent<HTMLElement>) => {
              configurator.Maximize((_, stat) => {
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
              configurator.Maximize((_, stat) => {
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
              configurator.Maximize((_, stat) => {
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
              configurator.Maximize((_, stat) => {
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
              configurator.Maximize((config, stat) => {
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
